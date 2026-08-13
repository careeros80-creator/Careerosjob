# career-os — v0.5.0-beta

Runtime evidence only. Verified on the isolated Supabase project
`zixgyokdlfktgjnrnvzh` (PostgreSQL 17.6).

> ⚠️ **Metric provenance (audit):** all quality/performance numbers below are
> computed over **deterministic fixture / representative data**, not live
> sources. They verify the *pipeline logic*, not production performance. Every
> such number is marked **[Test Data]**. See "Audit — metric provenance".

## Baselines / commit hashes
| Milestone | Commit |
|---|---|
| VS1 baseline (`v0.1.0`) | `b472097` |
| Module 1 — Normalization | `9f7fea7` / `65d7508` |
| Module 2 — Multi-Source Discovery (`v0.2.0-beta`) | `d56dc08` / `e58fd7b` |
| Module 3 — Employer Enrichment (`v0.3.0-beta`) | `d49c550` / `03eb90d` |
| Module 4 — Application Generator (`v0.4.0-beta`) | `bd358b3` / `60be560` |
| Module 5 — Email Intelligence | `55bd349` / **`a486794`** ← `v0.5.0-beta` |

## Module 1 — Normalization
Tests: `test_normalize` 28 · `test_vs2_normalize` 29. Runtime: migration `014`;
2 jobs `raw→cleaned`; `job.cleaned` ×2; vs2_metrics normalized=2 **[Test Data]**.

## Module 2 — Multi-Source Discovery
Tests: `test_registry` 17 · `test_isolation` 12 · `test_multi_source` 12.
Runtime: registry `[jobbank,indeed,linkedin,jooble,direct]`; flag toggle verified;
isolation verified; `connector_health.jobbank` healthy, found=4/new=2 **[Test Data —
discovery fed representative Job Bank markup, not a live scrape]**. indeed/linkedin/
jooble/direct are documented non-scraping stubs.

## Module 3 — Employer Enrichment
Tests: provider 15 · service 9 · retry 8 · cache 7 · failure 7 · integration 11.
Runtime: migration `015`; 2 companies enriched (role-based email only; 0 personal-
email rows); queue pending→done; cache_hits=2/misses=2. **[Test Data — enrichment
read fixture HTML, not live company sites]**.

## Module 4 — Application Generator
Tests: cv 9 · cover_letter 12 · ats 10 · versioning 11 · idempotency 5 · integration 14.
Runtime: migration `016`; 2 packages `prepared` (nothing sent — ADR-006); 4 generated
documents (versioned + sha256 + traceable source_master/model/prompt_version);
cover letters personalized from company-level facts, unknowns omitted; idempotent
re-run (4→4 docs). ATS coverage / match score below are **[Test Data]**.

## Module 5 — Email Intelligence
Tests: classifier 11 · parser 14 · attachments 6 · threading 6 · integration 15.
Runtime **[Test Data — fixtures, no live inbox]**: migration `017`; 6 emails
classified (interview/offer/rejection/question/auto_reply/ignore); interview
metadata extracted (2026-08-20 14:00 EDT, Online, Zoom URL, reply_deadline
2026-08-18); offer attachment ×1; info-request has reply_deadline but no false
meeting; 4 emails linked to applications; 4 application_timeline events;
email_dashboard total=6/unread_actions=3/interviews=1/offers=1/rejected=1/
info_requests=1/auto_replies=1/unknown=1/waiting=2; idempotent re-run (6→6, 4→4).
READ-ONLY (ADR-006); Gmail OAuth-only, no passwords.

## Regression (VS1 remains green)
`test_schemas` 11 · `test_canonical_output` 20 · `test_vs1` 59.

## Audit — metric provenance (v0.4.0-beta)
| Metric | Observed | Why it is not production performance | Label |
|---|---|---|---|
| ATS coverage | 100% | required keyword = the job title, which the CV injects verbatim; fixture job text yields a single keyword | **Test Data** |
| Match score | 100 | derived directly from ATS coverage | **Test Data** |
| Keyword coverage | 1/1 | short fixture job descriptions → one keyword each | **Test Data** |
| Readability | 0.0 | prose metric applied to a bullet CV; also over synthetic content — not meaningful | **Test Data / metric TBD** |
| Enrichment fields/confidence | present | extracted from fixture HTML, not live sites | **Test Data** |
| Discovery counts | fetched=2 | representative Job Bank markup, not a live fetch | **Test Data** |

Genuinely verified (not data-dependent): schema/migrations, idempotency,
connector isolation, retry/backoff, cache mechanics, human-in-the-loop (ADR-006),
git history, Supabase runtime. Real numbers require live sources (live Job Bank
fetch, real company sites, real job descriptions) gated by ToS/robots + API keys +
the manual n8n run.

## Known limitations
- Discovery + enrichment + generation runtimes use deterministic fixtures; live per-site fetch must honor robots.txt + Terms.
- The in-app Supabase MCP stayed bound to the old account; provisioning + runtime run via the Session pooler + psql.
- n8n workflow import/execution is a manual GUI step.
- Discovery/enrichment stubs (indeed/linkedin/jooble/direct; canada_open_registry/opencorporates) are documented, non-scraping, pending official-API integration.
- `readability` needs a CV-appropriate heuristic.

## No future plans
This document records only completed, verified runtime evidence. No roadmap is described here.
