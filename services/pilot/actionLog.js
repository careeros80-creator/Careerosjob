/**
 * services/pilot/actionLog.js
 *
 * pilot/production-validation — structured production logging. Every production
 * action is recorded in production_actions with the five required fields:
 * trace_id, correlation_id, timestamp (occurred_at default now()), status, and
 * duration_ms. A failed stage is dead-lettered so it stays retryable.
 */
const { newTraceId } = require('../observability/trace');

const STATUSES = ['success', 'error', 'retrying', 'skipped'];
const q = (v, tag = 'd') => (v == null ? 'NULL' : `$${tag}$${String(v)}$${tag}$`);

/** Build the production_actions INSERT for one action (always trace-correlated). */
function actionSQL(a = {}) {
  const trace = a.traceId || newTraceId();
  const corr = a.correlationId || trace;
  const dataSource = a.dataSource === 'production' ? 'production' : 'test';
  const status = STATUSES.includes(a.status) ? a.status : 'success';
  const attempt = a.attempt == null ? 1 : Math.trunc(a.attempt);
  const duration = a.durationMs == null ? 'NULL' : Math.trunc(a.durationMs);
  return `INSERT INTO production_actions (action, stage, trace_id, correlation_id, data_source, status, attempt, duration_ms, detail) ` +
    `VALUES (${q(a.action, 'a')}, ${q(a.stage, 'g')}, '${trace}'::uuid, '${corr}'::uuid, '${dataSource}', '${status}', ${attempt}, ${duration}, ${q(JSON.stringify(a.detail || {}), 'j')}::jsonb);`;
}

/** Dead-letter a failed stage. Unresolved rows (resolved=false) are the retryable ones. */
function deadLetterSQL(d = {}) {
  return `INSERT INTO dead_letter_queue (event_type, payload, error) ` +
    `VALUES (${q(d.eventType, 't')}, ${q(JSON.stringify(d.payload || {}), 'p')}::jsonb, ${q(d.error, 'e')});`;
}

module.exports = { actionSQL, deadLetterSQL, STATUSES };
