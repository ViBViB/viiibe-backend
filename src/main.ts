import './styles/main.css';
import { showView, showToast, tabs } from './ui/views';
import { switchTab, startSearch, applyVisualFilter, updateProgress } from './ui/moodboard';
import { API_BASE_URL, getImageProxyUrl, upgradeToOriginals, upgradeTo736x } from './config';
import lottie, { AnimationItem } from 'lottie-web';
import viiibeLogo from './assets/viiibe-logo.json';

// ==============================================================
// STYLE GUIDE DATA COLLECTION
// ==============================================================

import { calculatePaletteFromImages, extractAndGeneratePalette, detectEdgeColor } from './ui/palette';

// ==============================================================
// MINI-PRD CONTROLLER
// ==============================================================

import { MiniPRDController, MiniPRD } from './ui/mini-prd-gpt';

// Lottie animation instance
let logoAnimation: AnimationItem | null = null;

// Pin cache for instant reloads
let cachedPins: any[] = [];
let currentPage = 0;
const PINS_PER_PAGE = 20;
let currentQuery = '';

// Fundamentals download tracking
let figmaUserId = 'anonymous-user';
let fundamentalsDownloadsUsed = 0;
const FUNDAMENTALS_FREE_LIMIT = 3;
let isPro = false; // To be synced with backend/KV later
let pollingInterval: any = null;

// Stripe Configuration (Replace with your Price ID)
const STRIPE_PRICE_ID = 'price_1SzlyRRdpVcohn7Xmzb4J7GY';

async function syncWithBackend(showSuccessToast: boolean = false) {
    // Add cache buster to prevent browser/Figma caching of the status
    const cacheBuster = Date.now();
    console.log(`📡 [Backend Sync] Checking status for user: ${figmaUserId} (t=${cacheBuster})`);

    try {
        const response = await fetch(`https://viiibe-backend.vercel.app/api/user-status?userId=${figmaUserId}&t=${cacheBuster}`, {
            method: 'GET',
            cache: 'no-store' // Prevent caching without custom headers
        });
        const data = await response.json();

        if (data.success) {
            const wasProBefore = isPro;

            // Check all possible flags for PRO status
            isPro = data.isPro ||
                (data.debug && data.debug.is_pro_val) ||
                (data.raw_data && data.raw_data.is_pro) ||
                (data.raw_data && data.raw_data.status === 'PRO_FORCED') ||
                (data.raw_data && data.raw_data.status === 'PRO_VERIFIED') ||
                false;

            // Log detailed debug info for troubleshooting
            console.log('📡 [Backend Sync] Debug info:', {
                is_pro_result: isPro,
                was_pro_before: wasProBefore,
                raw_data: data
            });

            // ALWAYS sync with backend as source of truth
            // This allows resets to work properly
            fundamentalsDownloadsUsed = data.downloadsCount;

            updateFundamentalsBadge();

            // If we just detected PRO status change
            if (isPro && !wasProBefore) {
                console.log('✨ [Sync] PRO status just activated!');

                // Stop any active polling
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    console.log('⏹️ [Polling] Stopped polling - PRO confirmed');
                }

                // If we are in the upgrade view, switch back to main
                const drawer = document.getElementById('styleGuideDrawer');
                if (drawer && drawer.classList.contains('show-upgrade')) {
                    console.log('✨ [Sync] Closing upgrade view.');
                    switchToMainDrawer();
                }

                // Show success toast
                showToast('🎉 Viiibe Pro Unlocked!');
            } else if (isPro && wasProBefore && showSuccessToast) {
                // Already PRO, but user requested sync (e.g., from upgrade button)
                showToast('✅ You already have Viiibe Pro!');
            }

            console.log(`📡 [Backend Sync] Status: ${isPro ? 'PRO' : 'FREE'}, Downloads: ${fundamentalsDownloadsUsed}`);

            return isPro;
        }
    } catch (e) {
        console.warn('📡 [Backend Sync] Failed to sync with backend:', e);
        return false;
    }
}

// Monitor localStorage for payment completion signal from success.html
function startPaymentCompletionMonitor() {
    console.log('👀 [Payment Monitor] Starting localStorage monitor...');

    const checkInterval = setInterval(() => {
        try {
            const proActivated = localStorage.getItem('viiibe_pro_activated');
            if (proActivated) {
                const timestamp = parseInt(proActivated);
                const now = Date.now();

                // If flag was set in the last 60 seconds, it's fresh
                if (now - timestamp < 60000) {
                    console.log('🎊 [Payment Monitor] Detected PRO activation flag! Syncing...');
                    localStorage.removeItem('viiibe_pro_activated'); // Clear flag
                    syncWithBackend(false); // Sync immediately
                    clearInterval(checkInterval); // Stop monitoring
                }
            }
        } catch (e) {
            console.warn('⚠️ [Payment Monitor] localStorage check failed:', e);
        }
    }, 1000); // Check every second

    // Stop monitoring after 2 minutes
    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏹️ [Payment Monitor] Stopped monitoring after 2 minutes');
    }, 120000);
}

interface StyleGuideConfig {
    downloadMoodboard: boolean;
    downloadColorPalette: boolean;
    downloadTypeScale: boolean;
    createFigmaStyles: boolean;
    createFigmaVariables: boolean;
    createBasicComponents: boolean;
}

function openDrawer() {
    const drawer = document.getElementById('styleGuideDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer && backdrop) {
        backdrop.classList.add('active');
        drawer.classList.add('active');
        document.body.classList.add('drawer-open'); // Hide footer overlay
    }
}

function closeDrawer() {
    const drawer = document.getElementById('styleGuideDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('active');
        drawer.classList.remove('active');
        document.body.classList.remove('drawer-open'); // Show footer overlay

        // Reset to main view after animation finishes
        setTimeout(() => {
            switchToMainDrawer();
        }, 300);
    }
}

function switchToUpgradeDrawer(featureName: string = "") {
    const drawer = document.getElementById('styleGuideDrawer');
    const title = document.getElementById('drawerTitle');

    if (drawer) {
        if (isPro) {
            // If already PRO, just stay in main view or show success
            switchToMainDrawer();
            showToast('You already have Viiibe! Pro');
            return;
        }

        drawer.classList.add('show-upgrade');
        if (title) title.textContent = featureName ? `Unlock ${featureName}` : "Get Viiibe Pro";

        // If polling is active, update button state to show we are waiting
        const unlockBtn = document.getElementById('unlockProBtn');
        if (unlockBtn && pollingInterval) {
            unlockBtn.textContent = 'Verifying payment...';
            unlockBtn.setAttribute('disabled', 'true');
        }
    }
}

function switchToMainDrawer() {
    const drawer = document.getElementById('styleGuideDrawer');
    const title = document.getElementById('drawerTitle');
    if (drawer) {
        drawer.classList.remove('show-upgrade');
        if (title) title.textContent = "Get your Viiibe!";
    }
}

