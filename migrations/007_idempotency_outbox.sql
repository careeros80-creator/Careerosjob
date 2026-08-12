-- ══════════════════════════════════════════════════════════
-- 007_idempotency_outbox.sql
-- Purpose: Idempotency fields on events + Outbox Pattern
--
-- WHY IDEMPOTENCY:
--   n8n may re-execute a workflow on failure.
--   Without idempotency, same job gets processed twice.
--   event_id = dedup key. If already processed → skip.
--
-- WHY OUTBOX:
--   Worker updates DB then publishes event.
--   If crash between the two → event is lost.
--   Solution: both happen in ONE transaction.
--   Outbox publisher reads pending rows and emits events.
-- ══════════════════════════════════════════════════════════

-- ── Add Idempotency fields to events ─────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_id       UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS correlation_id UUID,
  -- correlation_id: groups all events from one user action
  -- e.g. one job search → many job.discovered events share same correlation_id
  ADD COLUMN IF NOT EXISTS causation_id   UUID;
  -- causation_id: the event_id that caused THIS event
  -- job.discovered → causes → job.cleaned (causation_id = job.discovered.event_id)

-- Idempotency key: prevents double-processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_event_id
  ON events(event_id);

CREATE INDEX IF NOT EXISTS idx_events_correlation
  ON events(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- ── OUTBOX TABLE ──────────────────────────────────────────
-- Rows are inserted in the SAME transaction as DB changes.
-- A separate publisher reads pending rows and emits events.
-- On success: mark as published.
-- On failure: retry (attempts < max_attempts).
CREATE TABLE IF NOT EXISTS outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Event identity
  event_id        UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL REFERENCES event_types(code),
  event_version   TEXT NOT NULL DEFAULT '1.0',
  -- Correlation chain
  correlation_id  UUID,
  causation_id    UUID,
  -- Payload
  payload         JSONB NOT NULL DEFAULT '{}',
  -- Related entities
  job_id          UUID REFERENCES jobs(id),
  company_id      UUID REFERENCES companies(id),
  application_id  UUID,
  -- Publishing state
  status          queue_status NOT NULL DEFAULT 'pending',
  attempts        SMALLINT NOT NULL DEFAULT 0,
  max_attempts    SMALLINT NOT NULL DEFAULT 3,
  next_retry_at   TIMESTAMPTZ DEFAULT now(),
  last_error      TEXT,
  published_at    TIMESTAMPTZ,
  -- Timing
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_status
  ON outbox(status, next_retry_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_outbox_event_id
  ON outbox(event_id);

-- ── OUTBOX PUBLISHER LOCK ─────────────────────────────────
-- Prevents two publisher instances from processing same row
CREATE TABLE IF NOT EXISTS outbox_locks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id   UUID NOT NULL UNIQUE REFERENCES outbox(id),
  locked_by   TEXT NOT NULL,   -- n8n instance ID
  locked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '5 minutes'
);

-- ── HELPER FUNCTION: Publish Event via Outbox ─────────────
-- Usage: SELECT publish_event('job.discovered', '{"raw_job_id": "..."}', job_id);
CREATE OR REPLACE FUNCTION publish_event(
  p_event_type    TEXT,
  p_payload       JSONB,
  p_job_id        UUID DEFAULT NULL,
  p_company_id    UUID DEFAULT NULL,
  p_application_id UUID DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL,
  p_causation_id  UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO outbox (
    event_id, event_type, payload,
    job_id, company_id, application_id,
    correlation_id, causation_id
  ) VALUES (
    v_event_id, p_event_type, p_payload,
    p_job_id, p_company_id, p_application_id,
    COALESCE(p_correlation_id, v_event_id),
    p_causation_id
  );
  RETURN v_event_id;
END;
$$;

-- ── IDEMPOTENCY CHECK FUNCTION ────────────────────────────
-- n8n calls this before processing any event
CREATE OR REPLACE FUNCTION is_event_processed(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_consumers
    WHERE event_id IN (
      SELECT id FROM events WHERE event_id = p_event_id
    )
    AND status = 'done'
  );
END;
$$;

INSERT INTO schema_migrations (version, name)
VALUES ('007', 'idempotency_outbox')
ON CONFLICT (version) DO NOTHING;
