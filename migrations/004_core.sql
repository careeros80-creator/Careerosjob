-- ══════════════════════════════════════════════════════════
-- 004_core.sql
-- Purpose: Core shared tables used across multiple contexts
-- Includes: companies, company_identities, documents,
--           ai_model_config, secret_refs
-- ══════════════════════════════════════════════════════════

-- ── unaccent fallback (defined BEFORE companies) ──────────
-- FIX (VS1): this function must exist before the companies table,
-- because companies.name_slug is a GENERATED column that calls it.
-- In the original 004 the function was declared AFTER the table,
-- which made a fresh `make migrate` fail with:
--   ERROR: function unaccent_if_possible(text) does not exist
CREATE OR REPLACE FUNCTION unaccent_if_possible(text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  BEGIN
    RETURN unaccent($1);
  EXCEPTION WHEN undefined_function THEN
    RETURN $1;
  END;
END;
$$;

-- ── COMPANIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  name_slug        TEXT GENERATED ALWAYS AS (
                     lower(regexp_replace(
                       unaccent_if_possible(name),
                       '[^a-zA-Z0-9]+', '-', 'g'
                     ))
                   ) STORED,
  city             TEXT,
  province         TEXT,
  country          TEXT DEFAULT 'CA',
  email            TEXT,
  phone            TEXT,
  website          TEXT,
  instagram        TEXT,
  linkedin         TEXT,
  -- Company Memory
  contact_count    INTEGER DEFAULT 0,
  last_contact_at  TIMESTAMPTZ,
  has_interview    BOOLEAN DEFAULT false,
  is_rejected      BOOLEAN DEFAULT false,
  is_blacklisted   BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklisted_at   TIMESTAMPTZ,
  -- Soft Delete
  is_deleted       BOOLEAN DEFAULT false,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_companies_slug
  ON companies(name_slug, city)
  WHERE is_deleted = false;

CREATE INDEX idx_companies_blacklist
  ON companies(is_blacklisted)
  WHERE is_blacklisted = true;

-- Trigram index for fuzzy company name matching
CREATE INDEX idx_companies_name_trgm
  ON companies USING gin(name gin_trgm_ops);

-- ── COMPANY IDENTITIES ────────────────────────────────────
-- Handles same company appearing with different names across sources
CREATE TABLE IF NOT EXISTS company_identities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id),
  raw_name         TEXT NOT NULL,     -- as scraped from source
  normalized_name  TEXT NOT NULL,     -- lowercased, no accents
  domain           TEXT,              -- nordik.com
  city             TEXT,
  province         TEXT,
  source           TEXT,              -- jobbank/indeed/manual
  confidence       FLOAT DEFAULT 1.0, -- 0.0-1.0
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_company_identities_company
  ON company_identities(company_id);

CREATE INDEX idx_company_identities_domain
  ON company_identities(domain)
  WHERE domain IS NOT NULL;

CREATE INDEX idx_company_identities_name_trgm
  ON company_identities USING gin(normalized_name gin_trgm_ops);

-- ── DOCUMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        doc_type NOT NULL,
  language    TEXT NOT NULL,     -- fr / en / ar
  target      TEXT,              -- esthetique / coiffure / combined / mac
  version     TEXT,              -- v1 / v2 / v3
  label       TEXT,              -- human-readable label
  file_url    TEXT,              -- Supabase Storage URL
  file_name   TEXT,
  mime_type   TEXT DEFAULT 'application/pdf',
  is_default  BOOLEAN DEFAULT false,
  notes       TEXT,
  is_deleted  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- One default per type+language+target combination
CREATE UNIQUE INDEX idx_documents_default
  ON documents(type, language, target)
  WHERE is_default = true AND is_deleted = false;

-- ── AI MODEL CONFIG ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_model_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role         ai_role NOT NULL UNIQUE,
  provider     TEXT NOT NULL,    -- openai / anthropic / google
  model        TEXT NOT NULL,    -- gpt-4o-mini / claude-sonnet-4-6
  model_version TEXT,            -- 2024-07-18
  max_tokens   INTEGER DEFAULT 1000,
  temperature  FLOAT DEFAULT 0.3,
  is_active    BOOLEAN DEFAULT true,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── SECRET REFERENCES ─────────────────────────────────────
