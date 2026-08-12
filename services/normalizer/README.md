# Normalizer (VS2)

Turns raw `CanonicalJob` records (VS1 output) into **cleaned** jobs.

```
raw → normalize → resolve company → dedup → UPDATE jobs (cleaned) → emit job.cleaned
```

## Files
- `normalize.js` — pure transforms (province/city, salary + hourly-equivalent,
  title & company normalization, source-agnostic `dedup_key`). No DB, no I/O.
- `run_normalize.js` — `planNormalization()` (pure, tested) + `renderSQL()`.
  CLI reads `{rawJobs, identities, dedupKeys}` JSON on stdin and prints SQL.

## What it fills on `jobs`
`city`, `province` (2-letter), `salary_min/max` (hourly equivalent),
`company_id` (via `companies` + `company_identities`), `dedup_key`,
`pipeline_status` → `cleaned` (or `duplicate`), and emits `job.cleaned`.

Migration `014_jobs_dedup_key.sql` adds `jobs.dedup_key` for cross-provider
duplicate detection (same posting from a different source → flagged duplicate).

## Run (against the configured DB, via psql over the pooler)
```bash
# dump raw jobs + existing identities/dedup keys → normalize → apply
psql "$DATABASE_URL" -tAc "SELECT COALESCE(json_agg(t),'[]') FROM (SELECT id,external_id,content_hash,title,company_raw,location_raw,salary_raw,source,country FROM jobs WHERE pipeline_status='raw' AND is_deleted=false) t;"  # → rawJobs
# build {rawJobs,identities,dedupKeys} then:
node services/normalizer/run_normalize.js < input.json | psql "$DATABASE_URL"
```

## Tests
- `tests/normalizer/test_normalize.js` — unit (28)
- `tests/integration/test_vs2_normalize.js` — pipeline integration (29)

Human-in-the-loop (ADR-006) is unchanged: normalization is fully automatic;
nothing is sent anywhere.
