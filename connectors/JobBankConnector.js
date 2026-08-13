/**
 * connectors/JobBankConnector.js
 *
 * Connector for Job Bank Canada (official Canadian government job board).
 * API: jobbank.gc.ca — public, no auth required.
 *
 * Output: CanonicalJob[] — same schema as all other connectors.
 * This connector has NO knowledge of scoring, rules, or AI.
 */

const crypto = require('crypto');

const SOURCE = 'jobbank';

const BEAUTY_KEYWORDS = [
  'esthetician', 'esthéticienne', 'aesthetician',
  'hairstylist', 'coiffeuse', 'coiffeur', 'coiffure',
  'makeup artist', 'make-up artist', 'maquilleuse',
  'nail technician', 'spa therapist', 'beautician',
  'skin care', 'soins esthétiques', 'salon', 'beauty',
  'cosmetologist', 'barber'
];

class JobBankConnector {
  constructor() {
    this.name = SOURCE;
    this.baseUrl = 'https://www.jobbank.gc.ca';
    this.searchUrl = `${this.baseUrl}/jobsearch/jobsearch`;
  }

  // ── PUBLIC API ─────────────────────────────────────────

  /**
   * Build search URLs for n8n HTTP Request node.
   * n8n fetches the HTML — this connector processes it.
   *
   * @returns {SearchConfig[]} URLs to fetch
   */
  searchConfigs() {
    return [
      {
        url: this.buildSearchUrl('esthetician', 'Ontario'),
        params: { keyword: 'esthetician', location: 'Ontario' }
      },
      {
        url: this.buildSearchUrl('hairstylist', 'Ontario'),
        params: { keyword: 'hairstylist', location: 'Ontario' }
      },
      {
        url: this.buildSearchUrl('esthetician', 'New Brunswick'),
        params: { keyword: 'esthetician', location: 'New Brunswick' }
      },
      {
        url: this.buildSearchUrl('esthetician', 'British Columbia'),
        params: { keyword: 'esthetician', location: 'British Columbia' }
      },
      {
        url: this.buildSearchUrl('makeup artist', 'Ontario'),
        params: { keyword: 'makeup artist', location: 'Ontario' }
      },
    ];
  }

  /**
   * Process raw HTML from Job Bank search results page.
   * Called by n8n after HTTP fetch.
   *
   * @param {string} html   - Raw HTML from Job Bank
   * @param {string} url    - The URL that was fetched
   * @returns {CanonicalJob[]}
   */
  processSearchPage(html, url) {
    const jobs = this.extractJobListings(html);
    return jobs
      .filter(job => this.isBeautyRelated(job))
      .map(job => this.toCanonical(job));
  }

  /**
   * Process a single job detail page.
   *
   * @param {string} html    - Raw HTML of job detail page
   * @param {string} url     - Job detail URL
   * @param {string} jobId   - Job Bank job ID
   * @returns {CanonicalJob|null}
   */
  processJobPage(html, url, jobId) {
    const raw = this.extractJobDetail(html, url, jobId);
    if (!raw) return null;
    if (!this.isBeautyRelated(raw)) return null;
    return this.toCanonical(raw);
  }

  // ── PARSING ────────────────────────────────────────────

  extractJobListings(html) {
    const jobs = [];
    // Split on <article — more reliable than complex regex across environments
    const parts = html.split('<article');

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part.includes('resultJobItem')) continue;

      const endIdx = part.indexOf('</article>');
      const articleHtml = endIdx >= 0 ? part.substring(0, endIdx) : part;

