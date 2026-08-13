/**
 * tests/email/test_parser.js — VS2 M5 parsing (interview + deadline extraction).
 * Run: node tests/email/test_parser.js
 */
const { parseEmail, parseDate, parseTime, parseTimezone, parseUrl } = require('../../services/email/parser');
const { MESSAGES } = require('../../services/email/fixtures/messages');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

section('[ date/time/tz/url units ]');
check(parseDate('on August 20, 2026 at') === '2026-08-20', 'English "August 20, 2026"');
check(parseDate('le 20 août 2026') === '2026-08-20', 'French "20 août 2026"');
check(parseDate('2026-08-20') === '2026-08-20', 'ISO date');
check(parseTime('at 2:00 PM EDT') === '14:00', '"2:00 PM" → 14:00');
check(parseTime('at 09:30') === '09:30', '24h "09:30"');
check(parseTimezone('2:00 PM EDT here') === 'EDT', 'timezone EDT');
check(parseUrl('join https://zoom.us/j/123 now') === 'https://zoom.us/j/123', 'zoom url');

section('[ interview invitation (MSG_INT_1) ]');
const int = MESSAGES.find(m => m.gmail_message_id === 'MSG_INT_1');
const p = parseEmail(int);
check(p.meeting_at === '2026-08-20T14:00:00', 'meeting_at = date + time');
check(p.meeting_timezone === 'EDT', 'meeting timezone EDT');
check(p.meeting_url === 'https://zoom.us/j/123456789', 'meeting URL (Zoom)');
check(p.meeting_location === 'Online', 'location = Online (URL present)');
check(p.reply_deadline === '2026-08-18', 'reply deadline extracted');
check(p.from_address === 'recruiter@nordikspavillage.ca' && p.subject.includes('Interview'), 'sender + subject');

section('[ non-meeting email has no meeting fields ]');
const rej = parseEmail(MESSAGES.find(m => m.gmail_message_id === 'MSG_REJ_1'));
check(rej.meeting_at === null && rej.meeting_url === null, 'rejection → no meeting metadata (not fabricated)');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
