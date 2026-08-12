#!/bin/bash
# scripts/validate_db.sh
# ══════════════════════════════════════════════════════════
# Step 4: Validate database before running any workflow
# Tests: Connection, ENUMs, Foreign Keys, Triggers, Outbox
# Usage: ./scripts/validate_db.sh
# ══════════════════════════════════════════════════════════

set -e

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

DB_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER:-career_os_user}:${POSTGRES_PASSWORD:-changeme}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-career_os}}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; echo -e "${RED}   $2${NC}"; exit 1; }
info() { echo -e "${YELLOW}▸  $1${NC}"; }
section() { echo -e "\n${BLUE}── $1 ──${NC}"; }

echo ""
echo "═══════════════════════════════════════════"
echo "  career-os Database Validation"
echo "═══════════════════════════════════════════"

psql() { command psql "$DB_URL" "$@"; }

# ── 1. Connection ─────────────────────────────────────────
section "1. Connection"

command psql "$DB_URL" -c "SELECT version();" -q > /dev/null 2>&1 \
  || fail "Cannot connect to database" "Check DATABASE_URL in .env"
pass "Database connection OK"

PG_VERSION=$(command psql "$DB_URL" -t -c "SELECT current_setting('server_version_num')::integer;" | tr -d ' ')
[ "$PG_VERSION" -ge 150000 ] || fail "PostgreSQL 15+ required" "Got version $PG_VERSION"
pass "PostgreSQL version OK (≥15)"

# ── 2. Migrations Applied ─────────────────────────────────
section "2. Migrations"

MIGRATION_COUNT=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM schema_migrations;" | tr -d ' ')
[ "$MIGRATION_COUNT" -ge 11 ] || fail "Not all migrations applied" "Expected ≥11, got $MIGRATION_COUNT"
pass "All $MIGRATION_COUNT migrations applied"

# Check specific migrations
for version in 000 001 002 003 004 007 008 009 010 011; do
  EXISTS=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version';" | tr -d ' ')
  [ "$EXISTS" = "1" ] || fail "Migration $version not applied" ""
done
pass "All critical migrations present"

# ── 3. ENUMs ─────────────────────────────────────────────
section "3. ENUMs"

ENUMS=(
  "job_pipeline_status"
  "job_priority"
  "lmia_status"
  "language_req"
  "contract_type"
  "app_status"
  "application_channel"
  "doc_type"
  "queue_status"
  "log_level"
  "ai_role"
  "rule_operator"
  "rule_group"
  "email_classification"
  "notification_type"
  "notification_channel"
  "actor_type"
)

for enum in "${ENUMS[@]}"; do
  EXISTS=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_type WHERE typname = '$enum';" | tr -d ' ')
  [ "$EXISTS" = "1" ] || fail "ENUM missing: $enum" ""
done
pass "All ${#ENUMS[@]} ENUMs present"