// Fundamentals tracking functions
function checkFundamentalsLimit(): boolean {
    if (isPro) return true; // PRO users have no limit

    // If we haven't loaded any count yet, try fallback
    if (fundamentalsDownloadsUsed === 0) {
        try {
            const local = localStorage.getItem('fundamentalsDownloads');
            if (local) fundamentalsDownloadsUsed = parseInt(local);
        } catch (e) { }
    }

    const hasLimitRemaining = fundamentalsDownloadsUsed < FUNDAMENTALS_FREE_LIMIT;
    console.log(`🔍 Limit check: ${fundamentalsDownloadsUsed}/${FUNDAMENTALS_FREE_LIMIT} (Has remaining: ${hasLimitRemaining})`);
    return hasLimitRemaining;
}

async function incrementFundamentalsDownload() {
    // 1. Increment locally immediately for instant feedback
    fundamentalsDownloadsUsed++;
    console.log(`📊 Incrementing! New count: ${fundamentalsDownloadsUsed}`);
    updateFundamentalsBadge();

    // 2. Persist to Figma clientStorage immediately (via code.js)
    // This is the MOST reliable way in Figma
    parent.postMessage({
        pluginMessage: {
            type: "sync-downloads",
            count: fundamentalsDownloadsUsed
        }
    }, "*");

    // 3. Persist to localStorage (as fallback)
    try {
        localStorage.setItem('fundamentalsDownloads', fundamentalsDownloadsUsed.toString());
    } catch (e) {
        console.warn('localStorage write failed');
    }

    // 4. Sync with cloud backend (fire and forget)
    fetch(`https://viiibe-backend.vercel.app/api/increment-downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: figmaUserId })
    }).then(() => console.log('📡 [Backend Sync] Cloud incremented'))
        .catch(e => console.warn('📡 [Backend Sync] Cloud failed', e));
}

function updateFundamentalsBadge() {
    const badge = document.getElementById('fundamentals-badge');
    const unlockBtn = document.getElementById('unlockProBtn');

    if (unlockBtn) {
        unlockBtn.style.display = isPro ? 'none' : 'block';
    }

    if (!badge) return;

    if (isPro) {
        badge.textContent = 'VIIIBE! PRO ACTIVE';
        badge.className = 'drawer-section-badge badge-pro-active';
        badge.style.color = '#10B981'; // Green for Pro
        badge.style.fontWeight = '700';
        return;
    }

    const remaining = FUNDAMENTALS_FREE_LIMIT - fundamentalsDownloadsUsed;
    if (remaining > 0) {
        badge.textContent = `${remaining} FREE DOWNLOAD${remaining === 1 ? '' : 'S'}`;
        badge.className = 'drawer-section-badge badge-fundamentals';
        badge.style.color = ''; // Reset
    } else {
        badge.textContent = 'UPGRADE TO PRO';
        badge.className = 'drawer-section-badge badge-fundamentals';
        badge.style.color = '#DC2626'; // Red color for upgrade
    }
}

function showUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}


function closeUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function getStyleGuideConfig(): StyleGuideConfig {
    return {
        downloadMoodboard: (document.getElementById('toggle-moodboard') as HTMLInputElement)?.checked || false,
        downloadColorPalette: (document.getElementById('toggle-palette') as HTMLInputElement)?.checked || false,
        downloadTypeScale: (document.getElementById('toggle-typography') as HTMLInputElement)?.checked || false,
        createFigmaStyles: (document.getElementById('toggle-styles') as HTMLInputElement)?.checked || false,
        createFigmaVariables: (document.getElementById('toggle-variables') as HTMLInputElement)?.checked || false,
        createBasicComponents: false // Always false for now
    };
}

// ...

async function collectAllData(): Promise<{ images: any[], colors: any[], typography: any[] }> {
    // Collect images
    const imageElements = document.querySelectorAll('.pin-image');
    console.log("🎨 [collectAllData] Found image elements:", imageElements.length);

    const imagePromises: Promise<any>[] = [];

    imageElements.forEach((img: any) => {
        // Accept both blob: URLs and proxy URLs
        if (img.src && (img.src.startsWith('blob:') || img.src.includes('image-proxy'))) {
            const originalUrl = img.getAttribute('data-url');

            // Only proceed if image is loaded (has naturalWidth)
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                const promise = fetch(img.src)
                    .then(res => res.arrayBuffer())
                    .then(buffer => ({
                        url: originalUrl,
                        bytes: Array.from(new Uint8Array(buffer)),
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    }))
                    .catch(err => {
                        console.warn('Failed to fetch image:', originalUrl, err);
                        return null; // Return null for failed images
                    });

                imagePromises.push(promise);
            }
        }
    });

    const allImages = await Promise.all(imagePromises);
    // Filter out failed images (null values)
    const images = allImages.filter(img => img !== null);
    console.log(`🎨 [collectAllData] Collected ${images.length} images (${allImages.length - images.length} failed)`);

    // Collect colors from window.viibeColorMap (set by palette UI)
    let colors: any[] = [];

    // CRITICAL: Always calculate colors before collecting, even if palette tab wasn't clicked
    if (!(window as any).viibeColorMap || (window as any).viibeColorMap.length === 0) {
        console.log("🎨 [collectAllData] viibeColorMap not found, calculating colors now...");
        await extractAndGeneratePalette();
    }

    if ((window as any).viibeColorMap && (window as any).viibeColorMap.length > 0) {
        colors = (window as any).viibeColorMap;
        console.log("🎨 [collectAllData] Loaded colors from window.viibeColorMap:", colors);
    } else {
        console.warn("🎨 [collectAllData] No colors available even after calculation");
    }

    // Collect typography
    const typography: any[] = [];
    const scaleItems = document.querySelectorAll('.scale-item');

    scaleItems.forEach((item: any) => {
        const role = item.querySelector('.scale-role')?.textContent;
        const preview = item.querySelector('.scale-preview');

        if (role && preview) {
            const computedStyle = window.getComputedStyle(preview);
            const fontSize = computedStyle.fontSize;
            const fontFamily = computedStyle.fontFamily;
            const fontWeight = computedStyle.fontWeight;
            const text = preview.textContent;

            typography.push({
                role: role,
                size: parseInt(fontSize),
                font: {
                    family: fontFamily.replace(/['"]/g, ''),
                },
                weight: fontWeight,
                text: text
            });
        }
    });

    return { images, colors, typography };
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Viiibe Plugin Loaded');

    // Start monitoring for payment completion signals
    startPaymentCompletionMonitor();

    // Initialize Lottie animation
    const lottieContainer = document.getElementById('lottie-logo');
    if (lottieContainer) {
        logoAnimation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: viiibeLogo
        });
        console.log('✨ Lottie animation loaded');
    }

    // DEBUG PANEL - Toggle with Cmd+Shift+D
    const debugPanel = document.getElementById('debugPanel');
    const debugCloseBtn = document.getElementById('debugCloseBtn');
    const debugResetFree = document.getElementById('debugResetFree');
    const debugSet3Downloads = document.getElementById('debugSet3Downloads');
    const debugActivatePro = document.getElementById('debugActivatePro');
    const debugRefreshStatus = document.getElementById('debugRefreshStatus');
    const debugCurrentStatus = document.getElementById('debugCurrentStatus');

    // Toggle debug panel with triple Escape press
    let escapeCount = 0;
    let escapeTimer: any = null;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            escapeCount++;

            // Reset counter after 1 second
            if (escapeTimer) clearTimeout(escapeTimer);
            escapeTimer = setTimeout(() => {
                escapeCount = 0;
            }, 1000);

            // Toggle on triple press
            if (escapeCount === 3) {
                e.preventDefault();
                e.stopPropagation();
                debugPanel?.classList.toggle('active');
                if (debugPanel?.classList.contains('active')) {
                    updateDebugStatus();
                }
                escapeCount = 0;
            }
        }
    });

    // Close debug panel
    debugCloseBtn?.addEventListener('click', () => {
        debugPanel?.classList.remove('active');
    });

    // Update debug status display
    function updateDebugStatus() {
        if (debugCurrentStatus) {
            const status = isPro ? '⭐ PRO ACTIVE' : `📥 FREE (${fundamentalsDownloadsUsed}/3 downloads)`;
            debugCurrentStatus.textContent = status;
        }
    }

    // Debug actions
    debugResetFree?.addEventListener('click', async () => {
        try {
            const response = await fetch(`https://viiibe-backend.vercel.app/api/complete-reset?userId=${figmaUserId}&secret=viiibe-debug-2026`);
            const data = await response.json();
            if (data.success) {
                showToast('✅ Reset to FREE (0/3)');
                await syncWithBackend();
                updateDebugStatus();
            }
        } catch (error) {
            showToast('❌ Reset failed');
        }
    });

    debugSet3Downloads?.addEventListener('click', async () => {
        try {
            const response = await fetch(`https://viiibe-backend.vercel.app/api/set-downloads?userId=${figmaUserId}&downloads=3&secret=viiibe-debug-2026`);
            const data = await response.json();
            if (data.success) {
                showToast('✅ Set to 3/3 downloads');
                await syncWithBackend();
                updateDebugStatus();
            }
        } catch (error) {
            showToast('❌ Failed to set downloads');
        }
    });

    debugActivatePro?.addEventListener('click', async () => {
        try {
            const response = await fetch(`https://viiibe-backend.vercel.app/api/admin-check-user?userId=${figmaUserId}&secret=viiibe-debug-2026&force=true`);
            const data = await response.json();
            if (data.success) {
                showToast('✅ PRO activated');
                await syncWithBackend();
                updateDebugStatus();
            }
        } catch (error) {
            showToast('❌ Failed to activate PRO');
        }
    });

    debugRefreshStatus?.addEventListener('click', async () => {
        await syncWithBackend();
        updateDebugStatus();
        showToast('🔄 Status refreshed');
    });

    // Plugin always starts on search view - no auth needed

    // TABS
    if (tabs.moodboard) tabs.moodboard.onclick = () => switchTab('moodboard');
    if (tabs.colors) tabs.colors.onclick = () => switchTab('colors');
    if (tabs.typography) tabs.typography.onclick = () => switchTab('typography');
    if (tabs.layout) tabs.layout.onclick = () => switchTab('layout');

    // LISTENERS
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const createMoodboardButton = document.getElementById('createMoodboardButton');

    document.querySelectorAll('.chip').forEach(chip => {
        // @ts-ignore
        chip.onclick = () => { if (searchInput) searchInput.value = chip.textContent; };
    });

    if (createMoodboardButton) createMoodboardButton.onclick = () => startSearch(searchInput ? searchInput.value : '');
    if (searchInput) searchInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            startSearch(searchInput.value);
        }
    };

    // MINI-PRD CHAT FUNCTIONALITY
    let miniPRDController: MiniPRDController | null = null;
    const startMiniPRDButton = document.getElementById('startMiniPRDButton');
    const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement;
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatCurrentStep = document.getElementById('chatCurrentStep');
    const backFromChat = document.getElementById('backFromChat');
    const confirmGenerateBtn = document.getElementById('confirmGenerateBtn');
    const confirmBackBtn = document.getElementById('confirmBackBtn');

    function addChatMessage(text: string, isUser: boolean) {
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? '👤' : '🎨';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateChatProgress(current: number) {
        if (chatCurrentStep) {
            chatCurrentStep.textContent = String(current);
        }
    }

    function showTypingIndicator() {
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.id = 'typing-indicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🎨';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(bubble);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async function handleChatSend() {
        if (!miniPRDController || !chatInput) return;

        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        // Add user message
        addChatMessage(userMessage, true);

        // Clear input
        chatInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        try {
            // Send message to GPT-4
            const botResponse = await miniPRDController.sendMessage(userMessage);

            // Hide typing indicator
            hideTypingIndicator();

            // Add bot response
            addChatMessage(botResponse, false);

            // Check if PRD is complete
            if (miniPRDController.isPRDComplete()) {
                // Show confirmation IN THE CHAT after a short delay
                setTimeout(() => {
                    // @ts-ignore - function is defined in current scope
                    if (typeof showInlinePRDConfirmation === 'function') {
                        // @ts-ignore
                        showInlinePRDConfirmation();
                    } else {
                        // Fallback call if it's already defined
                        showConfirmation();
                    }
                }, 1000);
            }

        } catch (error) {
            hideTypingIndicator();
            addChatMessage("Sorry, something went wrong. Please try again.", false);
            console.error('Chat error:', error);
        }
    }

    function showConfirmation() {
        if (!miniPRDController) return;

        const confirmationSummary = document.getElementById('confirmationSummary');
        const confirmationDetails = document.getElementById('confirmationDetails');

        // Generate conversational Mini-PRD summary
        if (confirmationSummary) {
            const summary = miniPRDController.generatePRDDocument();
            confirmationSummary.textContent = summary;
        }

        // Hide the tags section - we don't need it anymore
        if (confirmationDetails) {
            confirmationDetails.style.display = 'none';
        }

        showView('confirmation');

        function showInlinePRDConfirmation() {
            if (!miniPRDController) return;

            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) return;

            // Generate Mini-PRD summary and clean markdown formatting
            let prdSummary = miniPRDController.generatePRDDocument();

            // Remove markdown formatting (**, -, etc.)
            prdSummary = prdSummary
                .replace(/\*\*/g, '')  // Remove bold markers
                .replace(/\*/g, '')    // Remove italic markers
                .replace(/^- /gm, '')  // Remove list markers
                .trim();

            // Create confirmation message
            const confirmDiv = document.createElement('div');
            confirmDiv.className = 'message bot prd-confirmation';
            confirmDiv.innerHTML = `
            <div class="message-avatar">✨</div>
            <div class="message-bubble">
                <div class="prd-summary">${prdSummary}</div>
                <div class="prd-actions">
                    <button id="inlineConfirmBtn" class="btn-primary">Create Moood! board</button>
                    <button id="inlineBackBtn" class="btn-secondary">Add more info</button>
                </div>
            </div>
        `;

            chatMessages.appendChild(confirmDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Add event listeners to inline buttons
            const inlineConfirmBtn = document.getElementById('inlineConfirmBtn');
            const inlineBackBtn = document.getElementById('inlineBackBtn');

            if (inlineConfirmBtn) {
                inlineConfirmBtn.onclick = () => {
                    const prd = miniPRDController!.getPRD();

                    // Build search query from PRD
                    let query = '';
                    if (prd.projectType) query += prd.projectType + ' ';
                    if (prd.industry) query += prd.industry + ' ';
                    if (prd.styles.length > 0) query += prd.styles.join(' ') + ' ';
                    if (prd.colors.length > 0) query += prd.colors.join(' ') + ' ';

                    // Start search
                    startSearch(query.trim(), false);

                    // Reset controller
                    miniPRDController = null;
                };
            }

            if (inlineBackBtn) {
                inlineBackBtn.onclick = () => {
                    // Remove confirmation message
                    confirmDiv.remove();
                    // User can continue chatting
                };
            }
        }
    }

    // Mini-PRD button click
    if (startMiniPRDButton) {
        startMiniPRDButton.onclick = () => {
            miniPRDController = new MiniPRDController();

            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';

            // Show initial GPT-4 prompt
            const initialPrompt = miniPRDController.getInitialPrompt();
            addChatMessage(initialPrompt, false);

            // Hide progress indicator (no fixed questions in GPT-4 mode)
            const progressContainer = document.querySelector('.chat-progress');
            if (progressContainer) {
                (progressContainer as HTMLElement).style.display = 'none';
            }

            showView('mini-prd');
        };
    }


    // Chat send button
    if (chatSendBtn) {
        chatSendBtn.onclick = handleChatSend;
    }

    // Chat input enter key
    if (chatInput) {
        chatInput.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSend();
            }
        };
    }

    // Back from chat
    if (backFromChat) {
        backFromChat.onclick = () => {
            showView('search');
            miniPRDController = null;
        };
    }

    // Confirmation buttons
    if (confirmGenerateBtn) {
        confirmGenerateBtn.onclick = () => {
            if (!miniPRDController) return;

            const intent = (miniPRDController as any).getIntent ? (miniPRDController as any).getIntent() : {};

            // Build search query from intent
            let query = '';
            if (intent.projectType) query += intent.projectType + ' ';
            if (intent.industry) query += intent.industry + ' ';
            if (intent.styles && intent.styles.length > 0) query += intent.styles.join(' ') + ' ';
            if (intent.colors && intent.colors.length > 0) query += intent.colors.join(' ') + ' ';

            // Start search with the generated query
            startSearch(query.trim(), false);

            // Reset controller
            miniPRDController = null;
        };
    }

    if (confirmBackBtn) {
        confirmBackBtn.onclick = () => {
            showView('mini-prd');
        };
    }

    // Auth handlers removed - plugin now uses saved pins from Vercel KV

    const backButton = document.getElementById('backButton');
    if (backButton) backButton.onclick = () => {
        // Reset to moodboard tab before going back to search
        switchTab('moodboard');
        // Clear search input when going back
        if (searchInput) searchInput.value = '';
        showView('search');
    };

    // Search terms bar click handler - goes back to search with query preloaded
    const searchTermsBar = document.getElementById('searchTermsBar');
    if (searchTermsBar) searchTermsBar.onclick = (e) => {
        // Don't trigger if clicking reload button
        if ((e.target as HTMLElement).closest('#reloadButton')) return;

        const searchTermsText = document.getElementById('searchTermsDisplay');
        const query = searchTermsText?.getAttribute('data-original-query') || '';
        if (searchInput && query) searchInput.value = query;
        showView('search');
    };

    // Reload button - get different results for same search
    const reloadButton = document.getElementById('reloadButton');
    if (reloadButton) reloadButton.onclick = (e) => {
        console.log('🔄 Reload button clicked');
        e.stopPropagation(); // Prevent any parent click handlers

        // Get query from searchInput's data attribute (set when search is performed)
        const query = searchInput?.getAttribute('data-last-query') || searchInput?.value || '';
        console.log('🔍 Query for reload:', query);

        if (!query) {
            console.error('❌ No query found for reload');
            return;
        }

        // Check if we have cached pins to show
        currentPage++;
        const start = currentPage * PINS_PER_PAGE;
        const end = start + PINS_PER_PAGE;

        console.log(`📄 Page ${currentPage + 1}, showing pins ${start + 1}-${end}`);
        console.log(`💾 Cache has ${cachedPins.length} pins`);

        if (start < cachedPins.length) {
            // We have cached pins - show them instantly!
            console.log('⚡ Using cached pins - instant reload!');
            const pinsToShow = cachedPins.slice(start, end);

            // Render pins directly without loading screen
            imgUrls = [];
            const grid = document.getElementById('moodboardGrid');
            if (grid) {
                grid.innerHTML = '';
                pinsToShow.forEach((pin: any, index: number) => {
                    const srcUrl = pin.imageUrl || pin.image;
                    if (!srcUrl) return;

                    const proxyUrl = getImageProxyUrl(srcUrl);
                    const urlIndex = imgUrls.length;
                    imgUrls.push(proxyUrl);

                    // Use same structure as normal rendering
                    const div = document.createElement('div');
                    div.className = 'pin-container';

                    const img = document.createElement('img');
                    img.className = 'pin-image';
                    img.setAttribute('data-url', srcUrl);
                    img.crossOrigin = 'Anonymous';

                    // Detect and store edge color when image loads
                    img.onload = () => {
                        try {
                            const edgeColor = detectEdgeColor(img);
                            img.setAttribute('data-edge-color', edgeColor);
                            console.log(`🎨 Stored edge color for reloaded image ${urlIndex}:`, edgeColor);
                        } catch (error) {
                            console.warn('Failed to detect edge color on reload:', error);
                            img.setAttribute('data-edge-color', '#FFFFFF');
                        }
                    };

                    img.onerror = () => {
                        if (img.src !== srcUrl) {
                            console.warn('⚠️ Detail Proxy failed, falling back to direct:', srcUrl);
                            img.src = srcUrl;
                        }
                    };
                    img.src = proxyUrl;

                    // Handle cached images
                    if (img.complete) {
                        img.onload(new Event('load'));
                    }

                    img.alt = pin.title || 'Pin';
                    img.loading = 'lazy';

                    // Create overlay with eye icon
                    const overlay = document.createElement('div');
                    overlay.className = 'pin-overlay';
                    overlay.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
                    overlay.onclick = (event) => {
                        currIdx = urlIndex;
                        const dImg = document.getElementById('detailsImage') as HTMLImageElement;
                        if (dImg) {
                            showView('details');
                            dImg.src = imgUrls[urlIndex];

                            // Apply stored edge color
                            const lightbox = document.getElementById('lightbox');
                            if (lightbox) {
                                const clickedDiv = (event.currentTarget as HTMLElement).parentElement;
                                const clickedImg = clickedDiv?.querySelector('.pin-image') as HTMLImageElement;
                                const storedColor = clickedImg?.getAttribute('data-edge-color') || '#FFFFFF';

                                lightbox.style.setProperty('background-color', storedColor, 'important');

                                const detailsContainer = document.querySelector('.container.details') as HTMLElement;
                                if (detailsContainer) {
                                    detailsContainer.style.setProperty('background-color', storedColor, 'important');
                                }

                                const viewDetails = document.getElementById('view-details') as HTMLElement;
                                if (viewDetails) {
                                    viewDetails.style.setProperty('background-color', storedColor, 'important');
                                }

                                console.log('🎨 Applied stored edge color to lightbox (reload):', storedColor);
                            }
                        }
                    };

                    div.appendChild(img);
                    div.appendChild(overlay);
                    grid.appendChild(div);
                });
            }
        } else {
            // Cache exhausted - fetch new pins from backend
            console.log('🔄 Cache exhausted, fetching new pins from backend...');
            currentPage = 0;
            cachedPins = [];
            startSearch(query, true); // Pass true to indicate reload
        }
    };

    // Curate button - opens lightbox with first image
    const curateBtn = document.getElementById('curateBtn');
    if (curateBtn) curateBtn.onclick = () => {
        console.log('🎨 Curate button clicked');
        console.log('📊 imgUrls array:', imgUrls);
        console.log('📊 imgUrls.length:', imgUrls.length);
        if (imgUrls.length > 0) {
            currIdx = 0;
            console.log('🖼️ First image URL:', imgUrls[0]);

            if (dImg) {
                // Show lightbox immediately
                showView('details');

                // Use direct Pinterest URL (same as grid images)
                // The imgUrls array contains direct Pinterest URLs that work
                const imageUrl = imgUrls[0];
                console.log('🖼️ Loading direct URL:', imageUrl);

                // Set crossOrigin to allow loading from Pinterest
                dImg.crossOrigin = 'anonymous';

                // Set src to trigger load
                dImg.src = imageUrl;

                // Log when image loads
                dImg.onload = () => {
                    console.log('✅ Image loaded successfully');
                };

                dImg.onerror = () => {
                    console.error('❌ Image failed to load, trying proxy...');
                    // Fallback to proxy if direct load fails
                    const proxyUrl = getImageProxyUrl(imageUrl);
                    console.log('🔄 Trying proxy URL:', proxyUrl);
                    dImg.src = proxyUrl;
                };
            } else {
                console.error('❌ dImg element not found');
            }
        } else {
            console.error('❌ imgUrls array is empty');
        }
    };

    // Create button - opens download drawer
    const createBtn = document.getElementById('createBtn');
    if (createBtn) createBtn.onclick = () => {
        const drawerBackdrop = document.getElementById('drawerBackdrop');
        const drawer = document.getElementById('styleGuideDrawer');
        if (drawerBackdrop) drawerBackdrop.classList.add('active');
        if (drawer) drawer.classList.add('active');
    };

    // DETAILS & LIGHTBOX LOGIC
    let imgUrls: string[] = [];
    let currIdx = -1;
    const dImg = document.getElementById('detailsImage') as HTMLImageElement;
    const lightbox = document.getElementById('lightbox');

    window.onmessage = (event) => {
        const msg = event?.data?.pluginMessage;
        if (!msg) return;

        if (msg.type === 'figma-user-init') {
            // CRITICAL: Trim userId to prevent database key mismatches
            figmaUserId = msg.userId.trim();

            // Prioritize local downloads from Figma's clientStorage if backend hasn't synced yet
            if (msg.localDownloads > fundamentalsDownloadsUsed) {
                fundamentalsDownloadsUsed = msg.localDownloads;
                updateFundamentalsBadge();
            }

            console.log('📨 Received figma-user-init:', {
                userId: figmaUserId,
                localDownloads: msg.localDownloads
            });

            syncWithBackend(); // Real source of truth for PRO and count
            return;
        }

        if (msg.type === 'reset-local-storage') {
            console.log('🔄 Resetting local storage...');
            fundamentalsDownloadsUsed = 0;
            isPro = false;
            updateFundamentalsBadge();
            syncWithBackend();
            showToast('✅ Local storage reset!');
            return;
        }

        if (msg.type === 'show-view') {
            console.log('📨 Received show-view message:', msg.view);

            // Special case: If moodboard with 0 pins, show empty state view instead
            const hasNoPins = msg.view === 'moodboard' && msg.data && msg.data.pins && msg.data.pins.length === 0;

            if (hasNoPins) {
                console.log('✅ Showing empty state view (no results)');
                const emptyContent = document.getElementById('emptyStateContent');
                if (emptyContent) {
                    emptyContent.innerHTML = `
                        <svg width="144" height="144" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-illustration">
                            <rect width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect x="50" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect x="100" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect y="50" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect x="50" y="50" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect x="100" y="50" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect y="100" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <rect x="50" y="100" width="44" height="44" rx="6" fill="#F5F5F5"/>
                            <path d="M119.647 133.771C120.4 133.92 121.186 134 122 134V144C120.53 144 119.095 143.854 117.706 143.579L119.647 133.771ZM126.293 143.579C124.904 143.854 123.469 144 122 144V134C122.814 134 123.6 133.92 124.353 133.771L126.293 143.579ZM112.016 128.66C112.895 129.973 114.027 131.105 115.34 131.984L109.776 140.294C107.377 138.688 105.311 136.622 103.705 134.223L104.039 134L112.016 128.66ZM131.984 128.66L140.294 134.223C138.688 136.622 136.622 138.688 134.223 140.294L128.66 131.984C129.973 131.105 131.105 129.973 131.984 128.66ZM100 122C100 120.531 100.145 119.095 100.42 117.706L110.229 119.647C110.08 120.4 110 121.186 110 122C110 122.814 110.08 123.6 110.229 124.353L100.42 126.293C100.145 124.904 100 123.469 100 122ZM144 122C144 123.469 143.854 124.904 143.579 126.293L133.771 124.353C133.92 123.6 134 122.814 134 122C134 121.186 133.92 120.4 133.771 119.647L143.579 117.706C143.854 119.095 144 120.53 144 122ZM115.34 112.016C114.027 112.895 112.895 114.027 112.016 115.34L103.705 109.776C105.311 107.377 107.377 105.311 109.776 103.705L115.34 112.016ZM134.223 103.705C136.622 105.311 138.688 107.377 140.294 109.776L131.984 115.34C131.105 114.027 129.973 112.895 128.66 112.016L134.223 103.705ZM122 100C123.469 100 124.904 100.145 126.293 100.42L124.353 110.229C123.6 110.08 122.814 110 122 110C121.186 110 120.4 110.08 119.647 110.229L117.706 100.42C119.095 100.145 120.531 100 122 100Z" fill="#F5F5F5"/>
                        </svg>
                        <h2>No results found for that search.</h2>
                        <p>Try broader terms or search by industry<br>(finance, tech, healthcare, saas, ecommerce).</p>
                        <button id="emptyBackButton" class="empty-back-btn">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="40" height="40" rx="20" fill="black"/>
                                <path d="M14 20L26 20M14 20L19 24.5M14 20L19 15.5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                        </button>
                    `;

                    // Add click handler for back button
                    setTimeout(() => {
                        const backBtn = document.getElementById('emptyBackButton');
                        if (backBtn) {
                            backBtn.onclick = () => showView('search');
                        }
                    }, 100);
                }
                showView('empty');
                return;
            }

            // Show the requested view immediately
            console.log('✅ Showing view:', msg.view);
            showView(msg.view);

            if (msg.view === 'moodboard' && msg.data) {
                imgUrls = [];
                const grid = document.getElementById('moodboardGrid');
                const searchTermsDisplay = document.getElementById('searchTermsDisplay');

                if (searchTermsDisplay && msg.data.category) {
                    // Store original query for click handler
                    searchTermsDisplay.setAttribute('data-original-query', msg.data.category);

                    // Format the search terms with bold keywords
                    const query = msg.data.category;
                    const keywords = ['minimalist', 'landing page', 'red', 'modern', 'dashboard', 'mobile app', 'ecommerce', 'saas', 'portfolio', 'blog', 'dark', 'light', 'bold', 'clean', 'vibrant'];

                    let formattedText = query;
                    keywords.forEach(keyword => {
                        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
                        formattedText = formattedText.replace(regex, '<strong>$1</strong>');
                    });

                    searchTermsDisplay.innerHTML = formattedText;
                }

                if (grid) {
                    grid.innerHTML = '';
                    if (msg.data.pins && msg.data.pins.length > 0) {
                        // Cache ALL pins for instant reloads
                        cachedPins = msg.data.pins;
                        currentPage = 0;
                        console.log(`💾 Cached ${cachedPins.length} pins for instant reloads`);

                        // Show only first PINS_PER_PAGE (20) pins
                        const pinsToShow = cachedPins.slice(0, PINS_PER_PAGE);
                        console.log(`📄 Showing first ${pinsToShow.length} pins (page 1)`);

                        let loadedCount = 0;
                        const totalImages = pinsToShow.length;

                        pinsToShow.forEach((pin: any, index: number) => {
                            let srcUrl = pin.imageUrl || pin.image;
                            if (!srcUrl) return;

                            // Upgrade to 736x for better resolution in the Figma grid
                            srcUrl = upgradeTo736x(srcUrl);
                            const proxyUrl = getImageProxyUrl(srcUrl);

                            // Store proxy URL for lightbox navigation
                            const urlIndex = imgUrls.length;
                            imgUrls.push(proxyUrl);

                            const div = document.createElement('div');
                            div.className = 'pin-container';

                            // Create img element with loading and error handlers
                            const img = document.createElement('img');
                            img.className = 'pin-image';
                            img.setAttribute('data-url', srcUrl); // Store original URL
                            img.crossOrigin = 'Anonymous';

                            // Handle successful load
                            img.onload = () => {
                                loadedCount++;
                                console.log(`✅ Image ${loadedCount}/${totalImages} loaded: ${srcUrl.substring(0, 80)}...`);

                                // Detect and store edge color for lightbox
                                try {
                                    const edgeColor = detectEdgeColor(img);
                                    img.setAttribute('data-edge-color', edgeColor);
                                    console.log(`🎨 Stored edge color for image ${urlIndex}:`, edgeColor);
                                } catch (error) {
                                    console.warn('Failed to detect edge color:', error);
                                    img.setAttribute('data-edge-color', '#FFFFFF'); // Fallback
                                }

                                // Continue to next step when most images are loaded (80%)
                                if (loadedCount >= Math.ceil(totalImages * 0.8)) {
                                    updateProgress(4);
                                    // Visual filter disabled - API now handles color filtering
                                    // if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                                    //     updateProgress(5);
                                    //     applyVisualFilter(msg.data.intent.colors[0]);
                                    // } else {
                                    updateProgress(5);
                                    updateProgress(6);
                                    updateProgress(7);
                                    // }
                                }
                            };

                            // Handle load errors with fallback
                            img.onerror = () => {
                                // If /originals/ URL failed, try downgrading to /736x/
                                if (srcUrl.includes('/originals/') && !img.getAttribute('data-fallback-tried')) {
                                    const fallbackUrl = upgradeTo736x(srcUrl);
                                    const fallbackProxyUrl = getImageProxyUrl(fallbackUrl);

                                    console.warn(`⚠️ /originals/ failed (403), trying /736x/ fallback...`);
                                    console.warn(`   Original: ${srcUrl}`);
                                    console.warn(`   Fallback: ${fallbackUrl}`);

                                    // Update imgUrls array for lightbox
                                    imgUrls[urlIndex] = fallbackProxyUrl;

                                    img.setAttribute('data-fallback-tried', 'true');
                                    img.src = fallbackProxyUrl;
                                    return;
                                }

                                console.error(`❌ FAILED to load image:`);
                                console.error(`   Original URL: ${srcUrl}`);
                                console.error(`   Proxy URL: ${proxyUrl}`);
                                console.error(`   Pin ID: ${pin.id || pin.pinId || 'unknown'}`);
                                loadedCount++;

                                // Still continue if enough images loaded
                                if (loadedCount >= Math.ceil(totalImages * 0.8)) {
                                    updateProgress(4);
                                    // Visual filter disabled
                                    // if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                                    //     updateProgress(5);
                                    //     applyVisualFilter(msg.data.intent.colors[0]);
                                    // } else {
                                    updateProgress(5);
                                    updateProgress(6);
                                    updateProgress(7);
                                    // }
                                }
                            };

                            // Set image source (same for grid and lightbox)
                            // Set image source with fallback
                            img.onerror = () => {
                                if (img.src !== srcUrl) {
                                    console.warn('⚠️ Proxy failed, falling back to direct URL:', srcUrl);
                                    img.src = srcUrl;
                                }
                            };
                            img.onerror = () => {
                                if (img.src !== srcUrl) {
                                    console.warn('⚠️ Grid Proxy failed, falling back to direct:', srcUrl);
                                    img.src = srcUrl;
                                }
                            };
                            img.src = proxyUrl;

                            // Handle case where image loads from cache before onload is attached
                            if (img.complete) {
                                img.onload(new Event('load'));
                            }

                            // Create overlay
                            const overlay = document.createElement('div');
                            overlay.className = 'pin-overlay';
                            overlay.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
                            overlay.onclick = (event) => {
                                currIdx = urlIndex;  // Use index directly instead of searching
                                showView('details');
                                dImg.src = imgUrls[urlIndex];  // Use URL from array (may be fallback)

                                // Apply stored edge color to lightbox and details container
                                if (lightbox) {
                                    // Get the correct img element from the clicked overlay's parent div
                                    const clickedDiv = (event.currentTarget as HTMLElement).parentElement;
                                    const clickedImg = clickedDiv?.querySelector('.pin-image') as HTMLImageElement;
                                    const storedColor = clickedImg?.getAttribute('data-edge-color') || '#FFFFFF';

                                    // Use setProperty with !important to override CSS
                                    lightbox.style.setProperty('background-color', storedColor, 'important');

                                    // Also apply to details container
                                    const detailsContainer = document.querySelector('.container.details') as HTMLElement;
                                    if (detailsContainer) {
                                        detailsContainer.style.setProperty('background-color', storedColor, 'important');
                                    }

                                    // Also apply to view-details
                                    const viewDetails = document.getElementById('view-details') as HTMLElement;
                                    if (viewDetails) {
                                        viewDetails.style.setProperty('background-color', storedColor, 'important');
                                    }


                                    console.log('🎨 Applied stored edge color to lightbox:', storedColor);
                                }
                            };

                            div.appendChild(img);
                            div.appendChild(overlay);
                            grid.appendChild(div);
                        });

                        // Fallback: if no images load after 10 seconds, continue anyway
                        setTimeout(() => {
                            if (loadedCount < Math.ceil(totalImages * 0.8)) {
                                console.warn(`Timeout: Only ${loadedCount}/${totalImages} images loaded, continuing anyway`);
                                updateProgress(4);
                                // Visual filter disabled
                                // if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                                //     updateProgress(5);
                                //     applyVisualFilter(msg.data.intent.colors[0]);
                                // } else {
                                updateProgress(5);
                                updateProgress(6);
                                updateProgress(7);
                                // }
                            }
                        }, 10000);
                    } else {
                        grid.innerHTML = '<p style="text-align:center; width:100%;">No pins found.</p>';
                    }
                }
            }
        }

        if (msg.type === 'show-view' && msg.view === 'moodboard') {
            setTimeout(() => {
                const fab = document.querySelector('.fab') as HTMLElement;
                if (fab) {
                    fab.onclick = () => {
                        openDrawer();
                    };
                }
            }, 50);
        }
        // Auth window handler removed - no longer needed
        else if (msg.type === 'image-loaded') {
            const url = URL.createObjectURL(new Blob([msg.imageBytes]));
            if (msg.target === 'lightbox') dImg.src = url;
            else {
                // Use querySelectorAll and filter to avoid CSS selector injection
                const images = Array.from(document.querySelectorAll('img[data-pinterest-url]')) as HTMLImageElement[];
                const i = images.find(img => img.dataset.pinterestUrl === msg.url);
                if (i) i.src = url;
            }
        }
        else if (msg.type === 'progress-update') {
            updateProgress(msg.step);
        }
    };

    // Listen for lightbox URL updates from visual filtering
    window.addEventListener('message', (event) => {
        if (event.data.type === 'update-lightbox-urls') {
            imgUrls = event.data.urls;
            console.log('🎨 Lightbox URLs updated. New count:', imgUrls.length);
            // Reset current index if it's out of bounds
            if (currIdx >= imgUrls.length) {
                currIdx = 0;
            }
        }
    });

    // Function to rebuild masonry grid by forcing column-count recalculation
    function rebuildMasonryGrid() {
        const grid = document.getElementById('moodboardGrid');
        if (!grid) return;

        // Wait for all images to finish loading before reorganizing
        const images = grid.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) {
                return Promise.resolve();
            }
            return new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Resolve even on error
            });
        });

        Promise.all(imagePromises).then(() => {
            // Determine optimal column count based on number of images
            const imageCount = images.length;
            let targetColumns = 3;

            if (imageCount <= 2) {
                targetColumns = 1;
            } else if (imageCount <= 5) {
                targetColumns = 2;
            } else {
                targetColumns = 3;
            }

            // Force masonry recalculation by toggling column-count
            grid.style.columnCount = '1';
            setTimeout(() => {
                grid.style.columnCount = String(targetColumns);
            }, 50);
        });
    }

    const detailsCloseBtn = document.getElementById('detailsCloseBtn');
    if (detailsCloseBtn) detailsCloseBtn.onclick = () => {
        showView('moodboard');
        // Rebuild grid after view transition and DOM updates
        setTimeout(() => {
            rebuildMasonryGrid();
        }, 100);
    };

    const detailsNextBtn = document.getElementById('detailsNextBtn');
    const navigateLightbox = (direction: number) => {
        if (!dImg || imgUrls.length === 0) return;

        // Apply switching class for fade/scale out
        dImg.classList.add('switching');

        // Wait for half the transition time before swapping content
        setTimeout(() => {
            currIdx = (currIdx + direction + imgUrls.length) % imgUrls.length;
            dImg.src = imgUrls[currIdx];

            // Update background color for new image
            const allGridImages = document.querySelectorAll('.pin-image') as NodeListOf<HTMLImageElement>;
            if (allGridImages[currIdx]) {
                const storedColor = allGridImages[currIdx].getAttribute('data-edge-color') || '#FFFFFF';

                if (lightbox) {
                    lightbox.style.setProperty('background-color', storedColor, 'important');
                }

                const detailsContainer = document.querySelector('.container.details') as HTMLElement;
                if (detailsContainer) {
                    detailsContainer.style.setProperty('background-color', storedColor, 'important');
                }

                const viewDetails = document.getElementById('view-details') as HTMLElement;
                if (viewDetails) {
                    viewDetails.style.setProperty('background-color', storedColor, 'important');
                }
            }

            // Remove switching class after a small buffer to trigger fade in
            setTimeout(() => {
                dImg.classList.remove('switching');
            }, 30);
        }, 150);
    };

    if (detailsNextBtn) detailsNextBtn.onclick = () => navigateLightbox(1);

    const detailsPrevBtn = document.getElementById('detailsPrevBtn');
    if (detailsPrevBtn) detailsPrevBtn.onclick = () => navigateLightbox(-1);

    const detailsDeleteBtn = document.getElementById('detailsDeleteBtn');
    if (detailsDeleteBtn) detailsDeleteBtn.onclick = () => {
        if (currIdx > -1 && imgUrls[currIdx]) {
            const urlToDelete = imgUrls[currIdx];

            // Find the pin-container by matching the img src (which has proxy URL)
            const allContainers = document.querySelectorAll('.pin-container');
            let containerToRemove: Element | null = null;

            allContainers.forEach(container => {
                const img = container.querySelector('img.pin-image') as HTMLImageElement;
                if (img && img.src === urlToDelete) {
                    containerToRemove = container;
                }
            });

            // Remove the container if found
            if (containerToRemove) {
                (containerToRemove as HTMLElement).remove();
            }

            // Remove from imgUrls array
            imgUrls.splice(currIdx, 1);

            if (imgUrls.length === 0) {
                showView('moodboard');
            } else {
                // Adjust index if we deleted the last image
                if (currIdx >= imgUrls.length) currIdx = 0;
                // Use the new navigation logic for a smooth transition to next available image
                navigateLightbox(0); // direction 0 because we already spliced, so currIdx points to the "next" image
            }
        }
    };

    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    if (refreshStatusBtn) {
        refreshStatusBtn.onclick = async (e) => {
            e.preventDefault();
            refreshStatusBtn.textContent = 'Checking...';
            await syncWithBackend();
            if (isPro) {
                showToast('🎉 Viiibe Pro active!');
            } else {
                showToast('No PRO status found yet...');
                refreshStatusBtn.textContent = 'Already paid? Refresh status';
            }
        };
    }

    // DRAWER LISTENERS
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerBackBtn = document.getElementById('drawerBackBtn');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const generateStyleGuideBtn = document.getElementById('generateStyleGuideBtn');
    const unlockProBtn = document.getElementById('unlockProBtn');

    if (drawerCloseBtn) drawerCloseBtn.onclick = () => closeDrawer();
    if (drawerBackBtn) drawerBackBtn.onclick = () => switchToMainDrawer();
    if (drawerBackdrop) drawerBackdrop.onclick = () => closeDrawer();

    if (unlockProBtn) {
        unlockProBtn.onclick = async () => {
            console.log('💳 Initiating Stripe Checkout...');
            unlockProBtn.textContent = 'Processing...';
            unlockProBtn.setAttribute('disabled', 'true');

            try {
                const response = await fetch(`${API_BASE_URL}/stripe-checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: figmaUserId,
                        priceId: STRIPE_PRICE_ID
                    })
                });

                const data = await response.json();
                if (data.url) {
                    console.log('✅ Checkout URL received:', data.url);
                    parent.postMessage({
                        pluginMessage: {
                            type: "open-url",
                            url: data.url
                        }
                    }, "*");

                    startStatusPolling();
                    showToast('Opening Stripe Checkout...');
                } else {
                    console.error('❌ Server error:', data);
                    throw new Error(data.message || 'Failed to get checkout URL');
                }
            } catch (error: any) {
                console.error('❌ Payment error:', error);
                showToast(`Error: ${error.message || 'Could not start payment'}`);
            } finally {
                // Only reset button if we are NOT polling for success
                if (!pollingInterval) {
                    unlockProBtn.textContent = 'Unlock Lifetime Access';
                    unlockProBtn.removeAttribute('disabled');
                } else {
                    // Keep the "Verifying..." label and disabled state
                    unlockProBtn.textContent = 'Verifying payment...';
                    unlockProBtn.setAttribute('disabled', 'true');
                }
            }
        };
    }

    function startStatusPolling() {
        if (pollingInterval) clearInterval(pollingInterval);

        console.log('🔄 Starting payment verification polling...');
        let pollCount = 0;
        const MAX_POLLS = 60; // 60 attempts × 3 seconds = 3 minutes max

        pollingInterval = setInterval(async () => {
            pollCount++;
            console.log(`🔄 Poll attempt ${pollCount}/${MAX_POLLS}`);

            // Use syncWithBackend which has all the PRO detection logic
            const isProNow = await syncWithBackend(false);

            if (isProNow) {
                console.log('✨ Payment verified! User is now PRO!');
                clearInterval(pollingInterval);
                pollingInterval = null;

                // UI is already updated by syncWithBackend
                // Just switch back to main drawer view
                setTimeout(() => {
                    switchToMainDrawer();
                }, 1000);
            }

            // Stop polling after max attempts
            if (pollCount >= MAX_POLLS) {
                console.log('🛑 Polling max attempts reached.');
                clearInterval(pollingInterval);
                pollingInterval = null;

                const unlockBtn = document.getElementById('unlockProBtn');
                if (unlockBtn) {
                    unlockBtn.textContent = 'Unlock Lifetime Access';
                    unlockBtn.removeAttribute('disabled');
                }

                showToast('⚠️ Verification timeout. Please refresh the plugin if payment completed.');
            }
        }, 3000); // Check every 3 seconds (faster than before)
    }

    // Pro toggle handlers
    document.querySelectorAll('.pro-toggle').forEach(toggle => {
        const input = toggle.querySelector('input') as HTMLInputElement;
        if (input) {
            input.onclick = (e) => {
                if (isPro) return; // PRO users can always toggle

                // If not PRO, check if they have free downloads left
                const hasFreeRemaining = checkFundamentalsLimit();

                // If they are trying to turn it ON but have no downloads left
                if (!hasFreeRemaining && input.checked) {
                    e.preventDefault(); // Prevent turning on
                    input.checked = false;
                    const feature = toggle.getAttribute('data-feature') || "Pro features";
                    console.log(`🔒 Free limit reached for ${feature}. Opening upgrade view.`);
                    switchToUpgradeDrawer();
                }
                // If they have free downloads left, we LET THEM turn it on.
                // The "credit" will be consumed only when they click the main Download button.
            };
        }
    });

    // Upgrade modal event listeners
    const upgradeBtn = document.getElementById('upgradeBtn');
    const cancelUpgradeBtn = document.getElementById('cancelUpgradeBtn');

    if (upgradeBtn) {
        upgradeBtn.onclick = () => {
            // TODO: Redirect to payment page or open Stripe checkout
            console.log('🚀 Upgrade to Pro clicked');
            alert('Payment integration coming soon! For now, this is just a demo.');
            closeUpgradeModal();
        };
    }

    if (cancelUpgradeBtn) {
        cancelUpgradeBtn.onclick = () => {
            closeUpgradeModal();
        };
    }

    // Terms of Use drawer event listeners
    const termsDrawer = document.getElementById('termsDrawer');
    const termsDrawerBackdrop = document.getElementById('termsDrawerBackdrop');
    const termsLinkSearch = document.getElementById('termsLinkSearch');
    const termsLinkDrawer = document.getElementById('termsLinkDrawer');
    const termsDrawerCloseBtn = document.getElementById('termsDrawerCloseBtn');

    function openTermsDrawer() {
        console.log('📖 Opening terms drawer');
        if (termsDrawer && termsDrawerBackdrop) {
            termsDrawerBackdrop.classList.add('active');
            termsDrawer.classList.add('active');
            document.body.classList.add('drawer-open'); // Hide footer overlay
        }
    }

    function closeTermsDrawer() {
        console.log('📕 Closing terms drawer');
        if (termsDrawer && termsDrawerBackdrop) {
            termsDrawerBackdrop.classList.remove('active');
            termsDrawer.classList.remove('active');
            document.body.classList.remove('drawer-open'); // Show footer overlay
        }
    }

    if (termsLinkSearch) {
        console.log('✅ Terms link found and event listener attached');
        termsLinkSearch.onclick = (e) => {
            console.log('🔗 Terms link clicked!');
            e.preventDefault();
            openTermsDrawer();
        };
    } else {
        console.log('❌ Terms link NOT found');
    }

    if (termsLinkDrawer) {
        termsLinkDrawer.onclick = (e) => {
            e.preventDefault();
            openTermsDrawer();
        };
    }

    if (termsDrawerCloseBtn) {
        termsDrawerCloseBtn.onclick = () => {
            closeTermsDrawer();
        };
    }

    // Close terms drawer when clicking backdrop
    if (termsDrawerBackdrop) {
        termsDrawerBackdrop.onclick = () => {
            closeTermsDrawer();
        };
    }

    // Initialize state from localStorage and update badge on page load
    checkFundamentalsLimit();
    updateFundamentalsBadge();

    if (generateStyleGuideBtn) {
        generateStyleGuideBtn.onclick = async () => {
            const config = getStyleGuideConfig();
            console.log('🎨 Style guide configuration:', config);

            // Check if any Fundamentals are selected
            const hasFundamentals = config.createFigmaStyles || config.createFigmaVariables;

            if (hasFundamentals && !isPro) {
                if (!checkFundamentalsLimit()) {
                    // Show upgrade view inside drawer instead of old modal
                    console.log('❌ Fundamentals limit reached');
                    switchToUpgradeDrawer();
                    return;
                }
            }

            // Close drawer
            closeDrawer();

            // Show generating view
            showView('generating');

            // Collect data
            console.log('🎨 Collecting style guide data...');
            const data = await collectAllData();
            console.log('📦 Data collected:', {
                images: data.images.length,
                colors: data.colors.length,
                typography: data.typography.length
            });

            // Send to backend with config
            console.log('📤 Sending to backend:');
            console.log('  - Images:', data.images.length);
            console.log('  - Colors:', data.colors);
            console.log('  - Typography:', data.typography.length);
            console.log('  - Config:', config);

            parent.postMessage({
                pluginMessage: {
                    type: "generate-full-styleguide",
                    images: data.images,
                    palette: data.colors,
                    typography: data.typography,
                    config: config
                }
            }, "*");

            // Increment Fundamentals counter if applicable (only for non-pro users)
            if (hasFundamentals && !isPro) {
                incrementFundamentalsDownload();
            }
        };
    }
});