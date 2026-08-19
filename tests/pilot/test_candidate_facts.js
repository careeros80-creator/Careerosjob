/**
 * tests/pilot/test_candidate_facts.js — resolved candidate-fact registry (Phase 5).
 * Verified facts are assertable; excluded/missing facts are not. Run: node ...
 */
const { FACTS, canAssert, experienceStatement, verifiedContact, assertableSkills, forbiddenSkills, generationReadiness } = require('../../services/pilot/facts');
const { decide } = require('../../services/pilot/decisions');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

console.log('\n[ resolved binding facts are assertable ]');
check(FACTS.experience_duration.status === 'USER_CONFIRMED', 'experience_duration USER_CONFIRMED');
check(/^17 years/.test(experienceStatement()), 'experience statement is 17 years (no 15/18/10+)');
check(canAssert('current_employer') && /ASY Beauty/.test(FACTS.current_employer.value), 'current employer ASY Beauty assertable');
check(canAssert('email') && canAssert('phone'), 'email + phone assertable');
check(verifiedContact().phone === '+212 6 62 79 32 95' && verifiedContact().email === 'samirabenaciri88@gmail.com', 'verified phone + email available');
check(verifiedContact().location === 'Salé, Morocco', 'location Salé, Morocco');

console.log('\n[ excluded / missing facts are NOT assertable ]');
['skill_hydrafacial', 'skill_microneedling', 'skill_carbon_laser', 'skill_ipl', 'skill_nails', 'skill_lash_extensions'].forEach(k =>
  check(canAssert(k) === false, `${k} not assertable`));
check(forbiddenSkills().includes('hydrafacial') && forbiddenSkills().includes('nails'), 'hydrafacial + nails are forbidden skills');
check(assertableSkills().includes('microblading') && assertableSkills().includes('permanent_makeup'), 'microblading + permanent make-up assertable');

console.log('\n[ language facts ]');
check(FACTS.language_french.value === 'Beginner' && FACTS.language_english.value === 'Good working proficiency', 'French Beginner, English Good working proficiency');
check(!/native|fluent|bilingual/i.test(FACTS.language_french.value + FACTS.language_english.value), 'no native/fluent/bilingual language level');

console.log('\n[ visa is not work authorization + never in CV ]');
check(/visitor/i.test(FACTS.visa_status.note) && /NOT work authorization/i.test(FACTS.visa_status.note), 'visa marked visitor / not work authorization');

console.log('\n[ generation readiness + send guard ]');
check(generationReadiness().ready === true, 'generation is READY (facts resolved)');
check(decide('rejected', 'send').ok === false && decide('needs_regeneration', 'approve').ok === false, 'non-prepared statuses cannot be approved/sent');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
