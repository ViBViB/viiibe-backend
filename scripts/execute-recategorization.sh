#!/bin/bash

# Read JSON file
RECAT_FILE="scripts/recategorize-uncategorized.json"

# Extract pins to delete
TO_DELETE=$(jq -r '.[] | select(.newCategory == "DELETE") | .pinId' $RECAT_FILE)

# Extract pins to recategorize
TO_RECAT=$(jq '[.[] | select(.newCategory != "DELETE") | {pinId, newCategory}]' $RECAT_FILE)

echo "=== RECATEGORIZATION PLAN ==="
echo ""
echo "To Delete: $(echo "$TO_DELETE" | wc -l | tr -d ' ') pins"
echo "To Recategorize: $(echo "$TO_RECAT" | jq length) pins"
echo ""

# Delete pins
echo "1. Deleting low-quality pins..."
for pinId in $TO_DELETE; do
    echo "   Deleting pin: $pinId"
    curl -s -X POST https://moood-refactor.vercel.app/api/cleanup \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"delete-pin\",\"pinId\":\"$pinId\"}" > /dev/null
done

echo ""
echo "2. Recategorizing pins..."
curl -s -X POST https://moood-refactor.vercel.app/api/batch-recategorize \
    -H "Content-Type: application/json" \
    -d "{\"recategorizations\":$TO_RECAT}" | jq '.'

echo ""
echo "✅ Recategorization complete!"
