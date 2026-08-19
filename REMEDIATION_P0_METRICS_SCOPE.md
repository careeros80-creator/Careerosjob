# P0 Remediation — Metrics Scope Correction (NON-DESTRUCTIVE)

**Outcome: applied and verified. Zero business-data row mutations; one schema_migrations ledger row inserted. Zero external actions.**

Scope: view/DDL-only correction so production-facing metric views count only jobs where `data_source='production' AND is_deleted=false`. No row was deleted, updated, approved, sent, or archived. Migration `025_metrics_scope.sql` applied in one guarded transaction with in-transaction assertions (rollback on mismatch). Ref: `INCIDENT_P0_APPLICATION_COUNT.md`.

- Regression: **before 42 PASS · after 42 PASS** (40 existing + 2 new).
- Migration guard NOTICE at apply time: *"production baseline 62 (56 prepared / 0 approved / 0 sent / 6 rejected); views exclude test rows."*
- `schema_migrations` version `025` (`metrics_scope`) registered.

---

## Counts by `data_source` (application_packages) — unchanged rows, corrected reporting

| data_source | prepared | approved | sent | rejected | total |
|---|---|---|---|---|---|
| **production** | 56 | 0 | 0 | 6 | **62** |
| test (preserved, excluded from metrics) | 1 | 0 | 1 | 0 | 2 |
| raw table (physical) | 57 | 0 | 1 | 6 | 64 |

## Before / after — production-facing views

| View | Metric | Before (leaked) | After (production-scoped) |
|---|---|---|---|
| `application_metrics` | packages / prepared / approved / **sent** | 64 / 57 / 0 / **1** | **62 / 56 / 0 / 0** |
| `application_metrics` | cvs / cover_letters | 135 / 134 | 133 / 132 |
| `application_metrics` | avg_ats / avg_match | 92.2 / 96.9 | 91.9 / 96.8 |
| `email_dashboard` | total_emails / interviews / offers / waiting | 6 / 1 / 1 / 2 | **0 / 0 / 0 / 0** |
| `system_health` | total_jobs / total_applications | 66 / 2 | **64 / 0** |
| `pilot_production_metrics` (already correct) | jobs_discovered / applications_sent | 64 / 0 | 64 / 0 (unchanged) |

## Audit of all production-facing surfaces

| View | Touches app tables | Scoped before | Action |
|---|---|---|---|
| `application_metrics` | yes | ❌ | **fixed** → production-jobs CTE |
| `email_dashboard` | yes | ❌ | **fixed** → `emails.data_source='production'` + waiting joins production jobs |
| `system_health` | yes | ❌ (job/app counts) | **fixed** → job/application counts join production jobs; infra plumbing (outbox/dead-letters/ai-cost/connectors) left as-is |
| `pilot_production_metrics` | yes | ✅ | already scoped — unchanged |
| `pilot_dashboard` | yes | ✅ (per data_source) | already scoped — unchanged |
| `pilot_readiness` | yes | ✅ | already scoped — unchanged |
| `enrichment_metrics`, `vs1_*`, `vs2/3/5/6_metrics` | no application counts | n/a | not application/production KPIs — unchanged |

## View definitions (after)

### application_metrics
```sql
CREATE OR REPLACE VIEW application_metrics AS
WITH pj AS (SELECT id FROM jobs WHERE data_source='production' AND is_deleted=false)
SELECT (SELECT count(*) FROM application_packages p JOIN pj ON pj.id=p.job_id) AS packages,
       (SELECT count(*) FROM application_packages p JOIN pj ON pj.id=p.job_id WHERE p.status='prepared') AS prepared,
       (SELECT count(*) FROM application_packages p JOIN pj ON pj.id=p.job_id WHERE p.status='approved') AS approved,
       (SELECT count(*) FROM application_packages p JOIN pj ON pj.id=p.job_id WHERE p.status='sent') AS sent,
       (SELECT count(*) FROM generated_documents d JOIN pj ON pj.id=d.job_id WHERE d.doc_type='cv') AS cvs,
       (SELECT count(*) FROM generated_documents d JOIN pj ON pj.id=d.job_id WHERE d.doc_type='cover_letter') AS cover_letters,
       (SELECT round(avg(a.coverage_pct),1) FROM application_ats a JOIN pj ON pj.id=a.job_id) AS avg_ats_coverage,
       (SELECT round(avg(p.match_score),1) FROM application_packages p JOIN pj ON pj.id=p.job_id) AS avg_match_score;
```
(`email_dashboard` scopes `FROM emails e WHERE e.data_source='production'` + waiting-subquery joins production jobs; `system_health` job/application subqueries add `data_source='production'`. Full DDL in `migrations/025_metrics_scope.sql`.)

## Changed files / DB objects

- **DB objects (DDL only):** `CREATE OR REPLACE VIEW` × 3 (`application_metrics`, `email_dashboard`, `system_health`); `schema_migrations` +1 ledger row (`025`).
- **Files:** `migrations/025_metrics_scope.sql`, `supabase/migrations/20260819000025_metrics_scope.sql`, `tests/pilot/test_metrics_scope.js`, `tests/pilot/test_no_test_rows_in_production_views.js`, `REMEDIATION_P0_METRICS_SCOPE.md`.

## Regression tests added

- `tests/pilot/test_metrics_scope.js` — asserts the three views scope through `data_source='production' AND is_deleted=false`; guard encodes 62 and 56/0/0/6.
- `tests/pilot/test_no_test_rows_in_production_views.js` — no unscoped base-table counts; sent test fixture cannot increment production sent; guard excludes test emails; no DML against protected tables.
- Covered assertions: **metrics scope · test rows never in production views · sent test fixtures never increment production sent · baseline exactly 62 · statuses 56/0/0/6.**

## Constraint #6 — test packages preserved; archival flag proposed (NOT applied)

The two test packages are **preserved with full history** and are now excluded from every production surface by the `data_source` filter (no flag needed):

| package_id | status | job | data_source |
|---|---|---|---|
| `7dd9b6f5-4dc1-4953-940b-7f22d06cfd02` | prepared | `JOBBANK_4287165` Nordik Spa Village | test |
| `63421bad-14da-40ce-bc9c-9b41c362ee73` | sent | `JOBBANK_4291822` Salon Élégance | test |

**Proposed (not applied):** a supported archival flag exists — `jobs.is_deleted` (currently `false` on both test jobs). Setting it `true` would further hide them from any `is_deleted=false` query, but it is an `UPDATE jobs` and therefore **out of this non-destructive scope**; it is also unnecessary since `data_source='production'` already excludes them. No archival flag was set.

## Confirmation

- **Zero business-data row mutations; one schema_migrations ledger row inserted (version `025`).** `application_packages` content checksum is **identical** before/after: `c4c3408f383e1d49a62c2376e7e7bbc7`. Business-data row counts unchanged: application_packages 64, applications 2, emails 6, generated_documents 269, jobs 66, production_actions 24.
- **Zero package/application status mutations.** No approve / send / mark_sent / Gmail / employer contact / external call.
- 4 target packages remain `prepared`; 6 rejections remain `rejected`; the sent test row is untouched (still `sent`, still `data_source='test'`, now excluded from production metrics).
- Regression **42/42** before and after.

**Status: `REMEDIATION_APPLIED_VERIFIED` — production metrics now scope to `data_source='production' AND is_deleted=false`; test data preserved and excluded; no destructive action taken.**
