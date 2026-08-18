/**
 * tests/integration/test_application.js — VS2 M4 application package end-to-end.
 * Run: node tests/integration/test_application.js
 */
const { ApplicationGeneratorService } = require('../../services/generator/ApplicationGeneratorService');
const { MASTER, TEMPLATE, packageSQL, docSQL } = require('../../services/generator/run_generate');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

const ATS_KW = [{ keyword: 'esthetician' }, { keyword: 'hydrafacial' }, { keyword: 'skin care' }, { keyword: 'french' }];
const job = { id: 'aaaaaaaa-0000-4000-8000-000000000001', title: 'Esthetician', raw_text: 'Esthetician with HydraFacial and skin care. French an asset.' };
const company = { id: 'bbbbbbbb-0000-4000-8000-000000000002', name: 'Nordik Spa Village', city: 'Ottawa', province: 'ON', description: 'Spa scandinave.' };

(async () => {
  const svc = new ApplicationGeneratorService({ now: () => '2026-08-12T00:00:00Z' });
  const pkg = svc.generatePackage({ master: MASTER, template: TEMPLATE, job, company, atsKeywords: ATS_KW });

  section('[ complete package ]');
  check(pkg.package.status === 'prepared', 'package prepared (awaits human approval)');
  check(pkg.cv && pkg.cover_letter && pkg.ats && pkg.match, 'CV + cover letter + ATS + match all produced');
  check(pkg.cv.content.includes('Esthetician') || pkg.cv.content.includes('Candidature ciblée'), 'CV tailored to job');
  check(pkg.cover_letter.content.includes('Nordik Spa Village') && pkg.cover_letter.content.includes('Ottawa, ON'), 'letter personalized to company');
  check(typeof pkg.package.match_score === 'number' && pkg.package.match_explanation.length > 0, 'match score + explanation');

  section('[ ATS metrics ]');
  check(pkg.ats.keywords_required.length >= 3, 'required keywords extracted from job');
  check(pkg.ats.coverage_pct >= 0 && pkg.ats.length_words > 0, 'coverage + length measured');

  section('[ traceability ]');
  check(pkg.cv.source_master === 'master_cv@v4' && pkg.cv.model && pkg.cv.prompt_version, 'CV traces master + model + prompt');
  check(pkg.cover_letter.source_master === 'cover_letter_template@v2', 'letter traces its template');
  check(pkg.cv.generated_at === '2026-08-12T00:00:00Z', 'generation timestamp recorded');

  section('[ persistence SQL ]');
  const psql = packageSQL(job.id, pkg.package, pkg.ats);
  check(/INSERT INTO application_packages/.test(psql) && /ON CONFLICT \(job_id\) DO UPDATE/.test(psql), 'application_packages upsert');
  check(/INSERT INTO application_ats/.test(psql), 'application_ats inserted');
  const dsql = docSQL(job.id, pkg.cv);
  check(/INSERT INTO generated_documents/.test(dsql) && /ON CONFLICT \(job_id, doc_type, checksum\) DO NOTHING/.test(dsql), 'generated_documents idempotent insert');
  check(!/'sent'/.test(psql), 'never sets status=sent (ADR-006)');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})();
