-- ══════════════════════════════════════════════════════════
-- 009_feature_flags_prompts.sql
-- Purpose: Feature flags + Prompt Registry + AI calls table
--
-- WHY FEATURE FLAGS:
--   Enable/disable features without deployment.
--   Roll out incrementally. Debug in production.
--   "ai_scoring_enabled = false" → rule-only scoring.
--
-- WHY PROMPT REGISTRY:
--   Prompts are code. They need versioning.
--   Without it: can't reproduce a result from 3 weeks ago.
--   With it: "this letter used scorer-v1.2 + writer-v2.0"
-- ══════════════════════════════════════════════════════════

-- ── FEATURE FLAGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  -- snake_case: ai_scoring_enabled
  description    TEXT,
  is_enabled     BOOLEAN NOT NULL DEFAULT false,
  -- Gradual rollout (0.0 = 0%, 1.0 = 100%)
  rollout_pct    FLOAT NOT NULL DEFAULT 1.0
                 CHECK (rollout_pct BETWEEN 0.0 AND 1.0),
  -- Optional: auto-disable after date
  expires_at     TIMESTAMPTZ,
  -- Metadata
  changed_by     actor_type DEFAULT 'manual',
  changed_reason TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default feature flags (all disabled → enable progressively)
INSERT INTO feature_flags (name, description, is_enabled) VALUES
('jobbank_connector_enabled',     'Fetch jobs from Job Bank Canada',          false),
('direct_connector_enabled',      'Scrape salon websites directly',           false),
('jooble_connector_enabled',      'Fetch jobs from Jooble (Phase 2)',         false),
('linkedin_connector_enabled',    'Fetch jobs from LinkedIn (Phase 3)',       false),
('indeed_connector_enabled',      'Fetch jobs from Indeed (Phase 3)',         false),
('rule_engine_enabled',           'Apply hard/soft rules before AI scoring',  false),
('ai_scoring_enabled',            'Use AI to score and analyze jobs',         false),
('ai_writing_enabled',            'Use Claude to generate cover letters',     false),
('email_classifier_enabled',      'Classify incoming email replies with AI',  false),
('telegram_notifications_enabled','Send job alerts to Telegram',              false),
('company_matching_enabled',      'Match same company across sources',        false),
('followup_scheduler_enabled',    'Auto-schedule follow-up reminders',        false),
('ats_analysis_enabled',          'Analyze CV-job ATS compatibility',         false)
ON CONFLICT (name) DO NOTHING;

-- ── FEATURE FLAG HISTORY ──────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flag_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id     UUID NOT NULL REFERENCES feature_flags(id),
  old_value   BOOLEAN,
  new_value   BOOLEAN NOT NULL,
  changed_by  actor_type DEFAULT 'manual',
  reason      TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── HELPER: Check Feature Flag ────────────────────────────
CREATE OR REPLACE FUNCTION is_enabled(p_flag_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
BEGIN
  SELECT * INTO v_flag
  FROM feature_flags
  WHERE name = p_flag_name;

  IF NOT FOUND THEN
    RETURN false; -- unknown flag = disabled
  END IF;

  IF v_flag.expires_at IS NOT NULL AND v_flag.expires_at < now() THEN
    RETURN false; -- expired
  END IF;

  RETURN v_flag.is_enabled;
END;
$$;

-- ── PROMPT REGISTRY ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  -- e.g. "scorer", "writer_cover_letter_fr", "classifier_email"
  version        TEXT NOT NULL,
  -- semver: "1.0.0", "1.2.3"
  ai_role        ai_role NOT NULL,
  language       TEXT DEFAULT 'fr',
  -- Template text with {{variables}} placeholders
  system_prompt  TEXT,
  user_prompt    TEXT NOT NULL,
  -- Variables this prompt expects
  variables      JSONB NOT NULL DEFAULT '[]',
  -- e.g. ["job_title", "company_name", "candidate_name"]
  -- Performance metadata (updated from ai_calls)
  avg_latency_ms INTEGER,
  avg_tokens_out INTEGER,
  avg_cost_usd   FLOAT,
  usage_count    INTEGER DEFAULT 0,
  -- State
  is_active      BOOLEAN NOT NULL DEFAULT false,
  -- Only ONE active version per name+role
  deprecated_at  TIMESTAMPTZ,
  deprecated_by  TEXT,
  -- Authoring
  created_by     actor_type DEFAULT 'manual',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, version)
);

-- Only one active prompt per name+role
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompts_active
  ON prompt_templates(name, ai_role)
  WHERE is_active = true;

