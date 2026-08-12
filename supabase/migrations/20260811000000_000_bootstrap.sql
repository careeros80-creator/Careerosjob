-- ══════════════════════════════════════════════════════════
-- 000_bootstrap.sql
-- Purpose: Verify environment prerequisites
-- Safe to re-run: YES (all statements are idempotent)
-- ══════════════════════════════════════════════════════════

-- Verify PostgreSQL version (minimum 15)
DO $$
BEGIN
  IF current_setting('server_version_num')::integer < 150000 THEN
    RAISE EXCEPTION 'career-os requires PostgreSQL 15+. Current: %',
      current_setting('server_version');
  END IF;
END $$;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Set default search path.
-- FIX (Supabase-safe): keep `extensions` (and "$user") on the path — Supabase
-- installs pgcrypto/etc. into the `extensions` schema and its managed schemas
-- (auth/storage) resolve those functions via the path. Forcing `TO public`
-- alone would strip `extensions` database-wide. Missing schemas are ignored on
-- plain PostgreSQL, so this stays correct locally too.
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;

-- Migration tracking table (idempotent)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  TIMESTAMPTZ DEFAULT now(),
  checksum    TEXT,
  applied_by  TEXT DEFAULT current_user
);

-- Verify we can write to schema_migrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_migrations'
  ) THEN
    RAISE EXCEPTION 'schema_migrations table creation failed';
  END IF;
END $$;

-- Record this migration
INSERT INTO schema_migrations (version, name)
VALUES ('000', 'bootstrap')
ON CONFLICT (version) DO NOTHING;
