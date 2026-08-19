/**
 * tests/pilot/test_no_test_rows_in_production_views.js — P0 remediation (hermetic).
 * Guarantees the fixed production-facing views cannot count test/synthetic rows:
 *  - no application/email/document count without a production predicate;
 *  - the sent-fixture can never increment the production 'sent' count;
 *  - the migration guard asserts test rows are excluded (sent=0, emails=0).
 * Run: node tests/pilot/test_no_test_rows_in_production_views.js
 */
const fs = require('fs'), path = require('path');
const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'migrations', '025_metrics_scope.sql'), 'utf8');
const norm = sql.replace(/\s+/g, ' ');

let passed = 0, failed = 0;
const check = (c, l) => { if (c) { console.log(`  ☑ ${l}`); passed++; } else { console.log(`  ✗ ${l}`); failed++; } };

console.log('\n[ no unscoped counts over base tables ]');
check(!/count\(\*\) FROM application_packages\)/.test(norm), 'no bare count(*) FROM application_packages)');
check(!/count\(\*\) FROM applications\)/.test(norm), 'no bare count(*) FROM applications)');
// every emails aggregate lives under the production-filtered emails query
check(/FROM emails e WHERE e.data_source = 'production'/.test(norm), 'emails aggregated only under data_source=production');
check(!/FROM emails\b(?![^;]*data_source = 'production')/.test(norm.replace(/FROM emails e WHERE e.data_source = 'production'/g, 'FROM emails_SCOPED')), 'no emails aggregate escapes the production filter');

console.log('\n[ sent test fixture can never increment production sent ]');
check(/application_packages p JOIN pj ON pj.id = p.job_id WHERE p.status = 'sent'/.test(norm), "sent count is join-scoped to production jobs");
check(/IF \(SELECT sent FROM application_metrics\) <> 0 THEN\s*RAISE EXCEPTION/.test(sql.replace(/\s+/g, ' ').replace(/ +/g, ' ')) || /test sent fixture leaked into production sent count/.test(sql), 'guard fails if a test sent leaks into production sent');

console.log('\n[ guard excludes test emails + holds the baseline ]');
check(/test emails leaked into email_dashboard/.test(sql) && /total_emails FROM email_dashboard\) <> 0/.test(norm), 'guard asserts 0 production emails (test emails excluded)');
check(/production packages=% \(expected 62\)/.test(sql) || /v_pkg <> 62/.test(norm), 'guard holds baseline at exactly 62 production packages');
check(/56\/0\/0\/6|v_prep <> 56 OR v_appr <> 0 OR v_sent <> 0 OR v_rej <> 6/.test(norm), 'guard holds statuses 56 prepared / 0 approved / 0 sent / 6 rejected');

console.log('\n[ non-destructive: no row mutations against protected tables ]');
// strip -- comments, then forbid DML against the six protected tables (schema_migrations ledger allowed)
const code = sql.split('\n').map(l => l.replace(/--.*$/, '')).join('\n');
const PROTECTED = '(jobs|application_packages|applications|emails|generated_documents|production_actions)';
check(!new RegExp(`(INSERT INTO|UPDATE|DELETE FROM)\\s+${PROTECTED}\\b`, 'i').test(code), 'no INSERT/UPDATE/DELETE against jobs/packages/applications/emails/documents/actions');
check(!/\b(TRUNCATE|DROP TABLE)\b/i.test(code), 'no TRUNCATE/DROP TABLE');
check((sql.match(/CREATE OR REPLACE VIEW/g) || []).length === 3, 'exactly 3 view redefinitions');

console.log('\n═══════════════════════════════════════');
console.log(`  Passed: ${passed} | Failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
