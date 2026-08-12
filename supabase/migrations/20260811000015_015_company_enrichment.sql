-- ══════════════════════════════════════════════════════════
-- 015_company_enrichment.sql
-- VS2 Module 3 — Employer Enrichment (company intelligence layer).
--
-- Company-level PUBLIC information only. No personal-contact harvesting.
-- Per-field provenance (source / last_updated / confidence) is kept in the
-- `fields` JSONB. All writes are idempotent (UNIQUE(company_id) upserts).
-- Additive + idempotent; does not touch the VS1/M1/M2 schema.
-- ══════════════════════════════════════════════════════════

-- ── COMPANY ENRICHMENT (1 row per company) ────────────────
CREATE TABLE IF NOT EXISTS company_enrichment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL UNIQUE REFERENCES companies(id),
  -- company-level fields (never personal contacts)
  website           TEXT,
  careers_url       TEXT,
  recruitment_email TEXT,          -- role-based only (careers@/jobs@/hr@…)
  business_phone    TEXT,
  address           TEXT,
  city              TEXT,
  province          TEXT,
  postal_code       TEXT,
  country           TEXT DEFAULT 'CA',
  business_category TEXT,
  description       TEXT,
  languages         TEXT[],
  hiring_status     TEXT,          -- hiring / not_hiring / unknown
  -- per-field provenance: { website:{source,last_updated,confidence}, ... }
  fields            JSONB NOT NULL DEFAULT '{}',
  enrichment_status TEXT NOT NULL DEFAULT 'pending', -- pending/enriched/partial/failed
  last_verified_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_enrichment_status ON company_enrichment(enrichment_status);

-- ── ENRICHMENT QUEUE (1 pending entry per company) ────────
CREATE TABLE IF NOT EXISTS enrichment_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL UNIQUE REFERENCES companies(id),
  status          queue_status NOT NULL DEFAULT 'pending', -- pending/processing/done/failed/dead
  attempts        SMALLINT NOT NULL DEFAULT 0,
  max_attempts    SMALLINT NOT NULL DEFAULT 3,
  next_attempt_at TIMESTAMPTZ DEFAULT now(),
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_ready
  ON enrichment_queue(status, next_attempt_at)
  WHERE status IN ('pending', 'failed');

-- ── ENRICHMENT HEALTH (single-row rollup) ─────────────────
CREATE TABLE IF NOT EXISTS enrichment_health (
  id             BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  total_enriched INTEGER NOT NULL DEFAULT 0,
  total_failed   INTEGER NOT NULL DEFAULT 0,
  total_retries  INTEGER NOT NULL DEFAULT 0,
  cache_hits     INTEGER NOT NULL DEFAULT 0,
  cache_misses   INTEGER NOT NULL DEFAULT 0,
  runs           INTEGER NOT NULL DEFAULT 0,
  avg_ms         INTEGER NOT NULL DEFAULT 0,
  last_run_at    TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO enrichment_health (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- ── ENRICHMENT METRICS (view) ─────────────────────────────
CREATE OR REPLACE VIEW enrichment_metrics AS
SELECT
  (SELECT COUNT(*) FROM company_enrichment WHERE enrichment_status = 'enriched') AS enriched,
  (SELECT COUNT(*) FROM company_enrichment WHERE enrichment_status = 'partial')  AS partial,
  (SELECT COUNT(*) FROM company_enrichment WHERE enrichment_status = 'failed')   AS failed,
  (SELECT COUNT(*) FROM enrichment_queue WHERE status = 'pending')    AS queue_pending,
  (SELECT COUNT(*) FROM enrichment_queue WHERE status = 'processing') AS queue_processing,
  (SELECT COUNT(*) FROM enrichment_queue WHERE status = 'done')       AS queue_done,
  (SELECT COUNT(*) FROM enrichment_queue WHERE status = 'failed')     AS queue_failed,
  (SELECT COUNT(*) FROM enrichment_queue WHERE status = 'dead')       AS queue_dead,
  eh.total_enriched, eh.total_failed, eh.total_retries,
  eh.cache_hits, eh.cache_misses, eh.runs, eh.avg_ms, eh.last_run_at
FROM enrichment_health eh;

INSERT INTO schema_migrations (version, name)
VALUES ('015', 'company_enrichment')
ON CONFLICT (version) DO NOTHING;
