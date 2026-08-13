-- ══════════════════════════════════════════════════════════
-- 018_rls_policies.sql   (hardening — audit finding S-1)
-- Enable Row Level Security on every application table and add a
-- least-privilege read policy for the anon dashboard.
--
-- Model:
--   • RLS ON for all public base tables.
--   • anon may SELECT non-deleted `jobs` only (the public job postings the
--     read-only dashboard shows). Everything else has NO anon policy → anon
--     has no access (PostgREST returns 401/empty).
--   • The VS1 metrics VIEWS keep working (owned by postgres → read underlying
--     tables with owner privileges, which bypass RLS).
--   • Our pooler connection is the table owner (postgres) → bypasses RLS, so
--     all server-side runners keep working. service_role also bypasses RLS.
--
-- Portable: the anon policy is only created when the `anon` role exists
-- (Supabase), so this is a safe no-op for the policy on plain PostgreSQL.
-- Additive + idempotent.
-- ══════════════════════════════════════════════════════════

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'DROP POLICY IF EXISTS anon_read_jobs ON public.jobs';
    EXECUTE 'CREATE POLICY anon_read_jobs ON public.jobs FOR SELECT TO anon USING (is_deleted = false)';
  END IF;
END $$;

INSERT INTO schema_migrations (version, name)
VALUES ('018', 'rls_policies')
ON CONFLICT (version) DO NOTHING;
