/**
 * tests/normalizer/test_normalize.js
 * VS2 — Normalizer unit tests.
 * Run: node tests/normalizer/test_normalize.js
 */
const {
  normalizeTitle, normalizeCompany, parseLocation, parseSalary, dedupKey, normalizeJob,
} = require('../../services/normalizer/normalize');

let passed = 0, failed = 0;
function check(cond, label) {
  if (cond) { console.log(`  ☑ ${label}`); passed++; }
  else      { console.log(`  ✗ ${label}`); failed++; }
}
function eq(a, b, label) { check(JSON.stringify(a) === JSON.stringify(b), `${label} (got ${JSON.stringify(a)})`); }
function section(t) { console.log(`\n${t}`); }

// ── Title ────────────────────────────────────────────────
section('[ title ]');
eq(normalizeTitle('  Esthetician   '), 'Esthetician', 'trims + collapses');
eq(normalizeTitle('Make   Up  Artist'), 'Make Up Artist', 'collapses inner whitespace');
eq(normalizeTitle(null), null, 'null → null');

// ── Company ──────────────────────────────────────────────
section('[ company ]');
eq(normalizeCompany('Nordik Spa Village').company_key, 'nordik spa village', 'basic key');
eq(normalizeCompany('Salon Élégance Inc.').company_key, 'salon elegance', 'accents + suffix stripped');
eq(normalizeCompany('The Beauty Group Ltd').company_key, 'beauty', 'drops the/group/ltd');
check(normalizeCompany('Nordik Spa').company_key === normalizeCompany('NORDIK  spa').company_key, 'case/space-insensitive match');
eq(normalizeCompany(null).company_key, null, 'null → null');

// ── Location ─────────────────────────────────────────────
section('[ location ]');
eq(parseLocation('Ottawa, ON'), { city: 'Ottawa', province: 'ON' }, 'City, CODE');
eq(parseLocation('Moncton, NB'), { city: 'Moncton', province: 'NB' }, 'City, NB');
eq(parseLocation('Gatineau, Quebec, Canada'), { city: 'Gatineau', province: 'QC' }, 'full province + drops Canada');
eq(parseLocation('Toronto, Ontario'), { city: 'Toronto', province: 'ON' }, 'full province name');
eq(parseLocation('Montréal, Québec'), { city: 'Montréal', province: 'QC' }, 'accented province');
eq(parseLocation('Remote'), { city: 'Remote', province: null }, 'no province → city only');
eq(parseLocation(null), { city: null, province: null }, 'null → nulls');

// ── Salary ───────────────────────────────────────────────
section('[ salary ]');
(() => {
  const r = parseSalary('$38.00 to $44.00 hourly');
  check(r.salary_min === 38 && r.salary_max === 44 && r.salary_period === 'hourly', 'range hourly → 38..44');
  check(r.salary_min_hourly === 38 && r.salary_max_hourly === 44, 'hourly equiv unchanged');
})();
(() => {
  const r = parseSalary('$21.00 hourly');
  check(r.salary_min === 21 && r.salary_max === null && r.salary_period === 'hourly', 'single hourly → 21 / null');
})();
(() => {
  const r = parseSalary('$55,000 annually');
  check(r.salary_min === 55000 && r.salary_period === 'annual', 'annual amount parsed');
  check(r.salary_min_hourly === Math.round(55000 / 2080), 'annual → hourly equivalent');
})();
(() => {
  const r = parseSalary('competitive');
  check(r.salary_min === null && r.salary_max === null && r.salary_period === null, 'non-numeric → nulls');
})();
eq(parseSalary(null).salary_currency, 'CAD', 'default currency CAD');

// ── Dedup (cross-provider) ───────────────────────────────
section('[ dedup ]');
(() => {
  const a = { title: 'Esthetician', company_raw: 'Nordik Spa Village', location_raw: 'Ottawa, ON' };
  const b = { title: 'esthetician',  company_raw: 'NORDIK SPA VILLAGE Inc.', location_raw: 'Ottawa, Ontario' };
  const c = { title: 'Hairstylist',  company_raw: 'Nordik Spa Village', location_raw: 'Ottawa, ON' };
  check(dedupKey(a) === dedupKey(b), 'same posting across sources → same dedup key');
  check(dedupKey(a) !== dedupKey(c), 'different title → different dedup key');
})();

// ── Whole-job normalization ──────────────────────────────
section('[ normalizeJob ]');
(() => {
  const j = normalizeJob({
    title: '  Esthetician ', company_raw: 'Nordik Spa Village',
    location_raw: 'Gatineau, Quebec, Canada', salary_raw: '$38.00 to $44.00 hourly', country: 'CA',
  });
  check(j.title === 'Esthetician', 'title cleaned');
  check(j.city === 'Gatineau' && j.province === 'QC', 'location normalized');
  check(j.salary_min === 38 && j.salary_max === 44, 'salary normalized');
  check(/^[a-f0-9]{40}$/.test(j.dedup_key), 'dedup_key present');
})();

// ── Summary ──────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) { console.log('  Normalizer tests passed! ✅'); process.exit(0); }
else { console.log('  Some tests failed ❌'); process.exit(1); }
