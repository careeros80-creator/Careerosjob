/**
 * tests/integration/test_multi_source.js
 * VS2 — multi-source discovery integration test.
 * Registry-driven discovery with injected fetch + feature flags (no network).
 * Run: node tests/integration/test_multi_source.js
 */
const { buildRegistry } = require('../../connectors/sources');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

// Representative Job Bank search-results HTML (2 beauty jobs).
const HTML = `
<html><body>
<article class="resultJobItem" data-id="4287165">
  <span class="noctitle">Esthetician</span><span class="business">Nordik Spa Village</span>
  <span class="location">Ottawa, ON</span><span class="salary">$38.00 to $44.00 hourly</span>
  <time datetime="2026-08-09T12:00:00Z"></time>
</article>
<article class="resultJobItem" data-id="4291822">
  <span class="noctitle">Hairstylist</span><span class="business">Salon Élégance</span>
  <span class="location">Moncton, NB</span><span class="salary">$21.00 hourly</span>
</article>
</body></html>`;

(async () => {
  const registry = buildRegistry();

  // Deterministic clock so timing is stable in CI.
  let t = 1000;
  const ctx = {
    fetch: async () => HTML,                 // injected — no live network
    isEnabled: (flag) => ({
      jobbank_connector_enabled: true,
      jooble_connector_enabled: true,        // enabled but a stub → runs, returns nothing
      indeed_connector_enabled: false,
      linkedin_connector_enabled: false,
      direct_connector_enabled: false,
    }[flag] === true),
    now: () => '2026-08-12T00:00:00Z',
    clock: () => (t += 5),
  };

  const results = await registry.discoverAll(ctx);
  const by = Object.fromEntries(results.map(r => [r.connector, r]));

  // ── registry-driven discovery ──────────────────────────
  section('[ registry-driven discovery ]');
  check(results.length === registry.names().length, 'every registered connector produced a result');
  check(by.jobbank.status === 'success', 'jobbank ran (flag enabled)');
  check(by.jobbank.fetched === 2, 'jobbank discovered 2 jobs from injected HTML');
  check(by.jobbank.jobs.every(j => /^JOBBANK_/.test(j.external_id) && j.source === 'jobbank'), 'jobbank jobs are CanonicalJobs');

  // ── feature flags gate connectors ──────────────────────
  section('[ feature flags ]');
  check(by.indeed.status === 'disabled' && by.linkedin.status === 'disabled', 'ToS-forbidden sources disabled by flag');
  check(by.direct.status === 'disabled', 'direct connector disabled by flag');
  check(by.jooble.status === 'stub' && by.jooble.fetched === 0, 'jooble enabled but stub → runs, 0 jobs');
  check(/API/i.test(by.jooble.reason || ''), 'jooble stub documents official-API availability');

  // ── health metrics populated ───────────────────────────
  section('[ health metrics ]');
  const jh = registry.get('jobbank').health();
  check(jh.status === 'healthy' && jh.jobs_discovered === 2 && jh.runs === 1, 'jobbank health populated (healthy, discovered=2)');
  check(jh.avg_ms >= 0, 'jobbank avg_ms recorded');

  // ── isolation preserved with real registry ─────────────
  section('[ aggregate ]');
  const totalDiscovered = results.reduce((a, r) => a + r.fetched, 0);
  check(totalDiscovered === 2, 'total discovered across all sources = 2 (only jobbank produced jobs)');
  check(results.every(r => ['success', 'stub', 'disabled', 'failed'].includes(r.status)), 'every result has a known status');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) { console.log('  Multi-source integration tests passed! ✅'); process.exit(0); }
  else { console.log('  Some tests failed ❌'); process.exit(1); }
})();
