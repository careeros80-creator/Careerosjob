-- ══════════════════════════════════════════════════════════
-- 005_indexes.sql
-- Purpose: Additional indexes not defined inline in 004_core
-- Note: Context-specific indexes go in their own migrations
-- ══════════════════════════════════════════════════════════

-- No additional indexes needed at core level.
-- All core indexes are defined inline in 004_core.sql.
-- Context-specific indexes:
--   006_discovery.sql     → raw_jobs indexes
--   007_normalization.sql → jobs, job_contents indexes
--   008_scoring.sql       → job_scores, rules indexes
-- etc.

INSERT INTO schema_migrations (version, name)
VALUES ('005', 'indexes')
ON CONFLICT (version) DO NOTHING;
