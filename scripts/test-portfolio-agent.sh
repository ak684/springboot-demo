#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:9000}"
API_URL="$BASE_URL/api/v1"
PORTFOLIO_ID="${PORTFOLIO_ID:-1}"
SYSADMIN_KEY="${SYSADMIN_API_KEY:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass_count=0
fail_count=0

auth_header=""

authenticate() {
  if [ -n "$SYSADMIN_KEY" ]; then
    auth_header="X-Sys-Admin-Key: $SYSADMIN_KEY"
    echo -e "${GREEN}Using sysadmin API key${NC}"
    return
  fi

  local response
  response=$(curl -s -i -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"alona@impactforesight.io","password":"password123"}')
  local token
  token=$(echo "$response" | grep -i '^Authorization:' \
    | sed 's/Authorization: Bearer //' | tr -d '\r')

  if [ -z "$token" ]; then
    echo -e "${RED}Failed to get auth token${NC}"
    exit 1
  fi

  auth_header="Authorization: Bearer $token"
  echo -e "${GREEN}Authenticated via JWT${NC}"
}

ask_agent() {
  local question="$1"
  local label="$2"

  echo ""
  echo -e "${YELLOW}=== Test: $label ===${NC}"
  echo "Question: $question"
  echo ""

  local payload
  payload=$(python3 -c "
import json, sys
print(json.dumps({
  'portfolioId': int('$PORTFOLIO_ID'),
  'messages': [{'role': 'user', 'content': sys.argv[1]}]
}))
" "$question")

  local http_code body tmpfile
  tmpfile=$(mktemp)

  http_code=$(curl -s -o "$tmpfile" -w "%{http_code}" \
    -X POST "$API_URL/portfolio-agent/ask" \
    -H "Content-Type: application/json" \
    -H "$auth_header" \
    --max-time 180 \
    -d "$payload")

  body=$(cat "$tmpfile")
  rm -f "$tmpfile"

  if [ "$http_code" != "200" ]; then
    echo -e "${RED}FAIL${NC} - HTTP $http_code"
    echo "Response: $(echo "$body" | head -c 500)"
    fail_count=$((fail_count + 1))
    return 0
  fi

  local answer company_count model answer_len
  answer=$(echo "$body" | python3 -c \
    "import sys,json; print(json.load(sys.stdin).get('answer',''))" \
    2>/dev/null || echo "")
  company_count=$(echo "$body" | python3 -c \
    "import sys,json; print(json.load(sys.stdin).get('companyCount',0))" \
    2>/dev/null || echo "0")
  model=$(echo "$body" | python3 -c \
    "import sys,json; print(json.load(sys.stdin).get('model',''))" \
    2>/dev/null || echo "")

  if [ -z "$answer" ] || [ "$answer" = "None" ]; then
    echo -e "${RED}FAIL${NC} - Empty answer"
    fail_count=$((fail_count + 1))
    return 0
  fi

  answer_len=${#answer}

  if [ "$answer_len" -lt 50 ]; then
    echo -e "${RED}FAIL${NC} - Answer too short ($answer_len chars)"
    echo "Answer: $answer"
    fail_count=$((fail_count + 1))
    return 0
  fi

  echo -e "${GREEN}PASS${NC} - HTTP 200, ${answer_len} chars, ${company_count} companies, model=${model}"
  echo "Answer preview (first 300 chars):"
  echo "$answer" | head -c 300
  echo ""
  echo "..."
  pass_count=$((pass_count + 1))
  return 0
}

echo "============================================"
echo "Portfolio AI Agent - Endpoint Test Suite"
echo "============================================"
echo "Base URL: $BASE_URL"
echo "Portfolio: $PORTFOLIO_ID"
echo ""

echo "Authenticating..."
authenticate

ask_agent \
  "Do we have a Fintech cluster in our portfolio? If yes, list the companies in it. If no, are there any companies that could be classified as fintech based on their description and industry?" \
  "Q1: Fintech cluster identification"

ask_agent \
  "Take the IT/Media cluster and subdivide it into meaningful subcategories. For each subcategory, show the number of companies, average growth score, and average ESG risk score." \
  "Q2: Cluster subdivision with statistics"

ask_agent \
  "What are the biggest levers to decrease the overall ESG risk across our portfolio? Identify which companies have the highest ESG risk scores and what specific areas (environmental, social, governance) are driving those scores." \
  "Q3: ESG risk reduction levers"

ask_agent \
  "Find 3 companies in our portfolio that could potentially collaborate based on complementary industries, technologies, or geographic proximity. Explain why they would be a good match." \
  "Q4: Company collaboration matching"

echo ""
echo "============================================"
echo "Results: ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC}"
echo "============================================"

if [ "$fail_count" -gt 0 ]; then
  exit 1
fi
