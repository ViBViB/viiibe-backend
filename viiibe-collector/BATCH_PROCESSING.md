# Moood! Collector - Batch Processing Feature

## 🎯 Overview

The batch processing feature allows you to save up to 20 Pinterest images at once using AI-assisted selection.

## 🚀 How to Use

### **Method 1: Context Menu (Recommended)**

1. Navigate to any Pinterest page (search results, board, profile)
2. Right-click anywhere on the page
3. Select **"Batch Mode (Select 20 images)"**
4. The batch processing panel will appear on the right side

### **Method 2: Extension Icon**

1. Navigate to any Pinterest page
2. Click the Viiibe Collector extension icon
3. Click **"Batch Mode"** button (coming soon)

---

## 📋 Batch Mode Workflow

### **Step 1: Auto-Selection**

When you enter batch mode:
- ✅ AI automatically selects the **top 20 best quality images**
- ✅ Selected images are marked with a **green checkmark** (✓)
- ✅ Selected images have a **green outline**

### **Step 2: Review & Adjust**

You can customize the selection:
- **Click any image** to toggle selection (select/deselect)
- **"Select All (20)"** button: Auto-select top 20 again
- **"Deselect All"** button: Clear all selections
- **Maximum**: 20 images per batch

### **Step 3: Save**

- Click **"Save Selected"** button
- Progress bar shows processing status
- Results summary shows:
  - ✅ **Saved**: Successfully saved images
  - ⚠️ **Duplicates**: Images already in your library
  - ❌ **Failed**: Images that couldn't be saved

### **Step 4: Done**

- Panel auto-closes after 5 seconds
- Or click **×** to close manually
- All selections are cleared

---

## 🤖 AI Selection Criteria

The AI scores images based on:

### **1. Resolution (0-2 points)**
- Higher resolution = higher score
- Minimum: 1200×800 pixels
- Ideal: 1920×1080+ pixels

### **2. Aspect Ratio (0-1 points)**
- Landscape (16:9, 3:2): 1.0 points (best for web designs)
- Portrait (9:16, 2:3): 0.8 points (best for mobile)
- Square (1:1): 0.9 points (best for cards)

### **3. URL Quality (0-2 points)** - Pinterest specific
- `/originals/`: 2.0 points (best quality)
- `/736x/`: 1.5 points (high quality)
- `/564x/`: 1.0 points (medium quality)
- `/236x/`: 0.3 points (thumbnail, usually too small)

### **4. File Format (0-0.5 points)**
- PNG: 0.5 points (best for UI)
- WebP: 0.4 points
- JPG/JPEG: 0.3 points

### **5. Visibility (0-0.5 points)**
- Currently visible on screen: +0.5 points
- Off-screen: 0 points

### **6. Position (0-0.3 points)**
- Top 30% of page: +0.3 points
- Top 50% of page: +0.2 points
- Bottom 50%: 0 points

**Total Score Range**: 0-6.3 points

**Example Scoring**:
- 1920×1080 PNG from `/originals/`, visible, top of page: **6.37 points** ⭐
- 1200×800 JPG from `/736x/`, visible, middle: **4.46 points** ⭐
- 600×400 JPG from `/564x/`, not visible, bottom: **2.54 points** ❌

---

## ⚙️ Configuration

### **Maximum Images**
- Default: 20 images per batch
- Can be adjusted in `batch-processing.js`:
  ```javascript
  const BATCH_CONFIG = {
    MAX_IMAGES: 20, // Change this value
    ...
  };
  ```

### **Batch Delay**
- Default: 1 second between saves
- Prevents rate limiting
- Can be adjusted in `batch-processing.js`:
  ```javascript
  const BATCH_CONFIG = {
    ...
    BATCH_DELAY: 1000 // milliseconds
  };
  ```

### **Minimum Resolution**
- Default: 0.96 (1200×800 pixels)
- Images below this are rejected
- Can be adjusted in `batch-processing.js`:
  ```javascript
  const BATCH_CONFIG = {
    ...
    MIN_RESOLUTION: 0.96 // (width × height) / 1000000
  };
  ```

---

## 🎨 UI Elements

### **Batch Panel**
- **Position**: Fixed top-right corner
- **Size**: 320px width, auto height
- **Style**: White background, rounded corners, shadow

