/**
 * tests/generator/test_cv.js — VS2 M4 CV generation.
 * Run: node tests/generator/test_cv.js
 */
const { generateCV } = require('../../services/generator/cvGenerator');
const { MASTER } = require('../../services/generator/run_generate');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

const job = { id: 'j1', title: 'Esthetician', raw_text: 'Esthetician skilled in HydraFacial and Microneedling wanted.' };

section('[ master is never mutated ]');
const before = JSON.stringify(MASTER);
const cv = generateCV(MASTER, job);
check(JSON.stringify(MASTER) === before, 'Master CV object unchanged after generation');

section('[ customization ]');
check(cv.emphasized.includes('HydraFacial') && cv.emphasized.includes('Microneedling'), 'job-relevant skills detected');
const skillsLine = cv.content.split('\n').find(l => l.includes('·'));
check(skillsLine.indexOf('HydraFacial') < skillsLine.indexOf('Balayage'), 'relevant skills float to the front');
check(cv.content.includes('Candidature ciblée : Esthetician'), 'CV targets the job title');

section('[ no fabrication ]');
// every skill token in the CV skills line comes from the master
const masterSet = new Set(MASTER.skills);
const cvSkills = skillsLine.split('·').map(s => s.trim());
check(cvSkills.every(s => masterSet.has(s)), 'CV skills are a subset of the master (nothing invented)');
check(cv.content.includes(MASTER.name), 'candidate name from master');
// Immigration/eligibility is emitted ONLY from verified evidence; the master carries none → CV must omit it.
check(!/ADMISSIBILIT[ÉE]|C16|Mobilit[ée] Francophone|sans EIMT|LMIA/i.test(cv.content), 'no unsupported immigration/eligibility claim in CV');
check(/débutant/i.test(cv.content) && /maternelle/i.test(cv.content) && !/\(natif\)/i.test(cv.content), 'languages accurate (French beginner, Arabic native; no "natif")');

section('[ metadata ]');
check(/^[a-f0-9]{64}$/.test(cv.checksum), 'sha256 checksum present');
check(cv.word_count > 0 && cv.model === 'deterministic-template-v1', 'word_count + model recorded');
check(cv.source_master === 'master_cv@v4', 'source master traced (id@version)');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
