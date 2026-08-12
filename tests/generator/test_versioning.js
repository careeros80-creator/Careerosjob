/**
 * tests/generator/test_versioning.js — VS2 M4 versioning + checksum.
 * Run: node tests/generator/test_versioning.js
 */
const { ApplicationGeneratorService, versionFor } = require('../../services/generator/ApplicationGeneratorService');
const { MASTER, TEMPLATE } = require('../../services/generator/run_generate');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

section('[ versionFor rules ]');
check(versionFor('c1', undefined) === 1, 'no existing → v1');
check(versionFor('c1', { checksum: 'c1', version: 1 }) === 1, 'same checksum → keep version');
check(versionFor('c2', { checksum: 'c1', version: 1 }) === 2, 'changed checksum → bump version');
check(versionFor('c3', { checksum: 'c2', version: 4 }) === 5, 'bump from arbitrary version');

section('[ checksum stability ]');
const svc = new ApplicationGeneratorService({ now: () => 'T' });
const job = { id: 'j1', title: 'Esthetician', raw_text: 'HydraFacial skin care' };
const p1 = svc.generatePackage({ master: MASTER, template: TEMPLATE, job });
const p2 = svc.generatePackage({ master: MASTER, template: TEMPLATE, job });
check(p1.cv.checksum === p2.cv.checksum, 'same inputs → identical CV checksum');
check(p1.cover_letter.checksum === p2.cover_letter.checksum, 'same inputs → identical letter checksum');

section('[ version bump on changed input ]');
const first = svc.generatePackage({ master: MASTER, template: TEMPLATE, job });
const existing = { cv: { checksum: first.cv.checksum, version: 1 } };
const changedJob = { id: 'j1', title: 'Hairstylist', raw_text: 'Balayage coloration' };
const next = svc.generatePackage({ master: MASTER, template: TEMPLATE, job: changedJob, existing });
check(next.cv.checksum !== first.cv.checksum, 'changed job → new CV content/checksum');
check(next.cv.version === 2, 'version bumped to 2');
const same = svc.generatePackage({ master: MASTER, template: TEMPLATE, job, existing });
check(same.cv.version === 1, 'unchanged content vs existing → stays v1');

section('[ every doc carries version + checksum + timestamp ]');
check(p1.cv.version === 1 && /^[a-f0-9]{64}$/.test(p1.cv.checksum) && p1.cv.generated_at === 'T', 'cv version/checksum/timestamp');
check(p1.cover_letter.version === 1 && /^[a-f0-9]{64}$/.test(p1.cover_letter.checksum), 'letter version/checksum');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
