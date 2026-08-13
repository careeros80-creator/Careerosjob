# PILOT_VALIDATION — `pilot/production-validation`

Base `hardening/rc1` (`6271e34`). Goal: validate CareerOS with one real
production user (pilot: Samira Benaciri) using **real production data**, not
fixtures. Verified live on the isolated Supabase project `zixgyokdlfktgjnrnvzh`
(PostgreSQL 17.6). Feature development is frozen (no Module 6).

**Provenance rule everywhere:** data carries `data_source ∈ {production, test}`.
Production metrics are computed **only** from `data_source='production'`. Fixtures
stay labelled Test Data and never enter production metrics.

---

## What is genuinely Production Runtime (real, this branch)

Fetched from **live Job Bank Canada** (public government board), parsed by the
shipped connector, run through the real pipeline:

| Stage | Result (real) |
|-------|---------------|
| 1. Discover | 5 live searches, 0 failed → **45 unique real jobs** |
| 2. Normalize | **45 processed** — 43 cleaned + 2 duplicate, 38 companies |
| 4–6. Generate + package | **43 packages**, **86 documents** (43 CV + 43 cover letters), `master_cv@v3` |
| 7. Approve | **manual only** — 0 approved (human decides; ADR-006) |
| 8. Send | **0 sent** — nothing auto-sent (ADR-006) |

Example real package — `JOBBANK_50065482`, Cleopatras Rituals (Kelowna BC),
`https://www.jobbank.gc.ca/jobposting/50065482`, match 100, a real tailored
French cover letter, status `prepared`, `source_master = master_cv@v3`.

### Pilot dashboard (Production Runtime vs Test Data)
```
 data_source | disc | clean | enr | prep | appr | sent | intv | offers | rej | wait
-------------+------+-------+-----+------+------+------+------+--------+-----+------
 production  |   45 |    45 |   0 |   43 |    0 |    0 |    0 |      0 |   0 |    0
 test        |    2 |     2 |   2 |    2 |    0 |    0 |    1 |      1 |   1 |    0
```

### Production metrics (real activity ONLY — never fixtures)
```
jobs_discovered            45
jobs_unique                43
discovery_success_rate_pct 95.6
duplicate_rate_pct          4.4
ats_coverage_pct           90.7
avg_processing_ms          2973
applications_sent           0
interview_rate_pct        (null)   ← pending real sends + Gmail
response_rate_pct         (null)
offer_rate_pct            (null)
```

### Structured logging — every production action (trace/correlation/status/duration)
```
 action       | stage      | data_source | status  | n | min_ms | max_ms
--------------+------------+-------------+---------+---+--------+-------
 discover     | connector  | production  | success | 5 |  2164  |  7365
 normalize    | pipeline   | production  | success | 1 |   302  |   302
 generate     | generation | production  | success | 1 |   316  |   316
 email_ingest | gmail      | test        | skipped | 1 |     0  |     0
```
All `production_actions` carry `trace_id` + `correlation_id` (0 missing).

---

## What is honestly BLOCKED (cannot be fabricated)

| Pilot step | Status | Why | To unblock |
|-----------|--------|-----|-----------|
| 3. Enrich company info | Pending | Job Bank exposes no company domain; live per-site fetch is brittle/ToS-bound | supply company sites, or a company-data source |
| 9–10. Real Gmail + timeline | **Pending Pilot User** | needs the pilot user's interactive Gmail **OAuth** + a real inbox | set `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` |
| Interview / response / offer rates | Pending | require real approved sends + real employer replies over days/weeks | run the pilot end-to-end over time |

These are **not** filled with fixtures. `pilot_email.js` auto-transitions:
credentials present → real Gmail as Production Runtime; absent → Pending Pilot
User on Test Data. **No code change** flips it — provenance follows the source.

---

## Bug-fix required for real discovery (documented)

The frozen VS1 connector parsed **0 of 27** live listings — Job Bank markup drifted
(`id="article-<id>"` + `<li>` fields today vs legacy `data-id` + `<span>`).
`parseArticle` now handles both (backward compatible). This is a drift bug-fix
backed by runtime evidence, not a redesign. Legacy fixtures still parse; the 27
JS regression suites stay green.

---

## Error recovery — every stage retryable

- **Connector**: curl retry + `dead_letter_queue` on exhaustion (unresolved = retryable).
- **Gmail**: `withRetry` around token/list/get; exhaustion → dead-letter, never fabricate.
- **Enrichment / generation**: idempotent re-run (`ON CONFLICT`) + queue/dead-letter.
- `services/pilot/retry.js` `withRetry()` — exponential backoff; throws with `.attempts`/`.cause`.

---

## Tests (added; regression untouched)

- `tests/pilot/test_retry.js` (5), `test_action_log.js` (16),
  `test_provenance.js` (13), `test_connector_markup.js` (10) — **44 checks green**.
- Full regression: **27 JS suites green** (VS1 + VS2 M1–M5 + hardening) — no regressions.
- `scripts/pilot_verify.sh` (live DB assertions): **10/10 PASS — PILOT VERIFY: GREEN**
  (production metrics exclude fixtures; all actions traced; ADR-006 zero auto-sent;
  real pipeline present; Gmail honestly pending).

---

## Migrations
`020_pilot_provenance.sql` — additive + idempotent: `data_source` on jobs+emails
(existing rows → 'test'), `production_actions`, `pilot_dashboard`,
`pilot_production_metrics`. `schema_migrations` now `000..020`.

## Commits (branch `pilot/production-validation`, pushed)
- `083b374` connector drift bug-fix (real discovery)
- `e015533` provenance + pilot dashboard + production metrics
- `1f9bcc9` real production discovery runner
- `2cfb56e` Gmail OAuth + auto test→production email pipeline
- `4c8be61` structured action logging + retryable recovery

## ADR-006 (unchanged)
No automatic application submission, no automatic email sending, no auto-accept.
Approval is manual: 0 approved, 0 sent. Gmail access is OAuth-only, read-only,
never a password.

## Definition of Done — status
Real jobs processed ✅ · real companies (38 linked) ✅ · real CV ✅ · real cover
letter ✅ · production dashboard ✅ · production metrics (real only) ✅ · trace
evidence ✅ · commit hashes ✅ · push ✅ — **Real Gmail messages ⏳ Pending Pilot
User** (OAuth), and interview/offer/response rates ⏳ pending real sends over time.
