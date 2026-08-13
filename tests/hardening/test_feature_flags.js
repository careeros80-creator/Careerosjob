/**
 * tests/hardening/test_feature_flags.js — F-1: each stage runner can be disabled.
 * Spawns the four stage runners with {enabled:false} and asserts a no-op.
 * Run: node tests/hardening/test_feature_flags.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };
const section = (t) => console.log(`\n${t}`);

const ROOT = path.join(__dirname, '..', '..');
function run(script, input) {
  return execFileSync('node', [path.join(ROOT, script)], { input: JSON.stringify(input), encoding: 'utf8' });
}
const RUNNERS = [
  { flag: 'normalization_enabled',      script: 'services/normalizer/run_normalize.js',   enabledInput: { rawJobs: [] } },
  { flag: 'enrichment_enabled',         script: 'services/enrichment/run_enrichment.js',  enabledInput: { companies: [] } },
  { flag: 'generator_enabled',          script: 'services/generator/run_generate.js',     enabledInput: { jobs: [] } },
  { flag: 'email_intelligence_enabled', script: 'services/email/run_email.js',            enabledInput: { messages: [] } },
];

section('[ disabled stage → no-op transaction ]');
for (const r of RUNNERS) {
  const out = run(r.script, { enabled: false, ...r.enabledInput });
  check(/^BEGIN;\s*COMMIT;\s*$/.test(out.trim()), `${r.flag}=false → ${path.basename(r.script)} emits only BEGIN/COMMIT (no writes)`);
  check(!/INSERT|UPDATE|publish_event/.test(out), `${path.basename(r.script)} disabled → no INSERT/UPDATE/publish_event`);
}

section('[ enabled stage → does work (trace present) ]');
for (const r of RUNNERS) {
  const out = run(r.script, r.enabledInput); // enabled by default (no `enabled:false`)
  check(/INSERT INTO traces/.test(out), `${path.basename(r.script)} enabled → runs (records a trace)`);
}

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
