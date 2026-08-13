# career-os — Project Audit

Verify-only audit at checkpoint `a486794` (branch `vs2-normalization`,
`v0.5.0-beta`). Runtime evidence gathered from the isolated Supabase project
`zixgyokdlfktgjnrnvzh` (PostgreSQL 17.6) + git + code. No features implemented.
All quality/latency numbers over synthetic inputs are labeled **[Test Data]**.

## Result
**Critical issues: 0.** Verified: 3 Medium, 3 Low. Details below.

---

## 1. Database
| Check | Evidence | Status |
|---|---|---|
| Migration order | `schema_migrations` = `000..017` (18), gaps: none | ✅ |
| Tables / views | 40 base tables, 14 views | ✅ |
| Foreign keys | 43 FK constraints | ✅ |
| Indexes | 104 indexes; 63 unique | ✅ |
| Check constraints | 204 | ✅ |
| Idempotency | `jobs` rows=2/distinct external_id=2; `generated_documents` rows=4/distinct(job,type,checksum)=4; `emails` rows=6/distinct msg_id=6 — re-runs produced no duplicates | ✅ |
| Rollback safety | **No down-migrations; `002`(CREATE TYPE)/`004`(CREATE TABLE) are not individually re-runnable** | ⚠️ **M-3 (Low)** |

## 2. Event system (`outbox`)
| Field | job.discovered | job.cleaned |
|---|---|---|
| event_id | 2/2 (all distinct) | 2/2 |
| correlation_id | 2/2 | 2/2 |
| version | 2/2 (`1.0`) | 2/2 |
| timestamp (created_at) | 2/2 | 2/2 |
| **causation_id** | **0/2 (NULL)** | **0/2 (NULL)** |

Ordering: `created_at` present on every row. **Finding A-1 (Low):** `causation_id`
is NULL for all events, and `correlation_id` equals each event's own id (events are
not chained across a pipeline run).

## 3. Observability
`traces=0`, `spans=0`, `logs=2`, `events`(table)`=0`.
**Finding O-1 (Medium):** the `traces`/`spans` tables + `start_span()/finish_span()`
helpers exist but the pipeline never records traces/spans; correlation exists only
via `outbox.correlation_id`. Distributed tracing is not active. The `events` table
is empty (pipeline uses `outbox`); `is_event_processed()` reads `events/event_consumers`
which stay empty.

## 4. Feature flags
13 flags seeded; enabled: `jobbank_connector_enabled`.
Flag-gated + verified (M2): discovery connectors (`jobbank`/`indeed`/`linkedin`/`jooble`/`direct`)
— toggling `jobbank_connector_enabled` in the DB flips the connector on/off with no code change.
**Finding F-1 (Medium):** only discovery is flag-gated. `run_normalize`, `run_enrichment`,
`run_generate`, `run_email` have **no** feature-flag gate — those stages cannot be disabled
via `feature_flags` (they are separate, independently-invoked runners).

## 5. Dashboard
| Item | Evidence | Status |
|---|---|---|
| API calls (anon key) | `GET /jobs` 200, `GET /vs1_metrics` 200, `GET /vs1_connector_metrics` 200 | ✅ |
| Widgets | 4 metric cards (discovered/inserted/duplicates/pipeline-success) + jobs table | ✅ |
| Loading / error / empty / unconfigured states | all four present in `App.jsx` (`status === 'loading'|'error'|'ready'|'unconfigured'`) | ✅ |
| Scope | Surfaces VS1 (`jobs` + vs1 metrics) only; M1–M5 data (enrichment, packages, emails, timeline) not yet shown — Module 7 (dashboard extension) not built | ℹ️ scope note |

## 6. Performance — core compute, **[Test Data]** (excludes DB/network; no live sources)
```
discovery (parse→canonical) 0.0511 ms/job
normalization               0.0349 ms/job
enrichment (extract)        0.0430 ms/company
generation (cv+letter+ats)  0.1623 ms/package
email (classify+parse+link) 0.0112 ms/email
```
No **Production Runtime** latency exists — every stage has only run over fixtures/
representative markup (see v0.4.0-beta metric-provenance audit).

## 7. Security
| Check | Evidence | Status |
|---|---|---|
| Secrets committed | `git ls-files` .env = 0; real anon key + DB password found in **no** tracked file | ✅ |
| .env ignored | `.env` and `dashboard/.env` both git-ignored | ✅ |
| Placeholder only in docs | `docs/SUPABASE.md` contains `postgresql://postgres:<db-password>@…` (placeholder) | ✅ |
| OAuth only / no passwords | `GmailProvider` is OAuth2 (refresh-token ref); no password path | ✅ |
| anon writes | anon INSERT/UPDATE/DELETE grants: **NONE** | ✅ |
| Sensitive tables blocked | `GET /emails` (anon) → **401** | ✅ |
| RLS | **RLS-enabled public tables = 0**; anon has SELECT on `jobs` + 5 vs1 views with no row filter | ⚠️ **S-1 (Medium)** |

## 8. Git
Branch `vs2-normalization`; working tree **CLEAN**; in sync with origin (ahead 0 / behind 0);
15 commits; tags `v0.1.0, v0.2.0-beta, v0.3.0-beta, v0.4.0-beta, v0.5.0-beta`.
**Finding G-1 (info):** branch-protection is a GitHub-server setting and is **not verifiable
from the local repo** — cannot confirm; recommend enabling protection on `main` in GitHub.

---

## Verified issues (severity + recommended fix)
| ID | Severity | Issue | Recommended fix |
|---|---|---|---|
| S-1 | **Medium** | RLS disabled on all public tables; anon SELECT on `jobs` + vs1 views is unfiltered | Enable RLS on `jobs` + add explicit anon read policy, or document single-user acceptance |
| O-1 | **Medium** | traces/spans never recorded; tracing helpers unused | Instrument runners to open a trace/run + spans per stage, or mark observability deferred |
| F-1 | **Medium** | Only discovery is flag-gated; normalize/enrich/generate/email lack feature flags | Add `*_enabled` flags and gate each stage runner |
| A-1 | Low | `causation_id` NULL; `correlation_id` not shared across a run | Thread a single `correlation_id` per pipeline run and set `causation_id` on derived events |
| DB events | Low | `events` table empty; `is_event_processed()` reads empty tables | Reconcile `events` vs `outbox`, or document `outbox` as the source of truth |
| M-3 | Low | No rollback/down migrations; `002`/`004` not re-runnable | Document forward-only policy; optionally add down scripts / IF NOT EXISTS guards |

**Critical: 0.**
