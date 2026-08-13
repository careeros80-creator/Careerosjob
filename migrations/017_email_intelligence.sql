-- ══════════════════════════════════════════════════════════
-- 017_email_intelligence.sql
-- VS2 Module 5 — Email Intelligence.
--
-- Stores classified inbound recruitment emails, links them to applications,
-- extracts interview/meeting metadata, and builds a per-application timeline.
--
-- NOTHING is auto-sent/accepted (ADR-006): this module only READS + classifies.
-- Gmail auth is OAuth (refresh-token reference in secret_refs) — never passwords.
-- Additive + idempotent (UNIQUE gmail_message_id).
-- ══════════════════════════════════════════════════════════

-- ── EMAILS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emails (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT NOT NULL UNIQUE,
  gmail_thread_id  TEXT,
  application_id   UUID REFERENCES applications(id),
  job_id           UUID REFERENCES jobs(id),
  company_id       UUID REFERENCES companies(id),
  from_address     TEXT,
  subject          TEXT,
  body_text        TEXT,
  received_at      TIMESTAMPTZ,
  classification   email_classification,          -- interview/offer/rejection/question/auto_reply/ignore
  confidence       NUMERIC(4,3),
  is_urgent        BOOLEAN NOT NULL DEFAULT false,
  requires_action  BOOLEAN NOT NULL DEFAULT false,
  reply_deadline   TIMESTAMPTZ,
  meeting_at       TIMESTAMPTZ,
  meeting_timezone TEXT,
  meeting_location TEXT,
  meeting_url      TEXT,
  attachments      JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emails_application ON emails(application_id);
CREATE INDEX IF NOT EXISTS idx_emails_class ON emails(classification);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(gmail_thread_id);

-- ── APPLICATION TIMELINE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS application_timeline (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  job_id         UUID REFERENCES jobs(id),
  email_id       UUID REFERENCES emails(id),
  event_type     TEXT NOT NULL,   -- applied / email_received / interview_detected / offer / rejection / info_requested
  event_at       TIMESTAMPTZ NOT NULL,
  detail         JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- idempotent per (email, event) and per (application, applied)
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeline_email_event
  ON application_timeline(email_id, event_type) WHERE email_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_application ON application_timeline(application_id, event_at);

-- ── EMAIL DASHBOARD (view) ────────────────────────────────
CREATE OR REPLACE VIEW email_dashboard AS
SELECT
  COUNT(*)                                              AS total_emails,
  COUNT(*) FILTER (WHERE requires_action)               AS unread_actions,
  COUNT(*) FILTER (WHERE classification = 'interview')  AS interviews,
  COUNT(*) FILTER (WHERE classification = 'offer')      AS offers,
  COUNT(*) FILTER (WHERE classification = 'rejection')  AS rejected,
  COUNT(*) FILTER (WHERE classification = 'question')   AS info_requests,
  COUNT(*) FILTER (WHERE classification = 'auto_reply') AS auto_replies,
  COUNT(*) FILTER (WHERE classification = 'ignore')     AS unknown,
  (SELECT COUNT(*) FROM applications
     WHERE status IN ('sent','opened','replied') AND is_deleted = false) AS waiting
FROM emails;

INSERT INTO schema_migrations (version, name)
VALUES ('017', 'email_intelligence')
ON CONFLICT (version) DO NOTHING;
