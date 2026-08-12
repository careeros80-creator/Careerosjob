/**
 * tests/enrichment/test_service.js
 * VS2 M3 — CompanyEnrichmentService unit tests (stamping + idempotency).
 * Run: node tests/enrichment/test_service.js
 */
const { CompanyEnrichmentService } = require('../../services/enrichment/CompanyEnrichmentService');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

function providerReturning(fields, spy) {
  return { name: 'p', source: 'unit_source', enrich: async () => { if (spy) spy.calls++; return { fields }; } };
}

(async () => {
  // ── field stamping (source + last_updated + confidence) ─
  section('[ field stamping ]');
  const svc = new CompanyEnrichmentService({
    provider: providerReturning({ website: { value: 'https://x.ca', confidence: 0.9 }, city: { value: 'Ottawa' } }),
    now: () => '2026-08-12T00:00:00Z',
  });
  const r = await svc.enrichOne({ id: 'c1', company_key: 'x' });
  check(r.ok && r.fields.website.value === 'https://x.ca', 'value passed through');
  check(r.fields.website.source === 'unit_source', 'source stamped');
  check(r.fields.website.last_updated === '2026-08-12T00:00:00Z', 'last_updated stamped');
  check(r.fields.website.confidence === 0.9, 'confidence preserved');
  check(r.fields.city.confidence === 0.5, 'missing confidence → default 0.5');

  // ── idempotency (same company → cache hit, no re-fetch) ─
  section('[ idempotency ]');
  const spy = { calls: 0 };
  const svc2 = new CompanyEnrichmentService({ provider: providerReturning({ website: { value: 'https://y.ca', confidence: 1 } }, spy), now: () => 'T' });
  const a = await svc2.enrichOne({ id: 'c2', company_key: 'y' });
  const b = await svc2.enrichOne({ id: 'c2', company_key: 'y' });
  check(spy.calls === 1, 'provider called once for repeated enrichment (idempotent)');
  check(a.cache === 'miss' && b.cache === 'hit', 'first miss, second cache hit');
  check(JSON.stringify(a.fields) === JSON.stringify(b.fields), 'same fields both times');

  // ── company-level only: service never fabricates ───────
  section('[ empty provider ]');
  const svc3 = new CompanyEnrichmentService({ provider: providerReturning({}) });
  const e = await svc3.enrichOne({ id: 'c3', company_key: 'z' });
  check(e.ok && Object.keys(e.fields).length === 0, 'empty provider → ok with 0 fields (no invention)');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
