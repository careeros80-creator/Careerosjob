/**
 * connectors/website/WebsiteConnector.js
 *
 * Generic website connector with pluggable extractors.
 * WebsiteConnector knows HOW to fetch. Extractors know WHAT to parse.
 *
 * Architecture:
 *   WebsiteConnector
 *       ↓
 *   HTMLFetcher          ← fetches raw HTML
 *       ↓
 *   ContentExtractor     ← strips boilerplate, finds job sections
 *       ↓
 *   JobDetector          ← detects individual job postings
 *       ↓
 *   CanonicalMapper      ← outputs CanonicalJob[]
 *
 * Adding a new ATS platform:
 *   Create extractors/GreenhouseExtractor.js
 *   Register in EXTRACTOR_REGISTRY
 *   Done — WebsiteConnector handles the rest.
 */

const crypto = require('crypto');

// ── EXTRACTOR REGISTRY ────────────────────────────────────
// Maps domain patterns to specialized extractors
// Order matters: first match wins
const EXTRACTOR_REGISTRY = [
  { pattern: /greenhouse\.io/i,         extractor: 'GreenhouseExtractor' },
  { pattern: /lever\.co/i,              extractor: 'LeverExtractor'      },
  { pattern: /workday\.com/i,           extractor: 'WorkdayExtractor'    },
  { pattern: /breezy\.hr/i,             extractor: 'BreezyExtractor'     },
  { pattern: /indeed\.com\/cmp/i,       extractor: 'IndeedCompanyExtractor' },
  { pattern: /.*/,                      extractor: 'GenericExtractor'    }, // fallback
];

// ── BASE EXTRACTOR ─────────────────────────────────────────
class BaseExtractor {
  constructor(name) {
    this.name = name;
  }

  /**
   * @param {string} html     - Raw HTML from HTMLFetcher
   * @param {string} url      - Source URL
   * @returns {RawJobData[]}  - Array of raw job data objects
   */
  extract(html, url) {
    throw new Error(`extract() must be implemented by ${this.name}`);
  }

  /**
   * Generate content hash for deduplication.
   * UUID v5 from namespace + content
   */
  contentHash(title, company, location) {
    const content = [
      title?.toLowerCase().trim(),
      company?.toLowerCase().trim(),
      location?.toLowerCase().trim(),
    ].join('|');

    // UUID v5 using SHA1 (deterministic)
    const hash = crypto.createHash('sha1')
      .update('career-os-jobs|' + content)
      .digest('hex');

    // Format as UUID v5
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '5' + hash.substring(13, 16),    // version 5
      ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16)
        + hash.substring(18, 20),
      hash.substring(20, 32),
    ].join('-');
  }

  /**
   * Build external_id in standard format: SOURCE_ORIGINALID
   */
  externalId(source, originalId) {
    return `${source.toUpperCase()}_${originalId}`;
  }
}

// ── GENERIC EXTRACTOR (fallback) ──────────────────────────
class GenericExtractor extends BaseExtractor {
  constructor() { super('GenericExtractor'); }

  extract(html, url) {
    // Generic extraction: look for common job posting patterns
    // Returns raw data — AI Extractor will do the heavy lifting
    const jobs = [];

    // Detect if this is a careers/jobs page at all
    const isJobsPage = /\b(career|careers|emploi|job|jobs|hiring|nous recrutons)\b/i.test(html);
    if (!isJobsPage) return [];

    // Extract domain for company name hint
    const domain = new URL(url).hostname.replace('www.', '');

    jobs.push({
      source: 'website',
      source_url: url,
      company_raw: domain,
      company_domain: domain,
      raw_text: this.cleanText(html),
      raw_html: html,
      fetched_at: new Date().toISOString(),
      // title, salary, location → extracted by AI Extractor
    });

    return jobs;
  }

  cleanText(html) {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // limit for AI
  }
}

// ── GREENHOUSE EXTRACTOR ──────────────────────────────────
class GreenhouseExtractor extends BaseExtractor {
  constructor() { super('GreenhouseExtractor'); }

