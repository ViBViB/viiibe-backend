// ============================================
// MOOOD! COLLECTOR V2 - REWRITTEN (Dec 26, 2024)
// Clean, minimal implementation
// ============================================

// API Configuration
const API_BASE = 'https://moood-refactor.vercel.app/api';

// State Management
let currentScreen = 'dashboard';
let batchState = 'initial';
let scannedImages = [];
let selectedCount = 0;
let currentMissionIndustry = null;

// ============================================
// INITIALIZATION (Single event listener)
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Moood! Collector v2 loaded');

    // Initialize UI
    initNavigation();
    initBatchHandlers();
    setupStorageListener();

    // Load data
    loadStats();
    await loadCuratorMode();
});

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const screen = item.dataset.screen;
            switchScreen(screen);
        });
    });
}

function switchScreen(screenName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.screen === screenName);
    });
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === screenName);
    });
    currentScreen = screenName;

    if (screenName === 'batch') {
        loadCuratorMode();
    }
}

// ============================================
// STATS (DASHBOARD)
// ============================================

async function loadStats() {
    // Get today's count from local storage
    chrome.storage.sync.get(['todayPins', 'lastDate'], (result) => {
        const today = new Date().toDateString();
        let todayPins = result.todayPins || 0;

        if (result.lastDate !== today) {
            todayPins = 0;
            chrome.storage.sync.set({ todayPins: 0, lastDate: today });
        }

        document.getElementById('todayCount').textContent = todayPins;
    });

    // Fetch REAL total from API
    try {
        const response = await fetch(`${API_BASE}/get-curation-mission`);
        if (response.ok) {
            const data = await response.json();
            const totalPins = data.totalProgress?.current || 0;
            document.getElementById('totalCount').textContent = totalPins;
            console.log(`📊 Total pins from API: ${totalPins}`);
        }
    } catch (error) {
        console.error('Failed to fetch total pins:', error);
        // Fallback to local storage
        chrome.storage.sync.get(['totalPins'], (result) => {
            document.getElementById('totalCount').textContent = result.totalPins || 0;
        });
    }
}

function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && (changes.todayPins || changes.totalPins)) {
            loadStats();
        }
        if (changes.industryCounts) {
            loadCuratorMode();
        }
    });
}

// ============================================
// SETTINGS
// ============================================

document.getElementById('saveSettings')?.addEventListener('click', () => {
    const adminKey = document.getElementById('adminKey').value;
    const defaultCategory = document.getElementById('defaultCategory').value;

    if (!adminKey) {
        alert('Please enter your admin key');
        return;
    }

    chrome.storage.sync.set({ adminKey, defaultCategory }, () => {
        const button = document.getElementById('saveSettings');
        button.textContent = '✓ Saved!';
        button.style.background = '#00D9A3';
        setTimeout(() => {
            button.textContent = 'Save Settings';
            button.style.background = '';
        }, 2000);
    });
});

document.getElementById('syncStats')?.addEventListener('click', async () => {
    const button = document.getElementById('syncStats');
    button.disabled = true;
    button.innerHTML = '<span>Syncing...</span>';

    try {
        await syncIndustryCounts(true);  // FORCE REFRESH to get accurate data
        await loadCuratorMode();

        button.innerHTML = '<span>✓ Synced!</span>';
        button.style.background = '#00D9A3';
    } catch (error) {
        alert(`Sync failed: ${error.message}`);
    } finally {
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = '<span>Sync Stats</span>';
            button.style.background = '';
        }, 2000);
    }
});

// ============================================
// CURATOR MODE (Core Logic)
// ============================================

