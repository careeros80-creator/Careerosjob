# career-os — v0.3.0-beta

Runtime evidence only. Verified on the isolated Supabase project
`zixgyokdlfktgjnrnvzh` (PostgreSQL 17.6).

## Baselines / commit hashes
| Milestone | Commit |
|---|---|
| VS1 baseline (`v0.1.0`) | `b472097` |
| Module 1 — Normalization (core / pipeline) | `9f7fea7` / `65d7508` |
| Module 2 — Multi-Source Discovery (framework / runtime) (`v0.2.0-beta`) | `d56dc08` / `e58fd7b` |
| Module 3 — Employer Enrichment (framework / runtime) | `d49c550` / **`03eb90d`** ← `v0.3.0-beta` |

## Module 1 — Normalization (completed)
Tests: `test_normalize` 28/28 · `test_vs2_normalize` 29/29
Supabase runtime: migration `014` applied; 2 jobs `raw → cleaned`
(Ottawa/ON 38–44, Moncton/NB 21); `job.cleaned` × 2 in `outbox`; companies +
identities × 2; `vs2_metrics` normalized=2/province=2/city=2/salary=2;
data-quality province 100% / company_mapping 100% / salary_parse 100%.

## Module 2 — Multi-Source Discovery (completed)
Tests: `test_registry` 17/17 · `test_isolation` 12/12 · `test_multi_source` 12/12
Supabase runtime: registry `[jobbank, indeed, linkedin, jooble, direct]`; flags
read from `feature_flags`; toggle verified (enabled → success/2, disabled → 0)
with no code change; isolation verified (a crashing connector → others still run);
`connector_health.jobbank` healthy, runs_24h=2, successes=2, failures=0, found=4,
new=2, avg_latency_ms=466; indeed/linkedin/jooble/direct are documented non-scraping stubs.

## Module 3 — Employer Enrichment (completed)
Tests: `test_provider` 15/15 · `test_service` 9/9 · `test_retry` 8/8 ·
`test_cache` 7/7 · `test_failure` 7/7 · `test_enrichment` 11/11
Supabase runtime: migration `015` applied; `enrichment_queue` seeded pending=2 → done=2;
`company_enrichment` — 2 companies enriched with company-level public fields:
```
Nordik Spa Village | careers@nordikspavillage.ca | 613-555-0142 | K1A 0B1 | Beauty & Personal Care | hiring | {fr,en}
Salon Élégance     | emplois@salonelegance.ca    | 506-555-0199 | E1C 1A9 | Beauty & Personal Care | hiring | {fr}
```
Per-field provenance in `fields` JSONB `{source, last_updated, confidence}`
(e.g. recruitment_email confidence 0.95, source public_website).
Privacy guardrail verified: **0** personal-email rows (`john.smith@`, `ceo.*@`
rejected — role-based only). Cache: cache_hits=2, cache_misses=2 (2-pass);
`enrichment_health` runs=2, avg_ms=4; `enrichment_metrics` populated.

## Regression (VS1 remains green across all modules)
`test_schemas` 11/11 · `test_canonical_output` 20/20 · `test_vs1` 59/59

## Known limitations
- Discovery + enrichment runtime use representative fixture HTML (deterministic); a live per-site fetch must honor each site's robots.txt + Terms.
- The in-app Supabase MCP connector stayed bound to the old account; provisioning + runtime were performed via the Session pooler + psql.
- n8n workflow import/execution (`n8n/workflows/vs1_discovery.json`) is a manual GUI step.
- Discovery stubs (`indeed`/`linkedin` disabled by ToS; `jooble` pending API key; `direct` deferred) and enrichment registry providers (`canada_open_registry`, `opencorporates`) are documented, non-scraping stubs pending official-API integration.
- `salary_min` stored as an hourly equivalent (weekly/monthly/annual converted with fixed factors).

## No future plans
This document records only completed, verified runtime evidence. No roadmap or future work is described here.
