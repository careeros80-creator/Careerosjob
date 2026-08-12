/**
 * tests/integration/test_vs2_normalize.js
 * VS2 — Normalization pipeline integration test (raw → cleaned → job.cleaned).
 * Deterministic, DB-free (mirrors test_vs1's approach): asserts the pipeline
 * plan the runner applies to the database.
 * Run: node tests/integration/test_vs2_normalize.js
 */
const { planNormalization, renderSQL } = require('../../services/normalizer/run_normalize');

let passed = 0, failed = 0;
function check(cond, label) { if (cond) { console.log(`  ☑ ${label}`); passed++; } else { console.log(`  ✗ ${label}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

// Raw jobs as VS1 leaves them (pipeline_status raw, province/city/salary_min null).
const RAW = [
  { id: 'aaaaaaaa-0000-4000-8000-000000000001', external_id: 'JOBBANK_4287165',
    content_hash: '11111111-1111-4111-8111-111111111111', source: 'jobbank',
    title: 'Esthetician', company_raw: 'Nordik Spa Village',
    location_raw: 'Ottawa, ON', salary_raw: '$38.00 to $44.00 hourly' },
  { id: 'aaaaaaaa-0000-4000-8000-000000000002', external_id: 'JOBBANK_4291822',
    content_hash: '22222222-2222-4222-8222-222222222222', source: 'jobbank',
    title: 'Hairstylist', company_raw: 'Salon Élégance',
    location_raw: 'Moncton, NB', salary_raw: '$21.00 hourly' },
];

// ── Block 1: raw → cleaned ────────────────────────────────
section('[ raw → cleaned ]');
const plan = planNormalization({ rawJobs: RAW, identities: [], dedupKeys: [] });
check(plan.jobUpdates.length === 2, '2 jobs processed');
check(plan.jobUpdates.every(j => j.pipeline_status === 'cleaned'), 'both flip to pipeline_status=cleaned');

const est = plan.jobUpdates.find(j => j.external_id === 'JOBBANK_4287165');
const hair = plan.jobUpdates.find(j => j.external_id === 'JOBBANK_4291822');
check(est.province === 'ON' && est.city === 'Ottawa', 'Esthetician → Ottawa/ON');
check(est.salary_min === 38 && est.salary_max === 44, 'Esthetician salary 38..44');
check(hair.province === 'NB' && hair.city === 'Moncton', 'Hairstylist → Moncton/NB');
check(hair.salary_min === 21 && hair.salary_max === null, 'Hairstylist salary 21/null');

// ── Block 2: company resolution ──────────────────────────
section('[ company resolution ]');
check(plan.companies.length === 2, '2 companies created');
check(plan.identities.length === 2, '2 company_identities created');
check(plan.jobUpdates.every(j => j.company_id), 'every job mapped to a company_id');
check(est.company_id !== hair.company_id, 'distinct companies get distinct ids');

// ── Block 3: job.cleaned events ──────────────────────────
section('[ job.cleaned events ]');
check(plan.events.length === 2, '2 job.cleaned events emitted');
check(plan.events.every(e => e.type === 'job.cleaned'), 'event type = job.cleaned');
check(plan.events.every(e => e.payload.parser_version === '1.0.0'), 'parser_version = 1.0.0');
check(plan.events.every(e => e.payload.is_duplicate === false), 'is_duplicate = false (all unique)');

// ── Block 4: metrics ─────────────────────────────────────
section('[ metrics ]');
check(plan.metrics.jobs_cleaned === 2, 'metrics.jobs_cleaned = 2');
check(plan.metrics.with_province === 2, 'metrics.with_province = 2');
check(plan.metrics.with_city === 2, 'metrics.with_city = 2');
check(plan.metrics.with_salary === 2, 'metrics.with_salary = 2');
check(plan.metrics.with_company === 2, 'metrics.with_company = 2');
check(plan.metrics.duplicates === 0, 'metrics.duplicates = 0');

// ── Block 5: cross-provider dedup ────────────────────────
section('[ cross-provider dedup ]');
const dupPlan = planNormalization({
  rawJobs: [
    RAW[0],
    { id: 'bbbbbbbb-0000-4000-8000-000000000003', external_id: 'INDEED_9001',
      content_hash: '33333333-3333-4333-8333-333333333333', source: 'indeed',
      title: 'esthetician', company_raw: 'NORDIK SPA VILLAGE Inc.', location_raw: 'Ottawa, Ontario' },
  ], identities: [], dedupKeys: [],
});
check(dupPlan.metrics.duplicates === 1, 'same posting from another source flagged duplicate');
const dup = dupPlan.jobUpdates.find(j => j.external_id === 'INDEED_9001');
check(dup.is_duplicate === true && dup.pipeline_status === 'duplicate', 'duplicate → pipeline_status=duplicate');
check(dupPlan.companies.length === 1, 'duplicate maps to the SAME company (1 created)');

// ── Block 6: idempotency (already-cleaned not reprocessed) ─
section('[ idempotency ]');
const known = planNormalization({ rawJobs: [RAW[0]], identities: [], dedupKeys: [] });
const seenKey = known.jobUpdates[0].dedup_key;
const second = planNormalization({ rawJobs: [RAW[0]], identities: [
  { normalized_name: 'nordik spa village', company_id: known.companies[0].id },
], dedupKeys: [seenKey] });
check(second.companies.length === 0, 'existing company reused (no duplicate company)');
check(second.jobUpdates[0].is_duplicate === true, 'already-seen dedup_key → duplicate');

// ── Block 7: SQL rendering sanity ────────────────────────
section('[ SQL rendering ]');
const sql = renderSQL(plan);
check(sql.startsWith('BEGIN;') && sql.trim().endsWith('COMMIT;'), 'wrapped in a transaction');
check((sql.match(/publish_event\('job\.cleaned'/g) || []).length === 2, 'renders 2 job.cleaned publish_event calls');
check(sql.includes("pipeline_status=$v$cleaned$v$"), 'renders pipeline_status=cleaned update');
check(!/\$v\$[^$]*\$v\$[^;]*\$v\$[^;]*undefined/.test(sql), 'no undefined values leaked into SQL');

// ── Summary ──────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) { console.log('  VS2 normalization integration tests passed! ✅'); process.exit(0); }
else { console.log('  Some tests failed ❌'); process.exit(1); }
