# Employer Enrichment (VS2 — Module 3)

Company **intelligence** layer. Collects **company-level public** information
only — never personal contacts, never from ToS-prohibited sources.

## Fields (each stamped with source / last_updated / confidence)
website · careers_url · recruitment_email (role-based only) · business_phone ·
address · city · province · postal_code · country · business_category ·
description · languages · hiring_status · last_verified.

Provenance is kept per-field in `company_enrichment.fields` JSONB.

## Privacy guardrail
`PublicWebsiteProvider` accepts a recruitment email **only** when the local-part
is role-based (`careers@`, `jobs@`, `hr@`, `emplois@`, …). Dotted/personal
addresses (`john.smith@`, `ceo.name@`) are rejected. No personal names or
personal phones are collected.

## Sources
- `PublicWebsiteProvider` — a company's own public website (fetch injected;
  a live deployment MUST honor each site's robots.txt + Terms).
- `registryStubs` — `canada_open_registry` (open data) + `opencorporates`
  (official API): documented, ToS-permitted, **not scraped**; pending integration/keys.

## Service (`CompanyEnrichmentService`)
- **cache** (TTL) — repeated enrichment of a company is a cache hit (idempotent)
- **retry policy** — up to `maxAttempts`, retries counted; exhaustion → failure
- **isolation** — one company failing never stops the batch
- **health metrics** — enriched/failed/retries/cache_hits/cache_misses/avg_ms

## Persistence (`run_enrichment.js`, migration 015)
Idempotent upserts (UNIQUE `company_id`):
- `company_enrichment` (typed columns + `fields` JSONB provenance)
- `enrichment_queue` (status pending→done|failed|dead, attempts, next_attempt_at backoff)
- `enrichment_health` rollup + `enrichment_metrics` view

## Tests
`tests/enrichment/test_provider.js` (15), `test_service.js` (9),
`test_retry.js` (8), `test_cache.js` (7), `test_failure.js` (7),
`tests/integration/test_enrichment.js` (11).
