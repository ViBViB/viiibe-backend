// ============================================
// MOOOD! COLLECTOR - BACKGROUND SERVICE WORKER
// Rewritten Dec 26, 2024
// ============================================

// All 22 categories with targets
const ALL_CATEGORIES = [
    // Core (target: 100)
    { name: 'Finance', target: 100 },
    { name: 'Fitness', target: 100 },
    { name: 'Ecommerce', target: 100 },
    { name: 'Tech', target: 100 },
    { name: 'Education', target: 100 },
    { name: 'Saas', target: 100 },
    { name: 'Healthcare', target: 100 },
    // Secondary (target: 50)
    { name: 'Real estate', target: 50 },
    { name: 'Food', target: 50 },
    { name: 'Fashion', target: 50 },
    { name: 'Travel', target: 50 },
    { name: 'Construction', target: 50 },
    { name: 'Furniture', target: 50 },
    { name: 'Home services', target: 50 },
    { name: 'Logistics', target: 50 },
    { name: 'Business', target: 50 },
    { name: 'Sustainability', target: 50 },
    { name: 'Consulting', target: 50 },
    { name: 'Transportation', target: 50 },
    { name: 'Digital agency', target: 50 },
    { name: 'Beauty', target: 50 },
    { name: 'Agriculture', target: 50 }
];

// Initial counts will be fetched from API on first load
const INITIAL_COUNTS = {};

// ============================================
// INSTALLATION
// ============================================

chrome.runtime.onInstalled.addListener(async () => {
    // Don't initialize with hardcoded counts - popup will fetch from API
    console.log('✅ Extension installed - counts will be fetched from API on first popup open');

    // Initialize stats if not present
    const stats = await chrome.storage.sync.get(['todayPins', 'totalPins', 'lastDate']);
    if (stats.todayPins === undefined) {
        await chrome.storage.sync.set({
            todayPins: 0,
            totalPins: 0,
            lastDate: new Date().toDateString()
        });
        console.log('✅ Stats initialized to 0');
    } else {
        console.log(`✅ Stats loaded: Today=${stats.todayPins}, Total=${stats.totalPins}`);
    }

    // Create context menus
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'add-to-moood',
            title: '💾 Add to Moood!',
            contexts: ['page', 'link', 'image']
        });

        chrome.contextMenus.create({
            id: 'batch-mode',
            title: '🖼️ Batch Mode',
            contexts: ['page']
        });

        console.log('✅ Context menus created');
    });
});

// ============================================
// CONTEXT MENU HANDLER
// ============================================

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'add-to-moood') {
        // Get locked category for forced save
        chrome.storage.local.get('lockedCategory', (data) => {
            const forcedCategory = data.lockedCategory?.name || null;

            console.log(`🎯 Right-click save - Category: ${forcedCategory || 'uncategorized'}`);

            chrome.tabs.sendMessage(tab.id, {
                action: 'save-pin',
                url: info.pageUrl || info.linkUrl,
                forcedCategory: forcedCategory
            }).catch(err => {
                console.log('Content script not available:', err.message);
            });
        });
    }

    if (info.menuItemId === 'batch-mode') {
        chrome.tabs.sendMessage(tab.id, {
            action: 'toggle-batch-mode'
        }).catch(err => {
            console.log('Content script not available:', err.message);
        });
    }
});

// ============================================
// MESSAGE HANDLERS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'increment-industry-count') {
        chrome.storage.local.get('industryCounts', (data) => {
            const counts = data.industryCounts || INITIAL_COUNTS;
            const industry = request.industry;

            // Case-insensitive increment
            const key = findKeyCI(counts, industry);
            if (key) {
                counts[key]++;
                chrome.storage.local.set({ industryCounts: counts });
                console.log(`📊 ${key}: ${counts[key]}`);
            }
        });
    }

    if (request.action === 'pin-saved') {
        chrome.action.setBadgeText({ text: '✓', tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#00D9A3', tabId: sender.tab.id });
        setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: sender.tab.id }), 2000);
    }

    if (request.action === 'pin-error') {
        chrome.action.setBadgeText({ text: '!', tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#ff0000', tabId: sender.tab.id });
        setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: sender.tab.id }), 3000);
    }

    if (request.action === 'batch-completed') {
        const saved = request.saved || 0;
        chrome.action.setBadgeText({ text: `${saved}`, tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#00D9A3', tabId: sender.tab.id });
        setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: sender.tab.id }), 5000);
    }

    return true;
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCurrentMission(counts) {
    const incomplete = ALL_CATEGORIES
        .map(cat => {
            const count = getCountCI(counts, cat.name);
            return {
                name: cat.name,
                target: cat.target,
                current: count,
                isComplete: count >= cat.target
            };
        })
        .filter(cat => !cat.isComplete)
        .sort((a, b) => a.current - b.current); // Lowest first

    if (incomplete.length === 0) {
        return { name: null, isAllComplete: true };
    }

    return incomplete[0];
}

function getCountCI(counts, name) {
    if (!counts) return 0;
    if (counts[name] !== undefined) return counts[name];

    const lowerName = name.toLowerCase();
    for (const key of Object.keys(counts)) {
        if (key.toLowerCase() === lowerName) return counts[key];
    }
    return 0;
}

function findKeyCI(counts, name) {
    if (!counts) return null;
    if (counts[name] !== undefined) return name;

    const lowerName = name.toLowerCase();
    for (const key of Object.keys(counts)) {
        if (key.toLowerCase() === lowerName) return key;
    }
    return null;
}

// ============================================
// KEEPALIVE - Prevent service worker from going inactive
// ============================================

setInterval(() => {
    chrome.storage.local.get('keepalive', () => {
        // This keeps the service worker active
    });
}, 20000); // Every 20 seconds

console.log('✅ Moood! Collector background loaded');
