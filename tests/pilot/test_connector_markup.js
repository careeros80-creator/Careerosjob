/**
 * tests/pilot/test_connector_markup.js — the connector parses BOTH the 2026
 * live Job Bank markup (the drift bug-fix) and the legacy fixture markup.
 * Samples are Test Data (no network). Run: node tests/pilot/test_connector_markup.js
 */
const { JobBankConnector } = require('../../connectors/JobBankConnector');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const con = new JobBankConnector();

console.log('\n[ 2026 live markup: id="article-<id>" + <li> fields ]');
const live = `<article id="article-99001122">` +
  `<a href="/jobsearch/jobposting/99001122;jsessionid=ABC?source=searchresults" class="resultJobItem">` +
  `<h3 class="title"><span class="noctitle"> esthetician </span></h3>` +
  `<ul class="list-unstyled">` +
  `<li class="date">August 12, 2026</li>` +
  `<li class="business">Test Spa Co</li>` +
  `<li class="location"><span class="wb-inv">Location</span> Toronto (ON)</li>` +
  `<li class="salary"><span class="wb-inv">Salary</span> $25.00 hourly</li>` +
  `</ul></a></article>`;
const [j] = con.processSearchPage(live, 'https://www.jobbank.gc.ca/jobsearch/jobsearch');
check(!!j, 'parses a job from live markup (was 0 before the fix)');
check(j && j.external_id === 'JOBBANK_99001122', 'job id from id="article-<id>" / jobposting anchor');
check(j && j.title === 'esthetician', 'title from noctitle (whitespace collapsed)');
check(j && j.company_raw === 'Test Spa Co', 'company from <li class="business">');
check(j && j.location_raw === 'Toronto (ON)', 'location from <li> with "Location" label stripped');
check(j && j.salary_raw === '$25.00 hourly', 'salary from <li> with "Salary" label stripped');
check(j && j.source_url === 'https://www.jobbank.gc.ca/jobposting/99001122', 'source_url built from job id');

console.log('\n[ legacy markup still parses (backward compatible) ]');
const legacy = `<article class="resultJobItem" data-id="4287165">` +
  `<span class="noctitle">Esthetician</span>` +
  `<span class="business">Nordik Spa Village</span>` +
  `<span class="location">Ottawa, ON</span>` +
  `<span class="salary">$38.00 to $44.00 hourly</span>` +
  `<time datetime="2026-08-09T12:00:00Z"></time></article>`;
const [k] = con.processSearchPage(legacy, 'x');
check(!!k && k.external_id === 'JOBBANK_4287165', 'legacy data-id still yields the job');
check(k && k.company_raw === 'Nordik Spa Village' && k.location_raw === 'Ottawa, ON', 'legacy <span> fields still parse');

console.log('\n[ non-beauty jobs still filtered out ]');
const offtopic = live.replace('esthetician', 'truck driver');
check(con.processSearchPage(offtopic, 'x').length === 0, 'non-beauty title filtered');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
