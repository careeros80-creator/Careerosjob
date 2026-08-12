-- ══════════════════════════════════════════════════════════
-- 006_seed.sql
-- Purpose: Default data for rules, AI config, secret refs
-- Safe to re-run: YES (ON CONFLICT DO NOTHING)
-- ══════════════════════════════════════════════════════════

-- ── AI Model Config ───────────────────────────────────────
INSERT INTO ai_model_config (role, provider, model, model_version, max_tokens, temperature) VALUES
('extractor',  'openai',    'gpt-4o-mini',      '2024-07-18', 500,  0.1),
('scorer',     'openai',    'gpt-4o-mini',      '2024-07-18', 300,  0.1),
('classifier', 'openai',    'gpt-4o-mini',      '2024-07-18', 200,  0.1),
('writer',     'anthropic', 'claude-sonnet-4-6', null,         2000, 0.7)
ON CONFLICT (role) DO NOTHING;

-- ── Secret References ─────────────────────────────────────
INSERT INTO secret_refs (name, provider, vault_key) VALUES
('OPENAI_API_KEY',      'openai',    'career_os_openai_key'),
('ANTHROPIC_API_KEY',   'anthropic', 'career_os_anthropic_key'),
('GMAIL_TOKEN',         'google',    'career_os_gmail_token'),
('TELEGRAM_BOT_TOKEN',  'telegram',  'career_os_telegram_token'),
('SUPABASE_SERVICE_KEY','supabase',  'career_os_supabase_service_key')
ON CONFLICT (name) DO NOTHING;

-- ── Default Documents (Samira's CVs) ─────────────────────
-- File URLs will be updated after Supabase Storage upload
INSERT INTO documents (type, language, target, version, label, is_default) VALUES
('cv',           'fr', 'esthetique', 'v3', 'CV Esthétique FR v3',     true),
('cv',           'en', 'combined',   'v1', 'CV Combined EN v1',        true),
('cv',           'fr', 'combined',   'v3', 'CV Coiffure+Esthétique FR v3', false),
('cover_letter', 'fr', 'general',    'v1', 'Lettre Motivation FR v1',  true),
('cover_letter', 'fr', 'mobilite',   'v1', 'Lettre Mobilité Francophone FR v1', false),
('cover_letter', 'en', 'general',    'v1', 'Cover Letter EN v1',       false),
('cover_letter', 'fr', 'mac',        'v1', 'Lettre MAC Estée Lauder FR v1', false)
ON CONFLICT DO NOTHING;

INSERT INTO schema_migrations (version, name)
VALUES ('006', 'seed')
ON CONFLICT (version) DO NOTHING;
