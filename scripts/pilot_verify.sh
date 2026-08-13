#!/usr/bin/env bash
# scripts/pilot_verify.sh
#
# pilot/production-validation — runtime assertions against the live DB.
# Proves the pilot invariants from real data, not fixtures:
#   1. production metrics are computed only from data_source='production'
#   2. every production action is trace-correlated
#   3. ADR-006 holds: nothing was auto-approved / auto-sent
#   4. real Production Runtime data exists (jobs → cleaned → packages → docs)
#   5. Gmail is honestly Pending Pilot User until OAuth is provided
#
# Connects via the dockerised psql client (override the container with
# CAREEROS_PSQL_CONTAINER). Reads DATABASE_URL from .env.
set -u
CO="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${CAREEROS_PSQL_CONTAINER:-careeros_client}"
URL=$(grep '^DATABASE_URL=' "$CO/.env" | sed 's/^DATABASE_URL=//; s/^"//; s/"$//; s/\r$//')
[ -z "$URL" ] && { echo "DATABASE_URL missing in .env"; exit 2; }
Q(){ docker exec -e PGURL="$URL" "$CONTAINER" sh -c "psql \"\$PGURL\" -tAc \"$1\"" 2>/dev/null | tr -d '[:space:]'; }

pass=0; fail=0
assert(){ # <label> <actual> <op> <expected>
  local label="$1" actual="$2" op="$3" exp="$4" ok=0
  case "$op" in
    -eq) [ "$actual" -eq "$exp" ] 2>/dev/null && ok=1 ;;
    -ge) [ "$actual" -ge "$exp" ] 2>/dev/null && ok=1 ;;
    -gt) [ "$actual" -gt "$exp" ] 2>/dev/null && ok=1 ;;
  esac
  if [ "$ok" = 1 ]; then echo "  PASS  $label (=$actual)"; pass=$((pass+1));
  else echo "  FAIL  $label (got '$actual', expected $op $exp)"; fail=$((fail+1)); fi
}

echo "── Pilot production-validation runtime checks ──"

# 1) production metrics never from fixtures
PROD_JOBS=$(Q "select count(*) from jobs where data_source='production' and is_deleted=false;")
METRIC_JOBS=$(Q "select jobs_discovered from pilot_production_metrics;")
assert "production metrics count only production jobs" "$METRIC_JOBS" -eq "$PROD_JOBS"
TEST_INTERVIEWS=$(Q "select count(*) from emails where data_source='test' and classification='interview';")
PROD_METRIC_SENT=$(Q "select applications_sent from pilot_production_metrics;")
assert "test-data interviews exist but do NOT enter production metrics" "$TEST_INTERVIEWS" -ge 1
assert "production applications_sent excludes fixtures" "$PROD_METRIC_SENT" -eq 0

# 2) every production action trace-correlated
UNTRACED=$(Q "select count(*) from production_actions where trace_id is null or correlation_id is null;")
assert "all production_actions carry trace_id + correlation_id" "$UNTRACED" -eq 0
ACTIONS=$(Q "select count(*) from production_actions;")
assert "production actions logged" "$ACTIONS" -ge 5

# 3) ADR-006 — nothing auto-approved / auto-sent
AUTO_SENT=$(Q "select count(*) from application_packages where status in ('approved','sent');")
assert "ADR-006: zero packages auto-approved/auto-sent" "$AUTO_SENT" -eq 0

# 4) real Production Runtime pipeline present
assert "production jobs discovered" "$PROD_JOBS" -ge 1
PROD_CLEAN=$(Q "select count(*) from jobs where data_source='production' and pipeline_status<>'raw';")
assert "production jobs normalized" "$PROD_CLEAN" -ge 1
PROD_PKG=$(Q "select count(*) from application_packages p join jobs j on j.id=p.job_id where j.data_source='production';")
assert "production application packages prepared" "$PROD_PKG" -ge 1
PROD_DOCS=$(Q "select count(*) from generated_documents d join jobs j on j.id=d.job_id where j.data_source='production';")
assert "production CVs + cover letters generated" "$PROD_DOCS" -ge 2

# 5) Gmail honestly pending
PROD_EMAILS=$(Q "select count(*) from emails where data_source='production';")
if [ "$PROD_EMAILS" -eq 0 ] 2>/dev/null; then
  echo "  INFO  Gmail: Pending Pilot User — 0 production emails (awaiting OAuth). Not a failure."
else
  echo "  INFO  Gmail: Production Runtime active — $PROD_EMAILS real emails."
fi

echo "────────────────────────────────────────────"
echo "  PASS: $pass   FAIL: $fail"
[ "$fail" -eq 0 ] && echo "  PILOT VERIFY: GREEN" || echo "  PILOT VERIFY: RED"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
