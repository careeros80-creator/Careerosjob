-- ══════════════════════════════════════════════════════════
-- 010_connector_health_ats.sql
-- Purpose: Connector health monitoring + ATS compatibility layer
--
-- WHY CONNECTOR HEALTH:
--   Job Bank changes HTML structure → connector silently returns 0.
--   Without monitoring: 3 days of missed jobs before we notice.
--   With monitoring: Telegram alert after first failed fetch.
--
-- WHY ATS:
--   Most Canadian employers use ATS systems.
--   If CV doesn't parse correctly → ignored regardless of score.
--   ATS layer analyzes CV-job keyword matching before sending.
-- ══════════════════════════════════════════════════════════

-- ── CONNECTOR HEALTH ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS connector_health (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector       TEXT NOT NULL UNIQUE,
  -- jobbank / jooble / linkedin / direct / indeed
  -- Current state
  status          TEXT NOT NULL DEFAULT 'unknown',
  -- healthy / degraded / down / unknown
  -- Last run metrics
  last_run_at     TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_latency_ms INTEGER,
  last_error      TEXT,
  -- Rolling window (last 24h)
  runs_24h        INTEGER DEFAULT 0,
  successes_24h   INTEGER DEFAULT 0,
  failures_24h    INTEGER DEFAULT 0,
  jobs_found_24h  INTEGER DEFAULT 0,
  jobs_new_24h    INTEGER DEFAULT 0,
  -- Rates
  error_rate      FLOAT DEFAULT 0.0,
  -- failures / runs (0.0 - 1.0)
  avg_latency_ms  INTEGER DEFAULT 0,
  -- Alerting
  alert_sent_at   TIMESTAMPTZ,
  alert_threshold FLOAT DEFAULT 0.5,
  -- alert when error_rate > threshold
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: one row per connector
INSERT INTO connector_health (connector, status) VALUES
('jobbank', 'unknown'),
('direct',  'unknown'),
('jooble',  'unknown'),
('linkedin','unknown'),
('indeed',  'unknown')
ON CONFLICT (connector) DO NOTHING;

-- ── CONNECTOR RUN LOG ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS connector_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector    TEXT NOT NULL,
  -- Run details
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  duration_ms  INTEGER,
  -- Results
  status       TEXT NOT NULL DEFAULT 'running',
  -- running / success / partial / failed
  jobs_fetched INTEGER DEFAULT 0,
  jobs_new     INTEGER DEFAULT 0,
  jobs_dup     INTEGER DEFAULT 0,
  jobs_invalid INTEGER DEFAULT 0,
  -- Error
  error_type   TEXT,
  error_detail TEXT,
  -- Trace
  trace_id     UUID REFERENCES traces(trace_id)
);

CREATE INDEX IF NOT EXISTS idx_connector_runs_connector
  ON connector_runs(connector, started_at DESC);

-- ── UPDATE HEALTH after each run ─────────────────────────
CREATE OR REPLACE FUNCTION update_connector_health()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when run finishes
  IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
    UPDATE connector_health SET
      last_run_at     = NEW.started_at,
      last_latency_ms = NEW.duration_ms,
      last_error      = CASE WHEN NEW.status = 'failed' THEN NEW.error_detail ELSE NULL END,
      last_success_at = CASE WHEN NEW.status IN ('success','partial')
                             THEN NEW.finished_at ELSE last_success_at END,
      last_failure_at = CASE WHEN NEW.status = 'failed'
                             THEN NEW.finished_at ELSE last_failure_at END,
      -- Rolling 24h stats (simplified: last 50 runs)
      runs_24h      = (SELECT COUNT(*) FROM connector_runs
                       WHERE connector = NEW.connector
                       AND started_at > now() - INTERVAL '24 hours'),
      successes_24h = (SELECT COUNT(*) FROM connector_runs
                       WHERE connector = NEW.connector
                       AND status IN ('success','partial')
                       AND started_at > now() - INTERVAL '24 hours'),
      failures_24h  = (SELECT COUNT(*) FROM connector_runs
                       WHERE connector = NEW.connector
                       AND status = 'failed'
                       AND started_at > now() - INTERVAL '24 hours'),
      jobs_found_24h = (SELECT COALESCE(SUM(jobs_fetched),0) FROM connector_runs
                        WHERE connector = NEW.connector
                        AND started_at > now() - INTERVAL '24 hours'),
      jobs_new_24h   = (SELECT COALESCE(SUM(jobs_new),0) FROM connector_runs
                        WHERE connector = NEW.connector
                        AND started_at > now() - INTERVAL '24 hours'),
      -- Status classification
      status = CASE
        WHEN NEW.status = 'failed' THEN 'down'
        WHEN NEW.status IN ('success','partial') THEN 'healthy'
        ELSE 'unknown'
      END,
      avg_latency_ms = (SELECT ROUND(AVG(duration_ms)) FROM connector_runs
                        WHERE connector = NEW.connector
                        AND duration_ms IS NOT NULL
                        AND started_at > now() - INTERVAL '24 hours'),
      updated_at = now()
    WHERE connector = NEW.connector;

    -- Calculate error_rate after update
    UPDATE connector_health SET
      error_rate = CASE WHEN runs_24h > 0
                        THEN failures_24h::FLOAT / runs_24h
                        ELSE 0.0 END
    WHERE connector = NEW.connector;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connector_runs_update_health
