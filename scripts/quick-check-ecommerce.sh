#!/bin/bash

# Quick check of Ecommerce pin count
echo "Checking Ecommerce pin count..."

curl -s "https://moood-refactor.vercel.app/api/get-curation-mission" | jq -r '
  "Current mission: \(.industry) (\(.currentCount)/\(.targetCount))",
  "Total pins: \(.totalProgress.current)",
  "Next industry: \(.nextIndustry)"
'

echo ""
echo "If Ecommerce has less than 100 pins, there's a bug in the prioritization logic."