### **Selection Markers**
- **Checkmark**: Green circle with ✓
- **Outline**: 3px green border
- **Position**: Top-right of each image

### **Progress Bar**
- **Color**: Green (#00D9A3)
- **Updates**: Real-time during batch save
- **Text**: "X / Y" (processed / total)

### **Results Summary**
- **Saved**: Green text with ✅
- **Duplicates**: Yellow text with ⚠️
- **Failed**: Red text with ❌

---

## 🔧 Technical Details

### **Files Modified**

1. **`batch-processing.js`** (NEW)
   - AI scoring algorithm
   - Batch mode UI
   - Batch save logic
   - Selection management

2. **`manifest.json`**
   - Added `batch-processing.js` to content scripts

3. **`background.js`**
   - Added "Batch Mode" context menu item
   - Added batch mode toggle handler

### **Dependencies**

Batch processing uses existing functions from `content.js`:
- `getPinIdFromUrl()`: Extract pin ID from URL
- `savePinToViiibe()`: Save pin to backend
- `showNotification()`: Show toast notifications

### **Storage**

No additional storage required. Uses existing:
- `chrome.storage.sync.get(['adminKey'])`: Get admin key
- `chrome.storage.sync.set({ todayPins, lastDate })`: Update stats

---

## 🐛 Troubleshooting

### **Batch mode doesn't activate**
- Make sure you're on a Pinterest page
- Reload the page and try again
- Check browser console for errors

### **No images are auto-selected**
- Images might be too low quality (below 1200×800)
- Scroll down to load more images
- Try "Select All (20)" button

### **Some images fail to save**
- Could be duplicates (already saved)
- Could be missing admin key
- Could be network issues
- Check results summary for details

### **Progress bar stuck**
- Network timeout (backend slow)
- Wait for timeout (30 seconds per image)
- Close batch mode and try again

---

## 📊 Performance

### **Processing Speed**
- **1 second delay** between saves (configurable)
- **20 images** = ~20-25 seconds total
- Includes AI analysis time

### **Success Rate**
- **Expected**: 80-90% success rate
- **Duplicates**: 5-10% (already saved)
- **Failures**: 5-10% (network, errors)

---

## 🚀 Future Enhancements

### **Phase 2 Features**
- [ ] Adjustable batch size (10, 20, 50)
- [ ] Custom quality thresholds
- [ ] Batch mode keyboard shortcut (Ctrl+B)
- [ ] Save to specific category
- [ ] Preview selected images
- [ ] Drag to reorder selection
- [ ] Export selection as JSON

### **Phase 3 Features**
- [ ] ML-based quality scoring
- [ ] Learn from user deselections
- [ ] Smart categorization
- [ ] Duplicate detection before save
- [ ] Batch edit metadata
- [ ] Schedule batch processing

---

## 📝 Version History

### **v1.0.0** (Current)
- ✅ AI-assisted auto-selection (top 20)
- ✅ Manual toggle selection
- ✅ Batch save with progress
- ✅ Results summary
- ✅ Context menu integration

---

## 🎯 Usage Tips

### **Best Practices**
1. **Scroll first**: Load more images before batch mode
2. **Review selection**: AI is good but not perfect
3. **Deselect low quality**: Remove blurry or irrelevant images
4. **Save regularly**: Don't wait to fill all 20 slots
5. **Check results**: Review duplicates and failures

### **Optimal Workflow**
```
1. Search Pinterest for "fintech design"
2. Scroll to load ~50 images
3. Right-click → "Batch Mode"
4. Review AI selection (usually good)
5. Deselect 2-3 irrelevant images
6. Click "Save Selected" (17 images)
7. Wait ~20 seconds
8. Review results (15 saved, 2 duplicates)
9. Close batch mode
10. Repeat for next search
```

---

## 💡 Pro Tips

- **Use specific searches**: "minimal fintech dashboard" > "fintech"
- **Check aspect ratios**: Landscape for web, portrait for mobile
- **Prioritize originals**: `/originals/` URLs are best quality
- **Avoid thumbnails**: `/236x/` URLs are too small
- **Review duplicates**: Might be better versions
- **Save in batches**: 10-15 images per batch is optimal

---

**Happy collecting! 🎨**
