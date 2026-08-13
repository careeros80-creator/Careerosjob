/**
 * tests/pilot/test_action_log.js — structured production logging (actionLog.js).
 * Every production action must carry trace_id, correlation_id, timestamp,
 * status, duration_ms. Run: node tests/pilot/test_action_log.js
 */
const { actionSQL, deadLetterSQL } = require('../../services/pilot/actionLog');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const uuids = (s) => (s.match(/'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'::uuid/gi) || []);

console.log('\n[ actionSQL — required fields ]');
const sql = actionSQL({ action: 'discover', stage: 'connector', dataSource: 'production',
  status: 'success', durationMs: 1234, attempt: 2, detail: { jobs: 45 } });
check(/INSERT INTO production_actions/.test(sql), 'targets production_actions');
['trace_id', 'correlation_id', 'status', 'duration_ms', 'detail'].forEach(f =>
  check(sql.includes(f), `column present: ${f}`));
check(!/occurred_at/.test(sql), 'occurred_at omitted → DB default now() supplies the timestamp');
check(sql.includes("'production'"), 'records data_source=production');
check(sql.includes('1234'), 'records duration_ms');
check(/,\s*2,/.test(sql), 'records attempt');

console.log('\n[ trace correlation ]');
check(uuids(sql).length === 2 && uuids(sql)[0] === uuids(sql)[1],
  'correlation_id defaults to trace_id (self-correlated)');
const withCorr = actionSQL({ action: 'x', traceId: '11111111-1111-4111-8111-111111111111',
  correlationId: '22222222-2222-4222-8222-222222222222' });
check(uuids(withCorr).length === 2 && uuids(withCorr)[0] !== uuids(withCorr)[1],
  'explicit correlation_id is preserved distinctly');

console.log('\n[ validation + provenance ]');
check(actionSQL({ action: 'x', status: 'bogus' }).includes("'success'"), 'invalid status coerced to success');
check(actionSQL({ action: 'x', dataSource: 'nope' }).includes("'test'"), 'unknown data_source coerced to test (conservative)');
check(actionSQL({ action: 'x' }).includes('NULL'), 'null duration → NULL (not fabricated)');

console.log('\n[ deadLetterSQL (retryable) ]');
const dlq = deadLetterSQL({ eventType: 'pilot.fetch_failed', payload: { a: 1 }, error: 'boom' });
check(/INSERT INTO dead_letter_queue/.test(dlq) && dlq.includes('pilot.fetch_failed') && dlq.includes('boom'),
  'dead_letter row carries event_type + payload + error');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
