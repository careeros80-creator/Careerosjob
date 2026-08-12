-- ══════════════════════════════════════════════════════════
-- 001_extensions.sql
-- Purpose: Enable required PostgreSQL extensions
-- Safe to re-run: YES
-- ══════════════════════════════════════════════════════════

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions (for content_hash)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigram index for fuzzy text search (company names)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify extensions loaded
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'Extension uuid-ossp failed to load';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'Extension pgcrypto failed to load';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    RAISE EXCEPTION 'Extension pg_trgm failed to load';
  END IF;
END $$;

INSERT INTO schema_migrations (version, name)
VALUES ('001', 'extensions')
ON CONFLICT (version) DO NOTHING;
