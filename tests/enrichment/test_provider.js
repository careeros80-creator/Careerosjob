/**
 * tests/enrichment/test_provider.js
 * VS2 M3 — PublicWebsiteProvider unit tests (extraction + privacy guardrail).
 * Run: node tests/enrichment/test_provider.js
 */
const { PublicWebsiteProvider, isRoleEmail } = require('../../services/enrichment/providers/PublicWebsiteProvider');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

const HTML = `
<html><head><meta name="description" content="Nordik Spa — beauty & esthetics in Ottawa. We are hiring."></head>
<body><h1>Nordik Spa</h1><p>Spa and beauty services.</p>
<a href="/careers">Careers</a>
<div>123 Rue Principale, Ottawa, ON K1A 0B1 · tel: 613-555-0142 ·
  careers@nordik.example.ca — do NOT email john.smith@nordik.example.ca or ceo.tremblay@nordik.example.ca</div>
</body></html>`;

(async () => {
  // ── privacy guardrail: role vs personal ────────────────
  section('[ email guardrail ]');
  check(isRoleEmail('careers@x.ca') === true, 'careers@ accepted (role)');
  check(isRoleEmail('jobs@x.ca') === true, 'jobs@ accepted (role)');
  check(isRoleEmail('john.smith@x.ca') === false, 'john.smith@ rejected (personal)');
  check(isRoleEmail('ceo.tremblay@x.ca') === false, 'ceo.tremblay@ rejected (personal)');
  check(isRoleEmail('samira@x.ca') === false, 'bare personal name rejected');

  // ── extraction ─────────────────────────────────────────
  section('[ extraction ]');
  const p = new PublicWebsiteProvider();
  const { fields } = await p.enrich({ website: 'https://nordik.example.ca' }, { fetch: async () => HTML });

  check(fields.recruitment_email.value === 'careers@nordik.example.ca', 'recruitment_email = role-based only');
  const blob = JSON.stringify(fields);
  check(!/john\.smith|ceo\.tremblay/.test(blob), 'NO personal email anywhere in output');
  check(fields.business_phone && /613.*555.*0142/.test(fields.business_phone.value), 'business phone extracted');
  check(fields.postal_code.value === 'K1A 0B1', 'postal code normalized');
  check(/careers/.test(fields.careers_url.value), 'careers URL extracted');
  check(fields.business_category.value === 'Beauty & Personal Care', 'category inferred');
  check(fields.hiring_status.value === 'hiring', 'hiring status detected');
  check(fields.website.value === 'https://nordik.example.ca', 'website recorded');
  check(fields.recruitment_email.confidence >= 0.9, 'confidence attached per field');

  // ── no website → empty (no invention) ──────────────────
  section('[ no website ]');
  const empty = await p.enrich({}, { fetch: async () => HTML });
  check(Object.keys(empty.fields).length === 0 && /no public website/.test(empty.note), 'no website → no fields, documented note');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
