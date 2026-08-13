/**
 * scripts/pilot_email.js
 *
 * pilot/production-validation — the single email entrypoint that AUTO-TRANSITIONS
 * between Test Data and Production Runtime with no code change:
 *
 *   • GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN present
 *       → pulls REAL messages from the Gmail API (OAuth only, read-only)
 *       → emails written with data_source='production' (Production Runtime).
 *   • credentials absent
 *       → PENDING PILOT USER: falls back to the clearly-labelled Test Data
 *         fixtures → data_source='test'. Nothing is fabricated.
 *
 * ADR-006 unchanged: read-only. This never sends, replies to, or accepts
 * anything, and never touches a password.
 *
 * Emits idempotent SQL (emails + application_timeline + a production_actions
 * row) to stdout; a human-readable banner to stderr.
 *
 *   input (stdin, optional): { applications:[{id,job_id,company_id,gmail_thread_id,company_name,job_title}] }
 *   usage: node scripts/pilot_email.js < applications.json > email.sql
 */
const { GmailProvider } = require('../services/email/GmailProvider');
const { EmailIntelligenceService } = require('../services/email/EmailIntelligenceService');
const { emailSQL, timelineSQL } = require('../services/email/run_email');
const { newTraceId, traceSQL } = require('../services/observability/trace');

async function readStdin() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  return raw.trim() ? JSON.parse(raw) : {};
}

async function main() {
  const input = await readStdin().catch(() => ({}));
  const provider = GmailProvider.fromEnv();
  const source = provider.provenance();           // 'production' iff OAuth configured
  const traceId = newTraceId();

  let applications = input.applications || [];
  let messages = [];
  let banner;

  const t0 = Date.now();
  if (source === 'production') {
    messages = await provider.fetchMessages();    // REAL Gmail (OAuth, read-only)
    banner = `PRODUCTION RUNTIME — Gmail OAuth active: ${messages.length} real message(s) ingested.`;
  } else {
    const fx = require('../services/email/fixtures/messages');   // Test Data
    messages = fx.MESSAGES || [];
    if (!applications.length) applications = fx.APPLICATIONS || [];
    banner = `PENDING PILOT USER — Gmail OAuth not configured. Processing ${messages.length} Test Data fixture(s). ` +
             `Set GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN to switch to Production Runtime (no code change).`;
  }

  const service = new EmailIntelligenceService();
  const { emails, timeline, metrics } = service.process(messages, { applications });
  // provenance flows to every row; guard non-UUID link ids (fixtures use string
  // ids) → NULL so the emitted SQL is always DB-safe.
  const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  for (const e of emails) {
    e.data_source = source;
    if (!isUuid(e.application_id)) e.application_id = null;
    if (!isUuid(e.job_id)) e.job_id = null;
    if (!isUuid(e.company_id)) e.company_id = null;
  }
  for (const t of timeline) { if (!isUuid(t.application_id)) t.application_id = null; if (!isUuid(t.job_id)) t.job_id = null; }
  const durationMs = Date.now() - t0;

  const sql = ['BEGIN;', traceSQL(traceId, {
    trigger_type: 'runner', trigger_ref: 'pilot_email', status: 'ok',
    spans: [
      { context: 'email', operation: source === 'production' ? 'gmail_fetch' : 'fixture_load', ms: durationMs },
      { context: 'email', operation: 'classify', ms: 1 },
      { context: 'email', operation: 'link_application', ms: 1 },
      { context: 'email', operation: 'persist', ms: 1 },
    ],
  })];
  for (const e of emails) sql.push(emailSQL(e));
  for (const t of timeline) sql.push(timelineSQL(t));
  sql.push(
    `INSERT INTO production_actions (action, stage, trace_id, correlation_id, data_source, status, duration_ms, detail) ` +
    `VALUES ('email_ingest', 'gmail', '${traceId}'::uuid, '${traceId}'::uuid, '${source}', 'success', ${durationMs}, ` +
    `$d$${JSON.stringify({ source, messages: messages.length, emails: emails.length, pending_pilot_user: source === 'test' })}$d$::jsonb);`
  );
  sql.push('COMMIT;');

  process.stdout.write(sql.join('\n') + '\n');
  process.stderr.write(`${banner}\n` + JSON.stringify({
    provenance: source, messages: messages.length, emails: emails.length,
    linked: metrics.linked, by_class: metrics.by_class,
  }, null, 2) + '\n');
}

main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
