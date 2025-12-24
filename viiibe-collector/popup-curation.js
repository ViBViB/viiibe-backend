// Moood! Collector PRO - Curation Mode
// Handles guided curation with real-time progress tracking

const API_BASE = 'https://moood-refactor.vercel.app/api';

// ============================================
// STATE MANAGEMENT
// ============================================

let currentMission = null;
let sessionData = {
    industry: null,
    count: 0,
    date: new Date().toDateString()
};

// ============================================
// LOAD CURATION MISSION
// ============================================

async function loadCurationMission() {
    console.log('🎯 Loading curation mission...');

    // Show loading state
    document.getElementById('curationLoading').style.display = 'block';
    document.getElementById('curationMission').style.display = 'none';
    document.getElementById('curationError').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/get-curation-mission`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const mission = await response.json();
        console.log('✅ Mission loaded:', mission);

        // Check if all complete
        if (mission.isComplete) {
            showAllComplete();
            return;
        }

        currentMission = mission;

        // Load session data from storage
        loadSessionData();

        // Update UI
        updateMissionUI(mission);

        // Hide loading, show mission
        document.getElementById('curationLoading').style.display = 'none';
        document.getElementById('curationMission').style.display = 'block';

    } catch (error) {
        console.error('❌ Error loading mission:', error);
        document.getElementById('curationLoading').style.display = 'none';
        document.getElementById('curationError').style.display = 'block';
    }
}

// ============================================
// UPDATE UI WITH MISSION DATA
// ============================================

function updateMissionUI(mission) {
    // Industry badge
    document.getElementById('industryBadge').textContent = mission.industry;

    // Tier badge
    const tierBadge = document.getElementById('tierBadge');
    tierBadge.textContent = (mission.tier || 'secondary').toUpperCase();
    tierBadge.className = 'tier-badge ' + (mission.tier || 'secondary');

    // Progress bar
    const progressBar = document.getElementById('curationProgress');
    progressBar.style.width = mission.progress + '%';

    // Counts
    document.getElementById('currentCount').textContent = mission.currentCount;
    document.getElementById('targetCount').textContent = mission.targetCount;

    // Remaining
    const remaining = mission.targetCount - mission.currentCount;
    document.getElementById('remainingCount').textContent = remaining;

    // Motivational message
    updateMotivationalMessage(remaining, mission.progress);

    // Pinterest search link
    const query = mission.queries && mission.queries[0] ? mission.queries[0] : `${mission.industry} website design`;
    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    document.getElementById('pinterestSearchLink').href = pinterestUrl;

    // Next industry
    if (mission.nextIndustry) {
        document.getElementById('nextIndustryCard').style.display = 'block';
        document.getElementById('currentIndustryName').textContent = mission.industry;
        document.getElementById('nextIndustryName').textContent = mission.nextIndustry;
    } else {
        document.getElementById('nextIndustryCard').style.display = 'none';
    }

    // Update session counter
    updateSessionUI();
}

// ============================================
// MOTIVATIONAL MESSAGES
// ============================================

function updateMotivationalMessage(remaining, progress) {
    const messageEl = document.getElementById('motivationalMessage');

    if (remaining === 0) {
        messageEl.textContent = '🎉 Target reached!';
    } else if (remaining <= 5) {
        messageEl.textContent = `Almost there! Just ${remaining} more! 🔥`;
    } else if (remaining <= 10) {
        messageEl.textContent = 'You\'re so close! Keep going! 💪';
    } else if (progress >= 75) {
        messageEl.textContent = 'Great progress! Don\'t stop now! 🚀';
    } else if (progress >= 50) {
        messageEl.textContent = 'Halfway there! You got this! ⭐';
    } else if (progress >= 25) {
        messageEl.textContent = 'Good start! Keep the momentum! 💫';
    } else {
        messageEl.textContent = 'Let\'s do this! 💪';
    }
}

// ============================================
// SESSION DATA MANAGEMENT
// ============================================

function loadSessionData() {
    chrome.storage.local.get(['curationSession'], (result) => {
        if (result.curationSession) {
            const stored = result.curationSession;
            const today = new Date().toDateString();

            // Reset if new day or different industry
            if (stored.date !== today || stored.industry !== currentMission.industry) {
                sessionData = {
                    industry: currentMission.industry,
                    count: 0,
                    date: today
                };
                saveSessionData();
            } else {
                sessionData = stored;
            }
        } else {
            sessionData = {
                industry: currentMission.industry,
                count: 0,
                date: new Date().toDateString()
            };
            saveSessionData();
        }

        updateSessionUI();
    });
}

function saveSessionData() {
    chrome.storage.local.set({ curationSession: sessionData });
}

function updateSessionUI() {
    document.getElementById('sessionCount').textContent = sessionData.count;
}

function incrementSession() {
    sessionData.count++;
    saveSessionData();
    updateSessionUI();

    // Check if we completed the target
    if (currentMission && sessionData.count >= (currentMission.targetCount - currentMission.currentCount)) {
        showCompletion();
    }
}

// ============================================
// COMPLETION CELEBRATION
// ============================================

function showCompletion() {
    document.getElementById('completionCard').style.display = 'block';
    document.getElementById('completionMessage').textContent = `${currentMission.industry} completed! 🎉`;

    // Scroll to completion card
    setTimeout(() => {
        document.getElementById('completionCard').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function showAllComplete() {
    document.getElementById('curationLoading').style.display = 'none';
    document.getElementById('curationMission').innerHTML = `
        <div class="stats-card" style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #00D9A3 0%, #00C090 100%); border: none; color: white;">
            <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <div style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">All Complete!</div>
            <div style="font-size: 14px; opacity: 0.9;">All industries are balanced. Great work!</div>
        </div>
    `;
    document.getElementById('curationMission').style.display = 'block';
}

// ============================================
// EVENT LISTENERS
// ============================================

// Refresh mission button
document.getElementById('refreshMission').addEventListener('click', () => {
    loadCurationMission();
});

// Retry button (error state)
document.getElementById('retryLoad').addEventListener('click', () => {
    loadCurationMission();
});

// Continue to next button
document.getElementById('continueToNext').addEventListener('click', () => {
    // Reset session for new industry
    sessionData = {
        industry: null,
        count: 0,
        date: new Date().toDateString()
    };
    saveSessionData();

    // Reload mission
    loadCurationMission();
});

// Listen for pin saves from batch mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'pin-saved' || request.action === 'batch-completed') {
        console.log('📌 Pin saved, updating session...');

        // Increment session counter
        if (currentMission && sessionData.industry === currentMission.industry) {
            incrementSession();
        }

        // Reload mission to get updated counts
        setTimeout(() => {
            loadCurationMission();
        }, 1000);
    }
});

// ============================================
// INITIALIZE
// ============================================

// Load mission when curation tab is active
if (document.getElementById('curation').classList.contains('active')) {
    loadCurationMission();
}

// Reload when tab becomes active
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.dataset.tab === 'curation') {
            loadCurationMission();
        }
    });
});

console.log('✅ Curation mode loaded');