async function loadCuratorMode() {
    try {
        // 1. Check for locked category
        const locked = await chrome.storage.local.get('lockedCategory');

        if (locked.lockedCategory) {
            // Get fresh counts from API
            const response = await fetch(`${API_BASE}/get-curation-mission`);
            const data = await response.json();
            const currentCount = data.allCounts[locked.lockedCategory.name] || 0;

            // Check if complete
            if (currentCount >= locked.lockedCategory.target) {
                await chrome.storage.local.remove('lockedCategory');
                console.log(`✅ ${locked.lockedCategory.name} COMPLETE! Unlocking...`);
                // Fall through to find next category
            } else {
                // STAY LOCKED - show locked category
                console.log(`🔒 LOCKED: ${locked.lockedCategory.name} (${currentCount}/${locked.lockedCategory.target})`);
                currentMissionIndustry = locked.lockedCategory.name;
                showMission({
                    name: locked.lockedCategory.name,
                    current: currentCount,
                    target: locked.lockedCategory.target,
                    progress: Math.round((currentCount / locked.lockedCategory.target) * 100),
                    tier: locked.lockedCategory.target === 100 ? 'core' : 'secondary',
                    locked: true
                });
                return;
            }
        }

        // 2. No lock or just completed - find next category
        console.log('📡 Syncing counts from API...');
        const synced = await syncIndustryCounts(false);

        let counts;
        if (synced) {
            const fresh = await chrome.storage.local.get('industryCounts');
            counts = fresh.industryCounts;
        }

        if (!counts) {
            showError('No data available. Please check your connection.');
            return;
        }

        const mission = getCurrentMission(counts);

        if (mission.isAllComplete) {
            showAllComplete();
            return;
        }

        // 3. LOCK the new category
        await chrome.storage.local.set({
            lockedCategory: {
                name: mission.name,
                target: mission.target,
                startCount: mission.current,
                lockedAt: Date.now()
            }
        });
        console.log(`🔒 LOCKED: ${mission.name} (${mission.current}/${mission.target})`);

        // Store for forced category
        currentMissionIndustry = mission.name;

        // Update UI
        showMission(mission);

        console.log(`🎯 Current mission: ${mission.name} (${mission.current}/${mission.target})`);

    } catch (error) {
        console.error('Error in loadCuratorMode:', error);
        showError('Error loading data');
    }
}

function showMission(mission) {
    const industryEl = document.getElementById('missionIndustry');
    const currentEl = document.getElementById('progressCurrent');
    const targetEl = document.getElementById('progressTarget');
    const percentEl = document.getElementById('progressPercentage');
    const barEl = document.getElementById('missionProgressBar');

    if (industryEl) industryEl.textContent = mission.name.toUpperCase();
    if (currentEl) currentEl.textContent = mission.current;
    if (targetEl) targetEl.textContent = mission.target;
    if (percentEl) percentEl.textContent = `${mission.progress}%`;
    if (barEl) barEl.style.width = `${mission.progress}%`;

    // Show lock indicator if locked
    const lockIndicator = document.getElementById('lockIndicator');
    if (lockIndicator) {
        lockIndicator.style.display = mission.locked ? 'inline' : 'none';
    }

    // Hide completion states
    const allComplete = document.getElementById('allComplete');
    if (allComplete) allComplete.style.display = 'none';
}

function showAllComplete() {
    const industryEl = document.getElementById('missionIndustry');
    const allComplete = document.getElementById('allComplete');

    if (industryEl) {
        industryEl.textContent = 'ALL COMPLETE! 🎉';
        industryEl.style.color = '#00D9A3';
    }
    if (allComplete) {
        allComplete.style.display = 'block';
    }

    currentMissionIndustry = null;
}

function showError(message) {
    const industryEl = document.getElementById('missionIndustry');
    if (industryEl) {
        industryEl.textContent = 'ERROR';
        industryEl.style.color = '#ff6b6b';
    }
    console.error(message);
}

// ============================================
// API SYNC
// ============================================

async function syncIndustryCounts(forceRefresh = false) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout (refresh is slower)

        // Add ?refresh=true to bypass server cache when needed
        const url = forceRefresh
            ? `${API_BASE}/get-curation-mission?refresh=true`
            : `${API_BASE}/get-curation-mission`;

        console.log(`🔄 Syncing counts${forceRefresh ? ' (FORCE REFRESH)' : ''}...`);

        const response = await fetch(url, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.allCounts) {
            await chrome.storage.local.set({
                industryCounts: data.allCounts,
                lastSync: Date.now()
            });
            console.log('✅ Counts synced:', Object.keys(data.allCounts).length, 'categories');
            return true;
        }

        return false;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('⏱️ Sync timeout');
        } else {
            console.error('❌ Sync failed:', error.message);
        }
        return false;
    }
}

// ============================================
// BATCH PROCESSING
// ============================================

function initBatchHandlers() {
    document.getElementById('scanBtn')?.addEventListener('click', handleScanClick);
    document.getElementById('processBtn')?.addEventListener('click', handleProcessClick);
}

async function handleScanClick() {
    const btn = document.getElementById('scanBtn');
    const btnText = document.getElementById('scanBtnText');

    btn.disabled = true;
    btnText.textContent = 'Scanning...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('pinterest.com') && !tab.url.includes('pinterest.cl')) {
            alert('Please navigate to Pinterest first!');
            return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'scan-images-for-popup'
        });

        if (response?.images?.length > 0) {
            scannedImages = response.images;
            selectedCount = scannedImages.filter(img => img.selected).length;
            renderGrid();
            setBatchState('scanned');
        } else {
            alert('No images found on this page.');
        }
    } catch (err) {
        console.error('Scan error:', err);
        alert('Could not scan page. Please refresh and try again.');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Smart Scan';
    }
}

