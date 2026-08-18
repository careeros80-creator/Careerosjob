/**
 * services/pilot/wage.js
 *
 * Minimum-wage classification with EFFECTIVE DATES. Uses the minimum legally
 * applicable during the advertised employment period where determinable; where
 * timing is unclear it flags EFFECTIVE_DATE_REQUIRES_REVIEW. A stale minimum
 * that merely appears in a posting is never treated as compliant.
 *
 * Official facts on file:
 *  - BC general minimum: $17.85 (2025-06-01) → $18.25 (2026-06-01). BC law
 *    requires at least minimum wage regardless of hourly/salary/commission/
 *    incentive pay. Source: gov.bc.ca employment-standards minimum-wage.
 *  - ON general minimum: $17.60 (2025-10-01) — confirmed.
 *  Other provinces: current published rates, VERIFY against official source.
 */
const MINWAGE = {
  ON: { history: [{ from: '2022-10-01', rate: 15.50 }, { from: '2023-10-01', rate: 16.55 }, { from: '2024-10-01', rate: 17.20 }, { from: '2025-10-01', rate: 17.60 }], category: 'general', source: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0/minimum-wage', verified: true },
  BC: { history: [{ from: '2024-06-01', rate: 17.40 }, { from: '2025-06-01', rate: 17.85 }, { from: '2026-06-01', rate: 18.25 }], category: 'general (applies to hourly/salary/commission/incentive)', source: 'https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/wages/minimum-wage', verified: true },
  AB: { history: [{ from: '2018-10-01', rate: 15.00 }], category: 'general adult', source: 'https://www.alberta.ca/minimum-wage', verified: false },
  MB: { history: [{ from: '2025-10-01', rate: 16.00 }], category: 'general', source: 'https://www.gov.mb.ca/labour/standards/', verified: false },
  SK: { history: [{ from: '2025-10-01', rate: 15.35 }], category: 'general', source: 'https://www.saskatchewan.ca/minimum-wage', verified: false },
  NS: { history: [{ from: '2025-04-01', rate: 15.70 }], category: 'general', source: 'https://novascotia.ca/lae/employmentrights/minimumwage.asp', verified: false },
  NB: { history: [{ from: '2025-04-01', rate: 15.65 }], category: 'general', source: 'https://www2.gnb.ca', verified: false },
  NL: { history: [{ from: '2025-04-01', rate: 16.00 }], category: 'general', source: 'https://www.gov.nl.ca', verified: false },
  PE: { history: [{ from: '2025-10-01', rate: 16.00 }], category: 'general', source: 'https://www.princeedwardisland.ca/en/information/minimum-wage', verified: false },
};

function minWageFor(province, dateISO) {
  const p = MINWAGE[province]; if (!p) return null;
  const d = dateISO || '9999-12-31';
  let rate = null;
  for (const e of p.history) if (e.from <= d) rate = e;
  return rate ? { rate: rate.rate, effective: rate.from, category: p.category, source: p.source, verified: p.verified } : null;
}
// is `amount` a superseded (older, now-lower) minimum for this province?
function isSupersededMinimum(province, amount, currentDateISO) {
  const p = MINWAGE[province]; if (!p) return false;
  const cur = minWageFor(province, currentDateISO);
  return p.history.some(e => Math.abs(e.rate - amount) < 0.005 && cur && e.rate < cur.rate);
}

/**
 * @returns { category, detail, min, applicable_date, effective_review }
 * categories: A_WAGE_BELOW_MINIMUM | B_ANNUAL_WAGE_REQUIRES_HOURS |
 *             C_COMMISSION_STRUCTURE_REQUIRES_REVIEW | D_WAGE_COMPLIANT | E_WAGE_UNKNOWN
 */
function classifyWage(wage, province, { reviewDate, postingDate } = {}) {
  if (!wage) return { category: 'E_WAGE_UNKNOWN', detail: 'no wage on posting' };
  const commission = /commission|per sale|piece[- ]?rate|incentive|tips?|gratuit/i.test(wage);
  const annual = /annually|annual|per year|\/year|yearly/i.test(wage);
  const nums = (wage.match(/\d[\d,]*\.?\d*/g) || []).map(n => parseFloat(n.replace(/,/g, '')));
  // applicable date: prefer the advertised employment period (posting date); else review date
  const applicable = postingDate || reviewDate || null;
  const mw = minWageFor(province, applicable);
  if (commission) return { category: 'C_COMMISSION_STRUCTURE_REQUIRES_REVIEW', detail: 'base + commission / piece-rate / incentive; guaranteed vs non-guaranteed unclear — % is not an hourly wage' + (mw ? `; ${province} still requires top-up to $${mw.rate}` : ''), min: mw && mw.rate };
  if (annual) return { category: 'B_ANNUAL_WAGE_REQUIRES_HOURS', detail: 'annual salary; cannot convert to hourly without verified contractual hours (do NOT assume 2,080)' };
  if (!nums.length) return { category: 'E_WAGE_UNKNOWN', detail: 'no parseable hourly figure' };
  if (!mw) return { category: 'E_WAGE_UNKNOWN', detail: `hourly lower $${Math.min(...nums)}, no minimum on file for ${province}` };
  const lower = Math.min(...nums);
  const stale = isSupersededMinimum(province, lower, applicable) || !postingDate;
  const base = { min: mw.rate, applicable_date: mw.effective, source: mw.source, effective_review: stale };
  if (lower < mw.rate) return { category: 'A_WAGE_BELOW_MINIMUM', detail: `hourly lower $${lower} < ${province} min $${mw.rate} (eff ${mw.effective})${isSupersededMinimum(province, lower, applicable) ? ` — equals a SUPERSEDED ${province} minimum → likely stale posting, EFFECTIVE_DATE_REQUIRES_REVIEW` : ''}`, ...base };
  return { category: 'D_WAGE_COMPLIANT', detail: `hourly lower $${lower} ≥ ${province} min $${mw.rate} (eff ${mw.effective})`, ...base };
}

module.exports = { MINWAGE, minWageFor, isSupersededMinimum, classifyWage };
