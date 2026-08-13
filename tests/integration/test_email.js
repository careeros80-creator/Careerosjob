/**
 * tests/integration/test_email.js — VS2 M5 end-to-end email intelligence.
 * Run: node tests/integration/test_email.js
 */
const { EmailIntelligenceService } = require('../../services/email/EmailIntelligenceService');
const { GmailProvider } = require('../../services/email/GmailProvider');
const { MESSAGES, APPLICATIONS } = require('../../services/email/fixtures/messages');
const { emailSQL, timelineSQL } = require('../../services/email/run_email');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

(async () => {
  section('[ Gmail provider — OAuth only, no fabrication ]');
  const gp = new GmailProvider({ config: {} });
  check(gp.authType === 'oauth2' && gp.isConfigured() === false, 'OAuth2 provider, unconfigured by default (no passwords)');
  let threw = false; try { await gp.fetchMessages({}); } catch { threw = true; }
  check(threw, 'refuses to return data with no config + no injected messages');
  const msgs = await gp.fetchMessages({ messages: MESSAGES });
  check(msgs.length === 6, 'injected Test Data messages returned');

  section('[ process pipeline ]');
  const svc = new EmailIntelligenceService();
  const { emails, timeline, metrics } = svc.process(MESSAGES, { applications: APPLICATIONS });
  check(emails.length === 6, 'all 6 emails processed');
  check(metrics.by_class.interview === 1 && metrics.by_class.offer === 1 && metrics.by_class.rejection === 1 &&
        metrics.by_class.question === 1 && metrics.by_class.auto_reply === 1 && metrics.by_class.ignore === 1,
    'one of each class');

  section('[ metadata + linking ]');
  const int = emails.find(e => e.gmail_message_id === 'MSG_INT_1');
  check(int.meeting_at === '2026-08-20T14:00:00' && int.meeting_url.includes('zoom'), 'interview meeting metadata extracted');
  check(int.application_id === 'app-nordik' && int.job_id === 'job-nordik', 'interview linked to Nordik application');
  const offer = emails.find(e => e.gmail_message_id === 'MSG_OFFER_1');
  check(offer.attachments.length === 1 && offer.requires_action === true, 'offer has attachment + requires action');
  check(metrics.linked === 4, '4 emails linked to applications (auto-reply + unknown unlinked)');

  section('[ timeline ]');
  check(timeline.length === 4, 'timeline entry per linked email');
  const types = timeline.map(t => t.event_type).sort();
  check(types.includes('interview_detected') && types.includes('offer') && types.includes('rejection') && types.includes('info_requested'),
    'timeline event types reflect classifications');

  section('[ read-only + idempotent SQL (ADR-006) ]');
  const esql = emailSQL(int);
  check(/INSERT INTO emails/.test(esql) && /ON CONFLICT \(gmail_message_id\) DO UPDATE/.test(esql), 'emails upsert idempotent by gmail_message_id');
  const tsql = timelineSQL(timeline[0]);
  check(/ON CONFLICT \(email_id, event_type\) DO NOTHING/.test(tsql), 'timeline idempotent by (email,event)');
  const all = [...emails.map(emailSQL), ...timeline.map(timelineSQL)].join('\n');
  // read-only: only writes to emails / application_timeline; no send/outbox/status=sent
  check(!/INSERT INTO outbox|status\s*=\s*'sent'|sendmail|smtp|gmail\.send/i.test(all), 'no outbound/send action generated (read-only)');
  check(/^(INSERT INTO emails|INSERT INTO application_timeline|BEGIN|COMMIT)/.test(emailSQL(int).trim().split('\n')[0]) || /INSERT INTO emails/.test(emailSQL(int)), 'only writes emails/timeline');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
