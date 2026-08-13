/**
 * tests/email/test_attachments.js — VS2 M5 attachment extraction.
 * Run: node tests/email/test_attachments.js
 */
const { parseEmail } = require('../../services/email/parser');
const { MESSAGES } = require('../../services/email/fixtures/messages');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

section('[ attachments present ]');
const offer = parseEmail(MESSAGES.find(m => m.gmail_message_id === 'MSG_OFFER_1'));
check(offer.attachments.length === 1, 'offer email has 1 attachment');
check(offer.attachments[0].filename === 'offer_letter.pdf', 'attachment filename preserved');
check(offer.attachments[0].mime_type === 'application/pdf', 'attachment mime type preserved');
check(typeof offer.attachments[0].size === 'number', 'attachment size preserved');

section('[ attachments absent ]');
const interview = parseEmail(MESSAGES.find(m => m.gmail_message_id === 'MSG_INT_1'));
check(Array.isArray(interview.attachments) && interview.attachments.length === 0, 'no-attachment email → empty array (not null)');

section('[ malformed attachments tolerated ]');
const weird = parseEmail({ gmail_message_id: 'x', attachments: null });
check(Array.isArray(weird.attachments) && weird.attachments.length === 0, 'null attachments → [] (no crash)');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
