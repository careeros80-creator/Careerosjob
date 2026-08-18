/**
 * services/pilot/evidence.js
 *
 * Guards for verification-evidence integrity. Fetch timestamps must be real
 * ISO-8601 UTC values that are not in the future and not a hardcoded sentinel.
 * Used by the evidence pipeline and enforced by tests/pilot/test_evidence_timestamps.js.
 */
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
// Dates that appeared as hardcoded placeholders and must never be accepted as a fetch time.
const HARDCODED_SENTINELS = new Set(['2026-08-14', '2026-08-14T00:00:00Z']);

/** @returns {ok:boolean, reason?:string} */
function validateFetchTimestamp(ts, nowIso = new Date().toISOString()) {
  if (ts == null || typeof ts !== 'string') return { ok: false, reason: 'missing' };
  if (HARDCODED_SENTINELS.has(ts) || HARDCODED_SENTINELS.has(ts.slice(0, 10))) return { ok: false, reason: 'hardcoded sentinel date' };
  if (!ISO_UTC.test(ts)) return { ok: false, reason: 'not ISO-8601 UTC (Z)' };
  if (new Date(ts).getTime() > new Date(nowIso).getTime()) return { ok: false, reason: 'future-dated' };
  return { ok: true };
}

/** Validate a whole evidence set; returns the first offending record or null. */
function findInvalidTimestamp(rows, nowIso = new Date().toISOString()) {
  for (const r of rows || []) {
    if (r.evidence_classification === 'UNREACHABLE' && !r.fetched_at_utc) continue; // allowed: no successful fetch
    const v = validateFetchTimestamp(r.fetched_at_utc, nowIso);
    if (!v.ok) return { record: r.external_id || r.jid || '?', reason: v.reason, ts: r.fetched_at_utc };
  }
  return null;
}

module.exports = { validateFetchTimestamp, findInvalidTimestamp, ISO_UTC };
