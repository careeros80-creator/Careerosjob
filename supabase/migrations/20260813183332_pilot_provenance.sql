-- ══════════════════════════════════════════════════════════
-- 020_pilot_provenance.sql
-- pilot/production-validation — separate Production Runtime from Test Data.
--
-- Adds a per-row `data_source` provenance marker on the two tables where
-- provenance ORIGINATES:
--   • jobs   — 'production' when discovered from a live source (Job Bank),
--              'test' when seeded from fixtures.
--   • emails — 'production' when pulled from Gmail via OAuth,
--              'test' when seeded from fixtures.
-- Everything downstream (normalization, enrichment, application packages,
-- generated documents, timeline) inherits provenance by joining back to its
-- job (jobs.data_source) or email (emails.data_source) — so the moment the
-- pilot user authorises Gmail and real messages flow in, they are counted as
-- Production Runtime with NO code or schema change.
--
-- Also adds `production_actions` — the structured action log every production
-- stage writes to (trace_id, correlation_id, timestamp, status, duration).
--
-- Two reporting views:
--   • pilot_dashboard          — the 10 pilot metrics, split production vs test.
--   • pilot_production_metrics — the production rate metrics, computed ONLY
--                                from data_source='production' (never fixtures).
--
-- Additive + idempotent. Default 'test' is deliberately conservative: nothing
-- is counted as production unless a runner explicitly marks it 'production'.
-- ══════════════════════════════════════════════════════════

-- ── PROVENANCE COLUMNS ────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'test'
  CHECK (data_source IN ('test','production'));

ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'test'
  CHECK (data_source IN ('test','production'));

CREATE INDEX IF NOT EXISTS idx_jobs_data_source   ON jobs(data_source);
CREATE INDEX IF NOT EXISTS idx_emails_data_source ON emails(data_source);

-- Existing rows are all fixture-derived → explicitly Test Data.
UPDATE jobs   SET data_source = 'test' WHERE data_source IS NULL OR data_source NOT IN ('test','production');
UPDATE emails SET data_source = 'test' WHERE data_source IS NULL OR data_source NOT IN ('test','production');

-- ── STRUCTURED PRODUCTION ACTION LOG ──────────────────────
-- One row per production action. correlation_id ties an action to a trace
-- (traces.trace_id); status + duration_ms make every action auditable.
CREATE TABLE IF NOT EXISTS production_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action         TEXT NOT NULL,                    -- discover / normalize / enrich / generate / email_ingest / approve / mark_sent
  stage          TEXT,                             -- connector / enrichment / generation / gmail / pipeline
  trace_id       UUID,
  correlation_id UUID,
  data_source    TEXT NOT NULL DEFAULT 'production'
                 CHECK (data_source IN ('test','production')),
  status         TEXT NOT NULL DEFAULT 'success'   -- success / error / retrying / skipped
                 CHECK (status IN ('success','error','retrying','skipped')),
  attempt        INTEGER NOT NULL DEFAULT 1,
  duration_ms    INTEGER,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  detail         JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_production_actions_trace  ON production_actions(trace_id);
CREATE INDEX IF NOT EXISTS idx_production_actions_action ON production_actions(action, occurred_at);
CREATE INDEX IF NOT EXISTS idx_production_actions_source ON production_actions(data_source, occurred_at);

-- RLS parity with the hardening baseline (server-only; no anon policy).
ALTER TABLE production_actions ENABLE ROW LEVEL SECURITY;

