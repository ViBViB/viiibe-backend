# VIIIBE System - Information Flow & Cost Analysis

## Executive Summary

**VIIIBE** is a two-part system:
1. **Chrome Extension** - Curates design pins from Pinterest with AI tagging
2. **Figma Plugin** - Allows designers to search and import curated pins

**Key Insight:** Curation is a one-time investment (~$12), while plugin usage scales almost free (~$0.003/session).

---

# PART 1: CURATION FLOW (Chrome Extension)

## Information Flow

### Step 1: Curator Opens Extension on Pinterest

```
User Action: Opens extension → Batch Mode
    ↓
Extension: Calls GET /api/get-curation-mission
    ↓
API Response: {
  industry: "Finance",
  currentCount: 81,
  targetCount: 100,
  nextIndustry: "Fitness"
}
    ↓
Extension: Displays mission in UI
```

**Cost:** $0 (included in Vercel Pro)

---

### Step 2: Curator Scans Page for Images

```
User Action: Click "Scan Page"
    ↓
Extension: Scans Pinterest page for images
    ↓
Content Script:
  - Finds all images on page
  - Filters by quality (/736x/ or better)
  - Extracts Pin IDs
    ↓
API Call: POST /api/check-duplicates
  Request: ["123456", "789012", ...] (20 Pin IDs)
    ↓
Upstash: Checks if pins exist
  - Queries: saved-pin:123456, saved-pin:789012, etc.
  - 20 GET requests to Upstash
    ↓
API Response: {
  "123456": false,  // new
  "789012": true    // duplicate
}
    ↓
Extension: Filters duplicates, shows 20 valid images
```

**Cost per scan:**
- Upstash: 20 GET requests = $0.000004
- Vercel: $0

**Total: ~$0.000004 per scan**

---

### Step 3: Curator Saves Selected Images

```
User Action: Click "Save Selected" (20 images)
    ↓
For each image (×20):
    ↓
  Extension: Sends save request
    ↓
  API Call: POST /api/save-pin
    Request: {
      pinId: "123456",
      title: "Finance Dashboard",
      imageUrl: "https://i.pinimg.com/736x/.../image.jpg",
      pinterestUrl: "https://pinterest.com/pin/123456"
    }
    ↓
  Backend (save-pin.ts):
    1. Check if exists in Upstash
       - GET saved-pin:123456
    2. If not exists:
       - SET saved-pin:123456 (pin data)
       - Trigger AI analysis
    ↓
  AI Analysis (pin-analysis.ts):
    ↓
    Step A: Google Vision API
      - Download image from Pinterest
      - Send to Vision API
      - Receive: labels, colors, text
      Cost: $0.0015 per image
    ↓
    Step B: OpenAI GPT-4 Vision
      - Send image to GPT-4o
      - Receive: {
          industry: ["Finance"],
          style: ["modern", "clean"],
          typography: "sans-serif",
          layout: "dashboard"
        }
      Cost: $0.01 per image
    ↓
    Step C: Combine & Save Tags
      - Merge Vision + GPT-4 results
      - SET pin-tags:123456 (combined tags)
      Cost: $0.0002 (Upstash)
    ↓
  API Response: {
    success: true,
    aiAnalysis: {
      status: "completed",
      message: "Analysis completed in 2.3s"
    }
  }
    ↓
Extension: Shows "✅ Design saved!" notification
```

**Cost per pin saved:**
- Google Vision: $0.0015
- OpenAI GPT-4 Vision: $0.01
- Upstash (2 SETs + 1 GET): $0.0002
- Vercel: $0

**Total: ~$0.012 per pin**

---

### Step 4: Batch Complete - Update Counters

```
Extension: All 20 images saved
    ↓
API Call: GET /api/get-curation-mission
    ↓
Backend:
  - Scans all saved-pin:* keys
  - Gets pin-tags:* for each
  - Counts by industry (lowercase normalized)
  - Sorts by highest count first
    ↓
Upstash Queries:
  - SCAN saved-pin:* (100-500 requests)
  - GET pin-tags:* ×750 (for all pins)
    ↓
API Response: {
  industry: "Finance",
  currentCount: 101,  // was 81, now complete!
  allCounts: {
    Finance: 101,
    Fitness: 71,
    Healthcare: 59,
    ...
  }
}
    ↓
Extension:
  - Updates chrome.storage.local
  - Displays: "Finance: 101/100 ✅ Complete!"
  - Next mission: "Fitness: 71/100"
```

