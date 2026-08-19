/**
 * tests/pilot/test_english_docs.js — English CV (master_cv@v5) + tailored cover
 * letters must be claim-free, fact-accurate, and role-tailored.
 * Run: node tests/pilot/test_english_docs.js
 */
const fs = require('fs'), path = require('path');
const { generateEnglishCV } = require('../../services/generator/cvEnglish');
const { generateEnglishCoverLetter } = require('../../services/generator/coverLetterEnglish');
const master = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'services/generator/masters/master_cv_v5.json'), 'utf8'));

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

const CLAIM = /C16|Mobilit[ée]|EIMT|\bLMIA\b|work permit secured|authorized to work|eligible to work|sponsor|permanent resident|start immediately|available immediately/i;
const SENSITIVE = /passport|\bCIN\b|date of birth|\bDOB\b|marital|\bSIN\b|photograph|V-?1\b|multiple-entry/i;
const FORBIDDEN = /hydrafacial|microneedling|carbon laser|laser carbone|\bIPL\b|\bnail\b|manicure|pedicure|lash extension|medical aesthetic/i;
const FRLANG = /native\s+french|fluent\s+french|bilingual|bilingue|couramment|IELTS|\bCLB\b|CEFR/i;

console.log('\n[ master v5 ]');
check(master.version === 'v5.1' && master.language === 'en', 'master_cv is v5.1 / English');
check(!/\(\d{4} \(/.test(generateEnglishCV(master, { title: 'x' }).content), 'no nested-parenthesis date (internship formatting fixed)');
check(master.experience.length === 5 && /ASY Beauty/.test(master.experience[0].employer), '5-role timeline, ASY Beauty first (reverse chrono)');

const hair = generateEnglishCV(master, { title: 'hairstylist' });
const esth = generateEnglishCV(master, { title: 'esthetician' });
console.log('\n[ CV content + claims ]');
check(hair.source_master === 'master_cv@v5.1', 'CV traces master_cv@v5.1');
check(/17 years/.test(hair.content) && /ASY Beauty/.test(hair.content), 'CV states 17 years + ASY Beauty');
check(hair.content.includes('samirabenaciri88@gmail.com') && hair.content.includes('+212 6 62 79 32 95') && hair.content.includes('Salé, Morocco'), 'CV has verified email/phone/location');
check(!CLAIM.test(hair.content), 'CV has no immigration/work-authorization claim');
check(!SENSITIVE.test(hair.content), 'CV has no sensitive identifier / visa');
check(!FORBIDDEN.test(hair.content), 'CV omits HydraFacial/microneedling/laser/IPL/nail/lash');
check(!FRLANG.test(hair.content), 'CV makes no native/fluent-French or bilingual claim');
check(!/\{\{|Salon d'esth[ée]tique|Salon de coiffure/.test(hair.content), 'CV has no placeholder / generic salon');
check(hair.checksum !== esth.checksum, 'hairstylist CV differs from esthetician CV (role-tailored)');

console.log('\n[ cover letters ]');
const a = generateEnglishCoverLetter(master, { title: 'hairstylist' }, { name: 'Sukhi Laser Beauty Salon & Academy Ltd.' });
const b = generateEnglishCoverLetter(master, { title: 'hairstylist' }, { name: 'Blades & Scissors Hair Salon Ltd.' });
const e = generateEnglishCoverLetter(master, { title: 'esthetician' }, { name: 'Glamour Touch Studio' });
[a, b, e].forEach((L, i) => {
  check(L.word_count >= 250 && L.word_count <= 350, `letter ${i + 1} is 250-350 words (${L.word_count})`);
  check(!CLAIM.test(L.content) && !SENSITIVE.test(L.content) && !FORBIDDEN.test(L.content) && !FRLANG.test(L.content), `letter ${i + 1} clean of claims/sensitive/forbidden/lang`);
  check(L.content.includes('Samira Benaciri') && L.content.includes('+212 6 62 79 32 95') && L.content.includes('samirabenaciri88@gmail.com'), `letter ${i + 1} signed with verified contact`);
  check(/Dear Hiring Manager/.test(L.content) && !/Dear Sir\/Madam/i.test(L.content), `letter ${i + 1} uses "Dear Hiring Manager"`);
  check(/relocate promptly after receiving a formal offer/.test(L.content), `letter ${i + 1} states accurate relocation`);
});
check(a.content.includes('Sukhi Laser Beauty Salon & Academy Ltd') && b.content.includes('Blades & Scissors'), 'letters name the exact employer');
check(a.content !== b.content && a.checksum !== b.checksum, 'letters are not identical across employers');
check(!/Ltd\.\./.test(a.content), 'no double period after employer "Ltd."');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
