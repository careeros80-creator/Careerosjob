/**
 * services/enrichment/providers/PublicWebsiteProvider.js
 *
 * VS2 Module 3 — enrichment from a company's OWN public website.
 *
 * Extracts COMPANY-LEVEL public fields only. HTML is fetched via ctx.fetch so
 * the provider is deterministic/testable; a live deployment must honor each
 * site's robots.txt + Terms before fetching.
 *
 * PRIVACY GUARDRAIL: only ROLE-BASED recruitment emails (careers@, jobs@, hr@…)
 * are accepted. Personal-looking emails (firstname.lastname@…) are rejected.
 * No personal names / personal phones are ever collected.
 */
const { EnrichmentProvider } = require('./EnrichmentProvider');

// Role-based local-parts we accept as a *company* recruitment contact.
const ROLE_LOCALPARTS = new Set([
  'careers', 'career', 'jobs', 'job', 'recruit', 'recruiting', 'recruitment',
  'recrutement', 'hr', 'rh', 'emploi', 'emplois', 'hiring', 'talent',
  'info', 'contact', 'hello', 'bonjour', 'admin', 'office', 'reception',
]);

const CATEGORY_KEYWORDS = [
  { re: /\b(spa|salon|esthetic|esth[ée]tique|beauty|beaut[ée]|coiffure|hair|nail|barber|cosmetolog)/i, category: 'Beauty & Personal Care' },
  { re: /\b(restaurant|caf[ée]|bistro|food)/i, category: 'Food & Beverage' },
  { re: /\b(clinic|clinique|medical|dental|health)/i, category: 'Health' },
];

function emails(text) {
  return (text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).map(e => e.toLowerCase());
}
function isRoleEmail(e) {
  const local = e.split('@')[0];
  // reject anything that looks personal (a dotted first.last), accept only role local-parts
  if (local.includes('.')) return false;
  return ROLE_LOCALPARTS.has(local);
}

function firstRoleEmail(text) {
  for (const e of emails(text)) if (isRoleEmail(e)) return e;
  return null;
}
function phone(text) {
  const m = text.match(/(?:tel:)?(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return m ? m[0].replace(/^tel:/, '').trim() : null;
}
function postal(text) {
  const m = text.match(/\b[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d\b/);
  return m ? m[0].toUpperCase().replace(/([A-Z]\d[A-Z])[ -]?(\d[A-Z]\d)/, '$1 $2') : null;
}
function careersUrl(html, base) {
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1], label = (m[2] || '').toLowerCase();
    if (/careers?|emplois?|jobs?|recrut/i.test(href) || /careers?|emplois?|jobs?|hiring|recrut/i.test(label)) {
      try { return new URL(href, base || 'https://example.org').toString(); }
      catch { return href; }
    }
  }
  return null;
}
function description(html) {
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (meta) return meta[1].trim();
  const p = html.replace(/<script[\s\S]*?<\/script>/gi, '').match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return p ? p[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300) : null;
}
function category(text) {
  for (const c of CATEGORY_KEYWORDS) if (c.re.test(text)) return c.category;
  return null;
}
function languages(text) {
  const langs = [];
  if (/[éèàçêô]|\b(nous|emploi|recrut|bonjour|coiffure|beaut[ée])\b/i.test(text)) langs.push('fr');
  if (/\b(we|the|and|hiring|careers|team|welcome)\b/i.test(text)) langs.push('en');
  return langs.length ? [...new Set(langs)] : null;
}
function hiringStatus(text) {
  if (/\b(now hiring|we'?re hiring|join our team|nous recrutons|on recrute|careers|emplois)\b/i.test(text)) return 'hiring';
  return 'unknown';
}
function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

class PublicWebsiteProvider extends EnrichmentProvider {
  constructor() { super({ name: 'public_website', source: 'public_website' }); }

  async enrich(company, ctx = {}) {
    const website = company.website || null;
    if (!website) return { source: this.source, fields: {}, note: 'no public website on record' };
    if (typeof ctx.fetch !== 'function') throw new Error('public_website: ctx.fetch (url→html) is required');

    let html = await ctx.fetch(website);
    // Best-effort careers page (isolated — failure must not abort enrichment).
    let careersHtml = '';
    try { careersHtml = await ctx.fetch(website.replace(/\/?$/, '/careers')); } catch { /* ignore */ }
    const combined = `${html}\n${careersHtml}`;
    const text = stripTags(combined);

    const fields = {};
    const put = (k, value, confidence) => { if (value != null && value !== '') fields[k] = { value, confidence }; };

    put('website', website, 0.99);
    put('recruitment_email', firstRoleEmail(combined), 0.95);   // role-based ONLY
    put('business_phone', phone(text), 0.9);
    put('postal_code', postal(text), 0.9);
    put('careers_url', careersUrl(combined, website), 0.85);
    put('description', description(html), 0.7);
    put('business_category', category(text), 0.6);
    put('languages', languages(text), 0.7);
    put('hiring_status', hiringStatus(text), 0.6);

    return { source: this.source, fields };
  }
}

module.exports = { PublicWebsiteProvider, isRoleEmail, ROLE_LOCALPARTS };
