/**
 * tests/pilot/test_evidence_timestamps.js — evidence timestamps must be real,
 * ISO-8601 UTC, not future-dated, and never the hardcoded sentinel.
 * Run: node tests/pilot/test_evidence_timestamps.js
 */
const { validateFetchTimestamp, findInvalidTimestamp } = require('../../services/pilot/evidence');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const NOW = '2026-08-18T16:00:00Z';

console.log('\n[ single timestamp validation ]');
check(validateFetchTimestamp('2026-08-18T15:50:40Z', NOW).ok, 'real past ISO-UTC accepted');
check(!validateFetchTimestamp('2026-08-14', NOW).ok, 'hardcoded sentinel 2026-08-14 rejected');
check(!validateFetchTimestamp('2026-08-14T00:00:00Z', NOW).ok, 'hardcoded sentinel (with time) rejected');
check(!validateFetchTimestamp('2026-08-19T00:00:00Z', NOW).ok, 'future-dated rejected');
check(!validateFetchTimestamp('2026-08-18', NOW).ok, 'date-only (non-ISO-UTC) rejected');
check(!validateFetchTimestamp(null, NOW).ok, 'missing rejected');
check(validateFetchTimestamp('2026-08-18T15:59:59.999Z', NOW).ok, 'millisecond ISO-UTC accepted');

console.log('\n[ evidence-set scan ]');
const good = [{ external_id: 'A', fetched_at_utc: '2026-08-18T15:49:04Z', evidence_classification: 'OPEN' },
              { external_id: 'B', fetched_at_utc: null, evidence_classification: 'UNREACHABLE' }];
check(findInvalidTimestamp(good, NOW) === null, 'valid set passes (UNREACHABLE may lack a timestamp)');
const bad = [{ external_id: 'C', fetched_at_utc: '2026-08-14', evidence_classification: 'OPEN' }];
check(findInvalidTimestamp(bad, NOW)?.reason === 'hardcoded sentinel date', 'set with hardcoded date flagged');
const future = [{ external_id: 'D', fetched_at_utc: '2027-01-01T00:00:00Z', evidence_classification: 'OPEN' }];
check(findInvalidTimestamp(future, NOW)?.reason === 'future-dated', 'set with future date flagged');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
