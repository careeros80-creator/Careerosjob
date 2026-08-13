/**
 * tests/migrations/test_migrations.js
 *
 * Static migrations-integrity test (no DB, cross-platform). Replaces the
 * missing test_migrations.sh that `npm run test:migrations` referenced.
 * Verifies the migrations/ directory is a clean, contiguous, self-registering
 * sequence — the same invariants the DB relies on.
 *
 * Run: node tests/migrations/test_migrations.js
 */
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

const dir = path.join(__dirname, '..', '..', 'migrations');
const files = fs.readdirSync(dir).filter(f => /^\d{3}_.+\.sql$/.test(f)).sort();

console.log(`\n[ ${files.length} migrations in ${path.relative(process.cwd(), dir)} ]`);
check(files.length > 0, 'migrations directory is non-empty');

// 1) contiguous 000..N
const nums = files.map(f => parseInt(f.slice(0, 3), 10));
let contiguous = nums[0] === 0;
for (let i = 1; i < nums.length; i++) if (nums[i] !== nums[i - 1] + 1) contiguous = false;
check(contiguous, `versions contiguous 000..${String(nums[nums.length - 1]).padStart(3, '0')} (no gaps/dupes)`);

// 2) each file self-registers with a matching version literal + is non-trivial
for (const f of files) {
  const ver = f.slice(0, 3);
  const sql = fs.readFileSync(path.join(dir, f), 'utf8');
  const registers = new RegExp(`INSERT INTO schema_migrations[\\s\\S]*VALUES\\s*\\(\\s*'${ver}'`, 'i').test(sql);
  check(registers, `${f} registers version '${ver}' in schema_migrations`);
  check(/\b(CREATE|ALTER|INSERT|GRANT|DO)\b/i.test(sql), `${f} contains DDL/DML`);
}

// 3) additive-safety heuristic: every migration that CREATEs a table/type does so idempotently.
for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), 'utf8');
  const createsTable = /CREATE TABLE/i.test(sql);
  if (!createsTable) continue;
  const allGuarded = !/CREATE TABLE(?!\s+IF NOT EXISTS)/i.test(sql);
  check(allGuarded, `${f} guards CREATE TABLE with IF NOT EXISTS (idempotent)`);
}

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
