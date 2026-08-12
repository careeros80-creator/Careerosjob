/**
 * tests/connectors/test_isolation.js
 * VS2 — failure-simulation + connector-isolation tests.
 * Proves: one connector crashing NEVER stops the others, and flags gate cleanly.
 * Run: node tests/connectors/test_isolation.js
 */
const { Connector } = require('../../connectors/base/Connector');
const { ConnectorRegistry } = require('../../connectors/registry');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

// Test doubles.
class GoodConnector extends Connector {
  constructor(name, n = 1) { super({ name }); this.n = n; }
  normalizeSource(r) { return r; }
  async discoverJobs() {
    return { jobs: Array.from({ length: this.n }, (_, i) => ({ external_id: `${this.name.toUpperCase()}_${i}` })) };
  }
}
class FaultyConnector extends Connector {
  constructor(name = 'faulty') { super({ name }); }
  normalizeSource() { return null; }
  async discoverJobs() { throw new Error('boom: simulated connector crash'); }
}
class SlowThrower extends Connector {
  constructor() { super({ name: 'async_faulty' }); }
  normalizeSource() { return null; }
  async discoverJobs() { await Promise.resolve(); throw new Error('async boom'); }
}

const enableAll = () => true;

(async () => {
  // ── failure simulation ─────────────────────────────────
  section('[ failure simulation ]');
  const r1 = new ConnectorRegistry();
  r1.register(new FaultyConnector());
  const only = await r1.discoverAll({ isEnabled: enableAll });
  check(only.length === 1 && only[0].status === 'failed', 'a throwing connector → status=failed (not an exception)');
  check(/boom/.test(only[0].error), 'failure captures the error message');
  check(r1.get('faulty').health().status === 'down', 'failed connector health = down');

  // ── isolation: one crash must not stop the others ───────
  section('[ isolation ]');
  const reg = new ConnectorRegistry();
  reg.register(new GoodConnector('alpha', 2));
  reg.register(new FaultyConnector('beta'));      // crashes in the middle
  reg.register(new SlowThrower());                // async crash
  reg.register(new GoodConnector('omega', 3));    // must still run after crashes
  const res = await reg.discoverAll({ isEnabled: enableAll });

  const by = Object.fromEntries(res.map(x => [x.connector, x]));
  check(res.length === 4, 'all 4 connectors produced a result');
  check(by.alpha.status === 'success' && by.alpha.fetched === 2, 'alpha succeeded (before the crashes)');
  check(by.beta.status === 'failed', 'beta failed');
  check(by.async_faulty.status === 'failed', 'async_faulty failed');
  check(by.omega.status === 'success' && by.omega.fetched === 3, 'omega STILL ran after upstream crashes ✅ isolation');
  const totalJobs = res.reduce((a, x) => a + (x.jobs ? x.jobs.length : 0), 0);
  check(totalJobs === 5, 'healthy connectors still yielded all their jobs (2+3)');

  // ── flag gating (no code change to enable/disable) ──────
  section('[ feature-flag gating ]');
  const flags = { alpha_connector_enabled: true, beta_connector_enabled: false };
  const reg2 = new ConnectorRegistry();
  reg2.register(new GoodConnector('alpha', 1));
  reg2.register(new GoodConnector('beta', 1));
  const gated = await reg2.discoverAll({ isEnabled: (f) => flags[f] === true });
  const g = Object.fromEntries(gated.map(x => [x.connector, x]));
  check(g.alpha.status === 'success', 'enabled flag → connector runs');
  check(g.beta.status === 'disabled' && g.beta.fetched === 0, 'disabled flag → connector skipped, no work');

  // ── flag lookup itself throwing → fail-closed ───────────
  section('[ fail-closed flags ]');
  const reg3 = new ConnectorRegistry();
  reg3.register(new GoodConnector('alpha', 1));
  const fc = await reg3.discoverAll({ isEnabled: () => { throw new Error('flag store down'); } });
  check(fc[0].status === 'disabled', 'flag lookup error → connector treated as disabled (fail-closed)');

  console.log('\n═══════════════════════════════════════');
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) { console.log('  Isolation/failure tests passed! ✅'); process.exit(0); }
  else { console.log('  Some tests failed ❌'); process.exit(1); }
})();
