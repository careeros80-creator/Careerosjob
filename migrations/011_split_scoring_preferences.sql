-- ══════════════════════════════════════════════════════════
-- 011_split_scoring_preferences.sql
-- Purpose: Split scoring into Objective + Preference layers
--          + user_preferences table + ranking_results
--
-- WHY:
--   Single score mixes objective facts with personal taste.
--   Changing preferences → costly AI re-run.
--
-- WITH SPLIT:
--   objective_score  = AI computed once, never changes
--   preference_score = Rules computed, re-runs on pref change
--   combined_score   = weighted(objective, preference)
-- ══════════════════════════════════════════════════════════

-- ── USER PREFERENCES ──────────────────────────────────────
-- Read-only by Ranking Engine. Written by user via Dashboard.
CREATE TABLE IF NOT EXISTS user_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Geography
  preferred_provinces TEXT[] DEFAULT ARRAY['ON','NB','BC','AB','MB','NS'],
  excluded_provinces  TEXT[] DEFAULT ARRAY['QC'],
  preferred_cities    TEXT[] DEFAULT ARRAY[]::TEXT[],
  excluded_cities     TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Salary
  min_salary_hourly   INTEGER DEFAULT 30,
  target_salary_hourly INTEGER DEFAULT 35,
  -- Language
  preferred_languages TEXT[] DEFAULT ARRAY['fr','bilingual'],
  -- Contract
  preferred_contracts TEXT[] DEFAULT ARRAY['full_time'],
  excluded_contracts  TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Visa
  visa_strategy       TEXT DEFAULT 'c16_only',
  -- c16_only / c16_preferred / any
  -- Scoring weights (must sum to 1.0)
  weight_objective    FLOAT DEFAULT 0.6,
  -- 60% objective AI match
  weight_preference   FLOAT DEFAULT 0.4,
  -- 40% personal preference
  -- Notification threshold
  notify_threshold    INTEGER DEFAULT 70,
  -- combined_score >= this → Telegram
  -- Meta
  updated_at          TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT weights_sum_to_one CHECK (
    ABS(weight_objective + weight_preference - 1.0) < 0.001
  )
);

-- Single row per system (for now — multi-user: add user_id)
INSERT INTO user_preferences DEFAULT VALUES;

-- ── SPLIT JOB SCORES ──────────────────────────────────────
-- Replace single score with two independent scores
-- Migrate existing job_scores if table exists

-- First create the new columns if job_scores exists
DO $$
BEGIN
  -- Add objective score columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_scores') THEN
    ALTER TABLE job_scores
      ADD COLUMN IF NOT EXISTS objective_score    SMALLINT,
      ADD COLUMN IF NOT EXISTS preference_score   SMALLINT,
      ADD COLUMN IF NOT EXISTS combined_score     SMALLINT,
      -- Objective breakdown (AI-computed, stable)
      ADD COLUMN IF NOT EXISTS obj_skill_match    SMALLINT DEFAULT 0,  -- /30
      ADD COLUMN IF NOT EXISTS obj_experience     SMALLINT DEFAULT 0,  -- /20
      ADD COLUMN IF NOT EXISTS obj_language       SMALLINT DEFAULT 0,  -- /20
      ADD COLUMN IF NOT EXISTS obj_visa           SMALLINT DEFAULT 0,  -- /20
      ADD COLUMN IF NOT EXISTS obj_recency        SMALLINT DEFAULT 0,  -- /10
      -- Preference breakdown (rules-computed, volatile)
      ADD COLUMN IF NOT EXISTS pref_province      SMALLINT DEFAULT 0,  -- /30
      ADD COLUMN IF NOT EXISTS pref_salary        SMALLINT DEFAULT 0,  -- /40
      ADD COLUMN IF NOT EXISTS pref_contract      SMALLINT DEFAULT 0,  -- /20
      ADD COLUMN IF NOT EXISTS pref_language      SMALLINT DEFAULT 0,  -- /10
      -- Timestamps
      ADD COLUMN IF NOT EXISTS objective_scored_at  TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS preference_scored_at TIMESTAMPTZ;
  END IF;
END $$;

-- ── RANKING RESULTS ───────────────────────────────────────
-- Stores the result of the Ranking Engine for each run
-- Pure math: no AI, no external calls
CREATE TABLE IF NOT EXISTS ranking_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL REFERENCES jobs(id),
  -- Scores at time of ranking
  objective_score   SMALLINT NOT NULL,
  preference_score  SMALLINT NOT NULL,
  combined_score    SMALLINT NOT NULL,
  -- Weights used
  weight_objective  FLOAT NOT NULL,
  weight_preference FLOAT NOT NULL,
  -- Preference snapshot (what preferences were active)
  preferences_snapshot JSONB NOT NULL DEFAULT '{}',
  -- Display data (pre-computed for Telegram card)
  display_data      JSONB NOT NULL DEFAULT '{}',
  -- {objective_label, preference_label, combined_label, breakdown_text}
  -- Notification decision
  should_notify     BOOLEAN NOT NULL,
  notify_reason     TEXT,
  -- Meta
  ranked_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranking_job
  ON ranking_results(job_id, ranked_at DESC);

CREATE INDEX IF NOT EXISTS idx_ranking_combined
  ON ranking_results(combined_score DESC, ranked_at DESC)
  WHERE should_notify = true;

