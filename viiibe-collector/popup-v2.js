// ============================================
// MOOOD! COLLECTOR V2 - MAIN SCRIPT
// ============================================

// State Management
let currentScreen = 'dashboard';
let batchState = 'initial'; // initial, scanned, processing, results
let scannedImages = [];
let selectedCount = 0;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Force popup size
    document.documentElement.style.width = '600px';
    document.documentElement.style.height = '600px';
    document.body.style.width = '600px';
    document.body.style.height = '600px';

    // Initialize app
    initNavigation();
    loadStats();
    loadSettings();
    initBatchHandlers();
    setupStorageListener();
});

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screen = item.dataset.screen;
            switchScreen(screen);
        });
    });
}

function switchScreen(screenName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.screen === screenName);
    });

    // Update screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === screenName);
    });

    currentScreen = screenName;
}

// ============================================
// STATS (DASHBOARD)
// ============================================

function loadStats() {
    chrome.storage.sync.get(['todayPins', 'totalPins', 'lastDate'], (result) => {
        const today = new Date().toDateString();
        const lastDate = result.lastDate || '';

        // Reset today count if it's a new day
        let todayPins = result.todayPins || 0;
        if (lastDate !== today) {
            todayPins = 0;
            chrome.storage.sync.set({ todayPins: 0, lastDate: today });
        }

        // Update UI
        document.getElementById('todayCount').textContent = todayPins;
        document.getElementById('totalCount').textContent = result.totalPins || 0;
    });
}

// Auto-refresh stats when storage changes
function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
            if (changes.todayPins || changes.totalPins) {
                loadStats();
            }
        }
    });
}

// ============================================
// SETTINGS
// ============================================

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
        const originalText = button.textContent;
        button.textContent = '✓ Saved!';
        button.style.background = '#00D9A3';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    });
});

