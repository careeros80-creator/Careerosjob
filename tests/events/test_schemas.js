/**
 * tests/events/test_schemas.js
 * Validate all JSON Schemas + test payloads
 * Run: node tests/events/test_schemas.js
 */
const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

let passed = 0;
let failed = 0;

const compiledSchemas = {};

function pass(msg) { console.log(`✅ ${msg}`); passed++; }
function fail(msg, errors) {
  console.log(`❌ ${msg}`);
  if (errors) {
    errors.slice(0,2).forEach(e => console.log(`   → ${e.instancePath}: ${e.message}`));
  }
  failed++;
}

function getValidator(schemaPath) {
  if (!compiledSchemas[schemaPath]) {
    const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../../', schemaPath), 'utf-8'));
    compiledSchemas[schemaPath] = ajv.compile(schema);
  }
  return compiledSchemas[schemaPath];
}

function ok(schemaPath, data, label) {
  const v = getValidator(schemaPath);
  v(data) ? pass(`${label}`) : fail(`${label}`, v.errors);
}

function nok(schemaPath, data, label) {
  const v = getValidator(schemaPath);
  !v(data) ? pass(`${label} — correctly rejected`) : fail(`${label} — wrongly accepted`);
}

// ── job.discovered ────────────────────────────────────────
console.log('\n── job.discovered ──');

ok('schemas/events/job.discovered.v1.json', {
  event: 'job.discovered', version: '1.0',
  event_id: '550e8400-e29b-41d4-a716-000000000001',
  correlation_id: '550e8400-e29b-41d4-a716-000000000001',
  causation_id: null,
  payload: {
    raw_job_id: '550e8400-e29b-41d4-a716-446655440000',
    connector: 'jobbank',
    fetched_at: '2026-08-10T09:00:00Z',
    external_ref: 'JOBBANK_4287165'
  }
}, 'job.discovered — full valid payload');

ok('schemas/events/job.discovered.v1.json', {
  event: 'job.discovered', version: '1.0',
  event_id: '550e8400-e29b-41d4-a716-000000000002',
  correlation_id: '550e8400-e29b-41d4-a716-000000000002',
  payload: {
    raw_job_id: '550e8400-e29b-41d4-a716-446655440000',
    connector: 'indeed',
    fetched_at: '2026-08-10T09:00:00Z'
  }
}, 'job.discovered — optional fields absent');

nok('schemas/events/job.discovered.v1.json', {
  event: 'job.discovered', version: '1.0',
  event_id: '550e8400-e29b-41d4-a716-000000000003',
  correlation_id: '550e8400-e29b-41d4-a716-000000000003',
  payload: {
    raw_job_id: '550e8400-e29b-41d4-a716-446655440000',
    connector: 'INVALID_SOURCE',
    fetched_at: '2026-08-10T09:00:00Z'
  }
}, 'job.discovered — invalid connector');

nok('schemas/events/job.discovered.v1.json', {
  event: 'job.discovered', version: '1.0',
  // missing event_id and correlation_id
  payload: {
    raw_job_id: '550e8400-e29b-41d4-a716-446655440000',
    connector: 'jobbank',
    fetched_at: '2026-08-10T09:00:00Z'
  }
}, 'job.discovered — missing idempotency fields');

// ── job.scored ────────────────────────────────────────────
console.log('\n── job.scored ──');

ok('schemas/events/job.scored.v1.json', {
  event: 'job.scored', version: '1.0',
  event_id: '550e8400-e29b-41d4-a716-000000000010',
  correlation_id: '550e8400-e29b-41d4-a716-000000000001',
  causation_id: '550e8400-e29b-41d4-a716-000000000002',
  payload: {
    job_id: '550e8400-e29b-41d4-a716-446655440001',
    score: 92,
    priority: 'high',
    score_breakdown: { language:20, experience:23, visa:20, salary:15, province:10, recency:4 },
    lmia_required: 'c16_possible',
    passed_rules: true,
    failed_rules: [],
    ai_call_id: '550e8400-e29b-41d4-a716-446655440002',
    scored_at: '2026-08-10T09:05:00Z'
  }
}, 'job.scored — full valid payload');

nok('schemas/events/job.scored.v1.json', {
  event: 'job.scored', version: '1.0',
  event_id: '550e8400-e29b-41d4-a716-000000000011',
  correlation_id: '550e8400-e29b-41d4-a716-000000000001',
  payload: {
    job_id: '550e8400-e29b-41d4-a716-446655440001',
    score: 150,  // > 100
    priority: 'high',
    score_breakdown: { language:20, experience:23, visa:20, salary:15, province:10, recency:4 },
    lmia_required: 'no',
    passed_rules: true,
    scored_at: '2026-08-10T09:05:00Z'
  }
}, 'job.scored — score > 100');

// ── application.sent ──────────────────────────────────────
console.log('\n── application.sent ──');

ok('schemas/events/application.sent.v1.json', {
  event: 'application.sent', version: '1.0',
  event_id: '550e8400-e29b-41d4-a716-000000000020',
  correlation_id: '550e8400-e29b-41d4-a716-000000000001',
  causation_id: '550e8400-e29b-41d4-a716-000000000010',
  payload: {
    application_id: '550e8400-e29b-41d4-a716-000000000001',
    job_id: '550e8400-e29b-41d4-a716-000000000002',
    company_id: '550e8400-e29b-41d4-a716-000000000003',
    gmail_message_id: 'msg_abc123',
    gmail_thread_id: 'thread_xyz789',
    sent_to: 'hr@nordikspacanada.com',
    channel: 'gmail',
    sent_at: '2026-08-10T10:00:00Z',
    followup_scheduled: {
      day_7:  '2026-08-17T10:00:00Z',
      day_14: '2026-08-24T10:00:00Z',
      day_21: '2026-08-31T10:00:00Z'
    }
  }
}, 'application.sent — full valid payload');

// ── AI: extractor ─────────────────────────────────────────
console.log('\n── AI: extractor ──');

ok('schemas/ai/extractor.v1.json', {
  title_clean: 'Esthetician',
  company_clean: 'Nordik Spa Village',
  city: 'Gatineau', province: 'QC',
  salary_min: 35, salary_max: 45, salary_period: 'hourly',
  contract_type: 'full_time', language_required: 'bilingual',
  posted_date: '2026-08-09T00:00:00Z',
  apply_url: 'https://nordik.com/careers',
  is_beauty_related: true,
  beauty_keywords_found: ['esthetician', 'spa']
}, 'extractor — full valid output');

nok('schemas/ai/extractor.v1.json', {
  title_clean: 'Hairstylist',
  company_clean: 'Salon ABC',
  province: 'Ontario',  // should be 2-letter
  contract_type: 'full_time',
  language_required: 'fr',
  is_beauty_related: true,
  beauty_keywords_found: []
}, 'extractor — province not 2-letter code');

// ── AI: classifier ────────────────────────────────────────
console.log('\n── AI: classifier ──');

ok('schemas/ai/classifier.v1.json', {
  classification: 'interview',
  confidence: 0.97,
  key_phrase: 'We would like to schedule a video interview',
  is_urgent: true,
  suggested_action: 'Reply within 24 hours'
}, 'classifier — interview response');

nok('schemas/ai/classifier.v1.json', {
  classification: 'maybe',
  confidence: 0.5,
  key_phrase: 'some phrase',
  is_urgent: false
}, 'classifier — unknown classification');

// ── Summary ───────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) {
  console.log('  All schema tests passed! ✅');
  process.exit(0);
} else {
  console.log('  Some tests failed ❌');
  process.exit(1);
}
console.log('═══════════════════════════════════════\n');
