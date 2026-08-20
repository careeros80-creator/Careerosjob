/**
 * tests/pilot/test_candidate_facts.js — resolved candidate-fact registry (Phase 5C).
 * Evidence classes: a training certificate is NOT professional practice. Run: node ...
 */
const { FACTS, canAssert, experienceStatement, verifiedContact, outgoingSkills, trainingOnlySkills, unsupportedSkills, assertableSkills, forbiddenSkills, generationReadiness } = require('../../services/pilot/facts');
const { decide } = require('../../services/pilot/decisions');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

console.log('\n[ resolved binding facts are assertable ]');
check(FACTS.experience_duration.status === 'USER_CONFIRMED', 'experience_duration USER_CONFIRMED');
check(/^17 years/.test(experienceStatement()), 'experience statement is 17 years (no 15/18/10+)');
check(canAssert('current_employer') && /ASY Beauty/.test(FACTS.current_employer.value), 'current employer ASY Beauty assertable');
check(FACTS.current_employer.status === 'VERIFIED_BY_OFFICIAL_DOCUMENT', 'ASY ownership rests on official registration');
check(canAssert('email') && canAssert('phone'), 'email + phone assertable');
check(verifiedContact().phone === '+212 6 62 79 32 95' && verifiedContact().email === 'samirabenaciri88@gmail.com', 'verified phone + email available');
check(verifiedContact().location === 'Salé, Morocco', 'location Salé, Morocco');

console.log('\n[ evidence provenance: prior CV is not documentary evidence ]');
check(FACTS.previous_employers.status === 'USER_CONFIRMED' && /not independent documentary/i.test(FACTS.previous_employers.source), 'previous employers USER_CONFIRMED (timeline, not a CV)');

console.log('\n[ skills classified by evidence — 6B confirmations ]');
check(outgoingSkills().includes('womens_hairdressing') && outgoingSkills().includes('makeup') && outgoingSkills().includes('general_esthetic_care'), 'core practice-supported skills are outgoing');
check(outgoingSkills().includes('salon_management') && !outgoingSkills().includes('appointment_management'), 'salon management outgoing; appointment management NOT (ASY scheduling UNKNOWN)');
check(outgoingSkills().includes('microblading') && outgoingSkills().includes('permanent_makeup'), 'microblading + permanent make-up ARE outgoing (BOTH: training + practice confirmed)');
check(FACTS.skill_microblading.evidence === 'BOTH' && FACTS.skill_permanent_makeup.evidence === 'BOTH', 'microblading + permanent make-up evidence = BOTH');
check(trainingOnlySkills().includes('event_styling') && trainingOnlySkills().includes('advanced_esthetics') && !trainingOnlySkills().includes('microblading'), 'event styling / advanced esthetics remain training-only; microblading is not');
check(/never hair perming/i.test(FACTS.skill_permanent_makeup.note || ''), 'permanent make-up flagged esthetics-only (never hair perming)');
check(!outgoingSkills().includes('facials') && unsupportedSkills().includes('facials'), 'facials unsupported (use general esthetic care)');
check(['perming_waving', 'straightening', 'bleaching', 'frosting', 'appointment_management', 'stock_coordination', 'barbering', 'hair_extensions', 'wig_work', 'nails', 'lash_extensions', 'hydrafacial', 'microneedling', 'ipl', 'carbon_laser'].every(s => unsupportedSkills().includes(s)), 'perming/straightening/bleaching/frosting/appointments/stock/barbering/extensions/wigs/nails/lashes/devices all unsupported');

console.log('\n[ assertability gate ]');
['skill_hydrafacial', 'skill_microneedling', 'skill_carbon_laser', 'skill_ipl', 'skill_nails', 'skill_lash_extensions', 'skill_perming_waving', 'skill_straightening', 'skill_appointment_management', 'skill_barbering'].forEach(k =>
  check(canAssert(k) === false, `${k} not assertable`));
check(canAssert('skill_microblading') === true && canAssert('skill_permanent_makeup') === true, 'microblading + permanent make-up ARE assertable (BOTH)');
check(forbiddenSkills().includes('hydrafacial') && forbiddenSkills().includes('nails'), 'hydrafacial + nails are forbidden skills');
check(assertableSkills().length === outgoingSkills().length, 'assertableSkills() aliases outgoingSkills()');

console.log('\n[ language facts ]');
check(FACTS.language_french.value === 'Beginner' && FACTS.language_english.value === 'Good working proficiency', 'French Beginner, English Good working proficiency');
check(!/native|fluent|bilingual/i.test(FACTS.language_french.value + FACTS.language_english.value), 'no native/fluent/bilingual language level');

console.log('\n[ visa is not work authorization + never in documents ]');
check(/visitor/i.test(FACTS.visa_status.note) && /NOT work authorization/i.test(FACTS.visa_status.note), 'visa marked visitor / not work authorization');

console.log('\n[ generation readiness + send guard ]');
check(generationReadiness().ready === true, 'generation is READY (facts resolved)');
check(decide('rejected', 'send').ok === false && decide('needs_regeneration', 'approve').ok === false, 'non-prepared statuses cannot be approved/sent');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
