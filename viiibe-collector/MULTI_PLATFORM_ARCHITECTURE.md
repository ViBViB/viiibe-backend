# Multi-Platform Architecture - Moood! Collector v2.0

## 🎯 Overview

Moood! Collector now supports **multiple design platforms** with a flexible, extensible architecture.

**Supported Platforms**:
- ✅ **Pinterest** (fully implemented)
- 🚧 **Behance** (structure ready, extraction TODO)
- 🚧 **Dribbble** (structure ready, extraction TODO)

---

## 📁 File Structure

```
viiibe-collector/
├── manifest.json              # v2.0.0 - Multi-platform support
├── platform-extractors.js     # NEW - Platform detection & extraction
├── content.js                 # Simplified - Uses platform extractors
├── batch-processing.js        # Platform-agnostic batch mode
├── background.js              # Context menu handlers
└── popup.html                 # Extension popup UI
```

---

## 🏗️ Architecture

### **1. Platform Extractors (`platform-extractors.js`)**

Each platform has its own extractor object:

```javascript
const PlatformExtractor = {
    name: 'Platform Name',
    
    canHandle(url) {
        // Returns true if this extractor can handle the URL
    },
    
    extractId(url) {
        // Extracts unique ID from URL
    },
    
    extractMetadata() {
        // Extracts design data from current page
        // Returns: { platform, id, title, description, imageUrl, sourceUrl, tags }
    },
    
    extractFromImage(img) {
        // Extracts design data from image element (for batch processing)
    },
    
    getImageSelector() {
        // Returns CSS selector for images on this platform
    }
};
```

### **2. Unified API**

Platform-agnostic functions that work across all platforms:

```javascript
// Detect current platform
const platform = getCurrentPlatform(); // 'pinterest', 'behance', 'dribbble'

// Extract design metadata from current page
const design = extractDesignMetadata();
// Returns: { platform, id, title, description, imageUrl, sourceUrl, tags }

// Extract design from image element (batch mode)
const design = extractDesignFromImage(imgElement);

// Get image selector for current platform
const selector = getImageSelectorForPlatform();
```

### **3. Unified Design Data Structure**

All platforms return the same data structure:

```javascript
{
    platform: 'pinterest',           // Platform identifier
    id: 'AWtZVE7cT7Uc...',          // Unique ID on platform
    title: 'Design Title',           // Design title
    description: 'Description...',   // Design description
    imageUrl: 'https://...',         // High-quality image URL
    sourceUrl: 'https://...',        // Original URL on platform
    tags: ['tag1', 'tag2']          // Tags/keywords
}
```

---

## 🔧 Implementation Status

### **Pinterest** ✅ (Fully Implemented)

```javascript
const PinterestExtractor = {
    name: 'Pinterest',
    
    canHandle(url) {
        return url.includes('pinterest.com') || url.includes('pinterest.cl');
    },
    
    extractId(url) {
        // Supports both numeric and hash-based IDs
        // Numeric: /pin/1234567890/
        // Hash: /pin/AWtZVE7cT7Uc.../
    },
    
    extractMetadata() {
        // ✅ Extracts from meta tags
        // ✅ Extracts from DOM elements
        // ✅ Prioritizes high-quality images (/originals/, /736x/)
    },
    
    extractFromImage(img) {
        // ✅ Finds parent link with pin URL
        // ✅ Extracts pin ID from link
    },
    
    getImageSelector() {
        return 'img[src*="pinimg.com"]:not([src*="facebook_share_image"]):not([src*="user_avatar"])';
    }
};
```

### **Behance** 🚧 (Structure Ready)

```javascript
const BehanceExtractor = {
    name: 'Behance',
    
    canHandle(url) {
        return url.includes('behance.net');
    },
    
    extractId(url) {
        // Pattern: /gallery/123456789/Project-Name
        const match = url.match(/\/gallery\/(\d+)/);
        return match ? match[1] : null;
    },
    
    extractMetadata() {
        // TODO: Implement Behance-specific extraction
        // - Project title from meta tags
        // - Project description
        // - High-quality project images
        // - Creator info
    },
    
    extractFromImage(img) {
        // TODO: Implement for batch processing
    },
    
    getImageSelector() {
        return 'img[class*="Project"]'; // Placeholder
    }
};
```

### **Dribbble** 🚧 (Structure Ready)

```javascript
const DribbbleExtractor = {
    name: 'Dribbble',
    
    canHandle(url) {
        return url.includes('dribbble.com');
    },
    
    extractId(url) {
        // Pattern: /shots/12345678-Shot-Name
        const match = url.match(/\/shots\/(\d+)/);
        return match ? match[1] : null;
    },
    
    extractMetadata() {
        // TODO: Implement Dribbble-specific extraction
        // - Shot title from meta tags
        // - Shot description
        // - High-quality shot images
        // - Designer info
    },
    
    extractFromImage(img) {
        // TODO: Implement for batch processing
    },
    
    getImageSelector() {
        return 'img[class*="shot"]'; // Placeholder
    }
};
```

---

## 🚀 How to Add a New Platform

### **Step 1: Create Extractor**

