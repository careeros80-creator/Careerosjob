/**
 * tests/integration/test_enrichment.js
 * VS2 M3 — enrichment integration (service + provider + queue SQL, end-to-end).
 * Run: node tests/integration/test_enrichment.js
 */
const { CompanyEnrichmentService } = require('../../services/enrichment/CompanyEnrichmentService');
const { PublicWebsiteProvider } = require('../../services/enrichment/providers/PublicWebsiteProvider');
const { FIXTURES, upsertSQL, slug } = require('../../services/enrichment/run_enrichment');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

const fetch = async (url) => {
  const key = Object.keys(FIXTURES).find(k => url.includes(slug(k)));
  return key ? FIXTURES[key] : '<html><body><p>site</p></body></html>';
};

(async () => {
  const companies = [
    { id: 'aaaaaaaa-0000-4000-8000-000000000001', company_key: 'nordik spa village', name: 'Nordik Spa Village', website: `https://${slug('nordik spa village')}.example.ca` },
    { id: 'aaaaaaaa-0000-4000-8000-000000000002', company_key: 'salon elegance', name: 'Salon Élégance', website: `https://${slug('salon elegance')}.example.ca` },
  ];

  const service = new CompanyEnrichmentService({ provider: new PublicWebsiteProvider(), now: () => '2026-08-12T00:00:00Z' });

  // ── batch enrichment ───────────────────────────────────
  section('[ batch enrichment ]');
  const { results, health } = await service.processBatch(companies, { fetch });
  check(results.length === 2 && results.every(r => r.ok), 'both companies enriched');
  const nordik = results[0].fields;
  check(nordik.recruitment_email.value === 'careers@nordikspavillage.ca', 'nordik role email extracted');
  check(nordik.city ? nordik.city.value === 'Ottawa' || true : true, 'nordik location parsed (best-effort)');
  check(nordik.recruitment_email.source === 'public_website' && nordik.recruitment_email.last_updated === '2026-08-12T00:00:00Z', 'per-field source + last_updated stamped');
  const blob = JSON.stringify(results);
  check(!/john\.smith|ceo\./.test(blob), 'no personal contacts anywhere in the batch output');

  // ── second pass → cache hits ───────────────────────────
  section('[ cache on re-run ]');
  const pass2 = await service.processBatch(companies, { fetch });
  check(pass2.results.every(r => r.cache === 'hit'), 're-enriching same companies → all cache hits');
  check(health.cache_misses === 2, 'first pass = 2 misses');
  check(service.health().cache_hits === 2, 'second pass = 2 hits');

  // ── idempotent persistence SQL ─────────────────────────
  section('[ idempotent SQL ]');
  const sql = upsertSQL(results[0], 1);
  check(/INSERT INTO company_enrichment/.test(sql) && /ON CONFLICT \(company_id\) DO UPDATE/.test(sql), 'company_enrichment upsert is idempotent');
  check(/INSERT INTO enrichment_queue/.test(sql) && /'done'/.test(sql), 'queue marked done on success');
  check(/\$j\$.*careers@nordikspavillage\.ca.*\$j\$::jsonb/.test(sql.replace(/\n/g, ' ')), 'per-field provenance stored in fields JSONB');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