-- Stores references to secrets only — never actual values
CREATE TABLE IF NOT EXISTS secret_refs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  -- e.g. OPENAI_API_KEY / ANTHROPIC_API_KEY / GMAIL_TOKEN / TELEGRAM_BOT_TOKEN
  provider   TEXT,              -- openai / anthropic / google / telegram
  vault_key  TEXT NOT NULL,    -- Supabase Vault key name
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- CORE DOMAIN TABLES  (added in VS1 to unblock the pipeline)
--
-- WHY THIS EXISTS:
--   The shipped migration set never created jobs / raw_jobs /
--   job_contents / events / event_consumers / logs / job_queue /
--   dead_letter_queue / job_scores / applications, yet 007, 008,
--   009, 011 and 012 all reference them (FKs, ALTERs, views), and
--   the n8n vs1_discovery workflow + validate_db.sh + vs1_gates.sh
--   read/write them. Migration 005's comment even names the
--   intended-but-missing files (006_discovery → raw_jobs,
--   007_normalization → jobs/job_contents, 008_scoring → job_scores).
--   Runtime evidence: a fresh `make migrate` died at 004, then
--   would have died at 007 (ALTER TABLE events / REFERENCES jobs).
--
--   Columns are derived from the authoritative contracts:
--   schemas/models/canonical-job.v1.json, the INSERT field lists in
--   n8n/workflows/vs1_discovery.json, and the column references in
--   migrations 007-012 (metrics views).
-- ══════════════════════════════════════════════════════════

-- ── EVENTS (base table; 007 adds idempotency columns) ─────
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT REFERENCES event_types(code),
  payload      JSONB NOT NULL DEFAULT '{}',
  job_id       UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── EVENT CONSUMERS (idempotency ledger) ──────────────────
CREATE TABLE IF NOT EXISTS event_consumers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL,
  consumer     TEXT NOT NULL,
  status       queue_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_consumers_event ON event_consumers(event_id);

-- ── LOGS (008 adds trace_id / span_id) ────────────────────
CREATE TABLE IF NOT EXISTS logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level      log_level NOT NULL DEFAULT 'info',
  service    TEXT,
  job_id     UUID,
  message    TEXT,
  payload    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level, created_at DESC);

-- ── JOBS (the canonical job record — VS1 star table) ──────
CREATE TABLE IF NOT EXISTS jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id       TEXT NOT NULL UNIQUE,            -- e.g. JOBBANK_4287165
  source            TEXT NOT NULL,                   -- jobbank / website / jooble...
  content_hash      UUID,                            -- dedup key (UUID v5)
  title             TEXT,
  company_raw       TEXT,
  company_id        UUID REFERENCES companies(id),   -- filled by Normalizer (VS2)
  company_domain    TEXT,
  location_raw      TEXT,
  city              TEXT,                            -- filled by Normalizer (VS2)
  province          TEXT,                            -- filled by Normalizer (VS2)
  country           TEXT DEFAULT 'CA',
  salary_raw        TEXT,
  salary_min        INTEGER,                         -- filled by Normalizer (VS2)
  salary_max        INTEGER,
  salary_currency   TEXT DEFAULT 'CAD',
  contract_type     contract_type,
  language_req      language_req,
  apply_url         TEXT,
  source_url        TEXT,
  posted_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  scraped_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  pipeline_status   job_pipeline_status NOT NULL DEFAULT 'raw',
  is_duplicate      BOOLEAN NOT NULL DEFAULT false,
  duplicate_of      UUID REFERENCES jobs(id),
  is_deleted        BOOLEAN NOT NULL DEFAULT false,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON jobs(content_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_pipeline      ON jobs(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at    ON jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source        ON jobs(source);

-- ── RAW JOBS (staging: exact connector payload) ───────────
CREATE TABLE IF NOT EXISTS raw_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector         TEXT NOT NULL,
  external_ref      TEXT,
  raw_payload       JSONB NOT NULL DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending',
  job_id            UUID REFERENCES jobs(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_status ON raw_jobs(processing_status);

-- ── JOB CONTENTS (heavy text kept out of jobs) ────────────
CREATE TABLE IF NOT EXISTS job_contents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(id),
  raw_text         TEXT,
  raw_html         TEXT,
  parser_version   TEXT,
  content_version  INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_contents_job ON job_contents(job_id);

-- ── JOB SCORES (VS3/VS5 fill this; 011 adds split columns) ─
CREATE TABLE IF NOT EXISTS job_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID NOT NULL REFERENCES jobs(id),
  passed_rules   BOOLEAN,
  failed_rules   TEXT[] DEFAULT ARRAY[]::TEXT[],
  lmia_required  lmia_status,
  priority       job_priority,
  scored_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_scores_job ON job_scores(job_id);

-- ── JOB QUEUE (generic work queue) ────────────────────────
CREATE TABLE IF NOT EXISTS job_queue (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID REFERENCES jobs(id),
  task       TEXT,
  status     queue_status NOT NULL DEFAULT 'pending',
  attempts   SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── DEAD LETTER QUEUE (unrecoverable events) ──────────────
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID,
  event_type  TEXT,
  payload     JSONB DEFAULT '{}',
  error       TEXT,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── APPLICATIONS (VS8 fills this) ─────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID REFERENCES jobs(id),
  company_id        UUID REFERENCES companies(id),
  status            app_status NOT NULL DEFAULT 'draft',
  channel           application_channel,
  gmail_message_id  TEXT,
  gmail_thread_id   TEXT,
  sent_at           TIMESTAMPTZ,
  is_deleted        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

INSERT INTO schema_migrations (version, name)
VALUES ('004', 'core')
ON CONFLICT (version) DO NOTHING;
