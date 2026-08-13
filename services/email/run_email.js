/**
 * services/email/run_email.js
 *
 * VS2 M5 — email-intelligence runtime runner. Reads inbound messages
 * (Test Data fixtures) + existing applications as JSON on stdin, classifies +
 * extracts + links + builds timeline, and emits idempotent SQL
 * (emails upsert + application_timeline upsert). READ-ONLY (ADR-006).
 *
 *   input: { messages:[...], applications:[{id,job_id,company_id,gmail_thread_id,company_name,job_title}] }
 */
const { EmailIntelligenceService } = require('./EmailIntelligenceService');

const q  = (v) => (v == null ? 'NULL' : `$e$${String(v)}$e$`);
const qu = (v) => (v == null ? 'NULL' : `'${v}'::uuid`);
const qb = (v) => (v ? 'true' : 'false');
const qn = (v) => (v == null ? 'NULL' : String(v));
const qts = (v) => (v == null ? 'NULL' : `${q(v)}::timestamptz`);
const qj = (v) => `$e$${JSON.stringify(v)}$e$::jsonb`;

function emailSQL(e) {
  return `INSERT INTO emails (gmail_message_id, gmail_thread_id, application_id, job_id, company_id, from_address, subject, body_text, received_at, classification, confidence, is_urgent, requires_action, reply_deadline, meeting_at, meeting_timezone, meeting_location, meeting_url, attachments) ` +
    `VALUES (${q(e.gmail_message_id)}, ${q(e.gmail_thread_id)}, ${qu(e.application_id)}, ${qu(e.job_id)}, ${qu(e.company_id)}, ${q(e.from_address)}, ${q(e.subject)}, ${q(e.body_text)}, ${qts(e.received_at)}, ${q(e.classification)}::email_classification, ${qn(e.confidence)}, ${qb(e.is_urgent)}, ${qb(e.requires_action)}, ${qts(e.reply_deadline)}, ${qts(e.meeting_at)}, ${q(e.meeting_timezone)}, ${q(e.meeting_location)}, ${q(e.meeting_url)}, ${qj(e.attachments)}) ` +
    `ON CONFLICT (gmail_message_id) DO UPDATE SET application_id=EXCLUDED.application_id, job_id=EXCLUDED.job_id, company_id=EXCLUDED.company_id, classification=EXCLUDED.classification, confidence=EXCLUDED.confidence, is_urgent=EXCLUDED.is_urgent, requires_action=EXCLUDED.requires_action, reply_deadline=EXCLUDED.reply_deadline, meeting_at=EXCLUDED.meeting_at, meeting_timezone=EXCLUDED.meeting_timezone, meeting_location=EXCLUDED.meeting_location, meeting_url=EXCLUDED.meeting_url, attachments=EXCLUDED.attachments;`;
}

function timelineSQL(t) {
  return `INSERT INTO application_timeline (application_id, job_id, email_id, event_type, event_at, detail) ` +
    `VALUES (${qu(t.application_id)}, ${qu(t.job_id)}, (SELECT id FROM emails WHERE gmail_message_id=${q(t.gmail_message_id)}), ${q(t.event_type)}, ${qts(t.event_at)}, ${qj(t.detail)}) ` +
    `ON CONFLICT (email_id, event_type) WHERE email_id IS NOT NULL DO NOTHING;`;
}

async function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  const input = raw.trim() ? JSON.parse(raw) : {};

  const service = new EmailIntelligenceService();
  const { emails, timeline, metrics } = service.process(input.messages || [], { applications: input.applications || [] });

  const sql = ['BEGIN;'];
  for (const e of emails) sql.push(emailSQL(e));
  for (const t of timeline) sql.push(timelineSQL(t));
  sql.push('COMMIT;');

  process.stdout.write(sql.join('\n') + '\n');
  process.stderr.write(JSON.stringify({
    emails: emails.map(e => ({ id: e.gmail_message_id, class: e.classification, urgent: e.is_urgent, linked: !!e.application_id, meeting_at: e.meeting_at, url: e.meeting_url, attachments: e.attachments.length })),
    timeline: timeline.length,
    metrics,
  }, null, 2) + '\n');
}

module.exports = { emailSQL, timelineSQL };

if (require.main === module) {
  main().catch(e => { process.stderr.write('FATAL: ' + e.message + '\n'); process.exit(1); });
}
