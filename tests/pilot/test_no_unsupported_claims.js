/**
 * tests/pilot/test_no_unsupported_claims.js
 *
 * Regression: generated candidate content must contain NO unsupported language
 * or immigration claims, and immigration logic must follow verified evidence.
 * Binding facts: Arabic native, French beginner, English good working proficiency.
 * Run: node tests/pilot/test_no_unsupported_claims.js
 */
const fs = require('fs');
const path = require('path');
const { generateCV } = require('../../services/generator/cvGenerator');
const { generateCoverLetter } = require('../../services/generator/coverLetterGenerator');
const { isQuebecExcluded, c16Status, affirmativeWordingAllowed, rule } = require('../../services/generator/immigration/eligibility');
const { decide } = require('../../services/pilot/decisions');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

const G = path.join(__dirname, '..', '..', 'services', 'generator', 'masters');
const master = JSON.parse(fs.readFileSync(path.join(G, 'master_cv.json'), 'utf8'));
const template = fs.readFileSync(path.join(G, 'cover_letter_template.txt'), 'utf8');

// Claims that must never appear in candidate-facing generated content.
const CLAIM = /C16|Mobilit[ée]\s+[Ff]rancophone|EIMT|LMIA[-\s]?exempt|sans EIMT|without LMIA|authorized to work|Fran[çc]ais\s*\(natif\)|Francophone native|native Francophone|bilingue|bilingual|fluent French|couramment/i;

console.log('\n[ master CV data corrected ]');
check(master.version === 'v4', 'master_cv is v4');
check(JSON.stringify(master.languages).includes('Native') && JSON.stringify(master.languages).includes('Arabic'), 'Arabic = Native');
check(/French/.test(JSON.stringify(master.languages)) && /Beginner/.test(JSON.stringify(master.languages)), 'French = Beginner');
check(/English/.test(JSON.stringify(master.languages)) && /Good working proficiency/.test(JSON.stringify(master.languages)), 'English = Good working proficiency');
check(!CLAIM.test(master.summary), 'summary has no bilingual/native claim');
check(master.eligibility_verified === false && (master.eligibility == null), 'no verified C16 eligibility on master');

console.log('\n[ generated CV + cover letter are claim-free ]');
const job = { id: 'j1', title: 'esthetician', raw_text: 'esthetician role', };
const cv = generateCV(master, job);
const letter = generateCoverLetter(template, master, { name: 'Test Spa', city: 'Toronto', province: 'ON' }, job);
check(!CLAIM.test(cv.content), 'CV contains no unsupported language/immigration claim');
check(!CLAIM.test(letter.content), 'cover letter contains no unsupported claim');
check(!/ADMISSIBILIT[ÉE]/.test(cv.content), 'CV omits immigration/admissibilité line (unknown evidence)');
check(/débutant/i.test(cv.content) && /maternelle/i.test(cv.content), 'CV states French beginner + Arabic native accurately');
check(letter.source_master === 'cover_letter_template@v2', 'cover letter uses template v2');

console.log('\n[ C16 rule = UNKNOWN (retrieval failed) blocks affirmative wording ]');
check(rule.status === 'UNKNOWN' && rule.retrieval_result === 'FAILED', 'c16_rule status UNKNOWN, retrieval FAILED (provenance recorded)');
check(affirmativeWordingAllowed() === false, 'affirmative C16 wording NOT allowed');
check(c16Status({ province: 'QC' }) === 'NOT_APPLICABLE', 'Quebec → C16 NOT_APPLICABLE');
check(isQuebecExcluded('QC') && !isQuebecExcluded('ON'), 'Quebec is a hard exclusion');
check(c16Status({ province: 'ON' }) === 'UNKNOWN', 'non-Quebec with unretrieved rule → UNKNOWN (not POSSIBLE) — no LMIA-exempt inference');
check(c16Status({ province: 'ON', ruleVerified: true, candidateEvidence: {} }) === 'UNKNOWN', 'even with a verified rule, no candidate evidence → UNKNOWN (never CONFIRMED from nationality)');

console.log('\n[ invalidated artifacts cannot be approved ]');
check(decide('needs_regeneration', 'approve').ok === false, "status 'needs_regeneration' cannot be approved (state machine)");

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
