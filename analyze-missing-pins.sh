#!/bin/bash

# Batch analyze pins without AI analysis
# Usage: ./analyze-missing-pins.sh YOUR_ADMIN_KEY

ADMIN_KEY=$1
API_URL="https://viiibe-backend-lc8krv1jj-alberto-contreras-projects-101c33ba.vercel.app/api"

if [ -z "$ADMIN_KEY" ]; then
    echo "❌ Error: Admin key required"
    echo "Usage: ./analyze-missing-pins.sh YOUR_ADMIN_KEY"
    exit 1
fi

# Get pins without AI analysis that have imageUrl
echo "📊 Getting pins without AI analysis..."
PINS=$(curl -s "${API_URL}/get-saved-pins?limit=500" | \
    jq -r '.pins[] | select(.aiAnalysis == null or .aiAnalysis == {}) | select(.imageUrl != null) | .id')

PIN_COUNT=$(echo "$PINS" | wc -l | tr -d ' ')
echo "✅ Found ${PIN_COUNT} pins to analyze"

if [ "$PIN_COUNT" -eq 0 ]; then
    echo "✨ All pins already have AI analysis!"
    exit 0
fi

echo ""
echo "💰 Estimated cost: ~\$$(echo "scale=2; $PIN_COUNT * 0.006" | bc) USD"
echo ""

COUNTER=0
SUCCESS=0
FAILED=0

for PIN_ID in $PINS; do
    COUNTER=$((COUNTER + 1))
    echo "[$COUNTER/$PIN_COUNT] 🔍 Analyzing pin: $PIN_ID"
    
    RESPONSE=$(curl -s -X POST "${API_URL}/pin-analysis" \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"analyze\",\"adminKey\":\"${ADMIN_KEY}\",\"pinId\":\"${PIN_ID}\"}")
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        SUCCESS=$((SUCCESS + 1))
        echo "  ✅ Success"
    else
        FAILED=$((FAILED + 1))
        ERROR=$(echo "$RESPONSE" | jq -r '.error // .message // "Unknown error"')
        echo "  ❌ Failed: $ERROR"
    fi
    
    # Small delay to avoid rate limits
    sleep 2
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Analysis Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total:   $PIN_COUNT pins"
echo "  Success: $SUCCESS pins ✅"
echo "  Failed:  $FAILED pins ❌"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
