/**
 * services/normalizer/normalize.js
 *
 * VS2 — Normalization (pure, dependency-free).
 *
 * Turns a raw CanonicalJob (VS1 output) into normalized fields the rest of the
 * pipeline can rely on: 2-letter province, city, parsed salary, cleaned title
 * and company, plus a cross-provider dedup key.
 *
 * This module has NO knowledge of the database or connectors — it only
 * transforms data. The DB wiring (UPDATE jobs, pipeline_status raw→cleaned,
 * job.cleaned event) lives in a separate step so this stays unit-testable.
 */

const crypto = require('crypto');

// ── Canadian provinces / territories: full name → 2-letter code ──
const PROVINCE_CODES = {
  'AB': 'AB', 'BC': 'BC', 'MB': 'MB', 'NB': 'NB', 'NL': 'NL', 'NS': 'NS',
  'NT': 'NT', 'NU': 'NU', 'ON': 'ON', 'PE': 'PE', 'QC': 'QC', 'SK': 'SK', 'YT': 'YT',
  'ALBERTA': 'AB',
  'BRITISH COLUMBIA': 'BC',
  'MANITOBA': 'MB',
  'NEW BRUNSWICK': 'NB',
  'NOUVEAU-BRUNSWICK': 'NB',
  'NEWFOUNDLAND AND LABRADOR': 'NL',
  'NEWFOUNDLAND': 'NL',
  'TERRE-NEUVE-ET-LABRADOR': 'NL',
  'NOVA SCOTIA': 'NS',
  'NOUVELLE-ECOSSE': 'NS',
  'NORTHWEST TERRITORIES': 'NT',
  'NUNAVUT': 'NU',
  'ONTARIO': 'ON',
  'PRINCE EDWARD ISLAND': 'PE',
  'ILE-DU-PRINCE-EDOUARD': 'PE',
  'QUEBEC': 'QC',
  'QUÉBEC': 'QC',
  'SASKATCHEWAN': 'SK',
  'YUKON': 'YT',
};

const SALARY_PERIODS = [
  { re: /\b(hour|hourly|hr|\/h)\b/i, period: 'hourly' },
  { re: /\b(week|weekly|\/wk)\b/i,   period: 'weekly' },
  { re: /\b(month|monthly|\/mo)\b/i, period: 'monthly' },
  { re: /\b(year|yearly|annual|annually|\/yr|per annum)\b/i, period: 'annual' },
];

// Rough hourly-equivalent conversion (Canada full-time ~2080 h/yr, ~40 h/wk).
const HOURS = { hourly: 1, weekly: 40, monthly: 173.33, annual: 2080 };

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Cleaned job title: collapse whitespace, trim, drop trailing noise. */
function normalizeTitle(raw) {
  if (!raw) return null;
  const t = String(raw).replace(/\s+/g, ' ').trim();
  return t.length ? t : null;
}

/** Normalized company key: lowercased, no accents, no legal suffixes. */
function normalizeCompany(raw) {
  if (!raw) return { company_clean: null, company_key: null };
  const clean = String(raw).replace(/\s+/g, ' ').trim();
  const key = stripAccents(clean.toLowerCase())
    .replace(/\b(inc|ltd|ltee|ltée|llc|llp|co|corp|corporation|company|enr|srl|sarl|group|groupe|the)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return { company_clean: clean, company_key: key || null };
}

/**
 * Parse "Ottawa, ON" / "Gatineau, Quebec, Canada" / "Moncton, NB" →
 * { city, province } with a 2-letter province code (or nulls).
 */
function parseLocation(raw) {
  const out = { city: null, province: null };
  if (!raw) return out;
  const parts = String(raw)
    .split(',')
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p && !/^canada$/i.test(p));
  if (!parts.length) return out;

  // Find a province among the parts (prefer a later token).
  for (let i = parts.length - 1; i >= 0; i--) {
    const code = PROVINCE_CODES[stripAccents(parts[i]).toUpperCase()];
    if (code) {
      out.province = code;
      // City = first part that isn't the province token.
      const cityPart = parts.find((_, idx) => idx !== i);
      if (cityPart) out.city = cityPart;
      return out;
    }
  }
  // No province detected → first token is the city (best effort).
  out.city = parts[0] || null;
  return out;
}

/**
 * Parse a salary string → { salary_min, salary_max, salary_currency,
 * salary_period, salary_min_hourly, salary_max_hourly }.
 * Handles "$38.00 to $44.00 hourly", "$21.00 hourly", "$35-45/hr",
 * "$55,000 annually", "competitive" (→ nulls).
 */
function parseSalary(raw) {
  const out = {
    salary_min: null, salary_max: null,
    salary_currency: 'CAD', salary_period: null,
    salary_min_hourly: null, salary_max_hourly: null,
  };
  if (!raw) return out;
  const s = String(raw);

  const nums = (s.match(/\d[\d,]*(?:\.\d+)?/g) || [])
    .map(n => parseFloat(n.replace(/,/g, '')))
    .filter(n => !Number.isNaN(n));
  if (!nums.length) return out;

  out.salary_min = Math.round(nums[0]);
  out.salary_max = nums.length > 1 ? Math.round(nums[1]) : null;

  for (const { re, period } of SALARY_PERIODS) {
    if (re.test(s)) { out.salary_period = period; break; }
  }
  const h = HOURS[out.salary_period] || null;
  if (h) {
    out.salary_min_hourly = out.salary_min != null ? Math.round(out.salary_min / h) : null;
    out.salary_max_hourly = out.salary_max != null ? Math.round(out.salary_max / h) : null;
  }
  return out;
}

/**
 * Cross-provider dedup key: same posting from different sources should collide.
 * Based on normalized title + company + city (NOT the source id / URL).
 */
function dedupKey(job) {
  const title = normalizeTitle(job.title) || '';
  const { company_key } = normalizeCompany(job.company_raw);
  const { city } = parseLocation(job.location_raw);
  const basis = [
    stripAccents(title.toLowerCase()).replace(/[^a-z0-9]+/g, ' ').trim(),
    company_key || '',
    (city || '').toLowerCase(),
  ].join('|');
  return crypto.createHash('sha1').update('career-os-dedup|' + basis).digest('hex');
}

/**
 * Normalize a whole CanonicalJob → the fields to persist on `jobs`
 * (city, province, salary_min/max, plus helpers). Source-agnostic.
 */
function normalizeJob(job) {
  const title = normalizeTitle(job.title);
  const { company_clean, company_key } = normalizeCompany(job.company_raw);
  const { city, province } = parseLocation(job.location_raw);
  const salary = parseSalary(job.salary_raw);
  return {
    title,
    company_clean,
    company_key,
    city,
    province,
    country: job.country || 'CA',
    salary_min: salary.salary_min_hourly ?? salary.salary_min,
    salary_max: salary.salary_max_hourly ?? salary.salary_max,
    salary_currency: salary.salary_currency,
    salary_period: salary.salary_period,
    dedup_key: dedupKey(job),
  };
}

module.exports = {
  normalizeTitle,
  normalizeCompany,
  parseLocation,
  parseSalary,
  dedupKey,
  normalizeJob,
  PROVINCE_CODES,
};
