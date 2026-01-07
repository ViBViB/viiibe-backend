# Color Re-classification Guide

## Problem

The AI color classification is too lenient, causing "infiltrators" in color searches:
- **Pink** → classified as "red"
- **Beige/Brown** → classified as "red"  
- **Orange** → classified as "red"
- **Purple** → classified as "blue"

## Root Cause

The original `rgbToColorName()` function in `api/pin-analysis.ts` uses RGB thresholds that are too permissive, causing similar colors to be grouped together.

## Solution

Use GPT-4 Vision with an improved prompt that:
1. Only identifies colors occupying >30% of the design
2. Strictly distinguishes between similar colors (red vs pink vs orange)
3. Returns max 3 colors in order of prominence

## Usage

### 1. Dry Run (Recommended First)

Test the re-classification without saving changes:

```bash
node scripts/reclassify-colors.mjs --dry-run
```

This will:
- ✅ Show which pins would be reclassified
- ✅ Display the new colors and reasoning
- ✅ Calculate the cost
- ❌ NOT save any changes to the database

### 2. Re-classify Specific Color

Re-classify all pins with "red" as primary color:

```bash
node scripts/reclassify-colors.mjs --color=red
```

Re-classify all pins with "blue" as primary color:

```bash
node scripts/reclassify-colors.mjs --color=blue
```

### 3. Re-classify All Colors

To re-classify all colors, run the script for each color:

```bash
# Re-classify red pins
node scripts/reclassify-colors.mjs --color=red

# Re-classify blue pins  
node scripts/reclassify-colors.mjs --color=blue

# Re-classify green pins
node scripts/reclassify-colors.mjs --color=green

# ... and so on
```

## Cost Estimate

- **Per pin**: ~$0.01 (GPT-4o with vision)
- **85 red pins**: ~$0.85
- **All 1,746 pins**: ~$17.46

## Expected Results

### Before Re-classification

Search: "red landing page"
- 85 pins with "red" as primary
- 12 pins pass threshold 11.0
- 5-6 infiltrators (40-50%)

### After Re-classification

Search: "red landing page"
- ~40 pins with "red" as primary (estimated)
- 12 pins pass threshold 11.0
- 0-1 infiltrators (<10%)

## Output Example

```
🎨 Re-classifying pins with "red" as primary color...

✅ Found 1746 total pins
✅ Found 85 pins with "red" as primary color

💰 Estimated cost: $0.85 (85 pins × $0.01)

[1/85] Analyzing pin: 1234567890
   Title: Wellness App Landing Page - Pink & Purple Design...
   Current colors: red, white, gray
   🤖 Analyzing with GPT-4 Vision...
   📊 New colors: pink, purple, white
   💭 Reasoning: Primary color is soft pink (~40%), not red. Purple accents (~25%), white background.
   🔄 RECLASSIFIED: red → pink
   💾 Updated in database

[2/85] Analyzing pin: 0987654321
   Title: Real Estate Landing Page - Bold Red CTA...
   Current colors: red, white, black
   🤖 Analyzing with GPT-4 Vision...
   📊 New colors: red, white, black
   💭 Reasoning: Pure red dominates (~50%) in hero and CTA buttons. White background, black text.
   ✅ CORRECT: Still red

...

═══════════════════════════════════════════════════════════
📊 RE-CLASSIFICATION SUMMARY
═══════════════════════════════════════════════════════════

✅ Correct (still red): 38
🔄 Reclassified: 45
❌ Errors: 2
📊 Total processed: 85

💰 Actual cost: $0.85

✅ RE-CLASSIFICATION COMPLETE
```

## Next Steps

After re-classification:

1. **Test searches** with "red landing page", "blue dashboard", etc.
2. **Verify results** - infiltrators should be eliminated
3. **Monitor quality** - ensure legitimate pins weren't removed
4. **Consider re-classifying other colors** if needed

## Alternative: Update rgbToColorName()

Instead of re-running GPT-4 Vision on all pins, you could update the `rgbToColorName()` function in `api/pin-analysis.ts` to be more strict. However, this would only affect NEW pins, not existing ones.

The re-classification script is the only way to fix existing pins.
