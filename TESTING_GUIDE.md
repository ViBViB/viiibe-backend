# 🧪 Viiibe Plugin - Testing Guide

Welcome! This guide will help you test the Viiibe plugin and provide valuable feedback.

## 🎯 What is Viiibe?

Viiibe is an AI-powered Figma plugin that helps you:
- **Search** for design inspiration using natural language
- **Generate** moodboards from curated design examples
- **Extract** color palettes from images
- **Create** typography scales
- **Organize** design references with adaptive backgrounds

---

## 🚀 Getting Started

1. **Open Figma Desktop**
2. **Run the plugin:** Plugins → Viiibe (or Plugins → Development → Viiibe)
3. **Start searching!** Try queries like:
   - "fitness homepage"
   - "blue ecommerce"
   - "minimalist portfolio"
   - "dark dashboard"

---

## ✅ Features to Test

### 1. Smart Search with NLP

**What to test:**
- Search for different industries (e.g., "real estate", "saas", "fitness")
- Search for colors (e.g., "red landing page", "blue dashboard")
- Search for project types (e.g., "mobile app", "portfolio", "ecommerce")
- Try combinations (e.g., "green fitness mobile app")

**What to look for:**
- ✅ Results match your search intent
- ✅ No duplicate images
- ✅ Images load quickly
- ❌ Irrelevant results (e.g., searching "fitness" returns real estate)

**Known limitations:**
- First search may be slower (loading initial results)
- Some searches may have limited results

---

### 2. Reload for More Results

**What to test:**
- Click the **reload button** (↻) after a search
- Click it multiple times

**What to look for:**
- ✅ New, different images appear
- ✅ No duplicates from previous results
- ✅ Images still match search query
- ❌ Same images appearing again

---

### 3. Lightbox with Adaptive Backgrounds

**What to test:**
- Click on any image to open lightbox
- Navigate between images using arrow buttons (← →)
- Try images of different heights (short and tall)

**What to look for:**
- ✅ Background color adapts to image edge color
- ✅ Background color changes when navigating
- ✅ Smooth color transitions
- ✅ No white gaps visible
- ❌ Background stays the same color
- ❌ White areas showing through

---

### 4. Generate Style Guide

**What to test:**
- After searching, click **"Get your Viiibe!"** button
- Toggle options:
  - Mood board (on/off)
  - Color palette (on/off)
  - Type scale (on/off)
- Click **Download** button

**What to look for:**
- ✅ Moodboard page created with grid layout
- ✅ Color palette page with 4 colors (Primary, Secondary, Tertiary, Accent)
- ✅ Each color has unique name (no duplicates like "Lavender, Lavender")
- ✅ Type scale page with typography samples
- ✅ All pages zoom to fit automatically
- ❌ Pages not created
- ❌ Duplicate color names
- ❌ Images not loading

---

### 5. Color Palette Extraction

**What to test:**
- Generate a style guide with color palette enabled
- Check the color names and hex codes
- Try different search queries to get different palettes

**What to look for:**
- ✅ Colors extracted match the moodboard images
- ✅ Each color has a descriptive name (e.g., "Lavender", "Steel", "Coral")
- ✅ No duplicate names in the same palette
- ✅ Hex codes are correct
- ❌ Generic names like "Color" or "Purple"
- ❌ Two colors with the same name

**Recent fix:** Duplicate color names bug has been fixed!

---

### 6. Typography Scale

**What to test:**
- Generate a style guide with type scale enabled
- Check the typography page

**What to look for:**
- ✅ Page displays different text sizes
- ✅ Page zooms to fit automatically
- ✅ Text is readable
- ❌ Text overlapping or cut off

---

## 🐛 How to Report Issues

When you find a bug, please include:

1. **What were you doing?**
   - Example: "I searched for 'fitness homepage' and clicked reload"

2. **What did you expect?**
   - Example: "I expected to see new fitness-related images"

3. **What actually happened?**
   - Example: "The same images appeared again"

4. **Screenshots or screen recording** (if possible)

5. **Your setup:**
   - Figma version (Help → About Figma)
   - Operating system (Mac/Windows)
   - Browser (if using Figma in browser)

---

## 💡 Tips for Testing

- **Try edge cases:** Very long search queries, special characters, etc.
- **Test repeatedly:** Click reload 5-10 times to check for duplicates
- **Mix features:** Search → Reload → Lightbox → Generate
- **Test performance:** How fast do images load? Any lag?
- **Check details:** Color names, typography, spacing, alignment

---

## ✨ Recent Improvements

Here's what we've fixed recently:

- ✅ **Adaptive lightbox backgrounds** - Background color now matches image edges
- ✅ **Navigation color updates** - Background updates when using arrows in lightbox
- ✅ **Duplicate color names** - Each color in palette now has unique name
- ✅ **Keyword conflicts** - Fixed search issues (e.g., "home" no longer returns real estate)
- ✅ **Zoom to fit** - All generated pages now auto-zoom
- ✅ **UI polish** - Removed unnecessary badges and animations

---

## 🎨 Design Quality Checks

Pay attention to:
- **Visual hierarchy:** Is information easy to scan?
- **Spacing:** Does everything feel balanced?
- **Typography:** Are font sizes appropriate?
- **Colors:** Do colors have good contrast?
- **Interactions:** Are hover states and clicks responsive?

---

## 📊 What We're Looking For

Your feedback on:
1. **Accuracy:** Do search results match your intent?
2. **Usability:** Is the plugin easy to use?
3. **Performance:** Is it fast enough?
4. **Visual quality:** Does it look polished?
5. **Bugs:** What breaks or behaves unexpectedly?
6. **Missing features:** What would make this more useful?

---

## 🙏 Thank You!

Your testing and feedback are invaluable. Every bug you find and every suggestion you make helps us build a better product.

**Questions?** Reach out to [your contact info]

Happy testing! 🚀
