/**
 * tests/run_all.js
 *
 * Runs every test_*.js suite (recursively under tests/) in its own node
 * process and reports PASS/FAIL per suite. Exit code is non-zero if any suite
 * fails, so `npm test` is a single reproducible regression gate (cross-platform).
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (/^test_.+\.js$/.test(e.name)) out.push(p);
  }
  return out;
}

const root = __dirname;
const files = walk(root).sort();
let pass = 0, fail = 0;
const failed = [];

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  try {
    execFileSync('node', [f], { stdio: 'pipe' });
    console.log(`  PASS  ${rel}`);
    pass++;
  } catch (e) {
    console.log(`  FAIL  ${rel}`);
    if (e.stdout) process.stdout.write(String(e.stdout).split('\n').slice(-6).map(l => `        ${l}`).join('\n') + '\n');
    fail++;
    failed.push(rel);
  }
}

console.log(`\n  Suites: PASS=${pass}  FAIL=${fail}`);
if (fail) { console.log(`  Failed: ${failed.join(', ')}`); process.exit(1); }