**Cost per sync:**
- Upstash: ~500-1000 requests = $0.001-$0.002
- Vercel: $0

**Total: ~$0.002 per sync**

---

## Curation Cost Summary

### Per Batch (20 pins):
- Scan: $0.000004
- Save 20 pins: 20 × $0.012 = $0.24
- Sync counters: $0.002
- **Total: ~$0.242 per batch**

### Complete Curation (700 pins):
- 35 batches × $0.242 = $8.47
- **Total: ~$8.50 for 700 pins**

### Monthly Ongoing:
- Upstash storage: $1-2/month
- **Total: ~$1-2/month**

---

# PART 2: PLUGIN USAGE FLOW (Figma)

## Information Flow

### Step 1: Designer Opens Plugin in Figma

```
User Action: Figma → Plugins → VIIIBE
    ↓
Plugin UI: Shows search filters
  - Industry: [Finance, Healthcare, Tech, ...]
  - Style: [modern, minimal, clean, ...]
  - Colors: [blue, white, gray, ...]
```

**Cost:** $0

---

### Step 2: Designer Searches for Pins

```
User Action: Selects filters
  - Industry: Finance
  - Style: modern, clean
  - Colors: blue, white
  - Click "Search"
    ↓
Plugin: API Call GET /api/get-pins
  Query: ?industry=Finance&style=modern,clean&colors=blue,white&limit=50
    ↓
Backend (get-pins.ts):
  1. Query Upstash for matching pins
     - SCAN saved-pin:* (find all pins)
     - For each pin, GET pin-tags:*
     - Filter where:
       * tags.industry includes "Finance"
       * tags.style includes "modern" OR "clean"
       * tags.color includes "blue" OR "white"
     - Sort by relevance
     - Take top 50
    ↓
Upstash Queries:
  - SCAN: ~100-500 requests (depending on total pins)
  - GET tags: 50-200 requests (until 50 matches found)
  - Total: ~150-700 requests
    ↓
API Response: {
  pins: [
    {
      id: "123456",
      title: "Finance Dashboard",
      imageUrl: "https://i.pinimg.com/736x/.../image.jpg",
      pinterestUrl: "https://pinterest.com/pin/123456",
      tags: {
        industry: ["Finance"],
        style: ["modern", "clean"],
        color: ["blue", "white", "gray"]
      }
    },
    // ... 49 more
  ],
  total: 50
}
    ↓
Plugin: Displays grid of 50 image thumbnails
```

**Cost per search:**
- Upstash: ~150-700 requests = $0.0003-$0.0014
- Vercel: $0

**Total: ~$0.001 per search**

---

### Step 3: Designer Imports to Figma

```
User Action: Selects 20 images → Click "Import"
    ↓
For each selected image (×20):
    ↓
  Plugin:
    1. Download image from Pinterest
       - URL: https://i.pinimg.com/736x/.../image.jpg
       - Pinterest serves image (free CDN)
       - ~500KB per image
    ↓
    2. Create Figma node
       - Create rectangle frame
       - Set image as fill
       - Add metadata (title, tags, source URL)
       - Position in canvas
    ↓
Plugin: Shows "✅ 20 images imported!"
```

**Cost per import:**
- Pinterest CDN: $0 (free)
- Figma operations: $0 (local)

**Total: $0 per import**

---

## Plugin Usage Cost Summary

### Per Session:
- 1 search: $0.001
- Import 20 images: $0
- **Total: ~$0.001 per session**

### Per Designer/Month (20 sessions):
- 20 sessions × $0.001 = $0.02
- **Total: ~$0.02 per designer/month**

### 100 Designers/Month:
- 100 × $0.02 = $2
- **Total: ~$2/month for 100 designers**

---

# COST COMPARISON

## Curation vs Usage

| Component | Curation (One-time) | Plugin Usage (Monthly) |
|-----------|---------------------|------------------------|
| AI Analysis | $8.50 | $0 |
| Upstash Requests | $0.50 | $2.00 |
| Storage | - | $1-2 |
| **Total** | **~$9** | **~$3-4** |

