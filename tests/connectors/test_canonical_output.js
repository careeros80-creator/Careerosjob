/**
 * tests/connectors/test_canonical_output.js
 *
 * Validates that all connectors output valid CanonicalJob schemas.
 * Run: node tests/connectors/test_canonical_output.js
 */

const fs   = require('fs');
const path = require('path');
const Ajv  = require('ajv');
const addFormats = require('ajv-formats');
const { JobBankConnector } = require('../../connectors/JobBankConnector');
const { WebsiteConnector } = require('../../connectors/WebsiteConnector');

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

let passed = 0;
let failed = 0;

function pass(msg) { console.log(`✅ ${msg}`); passed++; }
function fail(msg, details) {
  console.log(`❌ ${msg}`);
  if (details) {
    (Array.isArray(details) ? details : [details])
      .slice(0, 2)
      .forEach(e => console.log(`   → ${JSON.stringify(e)}`));
  }
  failed++;
}

// Load CanonicalJob schema
const canonicalSchema = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../schemas/models/canonical-job.v1.json'),
    'utf-8'
  )
);
const validateCanonical = ajv.compile(canonicalSchema);

function isValidCanonical(job, label) {
  const valid = validateCanonical(job);
  if (valid) {
    pass(`${label} — valid CanonicalJob`);
  } else {
    fail(`${label} — invalid CanonicalJob`, validateCanonical.errors);
  }
  return valid;
}

// ── JobBankConnector ──────────────────────────────────────
console.log('\n── JobBankConnector ──');

const jbc = new JobBankConnector();

// Test: search configs are valid URLs
const configs = jbc.searchConfigs();
if (configs.length >= 3) {
  pass(`searchConfigs returns ${configs.length} configs`);
} else {
  fail(`searchConfigs should return ≥3 configs, got ${configs.length}`);
}

configs.forEach(cfg => {
  try {
    new URL(cfg.url);
    pass(`Valid URL: ${cfg.params.keyword} / ${cfg.params.location}`);
  } catch(e) {
    fail(`Invalid URL in searchConfig: ${cfg.url}`);
  }
});

// Test: mock article parsing → canonical output
const mockArticleHtml = `
<article class="resultJobItem" data-id="4287165">
  <span class="noctitle">Esthetician</span>
  <span class="business">Nordik Spa Village</span>
  <span class="location">Gatineau, QC</span>
  <span class="salary">$35.00 - $42.00 hourly</span>
  <time datetime="2026-08-09T12:00:00Z"></time>
</article>
`;

const mockSearchHtml = `<html><body>${mockArticleHtml}</body></html>`;
const results = jbc.processSearchPage(mockSearchHtml, 'https://www.jobbank.gc.ca/jobsearch');

if (results.length === 1) {
  pass('processSearchPage extracts 1 esthetician job');
  isValidCanonical(results[0], 'JobBank CanonicalJob');

  // Verify key fields
  if (results[0].external_id === 'JOBBANK_4287165') {
    pass('external_id format correct: JOBBANK_4287165');
  } else {
    fail(`external_id wrong: ${results[0].external_id}`);
  }

  if (results[0].source === 'jobbank') {
    pass('source = jobbank');
  } else {
    fail(`source wrong: ${results[0].source}`);
  }

  if (results[0].content_hash && results[0].content_hash.length === 36) {
    pass('content_hash is valid UUID v5');
  } else {
    fail(`content_hash invalid: ${results[0].content_hash}`);
  }
} else {
  fail(`Expected 1 result, got ${results.length}`);
}

// Test: non-beauty job is filtered out
const nonBeautyHtml = `
<html><body>
<article class="resultJobItem" data-id="9999999">
  <span class="noctitle">Software Engineer</span>
  <span class="business">Tech Corp</span>
  <span class="location">Toronto, ON</span>
</article>
</body></html>
`;
const nonBeautyResults = jbc.processSearchPage(nonBeautyHtml, 'https://www.jobbank.gc.ca/jobsearch');
if (nonBeautyResults.length === 0) {
  pass('Non-beauty job correctly filtered out');
} else {
  fail(`Non-beauty job should be filtered, got ${nonBeautyResults.length} results`);
}

