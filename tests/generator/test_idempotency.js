/**
 * tests/generator/test_idempotency.js — VS2 M4 idempotency.
 * Run: node tests/generator/test_idempotency.js
 */
const { ApplicationGeneratorService } = require('../../services/generator/ApplicationGeneratorService');
const { MASTER, TEMPLATE, docSQL } = require('../../services/generator/run_generate');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

const svc = new ApplicationGeneratorService({ now: () => 'T' });
const job = { id: '11111111-1111-4111-8111-111111111111', title: 'Esthetician', raw_text: 'HydraFacial skin care' };
const company = { id: '22222222-2222-4222-8222-222222222222', name: 'Nordik Spa Village', city: 'Ottawa', province: 'ON' };

section('[ regeneration is stable ]');
const a = svc.generatePackage({ master: MASTER, template: TEMPLATE, job, company });
const existing = { cv: { checksum: a.cv.checksum, version: a.cv.version }, cover_letter: { checksum: a.cover_letter.checksum, version: a.cover_letter.version } };
const b = svc.generatePackage({ master: MASTER, template: TEMPLATE, job, company, existing });
check(a.cv.checksum === b.cv.checksum && a.cover_letter.checksum === b.cover_letter.checksum, 'same inputs → same checksums');
check(b.cv.version === a.cv.version && b.cover_letter.version === a.cover_letter.version, 'version does not advance on identical regeneration');
check(a.package.status === 'prepared', 'package stays prepared (never auto-sent — ADR-006)');

section('[ SQL insert is idempotent (checksum conflict → do nothing) ]');
const sql = docSQL(job.id, a.cv);
check(/ON CONFLICT \(job_id, doc_type, checksum\) DO NOTHING/.test(sql), 'generated_documents insert guarded by (job_id,doc_type,checksum)');

section('[ different job → different package ]');
const c = svc.generatePackage({ master: MASTER, template: TEMPLATE, job: { id: 'jX', title: 'Hairstylist', raw_text: 'Balayage' }, company });
check(c.cv.checksum !== a.cv.checksum, 'different job content → different CV checksum');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
