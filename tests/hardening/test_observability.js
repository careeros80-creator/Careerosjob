/**
 * tests/hardening/test_observability.js — O-1: traces/spans wiring + events belong to a trace.
 * Run: node tests/hardening/test_observability.js
 */
const { newTraceId, traceSQL } = require('../../services/observability/trace');
const { planNormalization, renderSQL } = require('../../services/normalizer/run_normalize');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

section('[ trace helper ]');
const id = newTraceId();
check(/^[0-9a-f-]{36}$/.test(id), 'newTraceId() → uuid');
const sql = traceSQL(id, { trigger_type: 'runner', trigger_ref: 'unit', spans: [
  { context: 'stage', operation: 'a', ms: 2 }, { context: 'stage', operation: 'b', ms: 3, status: 'error' },
] });
check(sql.includes(`INSERT INTO traces`) && sql.includes(`'${id}'`), 'emits a traces row with the trace id');
check((sql.match(/INSERT INTO spans/g) || []).length === 2, 'emits one span row per span');
check(sql.includes('total_spans, failed_spans') && sql.includes(', 2, 1)'), 'trace records total_spans=2, failed_spans=1');

section('[ every emitted event belongs to a trace ]');
const plan = planNormalization({ rawJobs: [
  { id: '11111111-1111-4111-8111-111111111111', external_id: 'JOBBANK_1', content_hash: '22222222-2222-4222-8222-222222222222',
    source: 'jobbank', title: 'Esthetician', company_raw: 'Nordik', location_raw: 'Ottawa, ON', salary_raw: '$38 hourly' },
] });
const traceId = newTraceId();
const out = renderSQL(plan, traceId);
check(out.includes('INSERT INTO traces') && out.includes(`'${traceId}'`), 'runner output includes the trace');
check(out.includes("publish_event('job.cleaned'"), 'emits job.cleaned');
check(new RegExp(`publish_event[\\s\\S]*'${traceId}'::uuid\\)`).test(out), 'job.cleaned carries correlation_id = trace_id (event belongs to trace)');

section('[ no trace id → no tracing (backward compatible) ]');
const out2 = renderSQL(plan);
check(!out2.includes('INSERT INTO traces'), 'renderSQL without traceId omits tracing');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
