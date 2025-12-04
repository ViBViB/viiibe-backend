// Popup script for Viiibe Collector

// Load settings and stats on popup open
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadStats();
});

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(['adminKey', 'defaultCategory'], (result) => {
        if (result.adminKey) {
            document.getElementById('adminKey').value = result.adminKey;
        }
        if (result.defaultCategory) {
            document.getElementById('defaultCategory').value = result.defaultCategory;
        }
    });
}

// Load stats from storage
function loadStats() {
    chrome.storage.sync.get(['totalPins', 'todayPins', 'lastDate'], (result) => {
        const today = new Date().toDateString();
        const lastDate = result.lastDate || '';

        // Reset today count if it's a new day
        let todayPins = result.todayPins || 0;
        if (lastDate !== today) {
            todayPins = 0;
            chrome.storage.sync.set({ todayPins: 0, lastDate: today });
        }

        document.getElementById('todayCount').textContent = todayPins;
        document.getElementById('totalCount').textContent = result.totalPins || 0;
    });
}

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
    const adminKey = document.getElementById('adminKey').value;
    const defaultCategory = document.getElementById('defaultCategory').value;

    if (!adminKey) {
        alert('Please enter your admin key');
        return;
    }

    chrome.storage.sync.set({ adminKey, defaultCategory }, () => {
        // Show success feedback
        const button = document.getElementById('saveSettings');
        button.textContent = '✓ Saved!';
        button.style.background = '#4CAF50';
        button.style.color = 'white';

        setTimeout(() => {
            button.textContent = 'Save Settings';
            button.style.background = 'white';
            button.style.color = '#667eea';
        }, 2000);
    });
});

// Reset stats
document.getElementById('resetStats').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all stats? This cannot be undone.')) {
        chrome.storage.sync.set({
            totalPins: 0,
            todayPins: 0,
            lastDate: new Date().toDateString()
        }, () => {
            loadStats();
            const button = document.getElementById('resetStats');
            const originalText = button.textContent;
            button.textContent = '✓ Reset!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1500);
        });
    }
});
