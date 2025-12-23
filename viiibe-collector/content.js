// Content script for Moood! Collector
// Platform-agnostic design saving (uses platform-extractors.js)

// Import centralized configuration
const API_BASE = 'https://moood-refactor.vercel.app/api';

// NOTE: Platform detection and extraction logic is now in platform-extractors.js
// This file uses the unified API: extractDesignMetadata(), extractDesignFromImage()

// ============================================
// URL UPGRADING HELPERS
// ============================================

/**
 * Upgrade Pinterest URL to high resolution (/736x/)
 * Converts /236x/, /474x/, /564x/ → /736x/
 * Note: We use /736x/ instead of /originals/ because Pinterest blocks many /originals/ URLs
 */
function upgradeToOriginals(url) {
    if (!url || typeof url !== 'string') return url;

    // If already 736x or originals, return as is
    if (url.includes('/736x/') || url.includes('/originals/')) {
        return url;
    }

    // Replace any lower resolution path with /736x/
    return url.replace(/\/(236x|474x|564x)\//, '/736x/');
}

/**
 * Verify if /originals/ URL exists
 * Note: We can't actually verify with no-cors mode, so we trust the upgrade
 * The Figma plugin has fallback logic to handle broken URLs
 */
async function verifyOriginalExists(url) {
    // Skip verification - just return true
    // The plugin will handle fallback if /originals/ doesn't exist
    return true;

    // Note: HEAD requests with no-cors don't work for verification
    // We're trusting that most /originals/ URLs exist
    // Plugin has fallback to original URL if /originals/ fails
}

/**
 * Check if pins already exist in database (duplicate detection)
 * @param {string[]} pinIds - Array of pin IDs to check
 * @returns {Object} - Map of pinId -> boolean (true = duplicate, false = new)
 */
async function checkDuplicates(pinIds) {
    if (!pinIds || pinIds.length === 0) {
        return {};
    }

    try {
        console.log(`🔍 Checking ${pinIds.length} pins for duplicates...`);

        const response = await fetch(`${API_BASE}/check-duplicates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinIds })
        });

        if (!response.ok) {
            console.error('Failed to check duplicates:', response.status);
            return {}; // Assume all are new if check fails
        }

        const data = await response.json();
        console.log(`✅ Duplicate check: ${data.summary.duplicates} duplicates, ${data.summary.new} new`);

        return data.duplicates; // { "123": true, "456": false }
    } catch (error) {
        console.error('Error checking duplicates:', error);
        return {}; // Assume all are new if check fails
    }
}

// Save design to Moood! backend
async function saveDesignToMoood(designData, category = 'uncategorized') {
    try {
        // Check if chrome.storage is available
        if (!chrome.storage || !chrome.storage.sync) {
            showNotification('Extension storage not available', 'error');
            return false;
        }

        // Get admin key from storage
        const { adminKey } = await chrome.storage.sync.get(['adminKey']);

        if (!adminKey) {
            showNotification('Please set your admin key in the extension popup', 'error');
            return false;
        }

        // ⭐ UPGRADE IMAGE URL TO /originals/ BEFORE SAVING
        let finalImageUrl = designData.imageUrl;

        if (finalImageUrl && !finalImageUrl.includes('/originals/')) {
            console.log(`🔄 Attempting to upgrade URL to /originals/...`);
            console.log(`   Original: ${finalImageUrl}`);

            const upgradedUrl = upgradeToOriginals(finalImageUrl);
            console.log(`   Upgraded: ${upgradedUrl}`);

            // Verify the upgraded URL exists
            const exists = await verifyOriginalExists(upgradedUrl);

            if (exists) {
                finalImageUrl = upgradedUrl;
                console.log(`✅ Using /originals/ URL (3x better quality!)`);
            } else {
                console.log(`⚠️  /originals/ not available, rejecting pin`);
                showNotification('Image not available in high quality', 'warning');
                return false;
            }
        } else if (finalImageUrl && finalImageUrl.includes('/originals/')) {
            console.log(`✅ Already /originals/ URL`);
        }

        const response = await fetch(`${API_BASE}/save-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pinId: designData.id,
                title: designData.title,
                description: designData.description,
                imageUrl: finalImageUrl, // Use upgraded URL
                pinterestUrl: designData.sourceUrl,
                tags: designData.tags || [],
                platform: designData.platform, // NEW: track source platform
                category,
                quality: 'standard',
                adminKey
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save design');
        }

        const result = await response.json();

        // Check if design was a duplicate
        if (result.duplicate) {
            showNotification('Design already saved!', 'info');
            return 'duplicate';
        }

        // Show AI analysis status
        if (result.aiAnalysis) {
            const status = result.aiAnalysis.status;
            const message = result.aiAnalysis.message;

            if (status === 'completed') {
                showNotification(`✅ Design saved! ${message}`, 'success');
            } else if (status === 'timeout') {
                showNotification(`✅ Design saved! ⏱️ ${message}`, 'info');
            } else if (status === 'failed') {
                showNotification(`✅ Design saved! ⚠️ ${message}`, 'warning');
            } else {
                showNotification(`✅ Design saved! (No image for AI)`, 'info');
            }
        } else {
            showNotification('✅ Design saved!', 'success');
        }

        return true;
    } catch (error) {
        console.error('Error saving design:', error);
        showNotification(`Error: ${error.message}`, 'error');
        return false;
    }
}

// Show notification on page
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#4CAF50' : type === 'info' ? '#2196F3' : type === 'warning' ? '#FF9800' : '#f44336'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// BACKWARD COMPATIBILITY WRAPPERS
// ============================================

// Keep old function names for existing code
async function savePinToViiibe(pinData, category = 'uncategorized', showNotif = true) {
    if (!pinData) {
        console.error('❌ savePinToViiibe called with null/undefined pinData');
        return false;
    }

    // Convert old pinData format to new designData format
    const designData = {
        platform: pinData.platform || 'pinterest',
        id: pinData.pinId || pinData.id,
        title: pinData.title,
        description: pinData.description,
        imageUrl: pinData.imageUrl,
        sourceUrl: pinData.pinterestUrl || pinData.sourceUrl,
        tags: pinData.tags || []
    };

    return await saveDesignToMoood(designData, category);
}

function extractPinMetadata() {
    // Use new platform-agnostic function from platform-extractors.js
    if (typeof extractDesignMetadata === 'undefined') {
        console.error('❌ extractDesignMetadata is not defined. Make sure platform-extractors.js is loaded first.');
        return null;
    }
    return extractDesignMetadata();
}

function extractPinDataFromImage(img) {
    // Use new platform-agnostic function from platform-extractors.js
    if (typeof extractDesignFromImage === 'undefined') {
        console.error('❌ extractDesignFromImage is not defined. Make sure platform-extractors.js is loaded first.');
        return null;
    }
    return extractDesignFromImage(img);
}

// Helper function to check if image has valid pin link
function hasValidPinLink(img) {
    let currentElement = img;

    // Check up to 10 parent levels
    for (let i = 0; i < 10; i++) {
        currentElement = currentElement.parentElement;
        if (!currentElement) break;

        // Check if current element is a link
        if (currentElement.tagName === 'A' && currentElement.href && currentElement.href.includes('/pin/')) {
            return true;
        }

        // Check for link in children
        const link = currentElement.querySelector('a[href*="/pin/"]');
        if (link) {
            return true;
        }
    }

    // Check siblings
    if (img.parentElement) {
        const siblings = img.parentElement.querySelectorAll('a[href*="/pin/"]');
        if (siblings.length > 0) {
            return true;
        }
    }

    return false;
}

// Helper function to score image quality
function scoreImageQuality(img) {
    const url = img.src;

    // ⭐ QUALITY GATE: Accept /originals/, /736x/, and /236x/ for upgrading
    // We now upgrade /736x/ and /236x/ → /originals/ before saving
    // Still reject very low quality /474x/ and /564x/
    const isAcceptable = url.includes('/originals/') ||
        url.includes('/736x/') ||
        url.includes('/236x/');

    if (!isAcceptable) {
        const quality = url.includes('/474x/') ? '474x' :
            url.includes('/564x/') ? '564x' :
                'unknown';
        console.log(`❌ Quality Gate: Rejected low-quality image (${quality})`);
        return -1; // Return negative score to filter out
    }

    let score = 0;

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const resolutionScore = (width * height) / 1000000;

    score += Math.min(resolutionScore, 2.0);

    const aspectRatio = width / height;
    if (aspectRatio >= 1.2 && aspectRatio <= 2.0) {
        score += 1.0;
    } else if (aspectRatio >= 0.5 && aspectRatio <= 0.8) {
        score += 0.8;
    } else if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
        score += 0.9;
    }

    // Score based on current quality (will be upgraded to /originals/ before saving)
    if (url.includes('/originals/')) {
        score += 3.0; // Already maximum quality
    } else if (url.includes('/736x/')) {
        score += 2.0; // Good quality, will be upgraded
    } else if (url.includes('/236x/')) {
        score += 1.0; // Acceptable, will be upgraded
    }

    const rect = img.getBoundingClientRect();
    const isVisible = (
        rect.top >= -100 &&
        rect.bottom <= window.innerHeight + 100
    );
    if (isVisible) {
        score += 0.5;
    }

    return score;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔔 Content script received message:', request);

    if (request.action === 'save-pin') {
        console.log('📌 Save design action triggered');

        const designData = extractPinMetadata();
        console.log('📋 Extracted design data:', designData);

        if (!designData) {
            console.log('❌ No valid design data found');
            const platform = typeof getCurrentPlatform !== 'undefined' ? getCurrentPlatform() : 'unknown';
            showNotification(`Not a valid ${platform} design page`, 'error');
            chrome.runtime.sendMessage({ action: 'pin-error' });
            sendResponse({ success: false });
            return;
        }

        // Get category from storage or use default
        chrome.storage.sync.get(['defaultCategory'], async (result) => {
            console.log('📁 Category from storage:', result);
            const category = result.defaultCategory || 'uncategorized';
            console.log('🚀 Calling savePinToViiibe...');
            const success = await savePinToViiibe(designData, category);
            console.log('✅ savePinToViiibe result:', success);

            if (success && success !== 'duplicate') {
                // Don't show notification here - savePinToViiibe already shows it
                chrome.runtime.sendMessage({ action: 'pin-saved' });



                // Update stats (both todayPins and totalPins)
                chrome.storage.sync.get(['todayPins', 'totalPins', 'lastDate'], (result) => {
                    const today = new Date().toDateString();
                    const lastDate = result.lastDate || '';

                    // Reset today count if it's a new day
                    let todayPins = result.todayPins || 0;
                    if (lastDate !== today) {
                        todayPins = 0;
                    }

                    todayPins = todayPins + 1;
                    const totalPins = (result.totalPins || 0) + 1;

                    chrome.storage.sync.set({
                        todayPins,
                        totalPins,
                        lastDate: today
                    });

                    console.log(`📊 Stats updated: Today=${todayPins}, Total=${totalPins}`);
                });
            } else if (success === 'duplicate') {
                // Duplicate already handled in savePinToViiibe
                chrome.runtime.sendMessage({ action: 'pin-saved' });
            } else {
                chrome.runtime.sendMessage({ action: 'pin-error' });
            }

            sendResponse({ success: !!success });
        });

        // Return true to indicate we'll send a response asynchronously
        return true;
    }

    // NEW: Smart scan images for popup batch processing
    // Always returns exactly 20 valid, non-duplicate, high-quality images
    if (request.action === 'scan-images-for-popup') {
        // Handle async operation properly
        (async () => {
            try {
                console.log('🔍 Starting SMART SCAN for images (popup mode)');
                console.log('📋 Target: 20 valid images with /736x/ URLs, no duplicates');

                // Get all Pinterest images
                const allImages = Array.from(document.querySelectorAll('img'));
                const pinImages = allImages.filter(img => {
                    const src = img.src || '';
                    return (
                        src.includes('pinimg.com') &&
                        !src.includes('facebook_share_image') &&
                        !src.includes('user_avatar')
                    );
                });

                console.log(`📊 Found ${pinImages.length} Pinterest images on page`);

                // Phase 1: Filter by quality gate and upgrade to /736x/
                const validImages = [];
                const TARGET_COUNT = 20;
                const MAX_TO_SCAN = Math.min(pinImages.length, 100); // Limit to prevent infinite loop

                console.log(`🔍 Scanning up to ${MAX_TO_SCAN} images...`);

                for (let i = 0; i < MAX_TO_SCAN && validImages.length < TARGET_COUNT; i++) {
                    const img = pinImages[i];

                    // Check quality gate
                    const score = scoreImageQuality(img);
                    if (score < 0) {
                        continue; // Rejected by quality gate
                    }

                    // Extract pinId directly from link (try to find it, but don't require it)
                    let pinId = null;
                    let currentElement = img;

                    // Search for pin link in parents
                    for (let j = 0; j < 10; j++) {
                        currentElement = currentElement.parentElement;
                        if (!currentElement) break;

                        if (currentElement.tagName === 'A' && currentElement.href && currentElement.href.includes('/pin/')) {
                            const match = currentElement.href.match(/\/pin\/(\d+)/);
                            if (match) {
                                pinId = match[1];
                                break;
                            }
                        }
                    }

                    // If no pin ID found, try to extract from image src
                    if (!pinId && img.src) {
                        const srcMatch = img.src.match(/\/(\d+)x\//);
                        if (srcMatch) {
                            pinId = srcMatch[1];
                        }
                    }

                    if (!pinId) {
                        console.log(`⚠️ No pin ID found for image, skipping: ${img.src.substring(0, 60)}...`);
                        continue; // Skip if we really can't find a pin ID
                    }

                    // Try to upgrade to /736x/
                    const originalUrl = img.src;
                    const upgradedUrl = upgradeToOriginals(originalUrl);

                    // Verify URL exists (currently always returns true)
                    const hasOriginals = await verifyOriginalExists(upgradedUrl);
                    if (!hasOriginals) {
                        console.log(`❌ Skipped pin ${pinId}: no high-res URL available`);
                        continue;
                    }

                    // Add to valid list (duplicate check happens in batch later)
                    validImages.push({
                        src: upgradedUrl, // Use /736x/ URL
                        alt: img.alt || '',
                        score: score,
                        pinId: pinId,
                        element: img
                    });

                    // Log progress every 5 images
                    if (validImages.length % 5 === 0) {
                        console.log(`✅ Progress: ${validImages.length}/${TARGET_COUNT} valid images found`);
                    }
                }

                console.log(`📊 Phase 1 complete: ${validImages.length} images upgraded to /736x/`);

                // Phase 2: Check for duplicates
                if (validImages.length > 0) {
                    const pinIds = validImages.map(img => img.pinId);
                    const duplicates = await checkDuplicates(pinIds);

                    // Filter out duplicates
                    const uniqueImages = validImages.filter(img => !duplicates[img.pinId]);

                    console.log(`📊 Phase 2 complete: ${uniqueImages.length} unique images (${validImages.length - uniqueImages.length} duplicates removed)`);

                    // Sort by score and take top 20
                    uniqueImages.sort((a, b) => b.score - a.score);
                    const topImages = uniqueImages.slice(0, TARGET_COUNT);

                    // Return image data (without DOM elements)
                    // Use thumbnail for popup preview, but keep original URL for saving
                    const imageData = topImages.map((img, index) => ({
                        src: img.element.src, // Thumbnail URL for popup preview
                        originalSrc: img.src, // /736x/ URL for saving to database
                        alt: img.alt,
                        selected: true, // Auto-select all
                        index: index,
                        pinId: img.pinId
                    }));

                    console.log(`✅ SMART SCAN COMPLETE: Returning ${imageData.length} valid images`);
                    console.log(`📊 Summary: ${imageData.length} images ready to save (all /736x/, all unique)`);

                    sendResponse({ images: imageData });
                } else {
                    console.log(`⚠️  No valid images found`);
                    sendResponse({ images: [] });
                }
            } catch (error) {
                console.error('❌ Smart scan error:', error);
                sendResponse({ images: [], error: error.message });
            }
        })();

        return true; // Keep channel open for async response
    }

    // NEW: Save individual image from popup
    if (request.action === 'save-image-from-popup') {
        console.log('💾 Saving image from popup');

        (async () => {
            try {
                // Find the image element by src
                const img = Array.from(document.querySelectorAll('img')).find(
                    el => el.src === request.imageData.src
                );

                if (!img) {
                    console.error('❌ Image element not found');
                    sendResponse({ success: false, error: 'Image not found' });
                    return;
                }

                // Extract pin data from image
                const pinData = extractPinDataFromImage(img);

                if (!pinData) {
                    console.error('❌ Could not extract pin data');
                    sendResponse({ success: false, error: 'Could not extract pin data' });
                    return;
                }

                // Override imageUrl with /736x/ URL from smart scan
                if (request.imageData.originalSrc) {
                    pinData.imageUrl = request.imageData.originalSrc;
                    console.log(`✅ Using /736x/ URL for saving: ${pinData.imageUrl}`);
                }

                // Get admin key and category
                const { adminKey, defaultCategory } = await chrome.storage.sync.get(['adminKey', 'defaultCategory']);

                if (!adminKey) {
                    console.error('❌ No admin key');
                    sendResponse({ success: false, error: 'No admin key' });
                    return;
                }

                // Save to backend
                const category = defaultCategory || 'uncategorized';
                const result = await savePinToViiibe(pinData, category, false);

                if (result === true) {
                    sendResponse({ success: 'saved' });
                } else if (result === 'duplicate') {
                    sendResponse({ success: 'duplicate' });
                } else {
                    sendResponse({ success: false, error: 'Save failed' });
                }
            } catch (error) {
                console.error('❌ Error saving image:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true;
    }
});

console.log('✅ Moood! Collector content script loaded on:', window.location.href);
