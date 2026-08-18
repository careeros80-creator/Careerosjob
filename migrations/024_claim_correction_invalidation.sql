-- ══════════════════════════════════════════════════════════
-- 024_claim_correction_invalidation.sql
-- Root-cause correction: remove unsupported candidate claims + enable an
-- invalidation audit trail. Content correction only — approves/sends nothing,
-- deletes nothing.
--
-- 1. Invalidation audit columns on application_packages (represent invalidation
--    safely on the existing table; generated_documents already versions docs so
--    superseded artifacts are preserved).
-- 2. Correct stored LLM prompts (strip C16 / Mobilité francophone / no-LMIA /
--    Francophone-native / visa claims).
-- 3. Correct candidate language facts on pilot_preferences.
--
-- Additive + idempotent.
-- ══════════════════════════════════════════════════════════

ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS invalidated_at          TIMESTAMPTZ;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS invalidation_reason     TEXT;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS source_profile_version  TEXT;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS source_template_version TEXT;
ALTER TABLE application_packages ADD COLUMN IF NOT EXISTS audit_log               JSONB NOT NULL DEFAULT '[]';

-- Correct stored prompt templates: strip any line asserting an unsupported
-- immigration/language claim (newline-sensitive; removes the whole line).
UPDATE prompt_templates
   SET user_prompt = regexp_replace(
         user_prompt,
         '^.*(C16|Mobilit[ée] Francophone|no LMIA|Francophone native|French/Arabic speaker|Visa valide|Always mention Mobilit).*\n?',
         '', 'gn'),
       updated_at = now()
 WHERE user_prompt ~ '(C16|Mobilit[ée] Francophone|no LMIA|Francophone native|Visa valide|Always mention Mobilit)';

-- Correct candidate language facts (were imported from the superseded master CV).
UPDATE pilot_preferences
   SET languages = ARRAY['Arabic — Native', 'English — Good working proficiency', 'French — Beginner']::text[],
       updated_at = now();

INSERT INTO schema_migrations (version, name)
VALUES ('024', 'claim_correction_invalidation')
ON CONFLICT (version) DO NOTHING;
