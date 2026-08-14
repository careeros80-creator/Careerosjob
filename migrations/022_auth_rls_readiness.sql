-- ══════════════════════════════════════════════════════════
-- 022_auth_rls_readiness.sql
-- pilot/production-validation — Supabase Auth infrastructure (no business logic).
--
-- 1. RLS policies so an AUTHENTICATED pilot user can manage ONLY their own
--    rows (auth.uid() = pilot_profile.auth_uid). anon still has no access.
-- 2. pilot_readiness view — anon-safe aggregate booleans + gmail status for the
--    Production Readiness page (no PII, no row data).
--
-- Additive + idempotent (policies dropped-then-created; view CREATE OR REPLACE).
-- ══════════════════════════════════════════════════════════

-- ── grants: authenticated may touch its own pilot rows (RLS gates which) ──
GRANT SELECT, INSERT, UPDATE ON pilot_profile     TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pilot_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pilot_documents   TO authenticated;
GRANT SELECT, INSERT, UPDATE ON gmail_connections TO authenticated;

-- ── pilot_profile: own row keyed by auth.uid() ──
DROP POLICY IF EXISTS auth_select_own_profile ON pilot_profile;
CREATE POLICY auth_select_own_profile ON pilot_profile
  FOR SELECT TO authenticated USING (auth_uid = auth.uid());
DROP POLICY IF EXISTS auth_insert_own_profile ON pilot_profile;
CREATE POLICY auth_insert_own_profile ON pilot_profile
  FOR INSERT TO authenticated WITH CHECK (auth_uid = auth.uid());
DROP POLICY IF EXISTS auth_update_own_profile ON pilot_profile;
CREATE POLICY auth_update_own_profile ON pilot_profile
  FOR UPDATE TO authenticated USING (auth_uid = auth.uid()) WITH CHECK (auth_uid = auth.uid());

-- ── child tables: scoped through the owning profile ──
DO $mig$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pilot_preferences','pilot_documents','gmail_connections'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS auth_select_own ON %I', t);
    EXECUTE format($p$CREATE POLICY auth_select_own ON %I FOR SELECT TO authenticated
      USING (pilot_id IN (SELECT id FROM pilot_profile WHERE auth_uid = auth.uid()))$p$, t);
    EXECUTE format('DROP POLICY IF EXISTS auth_insert_own ON %I', t);
    EXECUTE format($p$CREATE POLICY auth_insert_own ON %I FOR INSERT TO authenticated
      WITH CHECK (pilot_id IN (SELECT id FROM pilot_profile WHERE auth_uid = auth.uid()))$p$, t);
    EXECUTE format('DROP POLICY IF EXISTS auth_update_own ON %I', t);
    EXECUTE format($p$CREATE POLICY auth_update_own ON %I FOR UPDATE TO authenticated
      USING (pilot_id IN (SELECT id FROM pilot_profile WHERE auth_uid = auth.uid()))
      WITH CHECK (pilot_id IN (SELECT id FROM pilot_profile WHERE auth_uid = auth.uid()))$p$, t);
  END LOOP;
END
$mig$;

-- ── Production Readiness view (anon-safe: booleans + gmail status only) ──
CREATE OR REPLACE VIEW pilot_readiness AS
SELECT
  true                                                                                         AS db_ready,
  EXISTS (SELECT 1 FROM jobs WHERE data_source='production' AND is_deleted=false)              AS discovery_ready,
  EXISTS (SELECT 1 FROM jobs WHERE data_source='production' AND pipeline_status<>'raw')        AS normalization_ready,
  EXISTS (SELECT 1 FROM application_packages p JOIN jobs j ON j.id=p.job_id
            WHERE j.data_source='production')                                                  AS generation_ready,
  EXISTS (SELECT 1 FROM emails WHERE data_source='production')                                 AS email_production_ready,
  EXISTS (SELECT 1 FROM production_actions)                                                    AS observability_ready,
  COALESCE((SELECT status FROM gmail_connections ORDER BY updated_at DESC LIMIT 1), 'pending') AS gmail_status;

GRANT SELECT ON pilot_readiness TO anon, authenticated;

INSERT INTO schema_migrations (version, name)
VALUES ('022', 'auth_rls_readiness')
ON CONFLICT (version) DO NOTHING;
