/**
 * tests/pilot/test_metrics_scope.js — P0 remediation contract (hermetic).
 * The production-facing metric views MUST scope through jobs where
 * data_source='production' AND is_deleted=false, and the migration MUST assert
 * the production baseline (62 packages; 56 prepared / 0 approved / 0 sent / 6
 * rejected). Verifies the migration SQL so scoping cannot silently regress.
 * Run: node tests/pilot/test_metrics_scope.js
 */
const fs = require('fs'), path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'migrations', '025_metrics_scope.sql'), 'utf8');
const norm = sql.replace(/\s+/g, ' ');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

console.log('\n[ views are re-scoped ]');
['application_metrics', 'email_dashboard', 'system_health'].forEach(v =>
  check(new RegExp(`CREATE OR REPLACE VIEW ${v}\\b`).test(sql), `${v} is CREATE OR REPLACE'd`));

console.log('\n[ application_metrics scoped to production jobs ]');
check(/WITH pj AS \(\s*SELECT id FROM jobs WHERE data_source = 'production' AND is_deleted = false/.test(norm.replace(/\s+/g, ' ')), 'pj CTE = production, not deleted');
// every package/status/document count must join pj (no bare unscoped count)
check(!/count\(\*\) FROM application_packages\)/.test(norm), 'no unscoped count(*) FROM application_packages)');
['prepared', 'approved', 'sent'].forEach(s =>
  check(new RegExp(`application_packages p JOIN pj ON pj.id = p.job_id WHERE p.status = '${s}'`).test(norm), `${s} count joins pj (production only)`));
check(/generated_documents d JOIN pj ON pj.id = d.job_id/.test(norm), 'document counts join pj');

console.log('\n[ email_dashboard scoped to production ]');
check(/FROM emails e WHERE e.data_source = 'production'/.test(norm), 'email_dashboard filters emails to production');
check(/applications a JOIN jobs j ON j.id = a.job_id[\s\S]*?j.data_source = 'production'/.test(sql), 'email_dashboard waiting joins jobs on production');

console.log('\n[ system_health job/application counts scoped to production ]');
check(/FROM jobs WHERE is_deleted = false AND data_source = 'production'/.test(norm), 'system_health total_jobs scoped to production');
check((norm.match(/applications a JOIN jobs j ON j.id = a.job_id[^)]*j.data_source = 'production'/g) || []).length >= 2, 'system_health app/interview/offer counts scoped to production');

console.log('\n[ migration guard encodes the production baseline ]');
check(/v_pkg <> 62/.test(norm) && /expected 62/.test(norm), 'guard asserts exactly 62 production packages');
check(/v_prep <> 56 OR v_appr <> 0 OR v_sent <> 0 OR v_rej <> 6/.test(norm), 'guard asserts 56 prepared / 0 approved / 0 sent / 6 rejected');
check(/DDL only|No INSERT\/UPDATE\/DELETE/i.test(sql), 'migration documents view-DDL-only (no row writes)');
// strip -- comment lines, then forbid DML against the six PROTECTED tables (schema_migrations ledger is allowed)
const code = sql.split('\n').map(l => l.replace(/--.*$/, '')).join('\n');
const PROTECTED = '(jobs|application_packages|applications|emails|generated_documents|production_actions)';
check(!new RegExp(`(INSERT INTO|UPDATE|DELETE FROM)\\s+${PROTECTED}\\b`, 'i').test(code), 'no INSERT/UPDATE/DELETE against protected tables');
check(!/\b(TRUNCATE|DROP)\b/i.test(code), 'no TRUNCATE/DROP');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
