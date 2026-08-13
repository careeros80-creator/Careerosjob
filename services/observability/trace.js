/**
 * services/observability/trace.js  (hardening — audit finding O-1)
 *
 * Emits SQL to record a distributed trace + spans for a pipeline stage run,
 * so every stage is observable and every emitted event can belong to a trace
 * (publish_event is called with correlation_id = trace_id).
 */
const crypto = require('crypto');

const newTraceId = () => crypto.randomUUID();

const T = (v) => (v == null ? 'NULL' : `$o$${String(v)}$o$`);

/**
 * @param {string} traceId
 * @param {object} o  { trigger_type, trigger_ref, job_id?, status?, spans:[{context,operation,ms,status?}] }
 * @returns SQL inserting one traces row + one spans row per stage span.
 */
function traceSQL(traceId, o = {}) {
  const spans = o.spans || [];
  const totalMs = spans.reduce((a, s) => a + (s.ms || 0), 0);
  const L = [];
  L.push(
    `INSERT INTO traces (trace_id, trigger_type, trigger_ref, job_id, status, started_at, finished_at, duration_ms, total_spans, failed_spans) ` +
    `VALUES ('${traceId}', ${T(o.trigger_type)}, ${T(o.trigger_ref)}, ${o.job_id ? `'${o.job_id}'::uuid` : 'NULL'}, ${T(o.status || 'completed')}, ` +
    `now() - ((${totalMs})::text||' milliseconds')::interval, now(), ${totalMs}, ${spans.length}, ${spans.filter(s => s.status === 'error').length});`
  );
  for (const s of spans) {
    L.push(
      `INSERT INTO spans (trace_id, span_id, context, operation, status, started_at, finished_at, duration_ms) ` +
      `VALUES ('${traceId}', '${crypto.randomUUID()}', ${T(s.context)}, ${T(s.operation)}, ${T(s.status || 'ok')}, ` +
      `now() - ((${s.ms || 0})::text||' milliseconds')::interval, now(), ${s.ms || 0});`
    );
  }
  return L.join('\n');
}

module.exports = { newTraceId, traceSQL };