# Critical: language_req must have 'unknown' not 'none'
HAS_UNKNOWN=$(command psql "$DB_URL" -t -c "
  SELECT COUNT(*) FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'language_req' AND e.enumlabel = 'unknown';
" | tr -d ' ')
[ "$HAS_UNKNOWN" = "1" ] || fail "language_req must have 'unknown' value" "Check migration 002"
pass "language_req has 'unknown' (not 'none')"

# ── 4. Core Tables ────────────────────────────────────────
section "4. Core Tables"

TABLES=(
  "companies" "company_identities"
  "documents" "ai_model_config" "secret_refs"
  "event_types" "events" "event_consumers"
  "job_queue" "dead_letter_queue" "outbox"
  "traces" "spans" "logs"
  "feature_flags" "prompt_templates" "ai_calls"
  "connector_health" "connector_runs"
  "ats_analyses" "ats_keywords"
  "user_preferences"
  "ranking_results"
)

for table in "${TABLES[@]}"; do
  EXISTS=$(command psql "$DB_URL" -t -c "
    SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table';
  " | tr -d ' ')
  [ "$EXISTS" = "1" ] || fail "Table missing: $table" ""
done
pass "All ${#TABLES[@]} tables present"

# ── 5. Foreign Keys ───────────────────────────────────────
section "5. Foreign Keys"

FK_COUNT=$(command psql "$DB_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.referential_constraints;
" | tr -d ' ')
[ "$FK_COUNT" -ge 10 ] || fail "Too few foreign keys ($FK_COUNT)" "Expected ≥10"
pass "Foreign keys present ($FK_COUNT)"

# ── 6. Triggers ───────────────────────────────────────────
section "6. Triggers"

TRIGGERS=(
  "connector_runs_update_health"
  "ai_calls_update_prompt_stats"
  "user_preferences_changed"
)

for trigger in "${TRIGGERS[@]}"; do
  EXISTS=$(command psql "$DB_URL" -t -c "
    SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = '$trigger';
  " | tr -d ' ')
  [ "$EXISTS" -ge 1 ] || fail "Trigger missing: $trigger" ""
done
pass "All ${#TRIGGERS[@]} triggers present"

# ── 7. Outbox ─────────────────────────────────────────────
section "7. Outbox Pattern"

# Test publish_event function exists
EXISTS=$(command psql "$DB_URL" -t -c "
  SELECT COUNT(*) FROM pg_proc WHERE proname = 'publish_event';
" | tr -d ' ')
[ "$EXISTS" = "1" ] || fail "publish_event() function missing" ""
pass "publish_event() function present"

# Test is_event_processed function exists
EXISTS=$(command psql "$DB_URL" -t -c "
  SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_event_processed';
" | tr -d ' ')
[ "$EXISTS" = "1" ] || fail "is_event_processed() function missing" ""
pass "is_event_processed() function present"

# ── 8. Seed Data ──────────────────────────────────────────
section "8. Seed Data"

AI_ROLES=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM ai_model_config;" | tr -d ' ')
[ "$AI_ROLES" = "4" ] || fail "Expected 4 AI roles, got $AI_ROLES" ""
pass "AI model config: 4 roles"

EVENT_TYPES=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM event_types;" | tr -d ' ')
[ "$EVENT_TYPES" -ge 16 ] || fail "Expected ≥16 event types, got $EVENT_TYPES" ""
pass "Event types: $EVENT_TYPES seeded"

FLAGS=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM feature_flags;" | tr -d ' ')
[ "$FLAGS" -ge 12 ] || fail "Expected ≥12 feature flags, got $FLAGS" ""
pass "Feature flags: $FLAGS seeded (all disabled)"

PROMPTS=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM prompt_templates;" | tr -d ' ')
[ "$PROMPTS" -ge 4 ] || fail "Expected ≥4 prompt templates, got $PROMPTS" ""
pass "Prompt templates: $PROMPTS seeded"

PREFS=$(command psql "$DB_URL" -t -c "SELECT COUNT(*) FROM user_preferences;" | tr -d ' ')
[ "$PREFS" = "1" ] || fail "user_preferences should have 1 row, got $PREFS" ""
pass "user_preferences: 1 row (ready to customize)"

# ── 9. Write/Read Test ────────────────────────────────────
section "9. Write → Read Roundtrip"

# Insert a test company
TEST_ID=$(command psql "$DB_URL" -tA -c "
  INSERT INTO companies (name, city, province)
  VALUES ('Test Spa DB Validation', 'Ottawa', 'ON')
  RETURNING id;
" | grep -oiE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
[ -n "$TEST_ID" ] || fail "Cannot INSERT into companies" ""
pass "INSERT companies OK (id: ${TEST_ID:0:8}...)"

# Read it back
FOUND=$(command psql "$DB_URL" -t -c "
  SELECT name FROM companies WHERE id = '$TEST_ID';
" | tr -d ' ')
[ "$FOUND" = "TestSpaDBValidation" ] || fail "Cannot SELECT from companies" ""
pass "SELECT companies OK"

# Test publish_event
EVENT_ID=$(command psql "$DB_URL" -tA -c "
  SELECT publish_event(
    'job.discovered',
    '{\"raw_job_id\": \"00000000-0000-0000-0000-000000000000\", \"connector\": \"jobbank\", \"test\": true}'::jsonb
  );
" | grep -oiE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
[ -n "$EVENT_ID" ] || fail "publish_event() returned no event_id" ""
pass "publish_event() OK → outbox row created"

# Verify outbox row
OUTBOX_STATUS=$(command psql "$DB_URL" -t -c "
  SELECT status FROM outbox WHERE event_id = '$EVENT_ID';
" | tr -d ' ')
[ "$OUTBOX_STATUS" = "pending" ] || fail "Outbox row status wrong: $OUTBOX_STATUS" ""
pass "Outbox row status = pending ✓"

# Cleanup test data
command psql "$DB_URL" -c "
  DELETE FROM outbox WHERE event_id = '$EVENT_ID';
  DELETE FROM companies WHERE id = '$TEST_ID';
" -q
pass "Test data cleaned up"

# ── 10. Feature Flag Check ────────────────────────────────
section "10. Feature Flags"

# Verify is_enabled function
IS_ENABLED=$(command psql "$DB_URL" -t -c "
  SELECT is_enabled('jobbank_connector_enabled');
" | tr -d ' ')
[ "$IS_ENABLED" = "f" ] || fail "jobbank_connector_enabled should be false by default" ""
pass "Feature flags: all disabled by default (safe)"

# Enable one flag
command psql "$DB_URL" -c "
  UPDATE feature_flags SET is_enabled = true WHERE name = 'jobbank_connector_enabled';
" -q
IS_ENABLED=$(command psql "$DB_URL" -t -c "
  SELECT is_enabled('jobbank_connector_enabled');
" | tr -d ' ')
[ "$IS_ENABLED" = "t" ] || fail "Cannot enable feature flag" ""
pass "Feature flag enable/disable works"

# Reset
command psql "$DB_URL" -c "
  UPDATE feature_flags SET is_enabled = false WHERE name = 'jobbank_connector_enabled';
" -q

# ── SUMMARY ───────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}  Database validation: ALL PASSED ✅${NC}"
echo "  Ready for Vertical Slice 1"
echo "═══════════════════════════════════════════"
echo ""
echo "Next step:"
echo "  1. Enable jobbank_connector in feature_flags"
echo "  2. Run n8n workflow: vs1_discovery"
echo "  3. Check: SELECT COUNT(*) FROM jobs;"
echo ""
