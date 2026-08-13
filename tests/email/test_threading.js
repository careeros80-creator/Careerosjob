/**
 * tests/email/test_threading.js — VS2 M5 email→application linking.
 * Run: node tests/email/test_threading.js
 */
const { EmailIntelligenceService } = require('../../services/email/EmailIntelligenceService');
const { APPLICATIONS } = require('../../services/email/fixtures/messages');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);
const svc = new EmailIntelligenceService();

section('[ link by thread id ]');
check(svc.linkApplication({ gmail_thread_id: 'T-nordik' }, APPLICATIONS).id === 'app-nordik', 'thread T-nordik → app-nordik');
check(svc.linkApplication({ gmail_thread_id: 'T-salon' }, APPLICATIONS).id === 'app-salon', 'thread T-salon → app-salon');

section('[ link by company (no thread) ]');
check(svc.linkApplication({ subject: 'Re: role at Nordik Spa Village' }, APPLICATIONS).id === 'app-nordik', 'company name in subject → app-nordik');

section('[ link by job title ]');
check(svc.linkApplication({ body_text: 'regarding the Hairstylist position' }, APPLICATIONS).id === 'app-salon', 'job title in body → app-salon');

section('[ no match → null ]');
check(svc.linkApplication({ gmail_thread_id: 'T-none', subject: 'lunch?' }, APPLICATIONS) === null, 'unrelated email → no application');

section('[ thread wins over content ]');
check(svc.linkApplication({ gmail_thread_id: 'T-salon', subject: 'about Nordik Spa Village' }, APPLICATIONS).id === 'app-salon', 'thread id takes priority');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
