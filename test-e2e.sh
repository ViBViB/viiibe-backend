#!/bin/bash

# End-to-End Testing Script for Viiibe Backend
# Usage: ./test-e2e.sh [admin-key]

set -e

BASE_URL="https://viiibe-backend-iugr7fwmo-alberto-contreras-projects-101c33ba.vercel.app"
ADMIN_KEY="${1:-change-me-in-production}"

echo "🧪 Viiibe Backend - End-to-End Tests"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
    fi
}

echo "1️⃣  Authentication Endpoints"
echo "----------------------------"
test_endpoint "Login endpoint" "GET" "/api/login" "" "307"
test_endpoint "Check auth (no state)" "GET" "/api/check-auth" "" "200"
echo ""

echo "2️⃣  Pin Management"
echo "------------------"
test_endpoint "Get saved pins" "GET" "/api/get-saved-pins" "" "200"

# Get first pin ID
FIRST_PIN=$(curl -s "$BASE_URL/api/get-saved-pins" | jq -r '.pins[0].id // empty')

if [ -n "$FIRST_PIN" ]; then
    echo -e "${YELLOW}ℹ️  Found pin ID: $FIRST_PIN${NC}"
    
    # Test pin analysis (will fail without valid admin key)
    echo -n "Testing: Pin analysis endpoint... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"analyze\",\"adminKey\":\"wrong-key\",\"pinId\":\"$FIRST_PIN\"}" \
        "$BASE_URL/api/pin-analysis")
    
    if [ "$status" = "401" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Correctly rejects invalid admin key)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected 401, got $status)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  No pins found, skipping pin analysis test${NC}"
fi
echo ""

echo "3️⃣  Board Management"
echo "--------------------"
test_endpoint "Get curated boards" "GET" "/api/curated-boards" "" "200"

# Test board validation (will fail without valid admin key)
echo -n "Testing: Auto-add board endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"auto-add-board\",\"adminKey\":\"wrong-key\",\"boardUrl\":\"https://pinterest.com/test/board\",\"category\":\"design\"}" \
    "$BASE_URL/api/pin-analysis")

if [ "$status" = "401" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Correctly rejects invalid admin key)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Expected 401, got $status)"
    ((FAILED++))
fi
echo ""

echo "4️⃣  Pinterest Integration"
echo "-------------------------"
test_endpoint "Pinterest proxy OPTIONS" "OPTIONS" "/api/pinterest-proxy" "" "200"
test_endpoint "Image proxy OPTIONS" "OPTIONS" "/api/image-proxy" "" "200"
echo ""

echo "5️⃣  CORS Headers"
echo "----------------"
echo -n "Checking CORS on pinterest-proxy... "
cors_header=$(curl -s -X OPTIONS -I "$BASE_URL/api/pinterest-proxy" | grep -i "access-control-allow-origin" | grep "*")
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo -n "Checking CORS on image-proxy... "
cors_header=$(curl -s -X OPTIONS -I "$BASE_URL/api/image-proxy" | grep -i "access-control-allow-origin" | grep "*")
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi
echo ""

echo "======================================"
echo "📊 Test Results"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
