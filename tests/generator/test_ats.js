/**
 * tests/generator/test_ats.js — VS2 M4 ATS report.
 * Run: node tests/generator/test_ats.js
 */
const { atsReport, extractKeywords, matchExplanation } = require('../../services/generator/ats');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

const ATS_KW = [{ keyword: 'esthetician' }, { keyword: 'hydrafacial' }, { keyword: 'skin care' }, { keyword: 'french' }, { keyword: 'welding' }];
const job = { title: 'Esthetician', raw_text: 'Esthetician with HydraFacial and skin care experience. French an asset.' };

section('[ keyword extraction ]');
const req = extractKeywords(job, ATS_KW);
check(req.includes('esthetician') && req.includes('hydrafacial') && req.includes('skin care') && req.includes('french'), 'required keywords pulled from job text');
check(!req.includes('welding'), 'irrelevant vocabulary NOT required');

section('[ coverage / missing ]');
const cv = 'Esthetician — HydraFacial, skin care, Microneedling. Bilingue français.';
const r = atsReport(cv, job, ATS_KW);
check(r.keywords_matched.includes('esthetician') && r.keywords_matched.includes('hydrafacial') && r.keywords_matched.includes('skin care'), 'matched keywords found in CV');
check(r.keywords_missing.includes('french'), 'missing keyword flagged (english "french" not literally in CV)');
check(r.coverage_pct === Math.round(3 / 4 * 1000) / 10, 'coverage_pct = 75.0');

section('[ readability + length ]');
check(typeof r.readability === 'number' && r.readability >= 0 && r.readability <= 100, 'readability 0–100');
check(r.length_words === (cv.trim().match(/\S+/g) || []).length, 'length_words = CV word count');

section('[ match explanation ]');
const m = matchExplanation(r);
check(m.score === 75, 'match score = 75');
check(/mots-cl[ée]s/.test(m.explanation) && /Manquants/.test(m.explanation), 'explanation lists coverage + missing');

section('[ no keywords case ]');
const none = atsReport('some cv', { title: '', raw_text: 'xyz' }, ATS_KW);
check(none.coverage_pct === 0 && none.keywords_required.length === 0, 'no required keywords → coverage 0');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
