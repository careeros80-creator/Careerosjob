-- ══════════════════════════════════════════════════════════
-- 002_enums.sql
-- Purpose: Define all domain ENUM types
-- Safe to re-run: NO (ENUMs cannot be redefined)
-- Note: Adding values to ENUM requires ALTER TYPE
--       Removing values requires new ENUM + migration
-- ══════════════════════════════════════════════════════════

-- ── Job Pipeline ──────────────────────────────────────────
CREATE TYPE job_pipeline_status AS ENUM (
  'raw',
  'cleaned',
  'scored',
  'notified',
  'applied',
  'ignored',
  'invalid',
  'duplicate'
);

-- ── Job Priority ──────────────────────────────────────────
CREATE TYPE job_priority AS ENUM (
  'high',
  'medium',
  'low',
  'ignore'
);

-- ── LMIA ──────────────────────────────────────────────────
CREATE TYPE lmia_status AS ENUM (
  'yes',
  'no',
  'c16_possible',
  'unknown'
);

-- ── Contract ──────────────────────────────────────────────
CREATE TYPE contract_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'freelance',
  'unknown'
);

-- ── Language ──────────────────────────────────────────────
-- Note: 'unknown' used as default, NOT 'none'
-- Contracts doc: language_req ENUM ('fr','en','bilingual','unknown')
CREATE TYPE language_req AS ENUM (
  'fr',
  'en',
  'bilingual',
  'unknown'
);

-- ── Application ───────────────────────────────────────────
CREATE TYPE app_status AS ENUM (
  'draft',
  'sent',
  'opened',
  'replied',
  'interview',
  'rejected',
  'offer',
  'closed'
);

CREATE TYPE application_channel AS ENUM (
  'gmail',
  'linkedin',
  'jobbank',
  'company_form',
  'indeed',
  'manual',
  'other'
);

-- ── Documents ─────────────────────────────────────────────
CREATE TYPE doc_type AS ENUM (
  'cv',
  'cover_letter',
  'portfolio',
  'other'
);

CREATE TYPE app_doc_role AS ENUM (
  'cv',
  'cover_letter',
  'attachment'
);

-- ── Queue ─────────────────────────────────────────────────
CREATE TYPE queue_status AS ENUM (
  'pending',
  'processing',
  'done',
  'failed',
  'dead'
);

-- ── Logging ───────────────────────────────────────────────
CREATE TYPE log_level AS ENUM (
  'debug',
  'info',
  'warning',
  'error',
  'critical'
);

-- ── AI ────────────────────────────────────────────────────
CREATE TYPE ai_role AS ENUM (
  'extractor',
  'writer',
  'classifier',
  'scorer'
);

-- ── Rule Engine ───────────────────────────────────────────
CREATE TYPE rule_operator AS ENUM (
  'eq',
  'neq',
  'gte',
  'lte',
  'in',
  'not_in',
  'contains',
  'not_contains'
);

CREATE TYPE rule_group AS ENUM (
  'geography',
  'salary',
  'language',
  'visa',
  'recency',
  'company',
  'contract'
);

-- ── Email Intelligence ────────────────────────────────────
CREATE TYPE email_classification AS ENUM (
  'interview',
  'offer',
  'rejection',
  'auto_reply',
  'question',
  'ignore'
);

-- ── Notifications ─────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'new_job',
  'interview_alert',
  'offer_alert',
  'followup_due',
  'system_error',
  'dead_letter_alert'
);

CREATE TYPE notification_channel AS ENUM (
  'telegram',
  'email',
  'dashboard',
  'webhook',
  'future'
);

-- ── Audit ─────────────────────────────────────────────────
CREATE TYPE actor_type AS ENUM (
  'system',
  'telegram',
  'n8n',
  'make',
  'manual',
  'cleanup_job'
);

-- Verify critical ENUMs exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_pipeline_status') THEN
    RAISE EXCEPTION 'ENUM job_pipeline_status missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_req') THEN
    RAISE EXCEPTION 'ENUM language_req missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lmia_status') THEN
    RAISE EXCEPTION 'ENUM lmia_status missing';
  END IF;
END $$;

INSERT INTO schema_migrations (version, name)
VALUES ('002', 'enums')
ON CONFLICT (version) DO NOTHING;