// Sync Stats with Backend
document.getElementById('syncStats').addEventListener('click', async () => {
    const button = document.getElementById('syncStats');
    const originalHTML = button.innerHTML;

    try {
        // Disable button and show loading
        button.disabled = true;
        button.innerHTML = '<span>Syncing...</span>';

        // Get admin key
        const { adminKey } = await chrome.storage.sync.get(['adminKey']);

        if (!adminKey) {
            alert('Please set your admin key first');
            button.disabled = false;
            button.innerHTML = originalHTML;
            return;
        }

        // Call optimized count endpoint
        const API_BASE = 'https://viiibe-backend-nfueitpl1-alberto-contreras-projects-101c33ba.vercel.app/api';
        const response = await fetch(`${API_BASE}/get-pins-count?adminKey=${adminKey}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const realTotal = data.count;

        // Update local cache
        await chrome.storage.sync.set({ totalPins: realTotal });

        // Show success
        button.innerHTML = `<span>✓ Synced! Total: ${realTotal}</span>`;
        button.style.background = '#00D9A3';
        button.style.color = '#fff';

        // Reload stats
        loadStats();

        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalHTML;
            button.style.background = '';
            button.style.color = '';
        }, 3000);

    } catch (error) {
        console.error('Sync error:', error);
        alert(`Failed to sync: ${error.message}\n\nPlease check your admin key and try again.`);
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
});

// ============================================
// BATCH PROCESSING
// ============================================

function initBatchHandlers() {
    const scanBtn = document.getElementById('scanBtn');
    const processBtn = document.getElementById('processBtn');

    scanBtn.addEventListener('click', handleScanClick);
    processBtn.addEventListener('click', handleProcessClick);
}

async function handleScanClick() {
    const btn = document.getElementById('scanBtn');
    const btnText = document.getElementById('scanBtnText');

    if (batchState === 'processing') {
        // Cancel processing
        cancelProcessing();
        return;
    }

    // Disable button
    btn.disabled = true;
    btnText.textContent = 'Scanning...';

    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Check if on Pinterest
        if (!tab.url.includes('pinterest.com') && !tab.url.includes('pinterest.cl')) {
            alert('Please navigate to Pinterest first!');
            btn.disabled = false;
            btnText.textContent = batchState === 'initial' ? 'Smart Scan' : 'Scan page';
            return;
        }

        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'scan-images-for-popup'
        });

        if (response && response.images && response.images.length > 0) {
            scannedImages = response.images;
            selectedCount = scannedImages.filter(img => img.selected).length;

            renderGrid();
            setBatchState('scanned');
        } else {
            alert('No images found on this page.');
        }

    } catch (err) {
        console.error('Scan error:', err);

        let errorMsg = 'Could not scan page. Please try the following:\n\n';
        if (err.message && err.message.includes('Receiving end does not exist')) {
            errorMsg += '1. Refresh the Pinterest page\n';
            errorMsg += '2. Reload the extension (chrome://extensions/)\n';
            errorMsg += '3. Try again';
        } else {
            errorMsg += '1. Refresh the Pinterest page\n';
            errorMsg += '2. Try again';
        }

        alert(errorMsg);
    } finally {
        btn.disabled = false;
        btnText.textContent = batchState === 'initial' ? 'Smart Scan' : 'Scan page';
    }
}

function renderGrid() {
    const grid = document.getElementById('thumbnailGrid');
    grid.innerHTML = '';

    scannedImages.forEach((imageData, index) => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        if (!imageData.selected) {
            item.classList.add('deselected');
        }

        const img = document.createElement('img');
        img.src = imageData.src;
        img.alt = imageData.alt || '';

        item.appendChild(img);

        // Click to toggle selection
        item.addEventListener('click', () => {
            toggleSelection(index);
        });

        grid.appendChild(item);
    });

    updateSelectionCounter();
}

function toggleSelection(index) {
    scannedImages[index].selected = !scannedImages[index].selected;

    // Update UI
    const items = document.querySelectorAll('.grid-item');
    items[index].classList.toggle('deselected');

    // Update counter
    selectedCount = scannedImages.filter(img => img.selected).length;
    updateSelectionCounter();

    // Enable/disable process button
    document.getElementById('processBtn').disabled = selectedCount === 0;
}

function updateSelectionCounter() {
    const counter = document.getElementById('selectionCounter');
    counter.textContent = `${selectedCount} designs selected. Deselect the ones you think are not a good fit in terms of design quality.`;
}

async function handleProcessClick() {
    if (selectedCount === 0) return;

    setBatchState('processing');

    const selectedImages = scannedImages.filter(img => img.selected);
    let saved = 0;
    let duplicates = 0;
    let failed = 0;

    for (let i = 0; i < selectedImages.length; i++) {
        // Update progress
        updateProgress(i + 1, selectedImages.length);

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send message to save image
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'save-image-from-popup',
                imageData: selectedImages[i]
            });

            if (response && response.success) {
                if (response.success === 'saved') {
                    saved++;
                } else if (response.success === 'duplicate') {
                    duplicates++;
                }
            } else {
                failed++;
            }

        } catch (err) {
            console.error('Error saving image:', err);
            failed++;
        }
    }

    // Show results
    showResults(saved, duplicates, failed);

    // Update storage
    if (saved > 0) {
        chrome.storage.sync.get(['todayPins', 'totalPins', 'lastDate'], (result) => {
            const today = new Date().toDateString();
            let todayPins = result.todayPins || 0;
            let totalPins = result.totalPins || 0;

            if (result.lastDate !== today) {
                todayPins = 0;
            }

            todayPins += saved;
            totalPins += saved;

            chrome.storage.sync.set({
                todayPins,
                totalPins,
                lastDate: today
            });
        });
    }
}

function updateProgress(current, total) {
    const label = document.getElementById('progressLabel');
    const bar = document.getElementById('progressBar');

    label.textContent = `Processing ${current}/${total} images`;
    bar.style.width = `${(current / total) * 100}%`;
}

function showResults(saved, duplicates, failed) {
    document.getElementById('savedCount').textContent = saved;
    document.getElementById('duplicatesCount').textContent = duplicates;
    document.getElementById('failedCount').textContent = failed;

    setBatchState('results');
}

function cancelProcessing() {
    // TODO: Implement cancel logic
    setBatchState('scanned');
}

// ============================================
// BATCH STATE MANAGEMENT
// ============================================

function setBatchState(state) {
    batchState = state;

    // Hide all states
    document.querySelectorAll('.batch-state').forEach(el => {
        el.classList.add('hidden');
    });

    // Show current state
    const stateMap = {
        'initial': 'batch-initial',
        'scanned': 'batch-scanned',
        'processing': 'batch-processing',
        'results': 'batch-results'
    };

    document.getElementById(stateMap[state]).classList.remove('hidden');

    // Update buttons
    updateBatchButtons();
}

function updateBatchButtons() {
    const scanBtn = document.getElementById('scanBtn');
    const scanBtnText = document.getElementById('scanBtnText');
    const processBtn = document.getElementById('processBtn');
    const processBtnText = document.getElementById('processBtnText');

    switch (batchState) {
        case 'initial':
            scanBtn.disabled = false;
            processBtn.disabled = true;
            break;

        case 'scanned':
            scanBtn.disabled = false;
            processBtn.disabled = selectedCount === 0;
            break;

        case 'processing':
            scanBtn.disabled = true;
            processBtn.disabled = false;
            break;

        case 'results':
            scanBtn.disabled = false;
            processBtn.disabled = true;
            break;
    }
}
