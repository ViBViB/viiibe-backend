// Platform-agnostic extractors for Moood! Collector
// Supports: Pinterest, Behance, Dribbble (extensible)

// ============================================
// PLATFORM DETECTION
// ============================================

function detectPlatform(url) {
    if (url.includes('pinterest.com') || url.includes('pinterest.cl')) {
        return 'pinterest';
    }
    if (url.includes('behance.net')) {
        return 'behance';
    }
    if (url.includes('dribbble.com')) {
        return 'dribbble';
    }
    return 'unknown';
}

// ============================================
// PINTEREST EXTRACTOR
// ============================================

const PinterestExtractor = {
    name: 'Pinterest',

    canHandle(url) {
        return url.includes('pinterest.com') || url.includes('pinterest.cl');
    },

    extractId(url) {
        // Pinterest pin URLs can be:
        // 1. Numeric: https://pinterest.com/pin/1234567890/
        // 2. Hash-based: https://cl.pinterest.com/pin/AWtZVE7cT7Uc7dS2Cmni0ESkUiVWQGkHyC-48Dj1wOc.../

        // Try numeric format first
        const numericMatch = url.match(/\/pin\/(\d+)/);
        if (numericMatch) {
            return numericMatch[1];
        }

        // Try hash-based format (alphanumeric + dashes/underscores)
        const hashMatch = url.match(/\/pin\/([A-Za-z0-9_-]+)/);
        if (hashMatch) {
            return hashMatch[1];
        }

        return null;
    },

    extractMetadata() {
        const currentUrl = window.location.href;
        const id = this.extractId(currentUrl);

        if (!id) {
            console.log('❌ No Pinterest pin ID found in URL');
            return null;
        }

        let title = '';
        let description = '';
        let imageUrl = '';
        let tags = [];

        // Extract title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) title = ogTitle.content;
        if (!title) {
            title = document.title.replace(' | Pinterest', '').trim();
        }

        // Extract description
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) description = ogDescription.content;
        if (!description) {
            const descElement = document.querySelector('[data-test-id="pin-closeup-description"]');
            if (descElement) {
                description = descElement.textContent.trim();
            }
        }

        // Extract image URL (prioritize high quality)
        const mainImage = document.querySelector('img[src*="pinimg.com/originals"]');
        if (mainImage && mainImage.src) {
            imageUrl = mainImage.src;
        } else {
            const largeImage = document.querySelector('img[src*="pinimg.com/736x"]');
            if (largeImage && largeImage.src) {
                imageUrl = largeImage.src;
            } else {
                const anyPinImage = document.querySelector('img[src*="pinimg.com"]:not([src*="facebook_share_image"])');
                if (anyPinImage && anyPinImage.src) {
                    imageUrl = anyPinImage.src;
                } else {
                    const ogImage = document.querySelector('meta[property="og:image"]');
                    if (ogImage && ogImage.content && !ogImage.content.includes('facebook_share_image')) {
                        imageUrl = ogImage.content;
                    }
                }
            }
        }

        return {
            platform: 'pinterest',
            id,
            title,
            description,
            imageUrl,
            sourceUrl: currentUrl,
            tags
        };
    },

    extractFromImage(img) {
        // For batch processing: extract pin data from an image element
        console.log('  🔎 extractFromImage called for:', img.src.substring(0, 60) + '...');

        let pinUrl = null;
        let currentElement = img;

        // Strategy 1: Traverse up to find a link to a pin (up to 10 levels)
        for (let i = 0; i < 10; i++) {
            currentElement = currentElement.parentElement;
            if (!currentElement) break;

            // Check if current element is a link
            if (currentElement.tagName === 'A' && currentElement.href && currentElement.href.includes('/pin/')) {
                pinUrl = currentElement.href;
                console.log(`  ✅ Found pin link in parent ${i}:`, pinUrl.substring(0, 80) + '...');
                break;
            }

            // Check for link in children
            const link = currentElement.querySelector('a[href*="/pin/"]');
            if (link) {
                pinUrl = link.href;
                console.log(`  ✅ Found pin link in children at level ${i}:`, pinUrl.substring(0, 80) + '...');
                break;
            }
        }

        // Strategy 2: If still not found, search in siblings
        if (!pinUrl && img.parentElement) {
            const siblings = img.parentElement.querySelectorAll('a[href*="/pin/"]');
            if (siblings.length > 0) {
                pinUrl = siblings[0].href;
                console.log('  ✅ Found pin link in siblings:', pinUrl.substring(0, 80) + '...');
            }
        }

        if (!pinUrl) {
            console.log('  ❌ Could not find pin URL for image');
            return null;
        }

        const id = this.extractId(pinUrl);
        if (!id) {
            console.log('  ❌ Could not extract ID from URL:', pinUrl);
            return null;
        }

        console.log('  ✅ Successfully extracted pin data, ID:', id);
        return {
            platform: 'pinterest',
            id,
            title: img.alt || 'Pinterest Pin',
            description: '',
            imageUrl: img.src,
            sourceUrl: pinUrl,
            tags: []
        };
    },

    getImageSelector() {
        // Selector for batch processing
        return 'img[src*="pinimg.com"]:not([src*="facebook_share_image"]):not([src*="user_avatar"])';
    }
};

