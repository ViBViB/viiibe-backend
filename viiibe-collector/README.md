# Viiibe Collector - Chrome Extension Setup Guide

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `viiibe-collector` folder
5. Extension should now appear in your extensions list

### 2. Configure Extension

1. Click the Viiibe Collector icon in Chrome toolbar
2. Enter your Admin Key (same as `CURATOR_ADMIN_KEY` from Vercel)
3. Select your default category
4. Click "Save Settings"

### 3. Deploy Backend API

The `/api/save-pin.ts` endpoint needs to be deployed to Vercel:

```bash
cd /Users/elnegro/Figma-plugins/viiibe-plugin
vercel --prod
```

Make sure `CURATOR_ADMIN_KEY` is set in Vercel environment variables.

---

## Usage

### Saving Pins

1. **Browse Pinterest** - Navigate to any pin page
2. **Right-click** anywhere on the page
3. **Select "Add to Viiibe"** from context menu
4. **Success notification** appears confirming pin was saved

### Viewing Stats

- Click extension icon to see:
  - Pins saved today
  - Total pins saved

---

## How It Works

### Data Flow

```
Pinterest Page
    ↓
Content Script extracts metadata (pinId, title, description)
    ↓
Sends to /api/save-pin
    ↓
Saved in Vercel KV as "saved-pin:{pinId}"
    ↓
Also indexed by category: "category:{category}"
```

### Data Stored

```json
{
  "saved-pin:1234567890": {
    "id": "1234567890",
    "title": "Minimalist Landing Page",
    "description": "Clean design...",
    "pinterestUrl": "https://pinterest.com/pin/1234567890",
    "tags": [],
    "category": "web-design",
    "quality": "standard",
    "addedDate": "2025-12-03T11:00:00Z",
    "addedBy": "extension",
    "source": "pinterest"
  }
}
```

---

## Troubleshooting

### "Please set your admin key"
- Open extension popup
- Enter the same key as `CURATOR_ADMIN_KEY` in Vercel

### "Not a valid Pinterest pin page"
- Make sure you're on a pin detail page (URL contains `/pin/`)
- Try refreshing the page

### "Error: Failed to save pin"
- Check that backend is deployed
- Verify admin key matches
- Check browser console for errors

---

## Next Steps

1. **Deploy backend** (`vercel --prod`)
2. **Load extension** in Chrome
3. **Configure settings** (admin key + category)
4. **Start curating!** (50-100 pins in 10 minutes)

---

## Icon Placeholder

The extension currently uses placeholder icons. To add custom icons:

1. Create 3 PNG files: `icon16.png`, `icon48.png`, `icon128.png`
2. Place in `viiibe-collector/icons/` folder
3. Reload extension in Chrome

For now, Chrome will use a default icon.
