-- ══════════════════════════════════════════════════════════
-- 013_vs1_dashboard_grants.sql
-- Purpose: Expose the VS1 read surface to the Supabase `anon` role so the
--          read-only dashboard (@supabase/supabase-js, anon key, no auth)
--          can SELECT jobs + the VS1 metrics views via PostgREST.
--
-- WHY A NEW MIGRATION (not an edit): additive, and required only because the
--   VS1 dashboard reads through PostgREST as the anon role. Runtime evidence:
--   without these grants, PostgREST returns 401/permission-denied for anon.
--
-- PORTABLE: guarded by a role check so it is a harmless no-op on a plain
--   PostgreSQL (which has no `anon` / `authenticated` roles); on Supabase it
--   grants read access. jobs has no RLS (public job postings, read-only VS1),
--   so a table-level SELECT grant is sufficient.
-- ══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT SELECT ON
      jobs,
      vs1_metrics,
      vs1_connector_metrics,
      vs1_data_quality,
      vs1_acceptance_gates,
      vs1_province_distribution
    TO anon, authenticated;
  END IF;
END $$;

INSERT INTO schema_migrations (version, name)
VALUES ('013', 'vs1_dashboard_grants')
ON CONFLICT (version) DO NOTHING;