Add to `platform-extractors.js`:

```javascript
const NewPlatformExtractor = {
    name: 'NewPlatform',
    
    canHandle(url) {
        return url.includes('newplatform.com');
    },
    
    extractId(url) {
        // Extract unique ID from URL
        const match = url.match(/\/design\/(\d+)/);
        return match ? match[1] : null;
    },
    
    extractMetadata() {
        const id = this.extractId(window.location.href);
        if (!id) return null;
        
        // Extract title
        const title = document.querySelector('meta[property="og:title"]')?.content || '';
        
        // Extract description
        const description = document.querySelector('meta[property="og:description"]')?.content || '';
        
        // Extract image
        const imageUrl = document.querySelector('img.main-image')?.src || '';
        
        return {
            platform: 'newplatform',
            id,
            title,
            description,
            imageUrl,
            sourceUrl: window.location.href,
            tags: []
        };
    },
    
    extractFromImage(img) {
        // Find parent link
        let link = img.closest('a[href*="/design/"]');
        if (!link) return null;
        
        const id = this.extractId(link.href);
        if (!id) return null;
        
        return {
            platform: 'newplatform',
            id,
            title: img.alt || 'Design',
            description: '',
            imageUrl: img.src,
            sourceUrl: link.href,
            tags: []
        };
    },
    
    getImageSelector() {
        return 'img.design-image';
    }
};
```

### **Step 2: Register Extractor**

```javascript
const PLATFORM_EXTRACTORS = {
    pinterest: PinterestExtractor,
    behance: BehanceExtractor,
    dribbble: DribbbleExtractor,
    newplatform: NewPlatformExtractor  // Add here
};
```

### **Step 3: Update Manifest**

```json
{
    "host_permissions": [
        "*://*.newplatform.com/*"
    ],
    "content_scripts": [
        {
            "matches": [
                "*://*.newplatform.com/*"
            ]
        }
    ]
}
```

### **Step 4: Test**

1. Load extension in Chrome
2. Navigate to newplatform.com
3. Right-click → "Add to Moood!"
4. Check console for extraction logs
5. Verify design saves correctly

---

## 🔄 Backward Compatibility

Old function names still work:

```javascript
// Old (still works)
const pinData = extractPinMetadata();
await savePinToViiibe(pinData);

// New (recommended)
const designData = extractDesignMetadata();
await saveDesignToMoood(designData);
```

Wrapper functions automatically convert between formats.

---

## 📊 Data Flow

```
User Action (Right-click / Batch Mode)
    ↓
detectPlatform(url)
    ↓
getExtractor(platform)
    ↓
extractor.extractMetadata() or extractor.extractFromImage(img)
    ↓
Unified Design Data { platform, id, title, description, imageUrl, sourceUrl, tags }
    ↓
saveDesignToMoood(designData)
    ↓
Backend API (/api/save-pin)
    ↓
Upstash KV Storage
```

---

## 🎯 Benefits

### **1. Extensibility**
- Add new platforms without modifying core code
- Each platform is self-contained
- Easy to maintain and test

### **2. Consistency**
- Unified data structure across all platforms
- Same API for all platforms
- Predictable behavior

### **3. Flexibility**
- Platform-specific optimizations
- Custom selectors per platform
- Different extraction strategies

### **4. Maintainability**
- Clear separation of concerns
- Easy to debug (platform-specific logs)
- Simple to add features

---

## 🐛 Debugging

### **Enable Verbose Logging**

All extractors log to console:

```javascript
console.log('🔍 Detected platform:', platform);
console.log('📋 Using Pinterest extractor');
console.log('✅ Extracted metadata:', { platform, id, title, imageUrl: 'Found' });
```

### **Test Platform Detection**

```javascript
// In browser console
detectPlatform(window.location.href);
// Returns: 'pinterest', 'behance', 'dribbble', or 'unknown'
```

### **Test Extraction**

```javascript
// In browser console
extractDesignMetadata();
// Returns: { platform, id, title, description, imageUrl, sourceUrl, tags }
```

---

## 📝 TODO

### **Behance Implementation**
- [ ] Extract project title from DOM
- [ ] Extract project description
- [ ] Find high-quality project images
- [ ] Extract creator information
- [ ] Test batch mode on project galleries

### **Dribbble Implementation**
- [ ] Extract shot title from DOM
- [ ] Extract shot description
- [ ] Find high-quality shot images (2x, 4x)
- [ ] Extract designer information
- [ ] Test batch mode on user profiles

### **Future Platforms**
- [ ] Awwwards
- [ ] Mobbin
- [ ] Lapa Ninja
- [ ] SiteInspire

---

## 🎉 Summary

**v2.0.0 Changes**:
- ✅ Platform-agnostic architecture
- ✅ Pinterest fully working (numeric + hash IDs)
- ✅ Behance structure ready
- ✅ Dribbble structure ready
- ✅ Unified API for all platforms
- ✅ Backward compatible with v1.x
- ✅ Easy to extend to new platforms

**Next Steps**:
1. Implement Behance extractor
2. Implement Dribbble extractor
3. Test batch mode on all platforms
4. Add platform icons to UI
