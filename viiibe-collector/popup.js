// Moood! Collector PRO - Popup Script
// Handles tab switching, stats, and settings

// ============================================
// TAB SWITCHING
// ============================================

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Show corresponding content
        const tabName = tab.dataset.tab;
        document.getElementById(tabName).classList.add('active');
    });
});

// ============================================
// LOAD STATS AND SETTINGS
// ============================================

function loadStats() {
    chrome.storage.sync.get(['todayPins', 'lastDate', 'totalPins', 'adminKey', 'defaultCategory', 'lastBatchCount'], (result) => {
        const today = new Date().toDateString();
        const lastDate = result.lastDate || '';

        // Reset today count if it's a new day
        let todayPins = result.todayPins || 0;
        if (lastDate !== today) {
            todayPins = 0;
            chrome.storage.sync.set({ todayPins: 0, lastDate: today });
        }

        // Update UI with cached values
        document.getElementById('todayCount').textContent = todayPins;
        document.getElementById('totalCount').textContent = result.totalPins || 0;

        // Load admin key (masked)
        if (result.adminKey) {
            document.getElementById('adminKey').value = result.adminKey;
        }

        // Load default category
        if (result.defaultCategory) {
            document.getElementById('defaultCategory').value = result.defaultCategory;
        }

        // Load last batch count (if element exists)
        const lastBatchElement = document.getElementById('lastBatchCount');
        if (result.lastBatchCount && lastBatchElement) {
            lastBatchElement.textContent = result.lastBatchCount;
        }
    });
}

// Load stats on popup open
loadStats();

// Auto-refresh stats when storage changes (e.g., after saving a pin)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        // Check if todayPins or totalPins changed
        if (changes.todayPins || changes.totalPins) {
            console.log('📊 Stats changed, refreshing...');
            loadStats();
        }
    }
});

// ============================================
// SAVE SETTINGS
// ============================================

document.getElementById('saveSettings').addEventListener('click', () => {
    const adminKey = document.getElementById('adminKey').value.trim();
    const defaultCategory = document.getElementById('defaultCategory').value;

    if (!adminKey) {
        alert('Please enter an admin key');
        return;
    }

    chrome.storage.sync.set({
        adminKey,
        defaultCategory
    }, () => {
        // Visual feedback
        const btn = document.getElementById('saveSettings');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.background = '#00D9A3';
        btn.style.color = 'white';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    });
});

// ============================================
// LISTEN FOR UPDATES FROM CONTENT SCRIPT
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'stats-updated') {
        loadStats();
    }

    if (request.action === 'batch-completed') {
        // Update last batch count
        if (request.saved !== undefined) {
            chrome.storage.sync.set({ lastBatchCount: request.saved });
            loadStats();
        }
    }
});

console.log('✅ Moood! Collector PRO popup loaded');
