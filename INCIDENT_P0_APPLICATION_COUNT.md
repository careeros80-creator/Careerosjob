# P0 Forensic Incident Report — Application Count & Sent-State Discrepancy

**Status: `SAFE_TO_REMEDIATE`**
Read-only forensic audit. Zero database writes, zero external actions, no git commit. DB session enforced `default_transaction_read_only = on`.

- **Captured (UTC):** 2026-08-19 ~20:29Z
- **Database:** Supabase project `zixgyokdlfktgjnrnvzh` · PostgreSQL 17.6 · db `postgres` · schema `public` · search_path `"$user", public, extensions`
- **Git:** HEAD `5cb6798` on `pilot/production-validation`, working tree clean (audit artifacts under gitignored `.pilot_tmp/audit/`)
- **Isolation:** read committed, `default_transaction_read_only=on`
- **Evidence snapshot SHA-256:** `90e365f6bf6f029491e0abbfb03778a983741a644a77883c53030b588c957992` (`.pilot_tmp/audit/snapshots/evidence_snapshot.txt`)

---

## 1. Executive finding

The discrepancy is fully explained and benign. **No real external email was ever sent.** The two "extra" packages and the one `sent` row are **test-fixture data (`data_source='test'`) that leaked into the live database during the 2026-08-12/13 Gmail-pipeline demo and was never cleaned up.** The canonical production metric (`pilot_production_metrics`) filters to `data_source='production'` and is therefore correct and unaffected; the naive `application_metrics` view does **not** filter and is the one showing contaminated counts.

**Sent-row classification: `STATE_ONLY_NO_EXTERNAL_SEND` (also `TEST_OR_SYNTHETIC_LEAKAGE`).**

---

## 2. Authoritative counts (by clearly defined scope)

| Scope | Definition | prepared | approved | sent | rejected | total |
|---|---|---|---|---|---|---|
| **Production** (authoritative) | packages whose job `data_source='production' AND is_deleted=false` | 56 | 0 | **0** | 6 | **62** |
| Test (leaked fixtures) | packages whose job `data_source='test'` | 1 | 0 | 1 | 0 | 2 |
| Raw table (contaminated) | all `application_packages` | 57 | 0 | 1 | 6 | 64 |

- `pilot_production_metrics.applications_sent = 0` ✅ (correct)
- Production packages in `sent`/`approved` = **0** ✅
- The 4 Phase-5C target packages remain **`prepared`** ✅

## 3. Baseline reconstruction (the "62")

- **Evidence:** `PILOT_APPLICATION_REVIEW.md` (generated **2026-08-14**; SHA-256 `35800473…`) recorded **total 62** (A1 0 · A2 58 · B 1 · C 3).
- **Exact query:** `.pilot_tmp/review_export.sql` (SHA-256 `de753843…`), whose filter is `WHERE j.data_source='production' AND p.status='prepared'`.
- **Scope:** production-only; Quebec/closed rejections were still `prepared` at that moment (the "C" group of 3), so all 62 counted as prepared then.
- **Evolution:** Phase 3+ moved 6 production packages `prepared → rejected`. Today: 56 prepared + 6 rejected = **still 62 production**. No production package was added or sent.
- The 62 original production package IDs are enumerated in the evidence snapshot (56 `prepared` + 6 `rejected`, all `data_source='production'`).

## 4. The two additional packages (64 − 62)

Both are **test-scoped**, created 2026-08-12 22:49:25Z:

| Package ID | Status | Job | data_source | Note |
|---|---|---|---|---|
| `7dd9b6f5-4dc1-4953-940b-7f22d06cfd02` | prepared | `JOBBANK_4287165` Nordik Spa Village (ON) | **test** | never approved → `mark_sent` guard matched 0 rows, stayed prepared |
| `63421bad-14da-40ce-bc9c-9b41c362ee73` | **sent** | `JOBBANK_4291822` Salon Élégance (Moncton NB), duplicate | **test** | state-only sent (see §5) |

These pre-existed the 2026-08-14 baseline but were correctly excluded by its `data_source='production'` filter.

## 5. Lifecycle of the `sent` row `63421bad` — no external send

**Provenance:** attached to test job `8732414e` (`JOBBANK_4291822`, Salon Élégance, `data_source='test'`, `is_duplicate=true`). Not part of Samira's real production pilot.

**How it entered `sent` (manual scratchpad SQL, ADR-006-guarded state transitions):**
1. `.pilot_tmp/d1.sql` (SHA-256 `8601193a…`): `prepared → approved`, `decided_by='samira'`, note "reviewed - good match" — matches `production_actions: approve/test/success @ 2026-08-13 22:45:07`.
2. `.pilot_tmp/d3.sql` (SHA-256 `dc7601b0…`): `approved → sent`, `decided_by='samira'` — matches `production_actions: mark_sent/test/success @ 2026-08-13 22:45:13`.
3. `.pilot_tmp/d2.sql` (SHA-256 `b95fb56b…`) targeted the Nordik package but its guard `status IN ('approved')` matched 0 rows (never approved).

**Proof no external message was sent:**
- `applications` rows for both test jobs: `status='sent'`, `channel='gmail'`, but **`gmail_message_id` empty** and **`sent_at` NULL** → no provider message ID, no delivery timestamp.
- `production_actions`: only `email_ingest/gmail/test/**skipped**` (detail: *"Gmail OAuth not configured", fixtures_available 6*), plus the test `approve`/`mark_sent`. **No `send` action, no `data_source='production'` send.**
- `gmail_connections`: single row `status='pending'`, `scopes='{}'`, no email, `connected_at=NULL` → **no authorized connection or token at 22:45:13**.
- No OAuth token exists anywhere (only LLM-token counters in `ai_calls`/`ai_model_config`).
- `outbox` (210 rows): only `job.discovered`/`job.cleaned` — **zero** email/send events.
- `emails` (6): all `data_source='test'` with fixture IDs (`MSG_REJ_1`, `MSG_INT_1`, …) from `services/email/fixtures/messages.js`.

