-- 025_metrics_scope.sql
-- P0 remediation (NON-DESTRUCTIVE): scope production-facing metric views through
-- jobs where data_source='production' AND is_deleted=false, so test/synthetic
-- rows can never inflate production application/email counts.
--
-- View DDL only. No INSERT/UPDATE/DELETE against jobs, application_packages,
-- applications, emails, generated_documents, or production_actions.
-- Guarded by in-transaction row-count assertions that ROLL BACK on any mismatch.
-- Ref: INCIDENT_P0_APPLICATION_COUNT.md (root cause: test-fixture leakage into
-- the live DB; canonical pilot_production_metrics already scoped and correct).

BEGIN;

-- ── application_metrics: scope ALL application/document counts to production ──
CREATE OR REPLACE VIEW application_metrics AS
WITH pj AS (
  SELECT id FROM jobs WHERE data_source = 'production' AND is_deleted = false
)
SELECT
  (SELECT count(*) FROM application_packages p JOIN pj ON pj.id = p.job_id)                                 AS packages,
  (SELECT count(*) FROM application_packages p JOIN pj ON pj.id = p.job_id WHERE p.status = 'prepared')     AS prepared,
  (SELECT count(*) FROM application_packages p JOIN pj ON pj.id = p.job_id WHERE p.status = 'approved')     AS approved,
  (SELECT count(*) FROM application_packages p JOIN pj ON pj.id = p.job_id WHERE p.status = 'sent')         AS sent,
  (SELECT count(*) FROM generated_documents d JOIN pj ON pj.id = d.job_id WHERE d.doc_type = 'cv')          AS cvs,
  (SELECT count(*) FROM generated_documents d JOIN pj ON pj.id = d.job_id WHERE d.doc_type = 'cover_letter') AS cover_letters,
  (SELECT round(avg(a.coverage_pct), 1) FROM application_ats a JOIN pj ON pj.id = a.job_id)                 AS avg_ats_coverage,
  (SELECT round(avg(p.match_score), 1) FROM application_packages p JOIN pj ON pj.id = p.job_id)             AS avg_match_score;

-- ── email_dashboard: scope emails + waiting-applications to production ──
CREATE OR REPLACE VIEW email_dashboard AS
SELECT
  count(*)                                                                            AS total_emails,
  count(*) FILTER (WHERE requires_action)                                             AS unread_actions,
  count(*) FILTER (WHERE classification = 'interview'::email_classification)          AS interviews,
  count(*) FILTER (WHERE classification = 'offer'::email_classification)              AS offers,
  count(*) FILTER (WHERE classification = 'rejection'::email_classification)          AS rejected,
  count(*) FILTER (WHERE classification = 'question'::email_classification)           AS info_requests,
  count(*) FILTER (WHERE classification = 'auto_reply'::email_classification)         AS auto_replies,
  count(*) FILTER (WHERE classification = 'ignore'::email_classification)             AS unknown,
  (SELECT count(*)
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
    WHERE a.status = ANY (ARRAY['sent'::app_status, 'opened'::app_status, 'replied'::app_status])
      AND a.is_deleted = false
      AND j.data_source = 'production' AND j.is_deleted = false)                       AS waiting
FROM emails e
WHERE e.data_source = 'production';

-- ── system_health: scope job/application counts to production (infra plumbing counts unchanged) ──
CREATE OR REPLACE VIEW system_health AS
SELECT
  (SELECT count(*) FROM jobs WHERE is_deleted = false AND data_source = 'production')                                                       AS total_jobs,
  (SELECT count(*) FROM jobs WHERE scraped_at > (now() - '24:00:00'::interval) AND is_deleted = false AND data_source = 'production')       AS jobs_24h,
  (SELECT count(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.is_deleted = false AND j.data_source = 'production')          AS total_applications,
  (SELECT count(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.status = 'interview'::app_status AND j.data_source = 'production') AS interviews,
  (SELECT count(*) FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.status = 'offer'::app_status AND j.data_source = 'production')     AS offers,
  (SELECT count(*) FROM outbox WHERE status = 'pending'::queue_status)                                                                      AS outbox_pending,
  (SELECT count(*) FROM dead_letter_queue WHERE resolved = false)                                                                           AS dead_letters,
  (SELECT round(sum(ai_calls.estimated_cost)::numeric, 2) FROM ai_calls WHERE ai_calls.created_at > (now() - '30 days'::interval))          AS ai_cost_30d_usd,
  (SELECT count(*) FROM connector_health WHERE status = 'healthy'::text)                                                                    AS connectors_healthy,
  (SELECT count(*) FROM connector_health WHERE status = 'down'::text)                                                                       AS connectors_down,
  now() AS checked_at;

-- ── GUARD: assert production truth and that fixed views exclude test rows; ROLLBACK on mismatch ──
DO $guard$
DECLARE
  v_pkg int; v_prep int; v_appr int; v_sent int; v_rej int;
  m_pkg int; m_prep int; m_appr int; m_sent int;
BEGIN
  SELECT count(*),
         count(*) FILTER (WHERE p.status='prepared'),
         count(*) FILTER (WHERE p.status='approved'),
         count(*) FILTER (WHERE p.status='sent'),
         count(*) FILTER (WHERE p.status='rejected')
    INTO v_pkg, v_prep, v_appr, v_sent, v_rej
  FROM application_packages p JOIN jobs j ON j.id = p.job_id
  WHERE j.data_source='production' AND j.is_deleted=false;

  IF v_pkg <> 62 THEN RAISE EXCEPTION 'ABORT: production packages=% (expected 62)', v_pkg; END IF;
  IF v_prep <> 56 OR v_appr <> 0 OR v_sent <> 0 OR v_rej <> 6 THEN
    RAISE EXCEPTION 'ABORT: production statuses %/%/%/% (expected 56/0/0/6)', v_prep, v_appr, v_sent, v_rej;
  END IF;

  SELECT packages, prepared, approved, sent INTO m_pkg, m_prep, m_appr, m_sent FROM application_metrics;
  IF m_pkg <> 62 OR m_prep <> 56 OR m_appr <> 0 OR m_sent <> 0 THEN
    RAISE EXCEPTION 'ABORT: application_metrics view=%/%/%/% (expected 62/56/0/0)', m_pkg, m_prep, m_appr, m_sent;
  END IF;

  -- the sent TEST fixture must never count as a production sent
  IF (SELECT sent FROM application_metrics) <> 0 THEN
    RAISE EXCEPTION 'ABORT: test sent fixture leaked into production sent count';
  END IF;
  -- email_dashboard must not count the 6 test-fixture emails
  IF (SELECT total_emails FROM email_dashboard) <> 0 THEN
    RAISE EXCEPTION 'ABORT: test emails leaked into email_dashboard (expected 0 production emails)';
  END IF;

  RAISE NOTICE 'GUARD OK: production baseline 62 (56 prepared / 0 approved / 0 sent / 6 rejected); views exclude test rows.';
END
$guard$;

-- migration ledger (schema_migrations is the migration registry, not application data)
INSERT INTO schema_migrations (version, name)
VALUES ('025', 'metrics_scope')
ON CONFLICT (version) DO NOTHING;

COMMIT;
