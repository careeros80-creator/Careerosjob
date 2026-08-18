/**
 * tests/pilot/test_candidate_facts.js — candidate-fact gates block generation
 * from conflicting facts, exact experience duration, and invented contact data.
 * Run: node tests/pilot/test_candidate_facts.js
 */
const { FACTS, canAssert, canClaimExperienceDuration, verifiedContact, generationReadiness } = require('../../services/pilot/facts');
const { decide } = require('../../services/pilot/decisions');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

console.log('\n[ conflicting / missing facts cannot be asserted ]');
check(FACTS.experience_duration.status === 'CONFLICTING', 'experience_duration is CONFLICTING (15/18/10+/2020-2024)');
check(canClaimExperienceDuration() === false, 'exact experience duration cannot be claimed while conflicting');
check(canAssert('experience_duration') === false, 'conflicting fact is not assertable');
check(canAssert('current_employer') === false, 'conflicting current_employer not assertable');
check(canAssert('skill_nails') === false, 'MISSING skill (nails) not assertable');
check(canAssert('visa_status') === false, 'MISSING visa_status not assertable');

console.log('\n[ contact data: verified only, never invented ]');
check(FACTS.phone.status === 'MISSING', 'phone is MISSING');
check(verifiedContact().phone === undefined, 'no phone is emitted (never invented)');
check(verifiedContact().email === 'samirabenaciri88@gmail.com', 'verified email is available');

console.log('\n[ generation readiness ]');
const g = generationReadiness();
check(g.ready === false, 'generation is BLOCKED_BY_CANDIDATE_FACTS while material facts are unresolved');
check(g.blockers.some(b => /experience_duration/.test(b)) && g.blockers.some(b => /phone/.test(b)), 'blockers name experience_duration + phone');

console.log('\n[ assertable binding/verified facts ]');
check(canAssert('email') && canAssert('language_english') && canAssert('skill_hydrafacial'), 'verified email + binding languages + declared skills are assertable');

console.log('\n[ HOLD / below-minimum applications are not sendable (state machine) ]');
check(decide('rejected', 'send').ok === false && decide('needs_regeneration', 'approve').ok === false, 'non-prepared statuses cannot be approved/sent');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
