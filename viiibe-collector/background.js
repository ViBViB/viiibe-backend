// Background service worker for Moood! Collector
// Handles context menu creation and messaging

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    // Remove all existing context menus first to avoid duplicates
    chrome.contextMenus.removeAll(() => {
        // PUBLIC: Quick Save (future public feature)
        chrome.contextMenus.create({
            id: 'add-to-moood',
            title: '💾 Add to Moood!',
            contexts: ['page', 'link', 'image']
        });

        // PRO: Batch Mode (internal only)
        chrome.contextMenus.create({
            id: 'batch-mode',
            title: '🖼️ Batch Mode (Select 20 images)',
            contexts: ['page']
        });

        console.log('✅ Moood! Collector PRO installed - Context menus created');
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'add-to-moood') {
        // PUBLIC: Quick Save
        chrome.tabs.sendMessage(tab.id, {
            action: 'save-pin',
            url: info.pageUrl || info.linkUrl
        }).catch(err => {
            console.log('Content script not available:', err.message);
        });
    }

    if (info.menuItemId === 'batch-mode') {
        // PRO: Batch Mode
        chrome.tabs.sendMessage(tab.id, {
            action: 'toggle-batch-mode'
        }).catch(err => {
            console.log('Content script not available:', err.message);
        });
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'pin-saved') {
        // Update badge
        chrome.action.setBadgeText({ text: '✓', tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#00D9A3', tabId: sender.tab.id });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
        }, 2000);
    }

    if (request.action === 'pin-error') {
        // Show error badge
        chrome.action.setBadgeText({ text: '!', tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#ff0000', tabId: sender.tab.id });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
        }, 3000);
    }

    if (request.action === 'batch-completed') {
        // Update badge with batch count
        const saved = request.saved || 0;
        chrome.action.setBadgeText({ text: `${saved}`, tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#00D9A3', tabId: sender.tab.id });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
        }, 5000);
    }

    return true;
});

console.log('✅ Moood! Collector PRO background script loaded');
