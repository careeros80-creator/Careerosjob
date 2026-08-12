-- ══════════════════════════════════════════════════════════
-- 012_metrics_views.sql
-- Purpose: Metrics views for each Vertical Slice
--          Readable from Dashboard from Day 1
-- Safe to re-run: YES (CREATE OR REPLACE VIEW)
-- ══════════════════════════════════════════════════════════

-- ── VS1 METRICS ───────────────────────────────────────────
-- Shows Discovery health at a glance
CREATE OR REPLACE VIEW vs1_metrics AS
SELECT
  -- Discovery volume
  COUNT(*)                                        AS jobs_discovered,
  COUNT(*) FILTER (WHERE pipeline_status != 'duplicate')
                                                  AS jobs_inserted,
  COUNT(*) FILTER (WHERE is_duplicate = true)     AS duplicates_detected,

  -- Time-based
  COUNT(*) FILTER (WHERE scraped_at > now() - INTERVAL '24 hours')
                                                  AS jobs_last_24h,
  COUNT(*) FILTER (WHERE scraped_at > now() - INTERVAL '1 hour')
                                                  AS jobs_last_hour,

  -- By source
  COUNT(*) FILTER (WHERE source = 'jobbank')      AS from_jobbank,
  COUNT(*) FILTER (WHERE source = 'website')      AS from_website,
  COUNT(*) FILTER (WHERE source = 'jooble')       AS from_jooble,

  -- Pipeline health
  COUNT(*) FILTER (WHERE pipeline_status = 'raw')      AS in_raw,
  COUNT(*) FILTER (WHERE pipeline_status = 'cleaned')  AS in_cleaned,
  COUNT(*) FILTER (WHERE pipeline_status = 'scored')   AS in_scored,
  COUNT(*) FILTER (WHERE pipeline_status = 'ignored')  AS in_ignored,
  COUNT(*) FILTER (WHERE pipeline_status = 'invalid')  AS in_invalid,

  -- Outbox health
  (SELECT COUNT(*) FROM outbox WHERE status = 'pending') AS outbox_pending,
  (SELECT COUNT(*) FROM outbox WHERE status = 'failed')  AS outbox_failed,
  (SELECT COUNT(*) FROM dead_letter_queue WHERE resolved = false)
                                                         AS dead_letter_count
FROM jobs
WHERE is_deleted = false;

-- ── VS1 CONNECTOR METRICS ─────────────────────────────────
CREATE OR REPLACE VIEW vs1_connector_metrics AS
SELECT
  ch.connector,
  ch.status,
  ch.last_run_at,
  ch.last_success_at,
  ch.last_failure_at,
  ch.runs_24h,
  ch.successes_24h,
  ch.failures_24h,
  ch.jobs_found_24h,
  ch.jobs_new_24h,
  ROUND((ch.error_rate * 100)::numeric, 1)        AS error_rate_pct,
  ch.avg_latency_ms                               AS connector_latency_ms,
  -- Pipeline success rate (jobs successfully inserted / total fetched)
  CASE WHEN ch.jobs_found_24h > 0
    THEN ROUND((ch.jobs_new_24h::numeric / ch.jobs_found_24h * 100), 1)
    ELSE NULL
  END                                             AS pipeline_success_rate,
  ch.updated_at
FROM connector_health ch
ORDER BY ch.connector;

-- ── VS1 PIPELINE SUCCESS RATE ─────────────────────────────
-- Per-run view: shows each connector run and its results
CREATE OR REPLACE VIEW vs1_run_history AS
SELECT
  cr.connector,
  cr.started_at,
  cr.duration_ms                                  AS latency_ms,
  cr.status,
  cr.jobs_fetched,
  cr.jobs_new,
  cr.jobs_dup,
  cr.jobs_invalid,
  CASE WHEN cr.jobs_fetched > 0
    THEN ROUND((cr.jobs_new::numeric / cr.jobs_fetched * 100), 1)
    ELSE 0
  END                                             AS success_rate_pct,
  cr.error_type,
  cr.error_detail
FROM connector_runs cr
ORDER BY cr.started_at DESC
LIMIT 100;

