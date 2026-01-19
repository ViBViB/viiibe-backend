# 📦 Viiibe Plugin - Distribution Guide

This guide explains how to share the Viiibe plugin with colleagues for testing.

## 🎯 Recommended: Publish as Private Plugin

The best way to share with your team is to publish the plugin privately in Figma Community.

### Steps to Publish

1. **Open Figma Desktop** (plugins can only be published from desktop app)

2. **Navigate to the plugin:**
   - Menu → Plugins → Development → Viiibe

3. **Publish the plugin:**
   - Click the "..." menu next to the plugin name
   - Select **"Publish new release"**

4. **Configure privacy:**
   - Choose **"Only members of [your organization]"**
   - This keeps it private to your team only

5. **Fill in details:**
   - **Version:** 1.0.0 (or your preferred version)
   - **Description:** "AI-powered design inspiration plugin. Search, curate, and generate moodboards, color palettes, and typography scales."
   - **Tags:** design, inspiration, moodboard, colors, typography
   - **Screenshots:** (optional but recommended)

6. **Publish!**
   - Click "Publish plugin"
   - Your team can now install it

### How Colleagues Install

1. Open Figma (Desktop or Web)
2. Go to **Plugins → Browse plugins in Community**
3. Search for **"Viiibe"**
4. Click **"Install"**
5. Access via **Plugins → Viiibe**

### Benefits
- ✅ Professional distribution
- ✅ Automatic updates when you publish new versions
- ✅ No technical setup required for testers
- ✅ Usage analytics (optional)

---

## 📁 Alternative: Manual File Sharing

If you prefer not to publish yet, you can share files directly.

### Files to Share

Create a ZIP file containing:
```
viiibe-plugin/
├── manifest.json
├── code.js
├── dist/
│   └── index.html
└── TESTING_GUIDE.md
```

**Quick packaging:**
```bash
cd /Users/elnegro/Figma-plugins/viiibe-plugin
bash scripts/package-for-distribution.sh
```

This creates `viiibe-plugin-distribution.zip` in the project root.

### Installation Instructions for Recipients

**Share these steps with your colleagues:**

1. **Download and extract** the ZIP file to a folder on your computer

2. **Open Figma Desktop** (must use desktop app for development plugins)

3. **Import the plugin:**
   - Menu → Plugins → Development → **"Import plugin from manifest..."**
   - Navigate to the extracted folder
   - Select `manifest.json`

4. **Run the plugin:**
   - Menu → Plugins → Development → **Viiibe**

### Limitations of Manual Distribution
- ❌ No automatic updates (must re-share files for updates)
- ❌ Appears in "Development" section (less polished)
- ❌ Requires technical knowledge to install

---

## 🔄 Updating the Plugin

### If Published to Figma Community
1. Make your code changes
2. Run `npm run build`
3. Commit and push changes
4. In Figma Desktop: Plugins → Development → Viiibe → "..." → **"Publish new release"**
5. Increment version number (e.g., 1.0.0 → 1.1.0)
6. Describe changes in release notes
7. Publish

**Colleagues' plugins will auto-update** next time they restart Figma.

### If Sharing Files Manually
1. Make your code changes
2. Run `npm run build`
3. Run `bash scripts/package-for-distribution.sh`
4. Send the new ZIP to colleagues
5. They must re-import the plugin (overwrites previous version)

---

## 🐛 Troubleshooting

### "Plugin not found" when searching in Community
- Make sure you published it as "Only members of [organization]"
- Colleagues must be part of the same Figma organization
- Try searching by exact name: "Viiibe"

### "Failed to load plugin" error
- Ensure all 3 files are present (manifest.json, code.js, dist/index.html)
- Check that `dist/index.html` is the compiled version (run `npm run build`)
- Verify manifest.json has correct paths

### Plugin works in development but not after publishing
- Clear Figma cache: Quit Figma → Delete `~/Library/Application Support/Figma/` → Restart
- Re-publish with incremented version number

### Images not loading
- Check internet connection (plugin requires network access)
- Verify Vercel backend is running: https://moood-refactor.vercel.app
- Check browser console for CORS errors

---

## 📊 Collecting Feedback

Share the [TESTING_GUIDE.md](file:///Users/elnegro/Figma-plugins/viiibe-plugin/TESTING_GUIDE.md) with your colleagues to guide their testing.

**Suggested feedback format:**
- What feature were you testing?
- What did you expect to happen?
- What actually happened?
- Screenshots/screen recordings (if applicable)
- Browser/Figma version

---

## 📞 Support

For issues or questions, contact: [your contact info]

Repository: https://github.com/ViBViB/viiibe-backend
