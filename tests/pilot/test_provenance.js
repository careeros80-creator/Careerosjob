/**
 * tests/pilot/test_provenance.js — Gmail OAuth provider + auto test→production.
 * OAuth only, never fabricate, provenance flips with credentials (no code change).
 * The Gmail resource below is a Test Data sample (no network).
 * Run: node tests/pilot/test_provenance.js
 */
const { GmailProvider } = require('../../services/email/GmailProvider');
const { emailSQL } = require('../../services/email/run_email');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const b64url = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

console.log('\n[ provenance flips with OAuth credentials — no code change ]');
const noCreds = new GmailProvider({ config: {} });
check(noCreds.isConfigured() === false && noCreds.provenance() === 'test',
  'no credentials → provenance=test (Pending Pilot User)');
const withCreds = new GmailProvider({ config: { clientId: 'a', clientSecret: 'b', refreshToken: 'c' } });
check(withCreds.isConfigured() === true && withCreds.provenance() === 'production',
  'client id/secret/refresh token → provenance=production');
check(GmailProvider.fromEnv({ GMAIL_CLIENT_ID: 'a', GMAIL_CLIENT_SECRET: 'b', GMAIL_REFRESH_TOKEN: 'c' }).isConfigured(),
  'fromEnv() builds a configured provider from OAuth env vars');
check(!('password' in withCreds.config) && !('GMAIL_PASSWORD' in process.env),
  'no password field anywhere — OAuth only');

console.log('\n[ never fabricates ]');
(async () => {
  const injected = await noCreds.fetchMessages({ messages: [{ gmail_message_id: 'x' }] });
  check(injected.length === 1, 'injected fixtures returned as-is (Test Data path)');
  let threw = false;
  try { await noCreds.fetchMessages(); } catch (e) { threw = /not configured|no live inbox|fabricat/i.test(e.message); }
  check(threw, 'no creds + no fixtures → throws (refuses to invent data)');

  console.log('\n[ maps a real Gmail API resource to the internal shape ]');
  const sample = {
    id: 'msg-1', threadId: 'thr-9', internalDate: String(Date.UTC(2026, 7, 10, 14, 0, 0)),
    payload: {
      headers: [
        { name: 'From', value: 'HR <hr@acme.ca>' },
        { name: 'Subject', value: 'Interview invitation' },
      ],
      parts: [
        { mimeType: 'text/plain', body: { data: b64url('We would like to schedule an interview with you.') } },
        { filename: 'job_description.pdf', mimeType: 'application/pdf', body: { attachmentId: 'a1' } },
      ],
    },
  };
  const mapped = GmailProvider.mapGmailMessage(sample);
  check(mapped.gmail_message_id === 'msg-1' && mapped.gmail_thread_id === 'thr-9', 'maps id + thread id');
  check(mapped.from_address === 'HR <hr@acme.ca>' && mapped.subject === 'Interview invitation', 'maps From + Subject headers');
  check(/schedule an interview/.test(mapped.body_text), 'decodes base64url text/plain body');
  check(mapped.attachments.length === 1 && mapped.attachments[0].filename === 'job_description.pdf', 'collects attachment metadata');
  check(mapped.received_at && mapped.received_at.startsWith('2026-08-10'), 'derives received_at from internalDate');

  console.log('\n[ provenance reaches the persisted row ]');
  const prod = emailSQL({ gmail_message_id: 'm', attachments: [], classification: 'interview', data_source: 'production' });
  check(/data_source/.test(prod) && prod.includes('production'), 'production email persists data_source=production');
  const test = emailSQL({ gmail_message_id: 'm', attachments: [], classification: 'interview' });
  check(test.includes('test') && !test.includes('production'), 'unlabelled email defaults to Test Data');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
