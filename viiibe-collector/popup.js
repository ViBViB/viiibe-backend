// Popup script for Viiibe Collector

// Load settings and stats on popup open
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadStats();
});

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(['adminKey'], (result) => {
        if (result.adminKey) {
            document.getElementById('adminKey').value = result.adminKey;
        }
    });
}

// Load stats from storage
function loadStats() {
    chrome.storage.sync.get(['todayPins', 'lastDate'], (result) => {
        const today = new Date().toDateString();
        const lastDate = result.lastDate || '';

        // Reset today count if it's a new day
        let todayPins = result.todayPins || 0;
        if (lastDate !== today) {
            todayPins = 0;
            chrome.storage.sync.set({ todayPins: 0, lastDate: today });
        }

        document.getElementById('todayCount').textContent = todayPins;
    });

    // Fetch total pins from backend
    fetch('https://viiibe-backend-hce5.vercel.app/api/get-saved-pins')
        .then(res => res.json())
        .then(data => {
            const totalPins = data.pins ? data.pins.length : 0;
            document.getElementById('totalCount').textContent = totalPins;
        })
        .catch(err => {
            console.error('Failed to fetch total pins:', err);
            document.getElementById('totalCount').textContent = '?';
        });
}

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
    const adminKey = document.getElementById('adminKey').value;

    if (!adminKey) {
        alert('Please enter your admin key');
        return;
    }

    chrome.storage.sync.set({ adminKey }, () => {
        // Show success feedback
        const button = document.getElementById('saveSettings');
        const originalText = button.textContent;
        button.textContent = '✓ Saved!';
        button.style.background = '#00D9A3';
        button.style.color = 'white';
        button.style.border = '2px solid #00D9A3';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'white';
            button.style.color = '#00D9A3';
            button.style.border = '2px solid #00D9A3';
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
