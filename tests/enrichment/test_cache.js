/**
 * tests/enrichment/test_cache.js
 * VS2 M3 — cache tests (hit within TTL, miss after expiry).
 * Run: node tests/enrichment/test_cache.js
 */
const { CompanyEnrichmentService } = require('../../services/enrichment/CompanyEnrichmentService');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

(async () => {
  const spy = { calls: 0 };
  let t = 0; // controllable clock
  const svc = new CompanyEnrichmentService({
    provider: { name: 'p', source: 's', enrich: async () => { spy.calls++; return { fields: { website: { value: 'https://x.ca', confidence: 1 } } }; } },
    ttlMs: 1000,
    clock: () => t,
    now: () => 'T',
  });
  const co = { id: 'c1', company_key: 'k' };

  section('[ cache hit within TTL ]');
  t = 0;    const r1 = await svc.enrichOne(co); check(r1.cache === 'miss', 't=0 → miss (cold)');
  t = 500;  const r2 = await svc.enrichOne(co); check(r2.cache === 'hit', 't=500 (<TTL) → hit');
  t = 999;  const r3 = await svc.enrichOne(co); check(r3.cache === 'hit', 't=999 (<TTL) → hit');
  check(spy.calls === 1, 'provider called only once while cached');
  check(svc.metrics.cache_hits === 2 && svc.metrics.cache_misses === 1, 'metrics: hits=2 misses=1');

  section('[ miss after TTL expiry ]');
  t = 2000; const r4 = await svc.enrichOne(co); check(r4.cache === 'miss', 't=2000 (>TTL) → miss (refetch)');
  check(spy.calls === 2, 'provider called again after expiry');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