-- ── VS2 METRICS (available after VS2) ─────────────────────
CREATE OR REPLACE VIEW vs2_metrics AS
SELECT
  COUNT(*) FILTER (WHERE pipeline_status = 'cleaned')   AS jobs_normalized,
  COUNT(*) FILTER (WHERE pipeline_status IN ('raw','cleaned','scored'))
                                                        AS jobs_pending_scoring,
  COUNT(*) FILTER (WHERE province IS NOT NULL)          AS with_province,
  COUNT(*) FILTER (WHERE city IS NOT NULL)              AS with_city,
  COUNT(*) FILTER (WHERE salary_min IS NOT NULL)        AS with_salary,
  COUNT(*) FILTER (WHERE province = 'QC')               AS in_quebec,
  COUNT(*) FILTER (WHERE province != 'QC' AND province IS NOT NULL)
                                                        AS outside_quebec,
  -- Top provinces
  COUNT(*) FILTER (WHERE province = 'ON')               AS in_ontario,
  COUNT(*) FILTER (WHERE province = 'NB')               AS in_new_brunswick,
  COUNT(*) FILTER (WHERE province = 'BC')               AS in_bc
FROM jobs
WHERE is_deleted = false;

-- ── VS3 METRICS ───────────────────────────────────────────
CREATE OR REPLACE VIEW vs3_metrics AS
SELECT
  COUNT(*) FILTER (WHERE js.passed_rules = true)        AS passed_rules,
  COUNT(*) FILTER (WHERE js.passed_rules = false)       AS failed_rules,
  COUNT(*) FILTER (WHERE j.pipeline_status = 'ignored') AS ignored_by_rules,
  -- Rule failure breakdown
  COUNT(*) FILTER (WHERE 'no_quebec' = ANY(js.failed_rules))   AS failed_no_quebec,
  COUNT(*) FILTER (WHERE 'min_salary' = ANY(js.failed_rules))  AS failed_min_salary,
  COUNT(*) FILTER (WHERE 'not_expired' = ANY(js.failed_rules)) AS failed_expired,
  -- Pass rate
  ROUND(
    (COUNT(*) FILTER (WHERE js.passed_rules = true)::numeric
    / NULLIF(COUNT(*), 0) * 100), 1
  )                                                      AS rule_pass_rate_pct
FROM jobs j
LEFT JOIN job_scores js ON js.job_id = j.id
WHERE j.is_deleted = false;

-- ── VS5 AI METRICS ────────────────────────────────────────
CREATE OR REPLACE VIEW vs5_ai_metrics AS
SELECT
  ac.role,
  COUNT(*)                                        AS total_calls,
  COUNT(*) FILTER (WHERE ac.status = 'ok')        AS successful_calls,
  COUNT(*) FILTER (WHERE ac.status = 'error')     AS failed_calls,
  COUNT(*) FILTER (WHERE ac.schema_valid = false) AS schema_invalid,
  ROUND(AVG(ac.latency_ms))                       AS avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ac.latency_ms))
                                                  AS p95_latency_ms,
  SUM(ac.tokens_in)                               AS total_tokens_in,
  SUM(ac.tokens_out)                              AS total_tokens_out,
  ROUND(SUM(ac.estimated_cost)::NUMERIC, 4)       AS total_cost_usd,
  ROUND(AVG(ac.estimated_cost)::NUMERIC, 6)       AS avg_cost_per_call_usd,
  ac.model
FROM ai_calls ac
WHERE ac.created_at > now() - INTERVAL '7 days'
GROUP BY ac.role, ac.model
ORDER BY ac.role;

-- ── VS6 RANKING METRICS ───────────────────────────────────
CREATE OR REPLACE VIEW vs6_ranking_metrics AS
SELECT
  COUNT(*)                                                AS total_ranked,
  COUNT(*) FILTER (WHERE should_notify = true)           AS above_threshold,
  COUNT(*) FILTER (WHERE should_notify = false)          AS below_threshold,
  ROUND(AVG(combined_score), 1)                         AS avg_combined_score,
  ROUND(AVG(objective_score), 1)                        AS avg_objective_score,
  ROUND(AVG(preference_score), 1)                       AS avg_preference_score,
  MAX(combined_score)                                   AS max_score,
  MIN(combined_score)                                   AS min_score,
  -- Distribution
  COUNT(*) FILTER (WHERE combined_score >= 80)          AS high_priority,
  COUNT(*) FILTER (WHERE combined_score BETWEEN 60 AND 79) AS medium_priority,
  COUNT(*) FILTER (WHERE combined_score < 60)           AS low_priority
