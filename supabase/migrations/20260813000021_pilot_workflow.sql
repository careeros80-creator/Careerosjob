-- ══════════════════════════════════════════════════════════
-- 021_pilot_workflow.sql
-- pilot/production-validation — the pilot workflow data model.
--
-- Adds the single-pilot-user profile, preferences, document imports (Master CV
-- + cover-letter template), Gmail connection STATUS (never tokens), and the
-- human decision audit columns on application_packages.
--
-- ADR-006: approval/send are human decisions. These columns only RECORD the
-- decision + who/when; the state machine (services/pilot/decisions.js) and the
-- guarded UPDATE (scripts/pilot_decide.js) enforce that a package can only be
-- 'sent' after a human 'approved' it. Nothing here sends anything.
--
-- Additive + idempotent.
-- ══════════════════════════════════════════════════════════

-- ── decision audit columns on application_packages ────────
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS approved_at   TIMESTAMPTZ;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS rejected_at   TIMESTAMPTZ;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS sent_at       TIMESTAMPTZ;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS decided_by    TEXT;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS decision_note TEXT;

-- ── pilot profile (one real pilot user for now) ───────────
CREATE TABLE IF NOT EXISTS pilot_profile (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid     UUID,                       -- Supabase Auth user id, once signed in
  email        TEXT UNIQUE,
  display_name TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── preferences ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pilot_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id         UUID NOT NULL UNIQUE REFERENCES pilot_profile(id) ON DELETE CASCADE,
  target_roles     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_locations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  languages        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  min_salary       NUMERIC,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── imported documents: Master CV + cover-letter template ─
-- Never overwritten: each distinct import (by checksum) is kept; the current
-- one is the most recent imported_at. Re-importing identical content is a no-op.
CREATE TABLE IF NOT EXISTS pilot_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id    UUID NOT NULL REFERENCES pilot_profile(id) ON DELETE CASCADE,
  doc_kind    TEXT NOT NULL CHECK (doc_kind IN ('master_cv', 'cover_letter_template')),
  format      TEXT NOT NULL DEFAULT 'json',
  content     TEXT NOT NULL,
  checksum    TEXT NOT NULL,               -- sha256(content)
  version     INTEGER NOT NULL DEFAULT 1,
  source      TEXT NOT NULL DEFAULT 'imported',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pilot_id, doc_kind, checksum)
);
CREATE INDEX IF NOT EXISTS idx_pilot_documents_current ON pilot_documents(pilot_id, doc_kind, imported_at DESC);

-- ── Gmail connection STATUS only (tokens live in env/Vault) ─
CREATE TABLE IF NOT EXISTS gmail_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id     UUID NOT NULL UNIQUE REFERENCES pilot_profile(id) ON DELETE CASCADE,
  email        TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error')),
  scopes       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_error   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS parity (server-only; these hold PII → no anon policy).
ALTER TABLE pilot_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

INSERT INTO schema_migrations (version, name)
VALUES ('021', 'pilot_workflow')
ON CONFLICT (version) DO NOTHING;
