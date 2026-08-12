-- ══════════════════════════════════════════════════════════
-- 003_reference_data.sql
-- Purpose: Reference tables (extensible without migrations)
-- Safe to re-run: YES (INSERT ... ON CONFLICT DO NOTHING)
-- ══════════════════════════════════════════════════════════

-- ── Event Types Reference Table ───────────────────────────
-- Using Reference Table instead of ENUM:
-- New event types = INSERT only, no migration needed
CREATE TABLE IF NOT EXISTS event_types (
  code             TEXT PRIMARY KEY,
  description      TEXT NOT NULL,
  source_context   TEXT NOT NULL,
  target_context   TEXT NOT NULL,
  retry_enabled    BOOLEAN DEFAULT true,
  dead_letter      BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

INSERT INTO event_types (code, description, source_context, target_context, retry_enabled, dead_letter) VALUES
('job.discovered',      'Raw job fetched from connector',           'discovery',          'normalization',      true,  true),
('job.cleaned',         'Job normalized and parsed',                'normalization',       'scoring',            true,  true),
('job.duplicate',       'Job already exists in database',           'normalization',       'logging',            false, false),
('job.invalid',         'Job failed normalization validation',      'normalization',       'logging',            false, false),
('job.rules_failed',    'Job did not pass hard rules',             'scoring',             'logging',            false, false),
('job.scored',          'Job evaluated by Rule Engine + AI',       'scoring',             'notification',       true,  true),
('job.approved',        'User approved job application',           'notification',        'application',        true,  true),
('job.rejected',        'User rejected job',                       'notification',        'logging',            false, false),
('application.drafted', 'Cover letter + email generated',          'application',         'notification',       true,  true),
('application.sent',    'Application email sent via Gmail',        'application',         'email_intelligence', true,  true),
('email.received',      'New email received from Gmail webhook',   'email_intelligence',  'email_intelligence', true,  true),
('email.classified',    'Email classified by AI',                  'email_intelligence',  'notification',       true,  true),
('interview.detected',  'Interview request identified in email',   'email_intelligence',  'notification',       true,  true),
('offer.detected',      'Job offer identified in email',           'email_intelligence',  'notification',       true,  true),
('followup.due',        'Follow-up deadline reached',              'scheduler',           'notification',       true,  true),
('followup.sent',       'Follow-up email sent',                    'application',         'logging',            false, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO schema_migrations (version, name)
VALUES ('003', 'reference_data')
ON CONFLICT (version) DO NOTHING;
