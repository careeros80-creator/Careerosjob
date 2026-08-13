/**
 * tests/email/test_classifier.js — VS2 M5 classifier.
 * Run: node tests/email/test_classifier.js
 */
const { classify } = require('../../services/email/classifier');
const { MESSAGES } = require('../../services/email/fixtures/messages');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);
const byId = Object.fromEntries(MESSAGES.map(m => [m.gmail_message_id, m]));
const cls = (id) => classify(byId[id]).classification;

section('[ six classes ]');
check(cls('MSG_INT_1') === 'interview', 'interview invitation → interview');
check(cls('MSG_OFFER_1') === 'offer', 'job offer → offer');
check(cls('MSG_REJ_1') === 'rejection', 'rejection → rejection');
check(cls('MSG_INFO_1') === 'question', 'documents request → question (information request)');
check(cls('MSG_AUTO_1') === 'auto_reply', 'automatic reply → auto_reply');
check(cls('MSG_UNK_1') === 'ignore', 'unrelated email → ignore (unknown)');

section('[ urgency ]');
check(classify(byId['MSG_INT_1']).is_urgent === true, 'interview is urgent');
check(classify(byId['MSG_OFFER_1']).is_urgent === true, 'offer is urgent');
check(classify(byId['MSG_REJ_1']).is_urgent === false, 'rejection not urgent');

section('[ rejection beats offer (order) ]');
check(classify({ subject: 'Update', body_text: 'We will not be offering you the position at this time.' }).classification === 'rejection',
  '"will not be offering" → rejection, not offer');

section('[ noreply sender fallback ]');
check(classify({ from_address: 'no-reply@x.com', subject: 'Update', body_text: 'status changed' }).classification === 'auto_reply',
  'no-reply sender with neutral body → auto_reply');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