// Test: deduplication — same job = same hash
const job1 = jbc.toCanonical({
  job_bank_id: '111',
  title: 'Esthetician',
  company_raw: 'Test Spa',
  location_raw: 'Ottawa, ON',
  apply_url: 'https://jobbank.gc.ca/111',
  source_url: 'https://jobbank.gc.ca/111',
});
const job2 = jbc.toCanonical({
  job_bank_id: '222',  // different ID!
  title: 'Esthetician',
  company_raw: 'Test Spa',
  location_raw: 'Ottawa, ON',
  apply_url: 'https://jobbank.gc.ca/222',
  source_url: 'https://jobbank.gc.ca/222',
});
if (job1.content_hash === job2.content_hash) {
  pass('Same title+company+location → same content_hash (dedup works)');
} else {
  fail('Same job content has different hashes — dedup broken');
}

// ── WebsiteConnector ──────────────────────────────────────
console.log('\n── WebsiteConnector ──');

const wc = new WebsiteConnector();

// Test: Greenhouse URL detection
const ghExtractor = wc.selectExtractor('https://boards.greenhouse.io/nordik/jobs/4287165');
if (ghExtractor.name === 'GreenhouseExtractor') {
  pass('Greenhouse URL → GreenhouseExtractor selected');
} else {
  fail(`Expected GreenhouseExtractor, got ${ghExtractor.name}`);
}

// Test: Lever URL detection
const leverExtractor = wc.selectExtractor('https://jobs.lever.co/somespa/abc-def-123');
if (leverExtractor.name === 'LeverExtractor') {
  pass('Lever URL → LeverExtractor selected');
} else {
  fail(`Expected LeverExtractor, got ${leverExtractor.name}`);
}

// Test: Unknown URL → GenericExtractor
const genericExtractor = wc.selectExtractor('https://some-random-salon.ca/careers');
if (genericExtractor.name === 'GenericExtractor') {
  pass('Unknown URL → GenericExtractor (fallback)');
} else {
  fail(`Expected GenericExtractor, got ${genericExtractor.name}`);
}

// Test: Generic extraction of a careers page
const mockCareersHtml = `
<html>
<head><title>Careers - Nordik Spa</title></head>
<body>
  <h1>Nous recrutons</h1>
  <p>Postes disponibles: Esthetician, Spa Therapist</p>
  <p>We are looking for experienced estheticians to join our team.</p>
  <p>Experience in HydraFacial and skin care required.</p>
  <a href="/apply">Apply Now</a>
</body>
</html>
`;

const wcResults = wc.process('https://nordik.ca/careers', mockCareersHtml);
if (wcResults.length >= 1) {
  pass(`WebsiteConnector extracted ${wcResults.length} job(s) from careers page`);
  isValidCanonical(wcResults[0], 'Website CanonicalJob');
} else {
  fail('WebsiteConnector should extract at least 1 job from careers page');
}

// ── Canonical Schema itself ────────────────────────────────
console.log('\n── CanonicalJob Schema ──');

// Test: minimal valid canonical job
const minimalJob = {
  external_id:  'JOBBANK_1234567',
  source:       'jobbank',
  content_hash: '550e8400-e29b-41d4-a716-446655440000',
  title:        'Esthetician',
  company_raw:  'Test Spa',
  location_raw: 'Ottawa, ON',
  apply_url:    'https://www.jobbank.gc.ca/jobposting/1234567',
  raw_text:     'We are looking for an experienced esthetician to join our team in Ottawa.',
  fetched_at:   '2026-08-10T09:00:00Z',
};
isValidCanonical(minimalJob, 'Minimal valid CanonicalJob');

// Test: invalid external_id format
const badExternalId = { ...minimalJob, external_id: 'invalid-no-source-prefix' };
const isInvalid = !validateCanonical(badExternalId);
if (isInvalid) {
  pass('Invalid external_id format correctly rejected');
} else {
  fail('Invalid external_id should be rejected');
}

// ── Summary ───────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) {
  console.log('  All connector tests passed! ✅');
  process.exit(0);
} else {
  console.log('  Some tests failed ❌');
  process.exit(1);
}
console.log('═══════════════════════════════════════\n');
