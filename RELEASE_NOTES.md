# career-os — v0.2.0-beta

Runtime evidence only. Verified on the isolated Supabase project
`zixgyokdlfktgjnrnvzh` (PostgreSQL 17.6).

## Baselines / commit hashes
| Milestone | Commit |
|---|---|
| VS1 baseline (`v0.1.0`) | `b472097` |
| Module 1 — Normalization (core) | `9f7fea7` |
| Module 1 — Normalization (pipeline) | `65d7508` |
| Module 2 — Multi-Source Discovery (framework) | `d56dc08` |
| Module 2 — Multi-Source Discovery (runtime) | **`e58fd7b`** ← `v0.2.0-beta` |

## Module 1 — Normalization (completed)
Tests executed:
- `tests/normalizer/test_normalize.js` → 28/28
- `tests/integration/test_vs2_normalize.js` → 29/29

Supabase runtime:
- migration `014_jobs_dedup_key` applied
- 2 jobs `raw → cleaned`: Ottawa/ON (38–44), Moncton/NB (21)
- `job.cleaned` × 2 in `outbox`
- `companies` + `company_identities` × 2
- `vs2_metrics`: normalized=2, province=2, city=2, salary=2
- `vs1_data_quality`: province 100%, company_mapping 100%, salary_parse 100%

## Module 2 — Multi-Source Discovery (completed)
Tests executed:
- `tests/connectors/test_registry.js` → 17/17
- `tests/connectors/test_isolation.js` → 12/12
- `tests/integration/test_multi_source.js` → 12/12

Supabase runtime:
- registry: `[jobbank, indeed, linkedin, jooble, direct]`
- feature flags read from `feature_flags`; toggle verified (enabled → success/2, disabled → 0) with no code change
- isolation verified (a crashing connector → the others still run; flag-lookup errors fail closed)
- `connector_health.jobbank`: healthy, runs_24h=2, successes=2, failures=0, found=4, new=2, avg_latency_ms=466
- `indeed`/`linkedin`/`jooble`/`direct`: documented, non-scraping stubs

## Regression (VS1 remains green)
- `test_schemas` 11/11 · `test_canonical_output` 20/20 · `test_vs1` 59/59

## Known limitations
- Discovery runtime uses representative Job Bank markup (deterministic); a true live scrape is the manual n8n run.
- The in-app Supabase MCP connector stayed bound to the old account; provisioning + runtime were performed via the Session pooler + psql.
- n8n workflow import/execution (`n8n/workflows/vs1_discovery.json`) is a manual GUI step.
- Stubs are intentionally not implemented: `indeed`/`linkedin` disabled by ToS; `jooble` pending an official API key; `direct` deferred (robots.txt/ToS allowlist).
- `salary_min` is stored as an hourly equivalent (weekly/monthly/annual converted with fixed factors).

## No future plans
This document records only completed, verified runtime evidence. No roadmap or future work is described here.
