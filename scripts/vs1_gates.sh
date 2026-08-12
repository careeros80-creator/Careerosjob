#!/bin/bash
# scripts/vs1_gates.sh
# ══════════════════════════════════════════════════════════
# VS1 Acceptance Gates — runs against real DB
# Usage: ./scripts/vs1_gates.sh
# Exit 0 = all gates pass → ready for VS2
# Exit 1 = gates failing → stay in VS1
# ══════════════════════════════════════════════════════════

set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

DB_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}}"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

psql() { command psql "$DB_URL" -t -A "$@"; }

echo ""
echo "══════════════════════════════════════════════"
echo "  VS1 Acceptance Gates"
echo "══════════════════════════════════════════════"

TOTAL=0; PASSED=0; FAILED=0

gate() {
  local name="$1" value="$2" threshold="$3" pass="$4"
  TOTAL=$((TOTAL+1))
  if [ "$pass" = "t" ] || [ "$pass" = "true" ]; then
    echo -e "  ${GREEN}☑${NC} ${name}: ${value} (threshold: ${threshold})"
    PASSED=$((PASSED+1))
  else
    echo -e "  ${RED}✗${NC} ${name}: ${value} (threshold: ${threshold})"
    FAILED=$((FAILED+1))
  fi
}

# Fetch all gates from view
echo ""
echo "[ Operational Health ]"
while IFS='|' read -r name value threshold passed; do
  gate "$name" "$value" "$threshold" "$passed"
done < <(psql -c "SELECT gate, value, threshold, passed::text FROM vs1_acceptance_gates ORDER BY gate;" 2>/dev/null \
  || echo "discovery_success_rate|no data|≥ 95%|false")

echo ""
echo "[ Data Quality ]"
psql -c "
SELECT
  'title_completeness'     AS metric,
  title_fill_pct::text     AS value,
  '= 100%'                 AS threshold,
  (title_fill_pct = 100)::text AS passed
FROM vs1_data_quality
UNION ALL
SELECT
  'total_jobs',
  total_jobs::text,
  '≥ 1',
  (total_jobs >= 1)::text
FROM vs1_data_quality;
" 2>/dev/null | while IFS='|' read -r name value threshold passed; do
  gate "$name" "$value" "$threshold" "$passed"
done

echo ""
echo "[ Province Distribution ]"
psql -c "SELECT province, job_count, pct::text || '%' FROM vs1_province_distribution LIMIT 5;" 2>/dev/null \
  | while IFS='|' read -r prov count pct; do
      echo "  ${prov}: ${count} jobs (${pct})"
    done

echo ""
echo "══════════════════════════════════════════════"
echo "  Gates: ${TOTAL} | Passed: ${PASSED} | Failed: ${FAILED}"

if [ "$FAILED" -eq 0 ]; then
  echo -e "  ${GREEN}VS1 ACCEPTANCE GATES: ALL PASSED ✅${NC}"
  echo "  → Ready for VS2 (Normalization)"
  echo "══════════════════════════════════════════════"
  exit 0
else
  echo -e "  ${RED}VS1 ACCEPTANCE GATES: ${FAILED} FAILING ❌${NC}"
  echo "  → Continue improving VS1 before VS2"
  echo "══════════════════════════════════════════════"
  exit 1
fi
