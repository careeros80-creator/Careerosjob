# HARDENING_REPORT — `hardening/rc1`

Base `v1.0.0-rc1` (`664bee7`). Scope: the **3 Medium** findings from
`PROJECT_AUDIT.md` only. No new features, no schema redesign, no UI changes.
Verified on the isolated Supabase project `zixgyokdlfktgjnrnvzh` (PostgreSQL 17.6).
All data is **[Test Data]**.

## S-1 — Row Level Security (Medium) → fixed
Migration `018_rls_policies.sql`: RLS enabled on every public table + one
least-privilege anon read policy.
- RLS-enabled public tables: **40 / 40**
- Policies: `anon_read_jobs ON jobs` (SELECT, `is_deleted = false`)
- anon REST: `/jobs` 200 · `/vs1_metrics` 200 · `/emails` **401** · `/company_enrichment` **401** · `/application_packages` **401**
- Server-side runners unaffected (connect as table-owner `postgres` → bypass RLS); the VS1 metric views still serve anon (owner-privilege). Dashboard unchanged and still reads.

## O-1 — Traces + spans through every stage (Medium) → fixed
`services/observability/trace.js`; wired into the discovery seed + the discovery,
normalization, enrichment, generator, and email runners. `publish_event` is now
called with `correlation_id = trace_id`, so every emitted event belongs to a trace.
- `traces = 6`, `spans = 23`
- one trace per stage: `discovery_seed(4)`, `normalization(3)`, `enrichment(3)`, `generator(4)`, `email_intelligence(4)`, `discovery(5)`
- **every emitted event belongs to a trace**: `job.discovered` 2/2, `job.cleaned` 2/2 (`correlation_id ∈ traces.trace_id`)

## F-1 — Feature flags for post-discovery stages (Medium) → fixed
Migration `019_stage_feature_flags.sql`: `normalization_enabled`,
`enrichment_enabled`, `generator_enabled`, `email_intelligence_enabled`
(default enabled). Each stage runner honors `enabled`.
- `normalization_enabled = false` → runner emits only `BEGIN;/COMMIT;` (no-op); job stayed `raw` (no writes)
- `normalization_enabled = true` → runner ran; job → `cleaned`; `job.cleaned` emitted
- Behavioral test spawns all four runners disabled (no-op) and enabled (records a trace)

## Tests
- New: `tests/hardening/test_observability.js` 8/8 · `tests/hardening/test_feature_flags.js` 12/12
- Full regression: **25 suites GREEN** (VS1 + VS2 M1–M5) — no regressions

## Migrations
`018_rls_policies.sql`, `019_stage_feature_flags.sql` — additive + idempotent;
`schema_migrations` now `000..019`.

## Residual (unchanged — out of hardening scope)
Low findings A-1 (causation_id NULL), events-vs-outbox, M-3 (no down-migrations)
remain as recorded in `PROJECT_AUDIT.md`. G-1 (branch protection) is a GitHub-side
setting, not modifiable from the repo.