-- ── PROMPT CHANGE LOG ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_changes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id       UUID NOT NULL REFERENCES prompt_templates(id),
  old_version     TEXT,
  new_version     TEXT NOT NULL,
  change_summary  TEXT,
  changed_by      actor_type DEFAULT 'manual',
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI CALLS ─────────────────────────────────────────────
-- Full audit of every AI call: input, output, cost, latency
CREATE TABLE IF NOT EXISTS ai_calls (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Which prompt was used
  prompt_id        UUID REFERENCES prompt_templates(id),
  prompt_version   TEXT,
  -- Which model
  role             ai_role NOT NULL,
  provider         TEXT NOT NULL,      -- openai / anthropic
  model            TEXT NOT NULL,
  model_version    TEXT,
  -- Observability
  trace_id         UUID REFERENCES traces(trace_id),
  span_id          UUID REFERENCES spans(span_id),
  -- Related entities
  job_id           UUID REFERENCES jobs(id),
  application_id   UUID,
  -- Performance
  tokens_in        INTEGER,
  tokens_out       INTEGER,
  estimated_cost   FLOAT,              -- USD
  latency_ms       INTEGER,
  -- Input / Output
  rendered_prompt  TEXT,               -- prompt after variable substitution
  response         JSONB,
  -- Validation
  schema_valid     BOOLEAN,            -- response matched JSON Schema?
  validation_errors JSONB,
  -- Status
  status           TEXT DEFAULT 'ok',  -- ok / error / timeout / invalid
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_calls_job
  ON ai_calls(job_id)
  WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_calls_role
  ON ai_calls(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_calls_trace
  ON ai_calls(trace_id)
  WHERE trace_id IS NOT NULL;

-- ── UPDATE PROMPT STATS after each call ──────────────────
CREATE OR REPLACE FUNCTION update_prompt_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prompt_id IS NOT NULL AND NEW.status = 'ok' THEN
    UPDATE prompt_templates SET
      avg_latency_ms = (
        SELECT ROUND(AVG(latency_ms))
        FROM ai_calls
        WHERE prompt_id = NEW.prompt_id AND status = 'ok'
      ),
      avg_tokens_out = (
        SELECT ROUND(AVG(tokens_out))
        FROM ai_calls
        WHERE prompt_id = NEW.prompt_id AND status = 'ok'
      ),
      avg_cost_usd = (
        SELECT AVG(estimated_cost)
        FROM ai_calls
        WHERE prompt_id = NEW.prompt_id AND status = 'ok'
      ),
      usage_count = usage_count + 1,
      updated_at = now()
    WHERE id = NEW.prompt_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_calls_update_prompt_stats
AFTER INSERT ON ai_calls
FOR EACH ROW EXECUTE FUNCTION update_prompt_stats();

-- ── SEED: Initial prompt templates ───────────────────────
INSERT INTO prompt_templates (name, version, ai_role, language, user_prompt, variables, is_active)
VALUES
(
  'extractor',
  '1.0.0',
  'extractor',
  'fr',
  E'Analyze this job posting and extract structured data.\n\nJob text:\n{{raw_text}}\n\nReturn ONLY valid JSON matching the extractor schema. No explanation.',
  '["raw_text"]',
  true
),
(
  'scorer',
  '1.0.0',
  'scorer',
  'fr',
  E'Evaluate this job posting for a candidate with the following profile:\n- 15 years esthetics/hairdressing experience\n- Skills: HydraFacial, Microneedling, Laser Carbone, IPL, Maquillage Permanent, Microblading\n- Eligible: Mobilité Francophone C16 (no LMIA required)\n- French/Arabic speaker\n\nJob text:\n{{raw_text}}\n\nReturn ONLY valid JSON matching the scorer schema.',
  '["raw_text"]',
  true
),
(
  'classifier',
  '1.0.0',
  'classifier',
  'fr',
  E'Classify this email reply from a job application.\n\nSubject: {{subject}}\nFrom: {{from_address}}\nBody:\n{{body_text}}\n\nReturn ONLY valid JSON matching the classifier schema.',
  '["subject", "from_address", "body_text"]',
  true
),
(
  'writer_cover_letter_fr',
  '1.0.0',
  'writer',
  'fr',
  E'Write a professional cover letter in French for the following application.\n\nCandidate: Samira Benaciri\nPosition: {{job_title}}\nCompany: {{company_name}}, {{city}}, Canada\nSalary: {{salary_display}}\n\nKey facts:\n- 15 years experience: HydraFacial, Microneedling, Laser Carbone, IPL, Maquillage Permanent, Microblading, Coiffures événementielles\n- Eligible Mobilité Francophone C16 (no LMIA, cost: 230 CAD, ~10 weeks)\n- Visa valide jusqu\'en 2028, disponible {{availability}}\n- Francophone native (arabe C2)\n\nTone: professional, warm, confident. Max 4 paragraphs.\nAlways mention Mobilité Francophone advantage clearly.\n\nReturn ONLY valid JSON matching the writer schema.',
  '["job_title", "company_name", "city", "salary_display", "availability"]',
  true
)
ON CONFLICT (name, version) DO NOTHING;

INSERT INTO schema_migrations (version, name)
VALUES ('009', 'feature_flags_prompts')
ON CONFLICT (version) DO NOTHING;
