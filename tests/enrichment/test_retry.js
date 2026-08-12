/**
 * tests/enrichment/test_retry.js
 * VS2 M3 — retry policy tests.
 * Run: node tests/enrichment/test_retry.js
 */
const { CompanyEnrichmentService } = require('../../services/enrichment/CompanyEnrichmentService');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

// Provider that throws the first `failTimes` calls, then succeeds.
function flakyProvider(failTimes) {
  let n = 0;
  return { name: 'flaky', source: 's', enrich: async () => { if (n++ < failTimes) throw new Error(`transient ${n}`); return { fields: { website: { value: 'https://ok.ca', confidence: 1 } } }; } };
}

(async () => {
  // ── recovers within maxAttempts ────────────────────────
  section('[ retry then succeed ]');
  const svc = new CompanyEnrichmentService({ provider: flakyProvider(2), maxAttempts: 3 });
  const r = await svc.enrichOne({ id: 'a', company_key: 'a' });
  check(r.ok === true, 'succeeds after transient failures');
  check(r.attempts === 3, 'took 3 attempts (2 fail + 1 success)');
  check(svc.metrics.retries === 2, 'metrics.retries = 2');

  // ── exhausts maxAttempts → failure ─────────────────────
  section('[ exhaust attempts ]');
  const svc2 = new CompanyEnrichmentService({ provider: flakyProvider(99), maxAttempts: 3 });
  const f = await svc2.enrichOne({ id: 'b', company_key: 'b' });
  check(f.ok === false, 'gives up after maxAttempts');
  check(f.attempts === 3, 'attempts capped at maxAttempts=3');
  check(/transient/.test(f.error), 'last error surfaced');
  check(svc2.metrics.retries === 2, 'retries counted (attempts-1)');

  // ── maxAttempts=1 → no retry ───────────────────────────
  section('[ no-retry policy ]');
  const svc3 = new CompanyEnrichmentService({ provider: flakyProvider(1), maxAttempts: 1 });
  const g = await svc3.enrichOne({ id: 'c', company_key: 'c' });
  check(g.ok === false && g.attempts === 1 && svc3.metrics.retries === 0, 'maxAttempts=1 → single try, 0 retries');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