-- ── RANKING ENGINE FUNCTION ────────────────────────────────
-- Pure math. No AI. Call this after AI scoring completes.
CREATE OR REPLACE FUNCTION compute_ranking(p_job_id UUID)
RETURNS ranking_results
LANGUAGE plpgsql
AS $$
DECLARE
  v_scores        job_scores%ROWTYPE;
  v_prefs         user_preferences%ROWTYPE;
  v_combined      SMALLINT;
  v_should_notify BOOLEAN;
  v_result        ranking_results%ROWTYPE;
  v_pref_score    SMALLINT;
BEGIN
  -- Load scores
  SELECT * INTO v_scores FROM job_scores WHERE job_id = p_job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No scores found for job %', p_job_id;
  END IF;

  -- Load preferences
  SELECT * INTO v_prefs FROM user_preferences LIMIT 1;

  -- Compute preference score (pure rules, no AI)
  v_pref_score := 0;

  -- Province match (30pts)
  IF EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = p_job_id
    AND j.province = ANY(v_prefs.preferred_provinces)
    AND j.province != ALL(v_prefs.excluded_provinces)
  ) THEN
    v_pref_score := v_pref_score + 30;
  END IF;

  -- Salary match (40pts)
  IF EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = p_job_id
    AND j.salary_min >= v_prefs.target_salary_hourly
  ) THEN
    v_pref_score := v_pref_score + 40;
  ELSIF EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = p_job_id
    AND j.salary_min >= v_prefs.min_salary_hourly
  ) THEN
    v_pref_score := v_pref_score + 20;
  END IF;

  -- Contract match (20pts)
  IF EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = p_job_id
    AND j.contract_type::TEXT = ANY(v_prefs.preferred_contracts)
  ) THEN
    v_pref_score := v_pref_score + 20;
  END IF;

  -- Language match (10pts)
  IF EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = p_job_id
    AND j.language_req::TEXT = ANY(v_prefs.preferred_languages)
  ) THEN
    v_pref_score := v_pref_score + 10;
  END IF;

  -- Weighted combined score
  v_combined := ROUND(
    COALESCE(v_scores.objective_score, 0) * v_prefs.weight_objective
    + v_pref_score * v_prefs.weight_preference
  );

  v_should_notify := v_combined >= v_prefs.notify_threshold;

  -- Insert ranking result
  INSERT INTO ranking_results (
    job_id,
    objective_score, preference_score, combined_score,
    weight_objective, weight_preference,
    preferences_snapshot, should_notify
  ) VALUES (
    p_job_id,
    COALESCE(v_scores.objective_score, 0),
    v_pref_score,
    v_combined,
    v_prefs.weight_objective, v_prefs.weight_preference,
    to_jsonb(v_prefs),
    v_should_notify
  )
  RETURNING * INTO v_result;

  -- Update job_scores with preference score
  UPDATE job_scores SET
    preference_score   = v_pref_score,
    combined_score     = v_combined,
    preference_scored_at = now()
  WHERE job_id = p_job_id;

  RETURN v_result;
END;
$$;

-- ── RERANK ALL: call when user changes preferences ─────────
CREATE OR REPLACE FUNCTION rerank_all_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
  v_count  INTEGER := 0;
BEGIN
  FOR v_job_id IN
    SELECT j.id FROM jobs j
    JOIN job_scores js ON js.job_id = j.id
    WHERE js.objective_score IS NOT NULL
    AND j.is_deleted = false
    AND j.pipeline_status NOT IN ('ignored', 'invalid', 'duplicate')
  LOOP
    PERFORM compute_ranking(v_job_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── TRIGGER: auto-rerank when preferences change ──────────
CREATE OR REPLACE FUNCTION trigger_rerank_on_preference_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the preference change
  INSERT INTO logs (level, service, message, payload)
  VALUES (
    'info', 'ranking_engine',
    'User preferences changed — triggering full rerank',
    jsonb_build_object(
      'old_min_salary', OLD.min_salary_hourly,
      'new_min_salary', NEW.min_salary_hourly,
      'old_provinces', OLD.preferred_provinces,
      'new_provinces', NEW.preferred_provinces
    )
  );

  -- Note: actual rerank runs in n8n workflow triggered by this log
  -- (PostgreSQL functions shouldn't run long operations in triggers)
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_changed
AFTER UPDATE ON user_preferences
FOR EACH ROW
WHEN (
  OLD.preferred_provinces IS DISTINCT FROM NEW.preferred_provinces
  OR OLD.min_salary_hourly IS DISTINCT FROM NEW.min_salary_hourly
  OR OLD.target_salary_hourly IS DISTINCT FROM NEW.target_salary_hourly
  OR OLD.preferred_contracts IS DISTINCT FROM NEW.preferred_contracts
  OR OLD.weight_objective IS DISTINCT FROM NEW.weight_objective
  OR OLD.weight_preference IS DISTINCT FROM NEW.weight_preference
  OR OLD.notify_threshold IS DISTINCT FROM NEW.notify_threshold
)
EXECUTE FUNCTION trigger_rerank_on_preference_change();

INSERT INTO schema_migrations (version, name)
VALUES ('011', 'split_scoring_preferences')
ON CONFLICT (version) DO NOTHING;