## Key Insights

1. **Curation = Investment**
   - One-time cost: ~$9 for 700 pins
   - Builds valuable asset (curated library)
   - AI tagging enables intelligent search

2. **Plugin = Scalable**
   - Minimal variable cost (~$0.001/session)
   - Scales to thousands of users
   - High margin potential

3. **Total First Month**
   - Curation: $9
   - Storage: $2
   - 100 users: $2
   - **Total: ~$13**

4. **Ongoing Monthly (after curation)**
   - Storage: $2
   - 100 users: $2
   - **Total: ~$4/month**

---

# COST PROJECTIONS

## Scenario 1: Small Team (10 designers)

**Initial Setup:**
- Curate 700 pins: $9
- Month 1 usage: $0.20

**Monthly Ongoing:**
- Storage: $2
- Usage: $0.20
- **Total: ~$2.20/month**

---

## Scenario 2: Medium Company (100 designers)

**Initial Setup:**
- Curate 700 pins: $9
- Month 1 usage: $2

**Monthly Ongoing:**
- Storage: $2
- Usage: $2
- **Total: ~$4/month**

---

## Scenario 3: Large Scale (1000 designers)

**Initial Setup:**
- Curate 2000 pins: $24
- Month 1 usage: $20

**Monthly Ongoing:**
- Storage: $5
- Usage: $20
- **Total: ~$25/month**

---

# BUSINESS MODEL IMPLICATIONS

## Cost Structure

**Fixed Costs:**
- Vercel Pro: $20/month (unlimited API calls)
- Initial curation: $9-24 (one-time)

**Variable Costs:**
- Upstash storage: ~$2-5/month (scales with pins)
- Upstash requests: ~$0.001 per user session

## Pricing Recommendations

### Option 1: Freemium
- **Free tier:** 10 searches/month
- **Pro tier:** $5/month (unlimited)
- **Margin:** ~$4.80/user at 100 users

### Option 2: Team License
- **$50/month** for up to 20 designers
- **Cost:** ~$1/month
- **Margin:** $49/month per team

### Option 3: Enterprise
- **$200/month** for unlimited designers
- **Cost:** ~$25/month at 1000 users
- **Margin:** $175/month

## Break-Even Analysis

**At $5/user/month:**
- Cost per user: ~$0.04/month
- Margin: $4.96/user
- **Break-even:** 5 users

**At $50/team (20 users):**
- Cost: ~$1/month
- Margin: $49/month
- **Break-even:** 1 team

---

# OPTIMIZATION OPPORTUNITIES

## Reduce Curation Costs

1. **Batch AI calls**
   - Process multiple images in one API call
   - Potential savings: 20-30%

2. **Use cheaper AI for simple tags**
   - Google Vision only for colors/labels
   - GPT-4 only for industry classification
   - Potential savings: 40-50%

3. **Cache common analyses**
   - Similar images get similar tags
   - Reuse tags for duplicates
   - Potential savings: 10-20%

## Reduce Plugin Costs

1. **Implement query caching**
   - Cache popular searches
   - Reduce Upstash requests by 50%

2. **Optimize SCAN operations**
   - Use Redis indexes
   - Reduce scan requests by 70%

3. **CDN for thumbnails**
   - Cache Pinterest images
   - Faster loading, same cost

---

# SUMMARY

## Current Cost Structure

**Curation Phase:**
- $0.012 per pin analyzed
- $9 for 700 pins (one-time)

**Plugin Usage:**
- $0.001 per search
- $0 per import
- ~$4/month for 100 designers

## Key Advantages

✅ **Low variable costs** - Scales efficiently
✅ **High margin potential** - 95%+ margins possible
✅ **Predictable costs** - No surprises
✅ **Sustainable** - Costs don't grow linearly with users

## Recommended Next Steps

1. **Complete initial curation** (700 pins) - $9 investment
2. **Launch with freemium model** - Validate demand
3. **Optimize AI costs** - Reduce by 30-50%
4. **Scale to 100+ users** - Prove unit economics
5. **Introduce paid tiers** - Capture value

---

**Bottom Line:** VIIIBE has excellent unit economics. Curation is a small one-time investment (~$9), while plugin usage scales almost free (~$0.001/session). This enables high-margin pricing and sustainable growth.
