// Background service worker for Viiibe Collector
// Handles context menu creation and messaging

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'add-to-viiibe',
        title: 'Add to Viiibe',
        contexts: ['page', 'link', 'image']
    });

    console.log('Viiibe Collector installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'add-to-viiibe') {
        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
            action: 'save-pin',
            url: info.pageUrl || info.linkUrl
        });
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'pin-saved') {
        // Update badge or show notification
        chrome.action.setBadgeText({ text: '✓', tabId: sender.tab.id });
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

    // Return true to indicate we'll send a response asynchronously
    return true;
});