// ============================================
// BEHANCE EXTRACTOR (Future)
// ============================================

const BehanceExtractor = {
    name: 'Behance',

    canHandle(url) {
        return url.includes('behance.net');
    },

    extractId(url) {
        // Behance project URLs: https://www.behance.net/gallery/123456789/Project-Name
        const match = url.match(/\/gallery\/(\d+)/);
        return match ? match[1] : null;
    },

    extractMetadata() {
        const currentUrl = window.location.href;
        const id = this.extractId(currentUrl);

        if (!id) {
            console.log('❌ No Behance project ID found in URL');
            return null;
        }

        // TODO: Implement Behance-specific extraction
        // For now, return basic structure
        return {
            platform: 'behance',
            id,
            title: document.title.replace(' on Behance', '').trim(),
            description: '',
            imageUrl: '',
            sourceUrl: currentUrl,
            tags: []
        };
    },

    extractFromImage(img) {
        // TODO: Implement for batch processing
        return null;
    },

    getImageSelector() {
        return 'img[class*="Project"]'; // Placeholder
    }
};

// ============================================
// DRIBBBLE EXTRACTOR (Future)
// ============================================

const DribbbleExtractor = {
    name: 'Dribbble',

    canHandle(url) {
        return url.includes('dribbble.com');
    },

    extractId(url) {
        // Dribbble shot URLs: https://dribbble.com/shots/12345678-Shot-Name
        const match = url.match(/\/shots\/(\d+)/);
        return match ? match[1] : null;
    },

    extractMetadata() {
        const currentUrl = window.location.href;
        const id = this.extractId(currentUrl);

        if (!id) {
            console.log('❌ No Dribbble shot ID found in URL');
            return null;
        }

        // TODO: Implement Dribbble-specific extraction
        return {
            platform: 'dribbble',
            id,
            title: document.title.replace(' | Dribbble', '').trim(),
            description: '',
            imageUrl: '',
            sourceUrl: currentUrl,
            tags: []
        };
    },

    extractFromImage(img) {
        // TODO: Implement for batch processing
        return null;
    },

    getImageSelector() {
        return 'img[class*="shot"]'; // Placeholder
    }
};

// ============================================
// PLATFORM REGISTRY
// ============================================

const PLATFORM_EXTRACTORS = {
    pinterest: PinterestExtractor,
    behance: BehanceExtractor,
    dribbble: DribbbleExtractor
};

// ============================================
// UNIFIED EXTRACTION API
// ============================================

function getCurrentPlatform() {
    const url = window.location.href;
    return detectPlatform(url);
}

function getExtractor(platform = null) {
    const platformName = platform || getCurrentPlatform();
    const extractor = PLATFORM_EXTRACTORS[platformName];

    if (!extractor) {
        console.log(`❌ No extractor found for platform: ${platformName}`);
        return null;
    }

    return extractor;
}

function extractDesignMetadata() {
    const platform = getCurrentPlatform();
    console.log(`🔍 Detected platform: ${platform}`);

    const extractor = getExtractor(platform);
    if (!extractor) {
        console.log('❌ Unsupported platform');
        return null;
    }

    console.log(`📋 Using ${extractor.name} extractor`);
    const metadata = extractor.extractMetadata();

    if (metadata) {
        console.log('✅ Extracted metadata:', {
            platform: metadata.platform,
            id: metadata.id,
            title: metadata.title,
            imageUrl: metadata.imageUrl ? 'Found' : 'Not found'
        });
    }

    return metadata;
}

function extractDesignFromImage(img) {
    const platform = getCurrentPlatform();
    const extractor = getExtractor(platform);

    if (!extractor) {
        return null;
    }

    return extractor.extractFromImage(img);
}

function getImageSelectorForPlatform() {
    const platform = getCurrentPlatform();
    const extractor = getExtractor(platform);

    if (!extractor) {
        return null;
    }

    return extractor.getImageSelector();
}

// ============================================
// BACKWARD COMPATIBILITY
// ============================================

// Keep old function names for backward compatibility
function getPinIdFromUrl(url) {
    const platform = detectPlatform(url);
    const extractor = getExtractor(platform);
    return extractor ? extractor.extractId(url) : null;
}

function extractPinMetadata() {
    return extractDesignMetadata();
}

function extractPinDataFromImage(img) {
    return extractDesignFromImage(img);
}

console.log('✅ Platform extractors loaded:', Object.keys(PLATFORM_EXTRACTORS));