-- ── PILOT DASHBOARD (Production Runtime vs Test Data) ──────
-- One row per data_source with all 10 pilot metrics. The React dashboard reads
-- this and renders the two columns side by side.
CREATE OR REPLACE VIEW pilot_dashboard AS
WITH src(data_source) AS (VALUES ('production'), ('test'))
SELECT
  src.data_source,
  (SELECT count(*) FROM jobs j
     WHERE j.is_deleted = false AND j.data_source = src.data_source)                       AS jobs_discovered,
  (SELECT count(*) FROM jobs j
     WHERE j.is_deleted = false AND j.pipeline_status <> 'raw'
       AND j.data_source = src.data_source)                                                AS jobs_cleaned,
  (SELECT count(DISTINCT ce.company_id) FROM company_enrichment ce
     JOIN jobs j ON j.company_id = ce.company_id
     WHERE j.data_source = src.data_source)                                                AS companies_enriched,
  (SELECT count(*) FROM application_packages p JOIN jobs j ON j.id = p.job_id
     WHERE p.status = 'prepared' AND j.data_source = src.data_source)                      AS applications_prepared,
  (SELECT count(*) FROM application_packages p JOIN jobs j ON j.id = p.job_id
     WHERE p.status = 'approved' AND j.data_source = src.data_source)                      AS applications_approved,
  (SELECT count(*) FROM application_packages p JOIN jobs j ON j.id = p.job_id
     WHERE p.status = 'sent' AND j.data_source = src.data_source)                          AS applications_sent,
  (SELECT count(*) FROM emails e
     WHERE e.classification = 'interview' AND e.data_source = src.data_source)             AS interviews,
  (SELECT count(*) FROM emails e
     WHERE e.classification = 'offer' AND e.data_source = src.data_source)                 AS offers,
  (SELECT count(*) FROM emails e
     WHERE e.classification = 'rejection' AND e.data_source = src.data_source)             AS rejections,
  (SELECT count(*) FROM application_packages p JOIN jobs j ON j.id = p.job_id
     WHERE p.status = 'sent' AND j.data_source = src.data_source
       AND NOT EXISTS (SELECT 1 FROM emails e
             WHERE e.job_id = p.job_id
               AND e.classification IN ('interview','offer','rejection')))                 AS waiting_responses
FROM src;

-- ── PILOT PRODUCTION METRICS (real activity ONLY) ─────────
-- Every number below is computed strictly from data_source='production'.
-- With no live data yet these are 0 / NULL — that is the honest state, not a
-- fixture-derived figure.
CREATE OR REPLACE VIEW pilot_production_metrics AS
WITH
  pj AS (SELECT * FROM jobs WHERE data_source = 'production' AND is_deleted = false),
  psent AS (SELECT p.* FROM application_packages p JOIN pj ON pj.id = p.job_id WHERE p.status = 'sent'),
  pe AS (SELECT * FROM emails WHERE data_source = 'production')
SELECT
  (SELECT count(*) FROM pj)                                                                AS jobs_discovered,
  (SELECT count(*) FROM pj WHERE is_duplicate = false)                                     AS jobs_unique,
  (SELECT count(*) FROM psent)                                                             AS applications_sent,
  ROUND(100.0 * (SELECT count(*) FROM pj WHERE is_duplicate = false)
        / NULLIF((SELECT count(*) FROM pj), 0), 1)                                         AS discovery_success_rate_pct,
  ROUND(100.0 * (SELECT count(*) FROM pj WHERE is_duplicate = true)
        / NULLIF((SELECT count(*) FROM pj), 0), 1)                                         AS duplicate_rate_pct,
  (SELECT ROUND(AVG(a.coverage_pct), 1) FROM application_ats a JOIN pj ON pj.id = a.job_id) AS ats_coverage_pct,
  (SELECT ROUND(AVG(duration_ms))::INT FROM production_actions
     WHERE data_source = 'production' AND status = 'success')                              AS avg_processing_ms,
  ROUND(100.0 * (SELECT count(*) FROM pe WHERE classification = 'interview')
        / NULLIF((SELECT count(*) FROM psent), 0), 1)                                      AS interview_rate_pct,
  ROUND(100.0 * (SELECT count(*) FROM pe WHERE classification IN ('interview','offer','rejection'))
        / NULLIF((SELECT count(*) FROM psent), 0), 1)                                      AS response_rate_pct,
  ROUND(100.0 * (SELECT count(*) FROM pe WHERE classification = 'offer')
        / NULLIF((SELECT count(*) FROM psent), 0), 1)                                      AS offer_rate_pct;

-- Dashboard reads (aggregate counts only, no PII) — owner-privilege views,
-- consistent with 013_vs1_dashboard_grants.
GRANT SELECT ON pilot_dashboard          TO anon;
GRANT SELECT ON pilot_production_metrics TO anon;

INSERT INTO schema_migrations (version, name)
VALUES ('020', 'pilot_provenance')
ON CONFLICT (version) DO NOTHING;
