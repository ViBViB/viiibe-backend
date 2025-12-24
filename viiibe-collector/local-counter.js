// Local Pin Counter - Maintains accurate counts independent of API
// Initialized with real counts from database (Dec 24, 2024)

const INITIAL_COUNTS = {
    'Finance': 81,
    'Fitness': 71,
    'Healthcare': 59,
    'Ecommerce': 46,
    'Tech': 45,
    'Education': 43,
    'Saas': 42,
    'Food': 37,
    'Construction': 30,
    'Furniture': 23,
    'Fashion': 23,
    'Home Services': 20,
    'Logistics': 19,
    'Sustainability': 16,
    'Travel': 15,
    'Consulting': 13,
    'Business': 11,
    'Transportation': 11,
    'Digital Agency': 11,
    'Beauty': 9,
    'Agriculture': 7
};

// Initialize counts in storage if not present
chrome.runtime.onInstalled.addListener(async () => {
    const stored = await chrome.storage.local.get('industryCounts');

    if (!stored.industryCounts) {
        await chrome.storage.local.set({
            industryCounts: INITIAL_COUNTS,
            lastSync: Date.now()
        });
        console.log('✅ Industry counts initialized');
    }
});

// Increment count when pin is saved
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'increment-industry-count') {
        chrome.storage.local.get('industryCounts', (data) => {
            const counts = data.industryCounts || INITIAL_COUNTS;
            const industry = request.industry;

            if (counts[industry] !== undefined) {
                counts[industry]++;
                chrome.storage.local.set({ industryCounts: counts });
                console.log(`📊 ${industry}: ${counts[industry]}`);
            }
        });
    }

    return true;
});

// Export for use in popup
async function getLocalCounts() {
    const data = await chrome.storage.local.get('industryCounts');
    return data.industryCounts || INITIAL_COUNTS;
}