  extract(html, url) {
    // Greenhouse has consistent structure: /jobs/<id>
    const jobs = [];
    const jobIdMatch = url.match(/\/jobs\/(\d+)/);
    if (!jobIdMatch) return [];

    const jobId = jobIdMatch[1];
    const companySlug = url.match(/boards\.greenhouse\.io\/([^/]+)/)?.[1] || 'unknown';

    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*app-title[^"]*"[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch?.[1]?.trim();

    // Extract location
    const locationMatch = html.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)<\/div>/i);
    const location = locationMatch?.[1]?.trim();

    jobs.push({
      source: 'website',
      external_id: this.externalId('GREENHOUSE', jobId),
      source_url: url,
      apply_url: url,
      title: title || null,
      company_raw: companySlug,
      company_domain: `${companySlug}.com`,
      location_raw: location || null,
      raw_text: new GenericExtractor().cleanText(html),
      raw_html: html,
      fetched_at: new Date().toISOString(),
    });

    return jobs;
  }
}

// ── LEVER EXTRACTOR ───────────────────────────────────────
class LeverExtractor extends BaseExtractor {
  constructor() { super('LeverExtractor'); }

  extract(html, url) {
    const jobs = [];
    const jobIdMatch = url.match(/\/([a-f0-9-]{36})$/); // UUID in URL
    if (!jobIdMatch) return [];

    const companySlug = url.match(/jobs\.lever\.co\/([^/]+)/)?.[1] || 'unknown';

    jobs.push({
      source: 'website',
      external_id: this.externalId('LEVER', jobIdMatch[1]),
      source_url: url,
      apply_url: url + '/apply',
      company_raw: companySlug,
      company_domain: `${companySlug}.com`,
      raw_text: new GenericExtractor().cleanText(html),
      raw_html: html,
      fetched_at: new Date().toISOString(),
    });

    return jobs;
  }
}

// ── WEBSITE CONNECTOR ─────────────────────────────────────
class WebsiteConnector {
  constructor(name = 'website') {
    this.name = name;
    this.extractors = {
      GenericExtractor:       new GenericExtractor(),
      GreenhouseExtractor:    new GreenhouseExtractor(),
      LeverExtractor:         new LeverExtractor(),
      WorkdayExtractor:       new GenericExtractor(),  // placeholder
      BreezyExtractor:        new GenericExtractor(),  // placeholder
      IndeedCompanyExtractor: new GenericExtractor(),  // placeholder
    };
  }

  /**
   * Select the right extractor for a given URL
   */
  selectExtractor(url) {
    for (const { pattern, extractor } of EXTRACTOR_REGISTRY) {
      if (pattern.test(url)) {
        return this.extractors[extractor] || this.extractors.GenericExtractor;
      }
    }
    return this.extractors.GenericExtractor;
  }

  /**
   * Fetch and extract jobs from a URL.
   * In n8n: HTTPRequest node fetches HTML, this function processes it.
   *
   * @param {string} url      - URL to process
   * @param {string} html     - HTML content (fetched by n8n)
   * @returns {CanonicalJob[]} - Array matching canonical-job.v1.json schema
   */
  process(url, html) {
    const extractor = this.selectExtractor(url);
    const rawJobs   = extractor.extract(html, url);

    return rawJobs
      .filter(job => this.isValid(job))
      .map(job => this.toCanonical(job));
  }

  isValid(job) {
    // Minimum requirements for a canonical job
    return (
      job.raw_text &&
      job.raw_text.length >= 50 &&
      job.source_url
    );
  }

  toCanonical(raw) {
    const title      = raw.title || '';
    const company    = raw.company_raw || '';
    const location   = raw.location_raw || '';
    const extractor  = this.extractors.GenericExtractor;

    return {
      external_id:     raw.external_id || extractor.externalId('WEBSITE', this.urlHash(raw.source_url)),
      source:          'website',
      content_hash:    extractor.contentHash(title, company, location),
      title:           title || null,
      company_raw:     company,
      company_domain:  raw.company_domain || null,
      location_raw:    location,
      city:            null,     // Normalizer fills this
      province:        null,     // Normalizer fills this
      country:         'CA',
      salary_raw:      raw.salary_raw || null,
      salary_min:      null,     // Normalizer fills this
      salary_max:      null,     // Normalizer fills this
      salary_currency: 'CAD',
      contract_type_raw: raw.contract_type_raw || null,
      language_raw:    raw.language_raw || null,
      apply_url:       raw.apply_url || raw.source_url,
      source_url:      raw.source_url,
      raw_text:        raw.raw_text,
      raw_html:        raw.raw_html || null,
      posted_at:       raw.posted_at || null,
      expires_at:      raw.expires_at || null,
      fetched_at:      raw.fetched_at || new Date().toISOString(),
    };
  }

  urlHash(url) {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
  }
}

module.exports = { WebsiteConnector, BaseExtractor, GenericExtractor };