function renderGrid() {
    const grid = document.getElementById('thumbnailGrid');
    if (!grid) return;

    grid.innerHTML = '';

    scannedImages.forEach((imageData, index) => {
        const item = document.createElement('div');
        item.className = 'grid-item' + (imageData.selected ? '' : ' deselected');

        const img = document.createElement('img');
        img.src = imageData.src;
        img.alt = imageData.alt || '';

        item.appendChild(img);
        item.addEventListener('click', () => toggleSelection(index));
        grid.appendChild(item);
    });

    updateSelectionCounter();
}

function toggleSelection(index) {
    scannedImages[index].selected = !scannedImages[index].selected;

    const items = document.querySelectorAll('.grid-item');
    items[index].classList.toggle('deselected');

    selectedCount = scannedImages.filter(img => img.selected).length;
    updateSelectionCounter();

    document.getElementById('processBtn').disabled = selectedCount === 0;
}

function updateSelectionCounter() {
    const counter = document.getElementById('selectionCounter');
    if (counter) {
        counter.textContent = `${selectedCount} designs selected.`;
    }
}

async function handleProcessClick() {
    if (selectedCount === 0) return;

    setBatchState('processing');

    const selectedImages = scannedImages.filter(img => img.selected);
    let saved = 0, duplicates = 0, failed = 0;

    for (let i = 0; i < selectedImages.length; i++) {
        updateProgress(i + 1, selectedImages.length);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'save-image-from-popup',
                imageData: selectedImages[i],
                forcedCategory: currentMissionIndustry  // FORCE category
            });

            if (response?.success === 'saved') saved++;
            else if (response?.success === 'duplicate') duplicates++;
            else failed++;

        } catch (err) {
            console.error('Error saving image:', err);
            failed++;
        }
    }

    showResults(saved, duplicates, failed);

    if (saved > 0) {
        // Update local stats
        chrome.storage.sync.get(['todayPins', 'totalPins', 'lastDate'], (result) => {
            const today = new Date().toDateString();
            let todayPins = result.todayPins || 0;
            if (result.lastDate !== today) todayPins = 0;

            chrome.storage.sync.set({
                todayPins: todayPins + saved,
                totalPins: (result.totalPins || 0) + saved,
                lastDate: today
            });
        });

        // Sync counts after save - FORCE REFRESH to bypass server cache
        await syncIndustryCounts(true);
        await loadCuratorMode();
    }
}

function updateProgress(current, total) {
    const label = document.getElementById('progressLabel');
    const bar = document.getElementById('progressBar');

    if (label) label.textContent = `Processing ${current}/${total} images`;
    if (bar) bar.style.width = `${(current / total) * 100}%`;
}

function showResults(saved, duplicates, failed) {
    document.getElementById('savedCount').textContent = saved;
    document.getElementById('duplicatesCount').textContent = duplicates;
    document.getElementById('failedCount').textContent = failed;
    setBatchState('results');
}

function setBatchState(state) {
    batchState = state;

    document.querySelectorAll('.batch-state').forEach(el => el.classList.add('hidden'));

    const stateMap = {
        'initial': 'batch-initial',
        'scanned': 'batch-scanned',
        'processing': 'batch-processing',
        'results': 'batch-results'
    };

    document.getElementById(stateMap[state])?.classList.remove('hidden');

    const scanBtn = document.getElementById('scanBtn');
    const processBtn = document.getElementById('processBtn');

    if (scanBtn) scanBtn.disabled = state === 'processing';
    if (processBtn) processBtn.disabled = state !== 'scanned' || selectedCount === 0;
}

// ============================================
// SHARED LOGIC (from categories-config.js)
// ============================================

// Inline the getCurrentMission logic to avoid import issues in Chrome extension
function getCurrentMission(counts) {
    const allCategories = [
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
        { name: 'Agriculture', target: 50 },
        { name: 'NGO', target: 50 },
        { name: 'Portfolio', target: 50 }
    ];

    const incomplete = allCategories
        .map(cat => {
            const count = getCountCaseInsensitive(counts, cat.name);
            return {
                name: cat.name,
                target: cat.target,
                current: count,
                progress: Math.round((count / cat.target) * 100),
                tier: cat.target === 100 ? 'core' : 'secondary',
                isComplete: count >= cat.target
            };
        })
        .filter(cat => !cat.isComplete)
        .sort((a, b) => a.current - b.current);

    if (incomplete.length === 0) {
        return { name: null, isAllComplete: true };
    }

    return incomplete[0];
}

function getCountCaseInsensitive(counts, name) {
    if (!counts) return 0;
    if (counts[name] !== undefined) return counts[name];

    const lowerName = name.toLowerCase();
    for (const key of Object.keys(counts)) {
        if (key.toLowerCase() === lowerName) return counts[key];
    }
    return 0;
}
