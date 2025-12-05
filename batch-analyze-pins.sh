#!/bin/bash

# Batch Analyze All Saved Pins
# This script analyzes all saved pins that haven't been analyzed yet

set -e

BASE_URL="https://viiibe-backend-hce5.vercel.app"

# Get admin key from argument
ADMIN_KEY="${1:-}"

if [ -z "$ADMIN_KEY" ]; then
    echo "❌ Error: Admin key required"
    echo "Usage: ./batch-analyze-pins.sh <admin-key>"
    exit 1
fi

echo "🤖 Batch Pin Analysis"
echo "====================="
echo ""

# Get all saved pins
echo "📌 Fetching all saved pins..."
ALL_PINS=$(curl -s "$BASE_URL/api/get-saved-pins")
TOTAL_PINS=$(echo "$ALL_PINS" | jq -r '.pins | length')

echo "   Total pins in database: $TOTAL_PINS"
echo ""

# Counter for progress
ANALYZED=0
SKIPPED=0
FAILED=0

# Process each pin
echo "$ALL_PINS" | jq -r '.pins[] | .id' | while read -r PIN_ID; do
    echo "---"
    echo "🔍 Analyzing pin: $PIN_ID"
    
    # Check if pin already has tags
    EXISTING_TAGS=$(curl -s "$BASE_URL/api/get-saved-pins" | jq -r ".pins[] | select(.id == \"$PIN_ID\") | .tags")
    
    # If tags exist and are not empty, skip
    if [ "$EXISTING_TAGS" != "null" ] && [ "$EXISTING_TAGS" != "[]" ]; then
        echo "   ⏭️  Already analyzed, skipping..."
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Analyze the pin
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"analyze\",\"adminKey\":\"$ADMIN_KEY\",\"pinId\":\"$PIN_ID\"}" \
        "$BASE_URL/api/pin-analysis")
    
    # Check if successful
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    
    if [ "$SUCCESS" == "true" ]; then
        echo "   ✅ Analysis complete"
        ANALYZED=$((ANALYZED + 1))
        
        # Show generated tags
        STYLE=$(echo "$RESPONSE" | jq -r '.tags.style | join(", ")')
        COLORS=$(echo "$RESPONSE" | jq -r '.tags.color | join(", ")')
        INDUSTRY=$(echo "$RESPONSE" | jq -r '.tags.industry | join(", ")')
        echo "   📊 Style: $STYLE"
        echo "   🎨 Colors: $COLORS"
        echo "   🏢 Industry: $INDUSTRY"
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // .error')
        echo "   ❌ Failed: $ERROR_MSG"
        FAILED=$((FAILED + 1))
    fi
    
    # Small delay to avoid rate limiting
    sleep 1
done

echo ""
echo "✅ Batch analysis complete!"
echo "   Analyzed: $ANALYZED"
echo "   Skipped: $SKIPPED"
echo "   Failed: $FAILED"
echo "   Total: $TOTAL_PINS"
