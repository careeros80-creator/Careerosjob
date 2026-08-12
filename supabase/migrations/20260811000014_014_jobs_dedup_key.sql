-- ══════════════════════════════════════════════════════════
-- 014_jobs_dedup_key.sql
-- VS2 (Normalization): cross-provider dedup key on jobs.
--
-- VS1 dedups exact re-fetches via content_hash. VS2 must also detect the
-- SAME posting arriving from DIFFERENT sources (different content_hash /
-- external_id but same normalized title|company|city). The Normalizer
-- computes a source-agnostic dedup_key and stores it here.
--
-- Additive + idempotent. Does not touch the VS1 baseline schema.
-- ══════════════════════════════════════════════════════════

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dedup_key TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_dedup_key ON jobs(dedup_key)
  WHERE dedup_key IS NOT NULL;

INSERT INTO schema_migrations (version, name)
VALUES ('014', 'jobs_dedup_key')
ON CONFLICT (version) DO NOTHING;
