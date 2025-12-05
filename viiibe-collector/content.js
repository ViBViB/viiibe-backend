// Content script for Viiibe Collector
// Extracts pin data from Pinterest pages and sends to backend

const API_BASE = 'https://viiibe-backend-l7t6xxnca-alberto-contreras-projects-101c33ba.vercel.app/api';

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

    // Method 1: Meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    if (ogTitle) title = ogTitle.content;
    if (ogDescription) description = ogDescription.content;
    if (ogImage) imageUrl = ogImage.content;

    // Method 2: Page title fallback
    if (!title) {
        title = document.title.replace(' | Pinterest', '').trim();
    }

    // Method 3: Try to extract from DOM
    if (!description) {
        const descElement = document.querySelector('[data-test-id="pin-closeup-description"]');
        if (descElement) {
            description = descElement.textContent.trim();
        }
    }

    // Method 4: Try to get image from DOM if og:image failed
    if (!imageUrl) {
        const mainImage = document.querySelector('img[src*="pinimg.com/originals"]');
        if (mainImage) {
            imageUrl = mainImage.src;
        } else {
            // Fallback to any pinimg.com image
            const anyPinImage = document.querySelector('img[src*="pinimg.com"]');
            if (anyPinImage) {
                imageUrl = anyPinImage.src;
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
    background: ${type === 'success' ? '#4CAF50' : type === 'info' ? '#2196F3' : '#f44336'};
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
    if (request.action === 'save-pin') {
        const pinData = extractPinMetadata();

        if (!pinData) {
            showNotification('Not a valid Pinterest pin page', 'error');
            chrome.runtime.sendMessage({ action: 'pin-error' });
            return;
        }

        // Get category from storage or use default
        chrome.storage.sync.get(['defaultCategory'], async (result) => {
            const category = result.defaultCategory || 'uncategorized';
            const success = await savePinToViiibe(pinData, category);

            if (success) {
                showNotification(`Pin saved to Viiibe! (${category})`, 'success');
                chrome.runtime.sendMessage({ action: 'pin-saved' });

                // Update stats
                chrome.storage.sync.get(['totalPins', 'todayPins', 'lastDate'], (result) => {
                    const today = new Date().toDateString();
                    const lastDate = result.lastDate || '';

                    // Reset today count if it's a new day
                    let todayPins = result.todayPins || 0;
                    if (lastDate !== today) {
                        todayPins = 0;
                    }

                    const totalPins = (result.totalPins || 0) + 1;
                    todayPins = todayPins + 1;

                    chrome.storage.sync.set({
                        totalPins,
                        todayPins,
                        lastDate: today
                    });
                });
            } else {
                chrome.runtime.sendMessage({ action: 'pin-error' });
            }
        });
    }
});

console.log('Viiibe Collector content script loaded');
