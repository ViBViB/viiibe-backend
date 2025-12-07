// Content script for Viiibe Collector
// Extracts pin data from Pinterest pages and sends to backend

const API_BASE = 'https://viiibe-backend-nfueitpl1-alberto-contreras-projects-101c33ba.vercel.app/api';

// Extract pin ID from URL
function getPinIdFromUrl(url) {
    // Pinterest pin URLs: https://pinterest.com/pin/1234567890/
    // or https://cl.pinterest.com/pin/1234567890/
    const match = url.match(/\/pin\/(\d+)/);
    return match ? match[1] : null;
}

// Extract pin metadata from page
function extractPinMetadata() {
    const pinId = getPinIdFromUrl(window.location.href);

    if (!pinId) {
        return null;
    }

    // Try multiple methods to extract data
    let title = '';
    let description = '';
    let imageUrl = '';
    let tags = [];

    // Method 1: Meta tags for title and description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');

    if (ogTitle) title = ogTitle.content;
    if (ogDescription) description = ogDescription.content;

    // Method 2: Page title fallback
    if (!title) {
        title = document.title.replace(' | Pinterest', '').trim();
    }

    // Method 3: Try to extract description from DOM
    if (!description) {
        const descElement = document.querySelector('[data-test-id="pin-closeup-description"]');
        if (descElement) {
            description = descElement.textContent.trim();
        }
    }

    // Method 4: Extract image URL - PRIORITIZE DOM over og:image
    // Pinterest's og:image often points to their generic logo, not the actual pin

    // Try to get the actual pin image from DOM first
    const mainImage = document.querySelector('img[src*="pinimg.com/originals"]');
    if (mainImage && mainImage.src) {
        imageUrl = mainImage.src;
    } else {
        // Try 736x variant (high quality)
        const largeImage = document.querySelector('img[src*="pinimg.com/736x"]');
        if (largeImage && largeImage.src) {
            imageUrl = largeImage.src;
        } else {
            // Try any pinimg.com image that's not the generic share image
            const anyPinImage = document.querySelector('img[src*="pinimg.com"]:not([src*="facebook_share_image"])');
            if (anyPinImage && anyPinImage.src) {
                imageUrl = anyPinImage.src;
            } else {
                // Last resort: use og:image (but this is often wrong)
                const ogImage = document.querySelector('meta[property="og:image"]');
                if (ogImage && ogImage.content && !ogImage.content.includes('facebook_share_image')) {
                    imageUrl = ogImage.content;
                }
            }
        }
    }

    return {
        pinId,
        title,
        description,
        imageUrl,  // Now includes image URL for AI analysis
        pinterestUrl: window.location.href,
        tags: tags
    };
}

// Save pin to Viiibe backend
async function savePinToViiibe(pinData, category = 'uncategorized') {
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

        const response = await fetch(`${API_BASE}/save-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...pinData,
                category,
                quality: 'standard',
                adminKey
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save pin');
        }

        const result = await response.json();

        // Check if pin was a duplicate
        if (result.duplicate) {
            showNotification('Pin already saved!', 'info');
            return 'duplicate';
        }

        // Show AI analysis status
        if (result.aiAnalysis) {
            const status = result.aiAnalysis.status;
            const message = result.aiAnalysis.message;

            if (status === 'completed') {
                showNotification(`✅ Pin saved! ${message}`, 'success');
            } else if (status === 'timeout') {
                showNotification(`✅ Pin saved! ⏱️ ${message}`, 'info');
            } else if (status === 'failed') {
                showNotification(`✅ Pin saved! ⚠️ ${message}`, 'warning');
            } else {
                showNotification(`✅ Pin saved! (No image for AI)`, 'info');
            }
        } else {
            showNotification('✅ Pin saved!', 'success');
        }

        return true;
    } catch (error) {
        console.error('Error saving pin:', error);
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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔔 Content script received message:', request);

    if (request.action === 'save-pin') {
        console.log('📌 Save pin action triggered');
        const pinData = extractPinMetadata();
        console.log('📋 Extracted pin data:', pinData);

        if (!pinData) {
            console.log('❌ No valid pin data found');
            showNotification('Not a valid Pinterest pin page', 'error');
            chrome.runtime.sendMessage({ action: 'pin-error' });
            sendResponse({ success: false });
            return;
        }

        // Get category from storage or use default
        chrome.storage.sync.get(['defaultCategory'], async (result) => {
            console.log('📁 Category from storage:', result);
            const category = result.defaultCategory || 'uncategorized';
            console.log('🚀 Calling savePinToViiibe...');
            const success = await savePinToViiibe(pinData, category);
            console.log('✅ savePinToViiibe result:', success);

            if (success && success !== 'duplicate') {
                // Don't show notification here - savePinToViiibe already shows it
                chrome.runtime.sendMessage({ action: 'pin-saved' });

                // Update stats
                chrome.storage.sync.get(['todayPins', 'lastDate'], (result) => {
                    const today = new Date().toDateString();
                    const lastDate = result.lastDate || '';

                    // Reset today count if it's a new day
                    let todayPins = result.todayPins || 0;
                    if (lastDate !== today) {
                        todayPins = 0;
                    }

                    todayPins = todayPins + 1;

                    chrome.storage.sync.set({
                        todayPins,
                        lastDate: today
                    });
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
});

console.log('✅ Viiibe Collector content script loaded on:', window.location.href);
