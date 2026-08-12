-- ══════════════════════════════════════════════════════════
-- 016_application_packages.sql
-- VS2 Module 4 — Personalized Application Generator.
--
-- Stores, per job, a PREPARED application package: a customized CV + cover
-- letter (traceable + versioned + checksummed), an ATS keyword report, and a
-- match explanation. Nothing is ever auto-sent (ADR-006): status starts
-- 'prepared' and only a human moves it to 'approved'/'sent'.
--
-- Additive + idempotent. The user's Master CV is never stored here as mutable
-- data — generated_documents.source_master records which master + checksum a
-- document was derived from.
-- ══════════════════════════════════════════════════════════

-- ── APPLICATION PACKAGES (1 current package per job) ──────
CREATE TABLE IF NOT EXISTS application_packages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL UNIQUE REFERENCES jobs(id),
  company_id        UUID REFERENCES companies(id),
  status            TEXT NOT NULL DEFAULT 'prepared', -- prepared/approved/sent/discarded
  match_score       SMALLINT,
  match_explanation TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_packages_status ON application_packages(status);

-- ── GENERATED DOCUMENTS (versioned, checksummed, traceable) ─
CREATE TABLE IF NOT EXISTS generated_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id     UUID NOT NULL REFERENCES application_packages(id),
  job_id         UUID NOT NULL REFERENCES jobs(id),
  doc_type       TEXT NOT NULL,               -- cv / cover_letter
  version        INTEGER NOT NULL DEFAULT 1,
  content        TEXT NOT NULL,
  checksum       TEXT NOT NULL,               -- sha256(content)
  word_count     INTEGER,
  source_master  TEXT,                        -- master ref @checksum (never mutated)
  model          TEXT,                        -- generator id (e.g. deterministic-template-v1)
  prompt_version TEXT,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, doc_type, checksum)         -- identical content is never re-stored
);
CREATE INDEX IF NOT EXISTS idx_generated_documents_pkg ON generated_documents(package_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_documents_version
  ON generated_documents(job_id, doc_type, version);

-- ── APPLICATION ATS REPORT ────────────────────────────────
CREATE TABLE IF NOT EXISTS application_ats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id        UUID NOT NULL REFERENCES application_packages(id),
  job_id            UUID NOT NULL REFERENCES jobs(id),
  keywords_required TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords_matched  TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords_missing  TEXT[] DEFAULT ARRAY[]::TEXT[],
  coverage_pct      NUMERIC(5,1),
  readability       NUMERIC(5,1),
  length_words      INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_ats_job ON application_ats(job_id);

-- ── METRICS VIEW ──────────────────────────────────────────
CREATE OR REPLACE VIEW application_metrics AS
SELECT
  (SELECT COUNT(*) FROM application_packages)                        AS packages,
  (SELECT COUNT(*) FROM application_packages WHERE status='prepared')AS prepared,
  (SELECT COUNT(*) FROM application_packages WHERE status='approved')AS approved,
  (SELECT COUNT(*) FROM application_packages WHERE status='sent')    AS sent,
  (SELECT COUNT(*) FROM generated_documents WHERE doc_type='cv')     AS cvs,
  (SELECT COUNT(*) FROM generated_documents WHERE doc_type='cover_letter') AS cover_letters,
  (SELECT ROUND(AVG(coverage_pct),1) FROM application_ats)          AS avg_ats_coverage,
  (SELECT ROUND(AVG(match_score),1) FROM application_packages)      AS avg_match_score;

INSERT INTO schema_migrations (version, name)
VALUES ('016', 'application_packages')
ON CONFLICT (version) DO NOTHING;
