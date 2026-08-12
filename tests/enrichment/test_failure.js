/**
 * tests/enrichment/test_failure.js
 * VS2 M3 — failure isolation (one company failing must not stop the batch).
 * Run: node tests/enrichment/test_failure.js
 */
const { CompanyEnrichmentService } = require('../../services/enrichment/CompanyEnrichmentService');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

// Provider that throws for companies flagged fail=true, succeeds otherwise.
const provider = {
  name: 'p', source: 's',
  enrich: async (company) => {
    if (company.fail) throw new Error('provider exploded');
    return { fields: { website: { value: `https://${company.company_key}.ca`, confidence: 1 } } };
  },
};

(async () => {
  section('[ batch isolation ]');
  const svc = new CompanyEnrichmentService({ provider, maxAttempts: 2 });
  const { results, health } = await svc.processBatch([
    { id: 'a', company_key: 'a' },
    { id: 'b', company_key: 'b', fail: true },   // crashes
    { id: 'c', company_key: 'c' },               // must still run
  ]);
  const by = Object.fromEntries(results.map(r => [r.company_id, r]));
  check(results.length === 3, 'batch returned all 3 results (never threw)');
  check(by.a.ok === true, 'company a enriched');
  check(by.b.ok === false && /exploded/.test(by.b.error), 'company b failed (captured)');
  check(by.c.ok === true, 'company c STILL enriched after b crashed ✅ isolation');
  check(health.enriched === 2 && health.failed === 1, 'health: enriched=2 failed=1');

  section('[ failing provider never crashes the service ]');
  const svc2 = new CompanyEnrichmentService({ provider: { name: 'x', source: 's', enrich: async () => { throw 'not-an-error-object'; } }, maxAttempts: 1 });
  let threw = false;
  let out;
  try { out = await svc2.processBatch([{ id: 'z', company_key: 'z' }]); } catch { threw = true; }
  check(!threw, 'processBatch does not throw even on a non-Error throw');
  check(out && out.results[0].ok === false, 'result marked failed');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
