/**
 * tests/pilot/test_english_docs.js — English CV (master_cv@v5.2) + tailored cover
 * letters must be claim-free, fact-accurate, evidence-scoped, restructured, and
 * genuinely tailored (not name-swap clones). Run: node tests/pilot/test_english_docs.js
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
const PROMO = /busy salon|leaves satisfied|loyal client base|results they can rely on|proven track record|high[- ]volume|award[- ]winning/i;

console.log('\n[ master v5.3 ]');
check(master.version === 'v5.3' && master.language === 'en', 'master_cv is v5.3 / English');
check(!/\(\d{4} \(/.test(generateEnglishCV(master, { title: 'x' }).content), 'no nested-parenthesis date');
check(master.experience.length === 5 && /ASY Beauty/.test(master.experience[0].employer), '5-role timeline, ASY Beauty first');
check(Array.isArray(master.credentials) && /Chamber of Handicrafts/.test(master.credentials.join()), 'craft status is a credential, not education');

const hair = generateEnglishCV(master, { title: 'hairstylist' });
const esth = generateEnglishCV(master, { title: 'esthetician' });
console.log('\n[ CV structure + claims ]');
check(hair.source_master === 'master_cv@v5.3', 'CV traces master_cv@v5.3');
check(/PROFESSIONAL CREDENTIALS/.test(hair.content) && /EDUCATION AND DIPLOMAS/.test(hair.content) && /ADDITIONAL TRAINING/.test(hair.content), 'CV has Credentials / Education and Diplomas / Additional Training sections');
check(/PROFESSIONAL CREDENTIALS[\s\S]*Chamber of Handicrafts/.test(hair.content) && !/EDUCATION AND DIPLOMAS[\s\S]*Chamber of Handicrafts/.test(hair.content), 'Chamber status under Credentials, not Education');
const coreSkills = hair.content.split('PROFESSIONAL EXPERIENCE')[0];
const esthCoreSkills = esth.content.split('PROFESSIONAL EXPERIENCE')[0];
check(!/Advanced esthetics|Event styling/i.test(coreSkills), 'Core Skills excludes training-only skills (advanced esthetics / event styling)');
check(/Microblading/.test(esthCoreSkills) && /Permanent make-up/i.test(esthCoreSkills), 'microblading + permanent make-up now in esthetics Core Skills (BOTH)');
check(!/appointment scheduling|stock coordination|product ordering|client bookings/i.test(hair.content), 'CV omits unsupported ASY appointments/stock/product ordering');
check(/Microblading/.test(hair.content) && /Permanent Make-up/.test(hair.content), 'microblading/permanent make-up also present under Additional Training');
check(/17 years/.test(hair.content) && /ASY Beauty/.test(hair.content), 'CV states 17 years + ASY Beauty');
check(hair.content.includes('samirabenaciri88@gmail.com') && hair.content.includes('+212 6 62 79 32 95') && hair.content.includes('Salé, Morocco'), 'CV has verified contact');
check(!CLAIM.test(hair.content) && !SENSITIVE.test(hair.content) && !FORBIDDEN.test(hair.content) && !FRLANG.test(hair.content), 'CV clean of claim/sensitive/forbidden/frlang');
check(!/facial/i.test(hair.content), 'CV makes no facials claim (general esthetic care instead)');
check(hair.checksum !== esth.checksum, 'hairstylist CV differs from esthetician CV');

console.log('\n[ cover letters — tailored, evidence-scoped, de-claimed ]');
const T = {
  sukhi: "Your posting calls for colour work — applying bleach, tints, and rinses — alongside cutting and styling, which are services I provide. It also asks for suggesting a style that suits each client's features. I would be glad to bring this colour and styling focus to Sukhi Laser Beauty Salon & Academy Ltd.",
  blades: "Your posting spans a broad range of hair services, and my experience aligns with the women's hairdressing side — cutting, colouring, and tinting treatments. My background is in women's hairdressing rather than barbering. I keep these techniques current through ongoing training.",
  oliha: "Your posting includes supervising other stylists — a responsibility I hold as owner-manager of my own salon, where I supervise day-to-day work and service quality while cutting, colouring, and styling hair myself. I would bring both to OLIHA MUNIZ BOUTIQUE AND HAIR INC.",
  glam: "As a hairdresser and esthetician, I provide general esthetic care and make-up with careful consultation and hygiene. Running my own salon, I deliver these services myself and supervise day-to-day work. I would welcome the chance to learn more about Glamour Touch Studio Inc.",
};
const a = generateEnglishCoverLetter(master, { title: 'hairstylist', tailoring: { specific: T.sukhi } }, { name: 'Sukhi Laser Beauty Salon & Academy Ltd.' });
const b = generateEnglishCoverLetter(master, { title: 'hairstylist', tailoring: { specific: T.blades } }, { name: 'Blades & Scissors Hair Salon Ltd.' });
const o = generateEnglishCoverLetter(master, { title: 'hairstylist', tailoring: { specific: T.oliha } }, { name: 'OLIHA MUNIZ BOUTIQUE AND HAIR INC.' });
const e = generateEnglishCoverLetter(master, { title: 'esthetician', tailoring: { specific: T.glam } }, { name: 'Glamour Touch Studio Inc.' });
const all = [a, b, o, e];
all.forEach((L, i) => {
  check(L.word_count >= 220 && L.word_count <= 300, `letter ${i + 1} is 220-300 words (${L.word_count})`);
  check(!CLAIM.test(L.content) && !SENSITIVE.test(L.content) && !FORBIDDEN.test(L.content) && !FRLANG.test(L.content) && !PROMO.test(L.content), `letter ${i + 1} clean of claim/sensitive/forbidden/lang/promotional`);
  check(L.content.includes('Samira Benaciri') && L.content.includes('+212 6 62 79 32 95') && L.content.includes('samirabenaciri88@gmail.com'), `letter ${i + 1} signed with verified contact`);
  check(/Dear Hiring Manager/.test(L.content), `letter ${i + 1} uses "Dear Hiring Manager"`);
  check(/available to relocate after receiving a formal job offer/.test(L.content), `letter ${i + 1} one-sentence accurate relocation`);
});
// hairstylist letters must NOT claim microblading/permanent make-up
[a, b, o].forEach((L, i) => check(!/microblad|permanent make-?up/i.test(L.content), `hair letter ${i + 1} omits microblading/permanent make-up`));
// perming/waving + straightening unsupported -> absent from CV and every letter
check(!/\bperming\b|permanent wave|straighten|lissage/i.test(hair.content) && !/\bperming\b|straighten/i.test(esth.content), 'CV omits perming/waving/straightening');
[a, b, o, e].forEach((L, i) => check(!/\bperming\b|permanent wave|\bperm and\b|straighten|lissage/i.test(L.content), `letter ${i + 1} omits perming/waving/straightening`));
// no letter claims appointment scheduling / stock coordination (UNKNOWN at ASY)
[a, b, o, e].forEach((L, i) => check(!/appointment scheduling|stock coordination|managing a full appointment/i.test(L.content), `letter ${i + 1} omits unsupported appointments/stock`));
// esthetician letter must NOT claim facials/wax/nails/lashes/laser
check(!/facial|\bwax|\bnail|lash|laser|device|medical/i.test(e.content), 'esthetician letter omits facials/wax/nails/lashes/devices');
// exact employer names + punctuation
check(a.content.includes('Sukhi Laser Beauty Salon & Academy Ltd.') && !/Ltd\.\./.test(a.content), 'Sukhi named exactly, no double period');
check(o.content.includes('OLIHA MUNIZ BOUTIQUE AND HAIR INC.') && !/INC\.\./.test(o.content), 'OLIHA named exactly, no double period');
// genuine tailoring: not name-swap clones
const uniq = new Set(all.map(L => L.checksum));
check(uniq.size === 4, 'all four letters are distinct documents');
function tri(t) { const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); const s = new Set(); for (let i = 0; i + 2 < w.length; i++) s.add(w[i] + w[i + 1] + w[i + 2]); return s; }
function jac(x, y) { const A = tri(x), B = tri(y); let n = 0; for (const z of A) if (B.has(z)) n++; return n / (A.size + B.size - n); }
let maxSim = 0; for (let i = 0; i < all.length; i++) for (let k = i + 1; k < all.length; k++) maxSim = Math.max(maxSim, jac(all[i].content, all[k].content));
check(maxSim < 0.7, `max pairwise letter similarity < 0.70 (${maxSim.toFixed(3)})`);
check(a.content !== b.content && b.content !== o.content, 'hairstylist letters are not identical templates');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
