-- ══════════════════════════════════════════════════════════
-- 019_stage_feature_flags.sql   (hardening — audit finding F-1)
-- Add feature flags so the post-discovery pipeline stages can each be disabled
-- without code changes (parity with the connector flags). These are core
-- stages, so they default to ENABLED (unlike the opt-in connector flags).
-- Additive + idempotent.
-- ══════════════════════════════════════════════════════════

INSERT INTO feature_flags (name, description, is_enabled) VALUES
('normalization_enabled',      'Normalize raw jobs (province/city/salary + dedup)', true),
('enrichment_enabled',         'Enrich companies from public sources',              true),
('generator_enabled',          'Generate tailored application packages',            true),
('email_intelligence_enabled', 'Classify + link inbound recruitment email',         true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO schema_migrations (version, name)
VALUES ('019', 'stage_feature_flags')
ON CONFLICT (version) DO NOTHING;
