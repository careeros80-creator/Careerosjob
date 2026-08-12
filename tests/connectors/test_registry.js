/**
 * tests/connectors/test_registry.js
 * VS2 — Connector interface + registry unit tests.
 * Run: node tests/connectors/test_registry.js
 */
const { Connector } = require('../../connectors/base/Connector');
const { ConnectorRegistry } = require('../../connectors/registry');
const { buildRegistry } = require('../../connectors/sources');
const { JobBankSource } = require('../../connectors/sources/JobBankSource');
const { stubConnectors } = require('../../connectors/sources/stubs');

let passed = 0, failed = 0;
function check(c, l) { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } }
function section(t) { console.log(`\n${t}`); }

// ── interface contract ───────────────────────────────────
section('[ interface contract ]');
const IFACE = ['discoverJobs', 'validate', 'health', 'normalizeSource'];
const all = [new JobBankSource(), ...stubConnectors()];
for (const c of all) {
  check(IFACE.every(m => typeof c[m] === 'function'), `${c.name} implements ${IFACE.join('/')}`);
}
check(new Connector({ name: 'x' }).flag === 'x_connector_enabled', 'default flag = <name>_connector_enabled');
(() => { try { new Connector({}); check(false, 'unnamed connector rejected'); } catch { check(true, 'unnamed connector rejected'); } })();

// ── registry basics ──────────────────────────────────────
section('[ registry ]');
const r = new ConnectorRegistry();
r.register(new JobBankSource());
check(r.get('jobbank') && r.get('jobbank').name === 'jobbank', 'register + get');
check(r.list().length === 1 && r.names()[0] === 'jobbank', 'list/names');
(() => { try { r.register(new JobBankSource()); check(false, 'duplicate register rejected'); } catch { check(true, 'duplicate register rejected'); } })();

// ── default registry (dynamic, not hardcoded) ────────────
section('[ default registry ]');
const reg = buildRegistry();
check(reg.names().includes('jobbank'), 'jobbank registered');
check(['indeed', 'linkedin', 'jooble', 'direct'].every(n => reg.names().includes(n)), 'stubs registered (indeed/linkedin/jooble/direct)');
check(reg.list().every(c => c.flag && c.flag.endsWith('_connector_enabled')), 'every connector has a feature flag');

// ── validate() ───────────────────────────────────────────
section('[ validate ]');
check(reg.get('jobbank').validate().ok === true, 'jobbank validate ok (valid search URLs)');
check(reg.get('indeed').validate().ok === false, 'indeed stub validate not ok (documented reason)');
check(/Terms of Service/i.test(reg.get('indeed').validate().errors[0]), 'indeed reason mentions ToS');

// ── health() default shape ───────────────────────────────
section('[ health ]');
const h = reg.get('jobbank').health();
check(['connector', 'status', 'jobs_discovered', 'jobs_inserted', 'duplicates', 'avg_ms'].every(k => k in h), 'health() has required fields');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) { console.log('  Registry/interface tests passed! ✅'); process.exit(0); }
else { console.log('  Some tests failed ❌'); process.exit(1); }