**Classification:** `STATE_ONLY_NO_EXTERNAL_SEND` + `TEST_OR_SYNTHETIC_LEAKAGE`. `sent_at` is a state-field mutation, **not** delivery evidence.

## 6. Metrics disagreement — root cause

- `application_metrics` = unfiltered `count(*)` over `application_packages` → 64/57/0/1 (**contaminated by test rows**).
- `pilot_production_metrics` = joins packages to jobs where `data_source='production' AND is_deleted=false` → excludes the 2 test rows → `applications_sent=0` (**correct**).
- **Cause:** raw-table contamination by un-cleaned test fixtures. Not stale/materialized metrics, not orphaned rows, not wrong schema, not RLS.

## 7. Test-isolation audit

- `npm test` → `node tests/run_all.js`. **0 of 40 suites open any DB connection** (no `DATABASE_URL`/`pg.Client`/`createClient` in `tests/`). Suites generate SQL strings and assert on them — e.g. `tests/integration/test_application.js:42` asserts the generated SQL **never** sets `status='sent'` (ADR-006). The automated suite did **not** write these rows.
- **Leak source:** manual scratchpad SQL run against the live DB during the demo — `.pilot_tmp/d1.sql`, `d2.sql`, `d3.sql`, `email.sql` (fixtures + traces/spans). `decided_by='samira'` and the 2026-08-13 dates originate there.
- `scripts/pilot_decide.js`: `send` maps only to a `mark_sent` DB label; **no gmail/smtp/googleapis/fetch** — no external-send path is wired in the codebase.

## 8. Integrity checks

| Check | Result |
|---|---|
| No employer email sent in 5B/5C | ✅ no send action, no provider msg id, no token |
| No Gmail credentials/token at alleged send time | ✅ connection `pending`, scopes `{}`, no token store |
| No external provider ID / receipt | ✅ `gmail_message_id` empty, `sent_at` NULL |
| 4 target packages remain `prepared` | ✅ |
| Rejected (Quebec/closed) remain blocked | ✅ 6 `rejected`, unchanged |
| Docs linked to correct package versions | ✅ targets → `master_cv@v5.2` / `cover_letter_en_template@v2` (latest) |
| No sent/approved production package selects superseded docs | ✅ 0 production sent/approved |
| Phase 5C changed 0 package rows | ✅ 0 rows touched 2026-08-19 |

---

## Proposed remediation plan (NOT APPLIED)

1. **Do not resend/approve/reset anything.** The sent row is test-only; no external harm occurred.
2. **Quarantine, then remove, the leaked test rows** from the live DB (soft-delete or delete), in one reviewed transaction, scoped strictly to `data_source='test'`:
   - `application_packages` 2 rows (`63421bad…`, `7dd9b6f5…`)
   - `applications` 2 rows (`fe5f32f6…`, `7834b3d6…`)
   - `emails` 6 test rows; `application_timeline` 4 test rows; test `traces`/`spans`; test `production_actions`; the 2 `test` jobs + their `raw_jobs`.
3. **Fix the reporting view:** redefine `application_metrics` to filter `data_source='production'` (or rename it `raw_application_metrics` and make dashboards read `pilot_production_metrics`).
4. **Prevent recurrence:** enforce a `data_source` default + partial indexes/monitors; never seed fixtures into the production DB — use a disposable/test database or a rolled-back transaction.

## Exact mutation allowlist required later (for the remediation phase only)

```
-- scoped strictly to test data; run in ONE reviewed transaction with row-count assertions
DELETE FROM emails               WHERE data_source='test';                       -- expect 6
DELETE FROM application_timeline WHERE application_id IN (test application ids);  -- expect 4
DELETE FROM applications         WHERE job_id IN (test job ids);                 -- expect 2
DELETE FROM application_packages WHERE job_id IN (test job ids);                 -- expect 2
DELETE FROM production_actions   WHERE data_source='test';                       -- expect 3
DELETE FROM outbox               WHERE job_id IN (test job ids);                 -- expect (job.discovered/cleaned for test jobs)
DELETE FROM jobs                 WHERE data_source='test';                       -- expect 2  (+ raw_jobs cascade)
-- then: CREATE OR REPLACE VIEW application_metrics AS ... WHERE ... data_source='production'
```
Guard every statement with an expected row count; abort the transaction on mismatch. No `application_packages` UPDATE to any production row; no send/approve.

## Tests to add later

- `tests/pilot/test_metrics_scope.js` — assert `application_metrics` counts equal production-only counts (no test leakage).
- `tests/pilot/test_no_test_rows_in_prod.js` — assert 0 rows with `data_source='test'` in prod tables (guard against future leakage).
- CI/lint rule: forbid scratchpad SQL that writes to prod tables without a `data_source='test'` + rollback harness.

## Confirmation

- **Zero database writes.** All queries ran under `default_transaction_read_only=on`.
- **Zero external actions** (no Gmail/SMTP/HTTP/send).
- **No git commit; HEAD frozen at `5cb6798`.**
- Application work remains **paused** pending human decision on remediation.

**Final status: `SAFE_TO_REMEDIATE`** — the `sent` row is a test-scoped, state-only mutation with no external delivery; remediation is a scoped cleanup of test-data leakage plus a metrics-view fix, to be applied only under an explicit mutation allowlist in a later phase.
