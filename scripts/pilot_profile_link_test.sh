#!/usr/bin/env bash
# scripts/pilot_profile_link_test.sh
#
# Behavioural regression for the profile-link bugfix (migration 023). Each
# scenario builds its OWN fixture (an unlinked seeded profile + a doc + a pref)
# inside a rolled-back transaction, so it is reproducible and never mutates real
# data. Proves: link existing seeded profile, no duplicate, FKs preserved,
# idempotent relogin, fresh user gets a new profile, RLS isolation.
set -u
CO="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${CAREEROS_PSQL_CONTAINER:-careeros_client}"
URL=$(grep '^DATABASE_URL=' "$CO/.env" | sed 's/^DATABASE_URL=//; s/^"//; s/"$//; s/\r$//')
[ -z "$URL" ] && { echo "DATABASE_URL missing"; exit 2; }
W="$CO/.pilot_tmp"; mkdir -p "$W"

FID='aaaaaaaa-0000-4000-8000-000000000001'   # fixture seeded profile
TU1='11111111-1111-4111-8111-111111111111'   # test user 1
TU2='22222222-2222-4222-8222-222222222222'   # test user 2
PARK='00000000-0000-4000-8000-000000000000'  # sentinel to park real unlinked rows

# Setup block: park real unlinked rows, then create the fixture as the ONLY unlinked profile.
read -r -d '' SETUP <<SQL
  UPDATE pilot_profile SET auth_uid='$PARK' WHERE auth_uid IS NULL;
  INSERT INTO pilot_profile (id, auth_uid, display_name) VALUES ('$FID', NULL, 'TEST Seed');
  INSERT INTO pilot_documents (pilot_id, doc_kind, format, content, checksum, source)
    VALUES ('$FID','master_cv','json','{"cv":1}','chk-cv','imported');
  INSERT INTO pilot_preferences (pilot_id) VALUES ('$FID');
SQL

cat > "$W/plt.sql" <<SQL
\pset footer off
-- ===== S1/S2/S3: link existing seeded profile, no duplicate, FKs preserved =====
BEGIN;
$SETUP
  SELECT set_config('t.p0', (SELECT count(*)::text FROM pilot_profile), true);
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"$TU1","role":"authenticated"}';
  SELECT set_config('t.linked', public.link_pilot_profile()::text, true);
  RESET ROLE;
  SELECT 'S1 existing seeded profile linked to user: '||CASE WHEN (SELECT auth_uid FROM pilot_profile WHERE id='$FID')='$TU1'::uuid THEN 'PASS' ELSE 'FAIL' END;
  SELECT 'S1 linked id == seeded id (no new row): '||CASE WHEN current_setting('t.linked')='$FID' THEN 'PASS' ELSE 'FAIL' END;
  SELECT 'S2 no duplicate (profile count unchanged): '||CASE WHEN (SELECT count(*) FROM pilot_profile)::text = current_setting('t.p0') THEN 'PASS' ELSE 'FAIL' END;
  SELECT 'S3 documents still attached: '||CASE WHEN (SELECT count(*) FROM pilot_documents WHERE pilot_id='$FID')=1 THEN 'PASS' ELSE 'FAIL' END;
  SELECT 'S3 preferences still attached: '||CASE WHEN (SELECT count(*) FROM pilot_preferences WHERE pilot_id='$FID')=1 THEN 'PASS' ELSE 'FAIL' END;
ROLLBACK;

-- ===== S4: second login idempotent (same id, still one profile) =====
BEGIN;
$SETUP
  SELECT set_config('t.p0', (SELECT count(*)::text FROM pilot_profile), true);
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"$TU1","role":"authenticated"}';
  SELECT set_config('t.a', public.link_pilot_profile()::text, true);
  SELECT set_config('t.b', public.link_pilot_profile()::text, true);
  RESET ROLE;
  SELECT 'S4 second call returns same profile id: '||CASE WHEN current_setting('t.a')=current_setting('t.b') THEN 'PASS' ELSE 'FAIL' END;
  SELECT 'S4 still one profile after relogin: '||CASE WHEN (SELECT count(*) FROM pilot_profile)::text = current_setting('t.p0') THEN 'PASS' ELSE 'FAIL' END;
ROLLBACK;

-- ===== S5: fresh user with NO seeded profile gets a NEW profile =====
BEGIN;
$SETUP
  UPDATE pilot_profile SET auth_uid='$PARK' WHERE auth_uid IS NULL;   -- consume the fixture too → no unlinked remains
  SELECT set_config('t.p0', (SELECT count(*)::text FROM pilot_profile), true);
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"$TU2","role":"authenticated"}';
  SELECT set_config('t.new', public.link_pilot_profile()::text, true);
  RESET ROLE;
  SELECT 'S5 fresh user got a NEW profile: '||CASE WHEN (SELECT count(*) FROM pilot_profile)::text=(current_setting('t.p0')::int+1)::text AND (SELECT auth_uid FROM pilot_profile WHERE id=current_setting('t.new')::uuid)='$TU2'::uuid THEN 'PASS' ELSE 'FAIL' END;
  SELECT 'S5 fresh profile has no inherited documents: '||CASE WHEN (SELECT count(*) FROM pilot_documents WHERE pilot_id=current_setting('t.new')::uuid)=0 THEN 'PASS' ELSE 'FAIL' END;
ROLLBACK;

-- ===== S6: RLS still isolates users =====
BEGIN;
$SETUP
  UPDATE pilot_profile SET auth_uid='$TU1' WHERE id='$FID';   -- TU1 owns the fixture
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"$TU2","role":"authenticated"}';
  SELECT 'S6 RLS: other user cannot see linked profile: '||CASE WHEN (SELECT count(*) FROM pilot_profile WHERE auth_uid='$TU1'::uuid)=0 THEN 'PASS' ELSE 'FAIL' END;
  RESET ROLE;
ROLLBACK;
SQL

docker cp "$W/plt.sql" "$CONTAINER:/tmp/plt.sql" >/dev/null 2>&1
out=$(docker exec -e PGURL="$URL" "$CONTAINER" sh -c 'psql "$PGURL" -tA -f /tmp/plt.sql' 2>&1)
echo "$out" | grep -E 'S[0-9].*(PASS|FAIL)' | sed 's/^/  /'
fails=$(echo "$out" | grep -c 'FAIL')
echo "────────────────────────────────────────────"
if [ "$fails" -eq 0 ]; then echo "  PROFILE-LINK REGRESSION: GREEN (all scenarios PASS)"; exit 0
else echo "  PROFILE-LINK REGRESSION: RED ($fails failing)"; echo "$out" | grep -iE 'error' | head | sed 's/^/  /'; exit 1; fi
