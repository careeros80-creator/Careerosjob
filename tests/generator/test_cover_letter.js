/**
 * tests/generator/test_cover_letter.js — VS2 M4 cover-letter generation.
 * Run: node tests/generator/test_cover_letter.js
 */
const { generateCoverLetter } = require('../../services/generator/coverLetterGenerator');
const { MASTER, TEMPLATE } = require('../../services/generator/run_generate');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

const job = { id: 'j1', title: 'Esthéticienne' };

section('[ personalization ]');
const full = generateCoverLetter(TEMPLATE, MASTER, { name: 'Nordik Spa Village', city: 'Ottawa', province: 'ON', description: 'Spa scandinave.' }, job);
check(full.content.includes('chez Nordik Spa Village'), 'company name used');
check(full.content.includes('Ottawa, ON'), 'city + province used');
check(full.content.includes('Spa scandinave'), 'public description used');
check(full.content.includes('Esthéticienne'), 'job title used');
check(full.content.includes(MASTER.name), 'candidate name present');

section('[ omit unknowns — never fabricate ]');
const noCompany = generateCoverLetter(TEMPLATE, MASTER, {}, job);
check(!/\{\{/.test(noCompany.content), 'no unresolved placeholders left');
check(!/undefined|null/.test(noCompany.content), 'no undefined/null leaked');
check(!/ chez /.test(noCompany.content), 'no "chez <company>" when company unknown');
const nameOnly = generateCoverLetter(TEMPLATE, MASTER, { name: 'Salon X' }, job);
check(nameOnly.content.includes('chez Salon X') && !/situé à/.test(nameOnly.content), 'name used but location NOT invented when unknown');

section('[ different letter per company ]');
const a = generateCoverLetter(TEMPLATE, MASTER, { name: 'Nordik Spa Village', city: 'Ottawa', province: 'ON' }, job);
const b = generateCoverLetter(TEMPLATE, MASTER, { name: 'Salon Élégance', city: 'Moncton', province: 'NB' }, job);
check(a.checksum !== b.checksum, 'two companies → two different letters (checksums differ)');

section('[ metadata ]');
check(/^[a-f0-9]{64}$/.test(full.checksum) && full.word_count > 0, 'checksum + word_count');
check(full.model === 'deterministic-template-v1' && full.prompt_version === 'writer-1.0.0', 'model + prompt_version traced');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
