// Background service worker for Moood! Collector
// Handles context menu creation and messaging

// LOCAL PIN COUNTER - Real counts from DB (Dec 24, 2024)
const INITIAL_COUNTS = {
    'Finance': 81, 'Fitness': 71, 'Healthcare': 59, 'Ecommerce': 46,
    'Tech': 45, 'Education': 43, 'Saas': 42, 'Food': 37,
    'Construction': 30, 'Furniture': 23, 'Fashion': 23, 'Home Services': 20,
    'Logistics': 19, 'Sustainability': 16, 'Travel': 15, 'Consulting': 13,
    'Business': 11, 'Transportation': 11, 'Digital Agency': 11,
    'Beauty': 9, 'Agriculture': 7
};

// Create context menu on installation
chrome.runtime.onInstalled.addListener(async () => {
    // Initialize local counts
    const stored = await chrome.storage.local.get('industryCounts');
    if (!stored.industryCounts) {
        await chrome.storage.local.set({
            industryCounts: INITIAL_COUNTS,
            lastSync: Date.now()
        });
        console.log('✅ Industry counts initialized');
    }

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
    // INCREMENT LOCAL COUNTER when pin saved
    if (request.action === 'increment-industry-count') {
        chrome.storage.local.get('industryCounts', (data) => {
            const counts = data.industryCounts || INITIAL_COUNTS;
            const industry = request.industry;

            if (counts[industry] !== undefined) {
                counts[industry]++;
                chrome.storage.local.set({ industryCounts: counts });
                console.log(`📊 ${industry}: ${counts[industry]}/100`);
            }
        });
    }

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
