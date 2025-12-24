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

    // Refresh curator mode when entering batch screen
    if (screenName === 'batch') {
        loadCuratorMode();
    }
}

// ============================================
// STATS (DASHBOARD)
// ============================================

function loadStats() {
    chrome.storage.sync.get(['todayPins', 'totalPins', 'lastDate', 'adminKey'], (result) => {
        const today = new Date().toDateString();
        const lastDate = result.lastDate || '';

        // Reset today count if it's a new day
        let todayPins = result.todayPins || 0;
        if (lastDate !== today) {
            todayPins = 0;
            chrome.storage.sync.set({ todayPins: 0, lastDate: today });
        }

        // Update UI with cached values immediately
        document.getElementById('todayCount').textContent = todayPins;
        document.getElementById('totalCount').textContent = result.totalPins || 0;

        // Auto-sync with backend in background (if adminKey is set)
        if (result.adminKey) {
            syncTotalPinsFromBackend(result.adminKey);
        }
    });
}

// Import centralized configuration
const API_BASE = 'https://moood-refactor.vercel.app/api';

// Auto-sync total pins from backend (silent, non-blocking)
async function syncTotalPinsFromBackend(adminKey) {
    try {
        const response = await fetch(`${API_BASE}/pins?action=count&adminKey=${adminKey}`);

        if (!response.ok) {
            console.warn('Failed to sync total pins:', response.status);
            return;
        }

        const data = await response.json();
        const realTotal = data.count; // Note: pins endpoint returns 'count' not 'exactCount'

        // Update cache and UI
        await chrome.storage.sync.set({ totalPins: realTotal });
        document.getElementById('totalCount').textContent = realTotal;

        console.log(`✅ Auto-synced: ${realTotal} pins`);
    } catch (error) {
        console.warn('Auto-sync failed (using cached value):', error.message);
        // Silently fail - user still sees cached value
    }
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

        // Use pins endpoint with action=count for precise financial tracking
        const response = await fetch(`${API_BASE}/pins?action=count&adminKey=${adminKey}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const realTotal = data.count; // Exact count from KV
        const remaining = 1000 - realTotal;
        const percentage = ((realTotal / 1000) * 100).toFixed(1);

        // Update local cache
        await chrome.storage.sync.set({ totalPins: realTotal });

        // Show success with details
        button.innerHTML = `<span>✓ ${realTotal} pins (${remaining} left, ${percentage}% used)</span>`;
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
// CURATOR MODE
// ============================================

// Load curator mode on dashboard load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Popup v2 loaded');

    // Listen for batch save completion messages
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'batch-save-complete') {
            console.log('📨 Received batch-save-complete message, refreshing...');
            // Refresh curator mode and stats
            loadCuratorMode();
            loadStats();
        }
    });

    initNavigation();
    loadStats();
    loadCuratorMode();
});

async function loadCuratorMode() {
    try {
        const response = await fetch(`${API_BASE}/get-curation-mission`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const mission = await response.json();

        // CRITICAL OVERRIDE: Calculate correct industry locally until Vercel fixes
        // This bypasses the broken API logic
        const CORE_INDUSTRIES = {
            'Real Estate': { target: 100, current: 108 },
            'Finance': { target: 100, current: 57 },
            'Fitness': { target: 100, current: 54 },
            'Ecommerce': { target: 100, current: 46 },
            'Tech': { target: 100, current: 45 },
            'Education': { target: 100, current: 43 },
            'Saas': { target: 100, current: 41 },
            'Healthcare': { target: 100, current: 38 }
        };

        // Find incomplete industries, sort by HIGHEST count first
        const incomplete = Object.entries(CORE_INDUSTRIES)
            .filter(([name, data]) => data.current < data.target)
            .sort((a, b) => b[1].current - a[1].current);

        if (incomplete.length > 0) {
            const [currentIndustry, currentData] = incomplete[0];
            const nextIndustry = incomplete.length > 1 ? incomplete[1][0] : null;

            // Override mission with correct data
            mission.industry = currentIndustry;
            mission.currentCount = currentData.current;
            mission.targetCount = currentData.target;
            mission.progress = Math.round((currentData.current / currentData.target) * 100);
            mission.nextIndustry = nextIndustry;
            mission.tier = 'core';

            console.log('🔧 FRONTEND OVERRIDE:', currentIndustry, currentData.current + '/' + currentData.target);
        }

        if (mission.isComplete) {
            showAllComplete(mission);
        } else {
            showMission(mission);
        }
    } catch (error) {
        console.error('Error loading curator mode:', error);
        showCuratorError();
    }
}

function showMission(mission) {
    // Hide completion states (with null checks)
    const missionComplete = document.getElementById('missionComplete');
    const allComplete = document.getElementById('allComplete');
    if (missionComplete) missionComplete.style.display = 'none';
    if (allComplete) allComplete.style.display = 'none';

    // Show mission details
    const industryEl = document.getElementById('missionIndustry');
    if (industryEl) {
        industryEl.textContent = mission.industry.toUpperCase();
    }

    // Show next industry in header
    const nextContainer = document.getElementById('nextIndustryContainer');
    const nextIndustryEl = document.getElementById('nextIndustry');
    if (mission.nextIndustry && nextContainer && nextIndustryEl) {
        nextContainer.style.display = 'block';
        nextIndustryEl.textContent = mission.nextIndustry;
    } else if (nextContainer) {
        nextContainer.style.display = 'none';
    }

    // Update progress with DYNAMIC target (3-tier system)
    const currentEl = document.getElementById('progressCurrent');
    const targetEl = document.getElementById('progressTarget');
    const percentageEl = document.getElementById('progressPercentage');
    const progressBarEl = document.getElementById('missionProgressBar');

    if (currentEl) currentEl.textContent = mission.currentCount;
    if (targetEl) targetEl.textContent = mission.targetCount; // ✅ Dynamic!
    if (percentageEl) percentageEl.textContent = `${mission.progress}%`;
    if (progressBarEl) progressBarEl.style.width = `${mission.progress}%`;

    // Render queries (removed from UI but keeping code for potential future use)
    const queryList = document.getElementById('queryList');
    if (queryList) {
        queryList.innerHTML = '';

        mission.queries.forEach((query, index) => {
            const card = document.createElement('div');
            card.className = 'query-card';
            card.innerHTML = `
                <span class="query-text">${index + 1}. ${query}</span>
                <button class="btn-copy-query" data-query="${query}">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 7.65624L11.6667 4.74996C11.6667 3.09309 10.3236 1.74994 8.66671 1.74996L5.7605 1.74999M8.16675 12.25L4.22925 12.25C3.50438 12.25 2.91675 11.6624 2.91675 10.9375L2.91675 5.24999C2.91675 4.52512 3.50437 3.93749 4.22925 3.93749L8.16675 3.93749C8.89162 3.93749 9.47925 4.52512 9.47925 5.24999L9.47925 10.9375C9.47925 11.6624 8.89162 12.25 8.16675 12.25Z" stroke="black" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                </button>
            `;
            queryList.appendChild(card);
        });

        // Add copy listeners
        document.querySelectorAll('.btn-copy-query').forEach(btn => {
            btn.addEventListener('click', () => copyQuery(btn));
        });
    }

    // Check if mission is complete
    if (mission.currentCount >= mission.targetCount) {
        showMissionComplete(mission);
    }
}

function copyQuery(btn) {
    const query = btn.dataset.query;
    navigator.clipboard.writeText(query);

    btn.classList.add('copied');

    setTimeout(() => {
        btn.classList.remove('copied');
    }, 2000);
}

function showMissionComplete(mission) {
    const missionCompleteEl = document.getElementById('missionComplete');
    const nextIndustryEl = document.getElementById('nextIndustry');

    if (missionCompleteEl) {
        missionCompleteEl.style.display = 'block';
    }

    if (nextIndustryEl) {
        nextIndustryEl.textContent = mission.nextIndustry || 'None';
    }

    const btnNext = document.getElementById('btnNextMission');
    if (btnNext) {
        btnNext.onclick = () => {
            loadCuratorMode(); // Reload to get next mission
        };
    }
}

function showAllComplete(mission) {
    const allCompleteEl = document.getElementById('allComplete');
    const totalPinsEl = document.getElementById('totalPinsComplete');

    if (allCompleteEl) {
        allCompleteEl.style.display = 'block';
    }

    if (totalPinsEl && mission.totalProgress) {
        totalPinsEl.textContent = mission.totalProgress.current;
    }
}

function showCuratorError() {
    const industry = document.getElementById('missionIndustry');
    if (industry) {
        industry.textContent = 'ERROR';
        industry.style.color = '#ff6b6b';
    }
}

// Auto-refresh after batch save
chrome.storage.onChanged.addListener((changes) => {
    if (changes.totalPins) {
        // Batch save completed, refresh mission
        setTimeout(() => loadCuratorMode(), 1000);
    }
});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
    });
}

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
