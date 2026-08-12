-- ══════════════════════════════════════════════════════════
-- 008_observability.sql
-- Purpose: Distributed tracing + structured observability
--
-- WHY:
--   A job goes through 8+ steps across 4+ contexts.
--   Without tracing: "why did this job get ignored?" is a
--   30-minute debug session.
--   With tracing: 30 seconds to find the exact step.
--
-- STRUCTURE (OpenTelemetry-compatible):
--   trace_id     = one full pipeline run (job discovered → sent)
--   span_id      = one step within the trace
--   parent_span_id = which step caused this step
-- ══════════════════════════════════════════════════════════

-- ── TRACES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS traces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  -- What triggered this trace
  trigger_type    TEXT NOT NULL,
  -- cron_crawler / telegram_command / webhook / manual
  trigger_ref     TEXT,
  -- e.g. "cron:crawler:15min" or "telegram:/apply 3a4b"
  -- Root entity
  job_id          UUID REFERENCES jobs(id),
  application_id  UUID,
  -- State
  status          TEXT NOT NULL DEFAULT 'running',
  -- running / completed / failed / partial
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  duration_ms     INTEGER,
  -- Summary
  total_spans     INTEGER DEFAULT 0,
  failed_spans    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_traces_job
  ON traces(job_id)
  WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_traces_status
  ON traces(status, started_at DESC);

-- ── SPANS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id       UUID NOT NULL REFERENCES traces(trace_id),
  span_id        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  parent_span_id UUID REFERENCES spans(span_id),
  -- What this span represents
  context        TEXT NOT NULL,
  -- discovery / normalization / scoring / notification / application / email_intelligence
  operation      TEXT NOT NULL,
  -- fetch_jobbank / compute_hash / run_rules / score_ai / send_gmail...
  -- State
  status         TEXT NOT NULL DEFAULT 'running',
  -- running / ok / error / skipped
  -- Timing
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  duration_ms    INTEGER,
  -- Metadata
  job_id         UUID REFERENCES jobs(id),
  ai_call_id     UUID,
  error_code     TEXT,
  error_message  TEXT,
  attributes     JSONB DEFAULT '{}',
  -- e.g. {"score": 92, "rules_failed": [], "model": "gpt-4o-mini"}
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spans_trace
  ON spans(trace_id, started_at);

CREATE INDEX IF NOT EXISTS idx_spans_job
  ON spans(job_id)
  WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spans_status
  ON spans(status)
  WHERE status = 'error';

-- ── Add trace fields to logs ───────────────────────────────
ALTER TABLE logs
  ADD COLUMN IF NOT EXISTS trace_id UUID,
  ADD COLUMN IF NOT EXISTS span_id  UUID;

CREATE INDEX IF NOT EXISTS idx_logs_trace
  ON logs(trace_id)
  WHERE trace_id IS NOT NULL;

-- ── Add trace fields to ai_calls ──────────────────────────
-- (ai_calls table created in 009_prompt_registry.sql)
-- Added there directly to avoid forward reference

-- ── HELPER: Start Span ────────────────────────────────────
CREATE OR REPLACE FUNCTION start_span(
  p_trace_id       UUID,
  p_context        TEXT,
  p_operation      TEXT,
  p_parent_span_id UUID DEFAULT NULL,
  p_job_id         UUID DEFAULT NULL,
  p_attributes     JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_span_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO spans (
    trace_id, span_id, parent_span_id,
    context, operation, job_id, attributes
  ) VALUES (
    p_trace_id, v_span_id, p_parent_span_id,
    p_context, p_operation, p_job_id, p_attributes
  );
  RETURN v_span_id;
END;
$$;

-- ── HELPER: Finish Span ───────────────────────────────────
CREATE OR REPLACE FUNCTION finish_span(
  p_span_id     UUID,
  p_status      TEXT DEFAULT 'ok',
  p_error_code  TEXT DEFAULT NULL,
  p_error_msg   TEXT DEFAULT NULL,
  p_attributes  JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE spans SET
    status        = p_status,
    finished_at   = now(),
    duration_ms   = EXTRACT(EPOCH FROM (now() - started_at)) * 1000,
    error_code    = p_error_code,
    error_message = p_error_msg,
    attributes    = CASE
                      WHEN p_attributes IS NOT NULL
                      THEN attributes || p_attributes
                      ELSE attributes
                    END
  WHERE span_id = p_span_id;
END;
$$;

INSERT INTO schema_migrations (version, name)
VALUES ('008', 'observability')
ON CONFLICT (version) DO NOTHING;