FROM ranking_results
WHERE ranked_at > now() - INTERVAL '7 days';

-- ── SYSTEM HEALTH OVERVIEW ────────────────────────────────
-- Single view for Dashboard home screen
CREATE OR REPLACE VIEW system_health AS
SELECT
  -- Discovery
  (SELECT COUNT(*) FROM jobs WHERE is_deleted = false)              AS total_jobs,
  (SELECT COUNT(*) FROM jobs WHERE scraped_at > now() - INTERVAL '24h'
   AND is_deleted = false)                                           AS jobs_24h,
  -- Applications
  (SELECT COUNT(*) FROM applications WHERE is_deleted = false)      AS total_applications,
  (SELECT COUNT(*) FROM applications WHERE status = 'interview')    AS interviews,
  (SELECT COUNT(*) FROM applications WHERE status = 'offer')        AS offers,
  -- Outbox health
  (SELECT COUNT(*) FROM outbox WHERE status = 'pending')            AS outbox_pending,
  (SELECT COUNT(*) FROM dead_letter_queue WHERE resolved = false)   AS dead_letters,
  -- AI cost (last 30 days)
  (SELECT ROUND(SUM(estimated_cost)::NUMERIC, 2)
   FROM ai_calls WHERE created_at > now() - INTERVAL '30 days')     AS ai_cost_30d_usd,
  -- Connectors
  (SELECT COUNT(*) FROM connector_health WHERE status = 'healthy')  AS connectors_healthy,
  (SELECT COUNT(*) FROM connector_health WHERE status = 'down')     AS connectors_down,
  -- Timestamp
  now()                                                             AS checked_at;

-- ── GRANT SELECT on all views ──────────────────────────────
-- (adjust role name to match your setup)
-- GRANT SELECT ON vs1_metrics TO career_os_app;
-- GRANT SELECT ON vs1_connector_metrics TO career_os_app;
-- GRANT SELECT ON system_health TO career_os_app;

INSERT INTO schema_migrations (version, name)
VALUES ('012', 'metrics_views')
ON CONFLICT (version) DO NOTHING;

-- ── VS1 DATA QUALITY ──────────────────────────────────────
CREATE OR REPLACE VIEW vs1_data_quality AS
SELECT
  COUNT(*)                                                        AS total_jobs,

  -- Completeness
  ROUND(COUNT(*) FILTER (WHERE title IS NOT NULL)     * 100.0 / NULLIF(COUNT(*),0), 1) AS title_fill_pct,
  ROUND(COUNT(*) FILTER (WHERE company_id IS NOT NULL)* 100.0 / NULLIF(COUNT(*),0), 1) AS company_mapping_pct,
  ROUND(COUNT(*) FILTER (WHERE city IS NOT NULL)      * 100.0 / NULLIF(COUNT(*),0), 1) AS city_fill_pct,
  ROUND(COUNT(*) FILTER (WHERE province IS NOT NULL)  * 100.0 / NULLIF(COUNT(*),0), 1) AS province_fill_pct,
  ROUND(COUNT(*) FILTER (WHERE posted_at IS NOT NULL) * 100.0 / NULLIF(COUNT(*),0), 1) AS posted_at_fill_pct,
  ROUND(COUNT(*) FILTER (WHERE apply_url IS NOT NULL) * 100.0 / NULLIF(COUNT(*),0), 1) AS apply_url_fill_pct,

  -- Salary parsing
  ROUND(COUNT(*) FILTER (WHERE salary_min IS NOT NULL)* 100.0 / NULLIF(COUNT(*),0), 1) AS salary_parse_pct,

  -- Null counts (for debugging)
  COUNT(*) FILTER (WHERE title IS NULL)        AS missing_title,
  COUNT(*) FILTER (WHERE company_raw IS NULL)  AS missing_company_raw,  -- VS1: connector fills this
  COUNT(*) FILTER (WHERE company_id IS NULL)   AS missing_company,      -- VS2: Normalizer maps this
  COUNT(*) FILTER (WHERE city IS NULL)       AS missing_city,
  COUNT(*) FILTER (WHERE province IS NULL)   AS missing_province,
  COUNT(*) FILTER (WHERE posted_at IS NULL)  AS missing_posted_at
