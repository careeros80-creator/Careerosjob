-- ══════════════════════════════════════════════════════════
-- 023_pilot_profile_link.sql
-- BUGFIX (pilot onboarding): link the EXISTING seeded pilot_profile to the
-- authenticated user instead of creating a second profile.
--
-- Root cause: the client cannot see an unlinked profile (RLS hides rows where
-- auth_uid IS NULL), so ensureProfile() created a duplicate — orphaning the
-- imported Master CV / cover-letter template / preferences (all FK'd to the
-- seeded profile). The link must be done by a sanctioned privileged path.
--
-- link_pilot_profile() is SECURITY DEFINER (runs as owner, bypassing RLS) but
-- only ever links the CALLING user's own auth.uid(). Idempotent. No schema
-- change, no data migration — it UPDATEs the existing row, so every FK
-- (pilot_documents, pilot_preferences) is preserved.
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.link_pilot_profile()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_uid        uuid := auth.uid();
  v_email      text;
  v_profile_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'link_pilot_profile: not authenticated';
  END IF;

  -- (1) already linked for this user → idempotent no-op (second login changes nothing)
  SELECT id INTO v_profile_id FROM pilot_profile WHERE auth_uid = v_uid LIMIT 1;
  IF v_profile_id IS NOT NULL THEN
    RETURN v_profile_id;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  -- (2) attach to the existing seeded profile (the single unlinked one), preserving all FKs
  UPDATE pilot_profile
     SET auth_uid   = v_uid,
         email      = COALESCE(email, v_email),
         updated_at = now()
   WHERE id = (SELECT id FROM pilot_profile WHERE auth_uid IS NULL ORDER BY created_at LIMIT 1)
  RETURNING id INTO v_profile_id;
  IF v_profile_id IS NOT NULL THEN
    RETURN v_profile_id;
  END IF;

  -- (3) no profile exists at all → create a fresh one for this user
  INSERT INTO pilot_profile (auth_uid, email, display_name)
  VALUES (v_uid, v_email, v_email)
  RETURNING id INTO v_profile_id;
  RETURN v_profile_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.link_pilot_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_pilot_profile() TO authenticated;

INSERT INTO schema_migrations (version, name)
VALUES ('023', 'pilot_profile_link')
ON CONFLICT (version) DO NOTHING;
