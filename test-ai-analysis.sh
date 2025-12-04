#!/bin/bash

# Test AI Pin Analysis
# This script tests the consolidated pin-analysis endpoint

set -e

BASE_URL="https://viiibe-backend-hce5.vercel.app"

echo "🤖 Testing AI Pin Analysis"
echo "=========================="
echo ""

# Get admin key from environment or argument
ADMIN_KEY="${1:-}"

if [ -z "$ADMIN_KEY" ]; then
    echo "⚠️  No admin key provided. Testing with invalid key (should return 401)..."
    ADMIN_KEY="test-invalid-key"
fi

# Get first saved pin
echo "📌 Fetching saved pins..."
FIRST_PIN=$(curl -s "$BASE_URL/api/get-saved-pins" | jq -r '.pins[0]')
PIN_ID=$(echo "$FIRST_PIN" | jq -r '.id')
PIN_TITLE=$(echo "$FIRST_PIN" | jq -r '.title')
PIN_URL=$(echo "$FIRST_PIN" | jq -r '.pinterestUrl')

echo "   Pin ID: $PIN_ID"
echo "   Title: $PIN_TITLE"
echo "   URL: $PIN_URL"
echo ""

# Test 1: Analyze pin
echo "🔍 Test 1: Analyze Pin with AI"
echo "-------------------------------"
echo "Request payload:"
cat <<EOF | jq '.'
{
  "action": "analyze",
  "adminKey": "$ADMIN_KEY",
  "pinId": "$PIN_ID"
}
EOF
echo ""

echo "Sending request..."
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"analyze\",\"adminKey\":\"$ADMIN_KEY\",\"pinId\":\"$PIN_ID\"}" \
    "$BASE_URL/api/pin-analysis")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Test 2: Auto-add board
echo "🎨 Test 2: Auto-Add Board"
echo "-------------------------"
BOARD_URL="https://www.pinterest.com/viiibedesign/minimalist-ui/"
CATEGORY="design"
QUALITY="premium"

echo "Request payload:"
cat <<EOF | jq '.'
{
  "action": "auto-add-board",
  "adminKey": "$ADMIN_KEY",
  "boardUrl": "$BOARD_URL",
  "category": "$CATEGORY",
  "quality": "$QUALITY"
}
EOF
echo ""

echo "Sending request..."
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"auto-add-board\",\"adminKey\":\"$ADMIN_KEY\",\"boardUrl\":\"$BOARD_URL\",\"category\":\"$CATEGORY\",\"quality\":\"$QUALITY\"}" \
    "$BASE_URL/api/pin-analysis")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Test 3: Invalid action
echo "❌ Test 3: Invalid Action (should fail)"
echo "---------------------------------------"
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"invalid-action\",\"adminKey\":\"$ADMIN_KEY\"}" \
    "$BASE_URL/api/pin-analysis")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

echo "✅ Testing complete!"