FROM jobs WHERE is_deleted = false;

-- ── VS1 ACCEPTANCE GATES ──────────────────────────────────
-- Returns one row per gate: name, value, threshold, passed
CREATE OR REPLACE VIEW vs1_acceptance_gates AS
WITH
  health  AS (SELECT * FROM vs1_connector_metrics WHERE connector = 'jobbank'),
  quality AS (SELECT * FROM vs1_data_quality),
  ops     AS (SELECT * FROM vs1_metrics),
  errors  AS (
    SELECT ROUND(
      COUNT(*) FILTER (WHERE level = 'error') * 1000.0
      / NULLIF(COUNT(*), 0), 1
    ) AS errors_per_1000
    FROM logs
    WHERE created_at > now() - INTERVAL '24h'
  ),
  latency AS (
    SELECT ROUND(AVG(duration_ms) / 1000.0, 1) AS avg_latency_sec
    FROM connector_runs
    WHERE connector = 'jobbank'
    AND status = 'success'
    AND started_at > now() - INTERVAL '24h'
  )
-- FIX (VS1): the original body put gate rows inside a VALUES() constructor
-- that referenced health.* / quality.* / ops.* etc. A VALUES list cannot see
-- columns from a cross-joined table, so the view failed with
--   ERROR: missing FROM-clause entry for table "health".
-- Rewritten as a UNION ALL of one SELECT per gate over the same CTEs —
-- identical gate names, values, thresholds and pass conditions.
SELECT 'discovery_success_rate'::text AS gate,
       health.pipeline_success_rate::TEXT AS value,
       '≥ 95%'::text AS threshold,
       COALESCE(health.pipeline_success_rate >= 95, false) AS passed
FROM health, quality, ops, errors, latency
UNION ALL
SELECT 'duplicate_rate',
       ROUND(ops.duplicates_detected * 100.0 / NULLIF(ops.jobs_discovered,0), 1)::TEXT || '%',
       '≤ 10%',
       COALESCE(ops.duplicates_detected * 100.0 / NULLIF(ops.jobs_discovered,0) <= 10, true)
FROM health, quality, ops, errors, latency
UNION ALL
SELECT 'missing_title',
       quality.missing_title::TEXT,
       '= 0',
       quality.missing_title = 0
FROM health, quality, ops, errors, latency
UNION ALL
SELECT 'missing_company_raw',
       quality.missing_company_raw::TEXT,
       '< 1%',
       COALESCE(quality.missing_company_raw * 100.0 / NULLIF(quality.total_jobs,0) < 1, true)
FROM health, quality, ops, errors, latency
-- NOTE (VS1 scope alignment): `company_mapping_rate` (company_id) and
-- `province_detection_rate` (province) test fields produced by the VS2
-- Normalizer, not by VS1 Discovery — see docs/vertical-slices.md (VS2) and
-- docs/definition-of-done.md (VS1 lists neither). They belong to the VS2
-- acceptance gate; keeping them here made VS1 unpassable by construction.
UNION ALL
SELECT 'processing_errors_per_1000',
       errors.errors_per_1000::TEXT,
       '< 5',
       COALESCE(errors.errors_per_1000 < 5, true)
FROM health, quality, ops, errors, latency
UNION ALL
SELECT 'processing_latency_sec',
       COALESCE(latency.avg_latency_sec::TEXT, 'no data'),
       '≤ 60s',
       COALESCE(latency.avg_latency_sec <= 60, true)
FROM health, quality, ops, errors, latency;

-- ── VS1 PROVINCE DISTRIBUTION ─────────────────────────────
CREATE OR REPLACE VIEW vs1_province_distribution AS
SELECT
  COALESCE(province, 'UNKNOWN') AS province,
  COUNT(*)                      AS job_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM jobs
WHERE is_deleted = false
GROUP BY province
ORDER BY COUNT(*) DESC;