      const job = this.parseArticle(articleHtml);
      if (job) jobs.push(job);
    }

    return jobs;
  }

  parseArticle(html) {
    // Job ID — 2026 Job Bank markup exposes it as id="article-<id>" plus an
    // anchor to /jobposting/<id>; legacy markup used data-id="<id>".
    // (Runtime drift bug-fix — pilot/production-validation. Backward compatible.)
    const jobId =
      html.match(/data-id="(\d+)"/)?.[1] ||
      html.match(/id="article-(\d+)"/)?.[1] ||
      html.match(/jobposting\/(\d+)/)?.[1];
    if (!jobId) return null;

    // Title — <span class="noctitle"> (current markup wraps it in an <h3> with
    // surrounding whitespace/newlines, so match non-greedily and collapse WS).
    const title = (
      html.match(/<span class="noctitle"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
      html.match(/<h3[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i)?.[1] ||
      ''
    ).replace(/\s+/g, ' ').trim();

    // Fields live in <li class="..."> today, <span class="..."> in legacy markup.
    const company  = this.fieldValue(html, 'business');
    const location = this.stripLabel(this.fieldValue(html, 'location'), 'Location');
    const salary   = this.stripLabel(this.fieldValue(html, 'salary'), 'Salary');

    // Posted date — datetime="..." (legacy) or <li class="date">August 12, 2026</li>
    const postedAt =
      html.match(/datetime="([^"]+)"/i)?.[1] ||
      this.fieldValue(html, 'date') || null;

    if (!title) return null;

    return {
      job_bank_id:  jobId,
      title,
      company_raw:  company || '',
      location_raw: location || '',
      salary_raw:   salary || null,
      posted_at:    postedAt || null,
      source_url:   `${this.baseUrl}/jobposting/${jobId}`,
      apply_url:    `${this.baseUrl}/jobposting/${jobId}`,
    };
  }

  /**
   * Extract a field that appears as <li class="X">…</li> (current Job Bank
   * markup) or <span class="X">…</span> (legacy markup). Inner tags — icons,
   * screen-reader spans — are stripped and whitespace collapsed.
   */
  fieldValue(html, cls) {
    const m =
      html.match(new RegExp(`<li class="${cls}"[^>]*>([\\s\\S]*?)<\\/li>`, 'i')) ||
      html.match(new RegExp(`<span class="${cls}"[^>]*>([\\s\\S]*?)<\\/span>`, 'i'));
    if (!m) return '';
    return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Drop a leading accessibility label word (e.g. "Location ", "Salary "). */
  stripLabel(value, label) {
    if (!value) return value;
    return value.replace(new RegExp(`^${label}\\s+`, 'i'), '').trim();
  }

  extractJobDetail(html, url, jobId) {
    // Full detail page parsing
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const companyMatch = html.match(/class="[^"]*business[^"]*"[^>]*>([^<]+)</i);
    const locationMatch = html.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)</i);
    const salaryMatch = html.match(/class="[^"]*salary[^"]*"[^>]*>([^<]+)</i);

    const descMatch = html.match(/<div[^>]+id="tp_jobDescription"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div[^>]+class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    const rawText = descMatch
      ? descMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 10000);

    return {
      job_bank_id:  jobId,
      title:        titleMatch?.[1]?.trim() || null,
      company_raw:  companyMatch?.[1]?.trim() || '',
      location_raw: locationMatch?.[1]?.trim() || '',
      salary_raw:   salaryMatch?.[1]?.trim() || null,
      source_url:   url,
      apply_url:    url,
      raw_text:     rawText,
      raw_html:     html,
    };
  }

  // ── FILTERING ──────────────────────────────────────────

  isBeautyRelated(job) {
    const text = [job.title, job.raw_text, job.company_raw]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return BEAUTY_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  }

  // ── CANONICAL OUTPUT ───────────────────────────────────

  toCanonical(raw) {
    const externalId = `JOBBANK_${raw.job_bank_id}`;
    const hash = this.contentHash(
      raw.title || '',
      raw.company_raw || '',
      raw.location_raw || ''
    );

    return {
      external_id:      externalId,
      source:           SOURCE,
      content_hash:     hash,
      title:            raw.title || null,
      company_raw:      raw.company_raw,
      company_domain:   null,         // Job Bank doesn't expose company domains
      location_raw:     raw.location_raw,
      city:             null,         // Normalizer fills this
      province:         null,         // Normalizer fills this
      country:          'CA',
      salary_raw:       raw.salary_raw || null,
      salary_min:       null,         // Normalizer fills this
      salary_max:       null,         // Normalizer fills this
      salary_currency:  'CAD',
      contract_type_raw: null,
      language_raw:     null,
      apply_url:        raw.apply_url,
      source_url:       raw.source_url,
      raw_text:         raw.raw_text || [raw.title, raw.company_raw, raw.location_raw, raw.salary_raw].filter(Boolean).join(' | '),
      raw_html:         raw.raw_html || null,
      posted_at:        raw.posted_at ? new Date(raw.posted_at).toISOString() : null,
      expires_at:       null,
      fetched_at:       new Date().toISOString(),
    };
  }

  // ── UTILITIES ──────────────────────────────────────────

  buildSearchUrl(keyword, location) {
    const params = new URLSearchParams({
      searchstring: keyword,
      locationstring: location,
      sort: 'D',         // D = by date (newest first)
      action: 'search',
    });
    return `${this.searchUrl}?${params}`;
  }

  contentHash(title, company, location) {
    const content = [
      title.toLowerCase().trim(),
      company.toLowerCase().trim(),
      location.toLowerCase().trim(),
    ].join('|');

    const hash = crypto.createHash('sha1')
      .update('career-os-jobs|' + content)
      .digest('hex');

    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '5' + hash.substring(13, 16),
      ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16)
        + hash.substring(18, 20),
      hash.substring(20, 32),
    ].join('-');
  }
}

module.exports = { JobBankConnector };
