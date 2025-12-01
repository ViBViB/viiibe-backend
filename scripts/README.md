# Pinterest Auto-Setup Script

This script automatically populates your Pinterest account with organized boards for testing the Moood plugin.

## What it does

1. **Creates 10 organized boards** in your Pinterest account:
   - Landing Pages
   - Dashboard UI
   - Mobile App UI
   - E-commerce Design
   - Red Design
   - Blue Design
   - Monochrome Design
   - Minimalist Design
   - Bold Design
   - Dark Mode Design

2. **Searches Pinterest** for relevant design inspiration

3. **Saves ~300 pins** to your boards automatically

## Setup Instructions

### 1. Install Dependencies

```bash
npm install node-fetch dotenv
```

### 2. Get Your Pinterest Access Token

1. Go to https://developers.pinterest.com/apps/
2. Select your app (or create one)
3. Go to the "OAuth" section
4. Click "Generate token"
5. Copy the access token

### 3. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your token
PINTEREST_ACCESS_TOKEN=your_actual_token_here
```

### 4. Run the Script

```bash
node scripts/pinterest-auto-setup.js
```

## Expected Output

```
🚀 Starting Pinterest Auto-Setup

📊 Configuration:
   - Boards to create: 10
   - Total pins: ~300

📌 Creating board: "Landing Pages"
   ✓ Board created with ID: 123456789
   🔍 Searching: "modern landing page design"
      Found 8 pins
      ✓ Saved: Modern Landing Page Design
      ✓ Saved: Minimalist Landing Inspiration
      ...
   ✅ Board "Landing Pages" complete: 32 pins saved

...

🎉 Setup Complete!
✓ Boards created: 10/10
✓ Total pins saved: 300
```

## Estimated Time

- **Total runtime**: 5-10 minutes
- **Rate limiting**: Built-in delays to respect Pinterest API limits

## Troubleshooting

### "PINTEREST_ACCESS_TOKEN not found"
- Make sure you created a `.env` file (not `.env.example`)
- Check that your token is correctly pasted

### "Failed to create board"
- Verify your access token is valid
- Check that your Pinterest app is in Trial or approved mode

### "Search failed"
- Trial mode might have search limitations
- Try reducing `pinsPerSearch` in the config

## Customization

Edit `BOARDS_CONFIG` in `pinterest-auto-setup.js` to:
- Add more boards
- Change search terms
- Adjust number of pins per search

## Next Steps

After running this script:
1. Your Pinterest account will have 10 organized boards
2. Each board will have ~30 pins
3. You can test the Moood plugin search functionality
4. The plugin will search within your boards (Trial mode)