AFTER UPDATE ON connector_runs
FOR EACH ROW EXECUTE FUNCTION update_connector_health();

-- ══════════════════════════════════════════════════════════
-- ATS COMPATIBILITY
-- ══════════════════════════════════════════════════════════

-- ── ATS ANALYSES ─────────────────────────────────────────
-- Analyzes CV-job keyword match before sending application
CREATE TABLE IF NOT EXISTS ats_analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id),
  document_id     UUID NOT NULL REFERENCES documents(id),
  -- ATS Score breakdown
  keyword_score   SMALLINT,  -- /100: keyword overlap %
  format_score    SMALLINT,  -- /100: CV format ATS-friendliness
  total_score     SMALLINT,  -- /100: weighted average
  -- Keyword analysis
  keywords_required TEXT[],  -- from job posting
  keywords_found    TEXT[],  -- found in CV
  keywords_missing  TEXT[],  -- required but absent from CV
  keywords_added    TEXT[],  -- suggested additions
  -- Format issues
  format_issues   JSONB DEFAULT '[]',
  -- [{"type": "table_detected", "severity": "warning", "fix": "Convert to bullet list"}]
  -- Recommendation
  recommendation  TEXT,
  -- high_match / medium_match / low_match / needs_tailoring
  summary         TEXT,
  -- Human-readable 2-3 sentence summary
  -- AI metadata
  ai_call_id      UUID REFERENCES ai_calls(id),
  analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ats_job
  ON ats_analyses(job_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ats_job_doc
  ON ats_analyses(job_id, document_id);

-- ── ATS KEYWORD LIBRARY ───────────────────────────────────
-- Common beauty/hairdressing keywords in Canadian job postings
CREATE TABLE IF NOT EXISTS ats_keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL,
  -- skill / certification / tool / soft_skill / requirement
  weight      FLOAT DEFAULT 1.0,
  -- higher = more important for scoring
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: Beauty industry keywords for Canadian ATS
INSERT INTO ats_keywords (keyword, category, weight) VALUES
-- Core skills (high weight)
('esthetician',         'skill',         2.0),
('hairstylist',         'skill',         2.0),
('cosmetologist',       'skill',         2.0),
('aesthetician',        'skill',         2.0),
('hydrafacial',         'skill',         1.8),
('microneedling',       'skill',         1.8),
('laser carbone',       'skill',         1.8),
('carbon laser',        'skill',         1.8),
('ipl',                 'skill',         1.6),
('microblading',        'skill',         1.6),
('permanent makeup',    'skill',         1.6),
('maquillage permanent','skill',         1.6),
('waxing',              'skill',         1.2),
('balayage',            'skill',         1.4),
('highlights',          'skill',         1.2),
('extensions',          'skill',         1.2),
('nail technician',     'skill',         1.2),
('gel nails',           'skill',         1.0),
('lash extensions',     'skill',         1.2),
('bridal hair',         'skill',         1.4),
('skin care',           'skill',         1.3),
('facial',              'skill',         1.2),
-- Certifications
('red seal',            'certification', 2.0),
('certificate',         'certification', 1.5),
('licensed',            'certification', 1.5),
('certified',           'certification', 1.5),
-- Requirements
('customer service',    'soft_skill',    1.2),
('bilingual',           'requirement',   1.5),
('french',              'requirement',   1.5),
('english',             'requirement',   1.0),
('full-time',           'requirement',   1.0),
('part-time',           'requirement',   1.0)
ON CONFLICT (keyword) DO NOTHING;

INSERT INTO schema_migrations (version, name)
VALUES ('010', 'connector_health_ats')
ON CONFLICT (version) DO NOTHING;
