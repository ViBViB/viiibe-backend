// Batch processing with thumbnail grid UI for Moood! Collector
// Shows thumbnails in panel instead of marking images on page

const BATCH_CONFIG = {
    MAX_IMAGES: 20,
    MIN_RESOLUTION: 0.3, // 600×500 minimum (lowered to accept Pinterest thumbnails)
    BATCH_DELAY: 1000, // 1 second between saves
    THUMBNAIL_SIZE: 80 // pixels
};

let batchMode = false;
let selectedImages = new Map(); // Map<img element, {src, alt, selected}>
let overlayElement = null;

// ============================================
// IMAGE QUALITY SCORING (same as before)
// ============================================

function scoreImage(img) {
    let score = 0;

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const resolutionScore = (width * height) / 1000000;

    // Don't reject small images - Pinterest thumbnails link to full-size
    // Just score them lower
    score += Math.min(resolutionScore, 2.0);

    const aspectRatio = width / height;
    if (aspectRatio >= 1.2 && aspectRatio <= 2.0) {
        score += 1.0;
    } else if (aspectRatio >= 0.5 && aspectRatio <= 0.8) {
        score += 0.8;
    } else if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
        score += 0.9;
    }

    const url = img.src;
    if (url.includes('/originals/')) {
        score += 2.0;
    } else if (url.includes('/736x/')) {
        score += 1.5;
    } else if (url.includes('/564x/')) {
        score += 1.0;
    } else if (url.includes('/236x/')) {
        score += 0.3;
    }

    if (url.includes('.png')) {
        score += 0.5;
    } else if (url.includes('.webp')) {
        score += 0.4;
    } else if (url.includes('.jpg') || url.includes('.jpeg')) {
        score += 0.3;
    }

    const rect = img.getBoundingClientRect();
    const isVisible = (
        rect.top >= -100 &&
        rect.bottom <= window.innerHeight + 100
    );
    if (isVisible) {
        score += 0.5;
    }

    const scrollPos = rect.top + window.scrollY;
    const relativePos = scrollPos / document.body.scrollHeight;
    if (relativePos < 0.3) {
        score += 0.3;
    } else if (relativePos < 0.5) {
        score += 0.2;
    }

    return score;
}

// Helper function to check if image has a valid pin link
function hasValidPinLink(img) {
    let currentElement = img;

    // Check up to 10 parent levels
    for (let i = 0; i < 10; i++) {
        currentElement = currentElement.parentElement;
        if (!currentElement) break;

        // Check if current element is a link
        if (currentElement.tagName === 'A' && currentElement.href && currentElement.href.includes('/pin/')) {
            return true;
        }

        // Check for link in children
        const link = currentElement.querySelector('a[href*="/pin/"]');
        if (link) {
            return true;
        }
    }

    // Check siblings
    if (img.parentElement) {
        const siblings = img.parentElement.querySelectorAll('a[href*="/pin/"]');
        if (siblings.length > 0) {
            return true;
        }
    }

    return false;
}

function autoSelectBestImages() {
    console.log('🔍 Starting auto-select...');
    const allImages = Array.from(document.querySelectorAll('img'));
    console.log(`📊 Total images on page: ${allImages.length}`);

    const pinImages = allImages.filter(img => {
        const src = img.src || '';
        const isPinImage = (
            src.includes('pinimg.com') &&
            !src.includes('facebook_share_image') &&
            !src.includes('user_avatar')
        );
        if (isPinImage) {
            console.log('✅ Valid pin image:', src.substring(0, 80) + '...');
        }
        return isPinImage;
    });

    console.log(`📌 Pinterest images found: ${pinImages.length}`);

    // Score all images (don't filter by links - Pinterest HTML changes too often)
    const scoredImages = pinImages.map(img => {
        const score = scoreImage(img);

        // Bonus points if we can find a link (but don't require it)
        const hasLink = hasValidPinLink(img);
        const finalScore = hasLink ? score + 0.5 : score;

        if (finalScore > 0) {
            console.log(`⭐ Image scored ${finalScore.toFixed(2)}${hasLink ? ' (has link)' : ''}:`, img.src.substring(0, 60) + '...');
        }

        return {
            element: img,
            score: finalScore
        };
    });

    console.log(`✅ Images to rank: ${scoredImages.length}`);

    scoredImages.sort((a, b) => b.score - a.score);

    const topImages = scoredImages.slice(0, BATCH_CONFIG.MAX_IMAGES);

    console.log(`🎯 Auto-selected top ${topImages.length} images`);

    return topImages.map(item => item.element);
}

// ============================================
// THUMBNAIL GRID UI
// ============================================

function createBatchPanel() {
    const overlay = document.createElement('div');
    overlay.id = 'viiibe-batch-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999999;
        pointer-events: none;
    `;

    const panel = document.createElement('div');
    panel.id = 'viiibe-batch-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        padding: 24px;
        width: 400px;
        max-height: 80vh;
        z-index: 1000000;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
    `;

    panel.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Batch Mode</h3>
            <button id="viiibe-close-batch" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: background 0.2s;
            ">×</button>
        </div>
        
        <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; color: #666;">Selected:</span>
                <span id="viiibe-selected-count" style="font-size: 24px; font-weight: 600;">0</span>
            </div>
        </div>
        
        <div id="viiibe-thumbnail-grid" style="
            flex: 1;
            overflow-y: auto;
            margin-bottom: 16px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            max-height: 400px;
        "></div>
        
        <div id="viiibe-batch-actions" style="display: grid; gap: 12px;">
            <button id="viiibe-save-batch" style="
                padding: 14px 24px;
                background: #00D9A3;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            ">Save Selected</button>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button id="viiibe-select-all" style="
                    padding: 10px 16px;
                    background: white;
                    color: #00D9A3;
                    border: 2px solid #00D9A3;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                ">Select All</button>
                
                <button id="viiibe-deselect-all" style="
                    padding: 10px 16px;
                    background: white;
                    color: #666;
                    border: 2px solid #e5e5e5;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                ">Deselect All</button>
            </div>
        </div>
        
        <div id="viiibe-batch-progress" style="display: none; margin-top: 16px;">
            <div style="background: #f8f8f8; border-radius: 8px; padding: 16px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Processing...</div>
                <div style="background: #e5e5e5; border-radius: 4px; height: 8px; overflow: hidden;">
                    <div id="viiibe-progress-bar" style="background: #00D9A3; height: 100%; width: 0%; transition: width 0.3s;"></div>
                </div>
                <div id="viiibe-progress-text" style="font-size: 12px; color: #666; margin-top: 8px;">0 / 0</div>
            </div>
        </div>
        
        <div id="viiibe-batch-results" style="display: none; margin-top: 16px;">
            <div style="background: #f8f8f8; border-radius: 8px; padding: 16px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Results</div>
                <div style="display: grid; gap: 8px; font-size: 14px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>✅ Saved:</span>
                        <span id="viiibe-saved-count" style="font-weight: 600;">0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>⚠️ Duplicates:</span>
                        <span id="viiibe-duplicate-count" style="font-weight: 600;">0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>❌ Failed:</span>
                        <span id="viiibe-failed-count" style="font-weight: 600;">0</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('viiibe-close-batch').addEventListener('click', exitBatchMode);
    document.getElementById('viiibe-save-batch').addEventListener('click', saveBatch);
    document.getElementById('viiibe-select-all').addEventListener('click', selectAllThumbnails);
    document.getElementById('viiibe-deselect-all').addEventListener('click', deselectAllThumbnails);

    const closeBtn = document.getElementById('viiibe-close-batch');
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#f0f0f0');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'none');

    return { overlay, panel };
}

function createThumbnail(img, index) {
    const container = document.createElement('div');
    container.className = 'viiibe-thumbnail';
    container.dataset.index = index;
    container.style.cssText = `
        position: relative;
        width: 90px;
        height: 90px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;
    `;

    const thumbnail = document.createElement('img');
    thumbnail.src = img.src;
    thumbnail.alt = img.alt || '';
    thumbnail.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    `;

    const checkbox = document.createElement('div');
    checkbox.className = 'viiibe-thumbnail-checkbox';
    checkbox.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        background: white;
        border: 2px solid #00D9A3;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: #00D9A3;
    `;

    container.appendChild(thumbnail);
    container.appendChild(checkbox);

    // Click handler
    container.addEventListener('click', () => {
        toggleThumbnailSelection(img, container);
    });

    // Hover effect
    container.addEventListener('mouseenter', () => {
        if (!selectedImages.get(img)?.selected) {
            container.style.borderColor = '#e5e5e5';
        }
    });
    container.addEventListener('mouseleave', () => {
        if (!selectedImages.get(img)?.selected) {
            container.style.borderColor = 'transparent';
        }
    });

    return container;
}

function toggleThumbnailSelection(img, container) {
    const data = selectedImages.get(img);
    if (!data) return;

    data.selected = !data.selected;
    updateThumbnailUI(container, data.selected);
    updateSelectedCount();
}

function updateThumbnailUI(container, selected) {
    const checkbox = container.querySelector('.viiibe-thumbnail-checkbox');

    if (selected) {
        container.style.borderColor = '#00D9A3';
        container.style.background = 'rgba(0, 217, 163, 0.1)';
        checkbox.textContent = '✓';
        checkbox.style.background = '#00D9A3';
        checkbox.style.color = 'white';
    } else {
        container.style.borderColor = 'transparent';
        container.style.background = 'transparent';
        checkbox.textContent = '';
        checkbox.style.background = 'white';
        checkbox.style.color = '#00D9A3';
    }
}

function renderThumbnails() {
    const grid = document.getElementById('viiibe-thumbnail-grid');
    grid.innerHTML = '';

    let index = 0;
    selectedImages.forEach((data, img) => {
        const thumbnail = createThumbnail(img, index);
        updateThumbnailUI(thumbnail, data.selected);
        grid.appendChild(thumbnail);
        index++;
    });
}

function selectAllThumbnails() {
    selectedImages.forEach((data) => {
        data.selected = true;
    });
    renderThumbnails();
    updateSelectedCount();
}

function deselectAllThumbnails() {
    selectedImages.forEach((data) => {
        data.selected = false;
    });
    renderThumbnails();
    updateSelectedCount();
}

function updateSelectedCount() {
    let count = 0;
    selectedImages.forEach((data) => {
        if (data.selected) count++;
    });

    const countElement = document.getElementById('viiibe-selected-count');
    if (countElement) {
        countElement.textContent = count;
    }

    const saveBtn = document.getElementById('viiibe-save-batch');
    if (saveBtn) {
        if (count === 0) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        } else {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
            saveBtn.textContent = `Save ${count} Selected`;
        }
    }
}

// ============================================
// BATCH SAVE
// ============================================

async function saveBatch() {
    const selected = Array.from(selectedImages.entries())
        .filter(([img, data]) => data.selected)
        .map(([img, data]) => img);

    if (selected.length === 0) return;

    document.getElementById('viiibe-batch-actions').style.display = 'none';
    document.getElementById('viiibe-thumbnail-grid').style.display = 'none';
    document.getElementById('viiibe-batch-progress').style.display = 'block';

    const progressBar = document.getElementById('viiibe-progress-bar');
    const progressText = document.getElementById('viiibe-progress-text');

    const total = selected.length;
    let saved = 0;
    let duplicates = 0;
    let failed = 0;
    let processed = 0;

    for (const img of selected) {
        console.log(`\n📸 Processing image ${processed + 1}/${total}:`, img.src.substring(0, 60) + '...');
        try {
            console.log('  🔍 Extracting pin data...');
            const pinData = await extractPinDataFromImage(img);

            if (pinData) {
                console.log('  ✅ Pin data extracted:', { id: pinData.id, platform: pinData.platform });
                const { adminKey } = await chrome.storage.sync.get(['adminKey']);

                if (!adminKey) {
                    console.log('  ❌ No admin key found');
                    failed++;
                    processed++;
                    continue;
                }

                console.log('  💾 Saving to backend...');
                const result = await savePinToViiibe(pinData, 'uncategorized', false);
                console.log('  📊 Save result:', result);

                if (result === true) {
                    console.log('  ✅ Saved successfully');
                    saved++;
                } else if (result === 'duplicate') {
                    console.log('  ⚠️ Duplicate');
                    duplicates++;
                } else {
                    console.log('  ❌ Save failed');
                    failed++;
                }
            } else {
                console.log('  ❌ Could not extract pin data (pinData is null)');
                failed++;
            }
        } catch (error) {
            console.error('  💥 Error processing image:', error);
            failed++;
        }

        processed++;

        const progress = (processed / total) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${processed} / ${total}`;

        if (processed < total) {
            await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.BATCH_DELAY));
        }
    }

    document.getElementById('viiibe-batch-progress').style.display = 'none';
    document.getElementById('viiibe-batch-results').style.display = 'block';
    document.getElementById('viiibe-saved-count').textContent = saved;
    document.getElementById('viiibe-duplicate-count').textContent = duplicates;
    document.getElementById('viiibe-failed-count').textContent = failed;

    // Update storage with batch count
    if (saved > 0) {
        chrome.storage.sync.set({ lastBatchCount: saved });

        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'batch-completed',
            saved,
            duplicates,
            failed
        });

        // Update total pins in storage
        chrome.storage.sync.get(['todayPins', 'lastDate'], (result) => {
            const today = new Date().toDateString();
            const lastDate = result.lastDate || '';

            let todayPins = result.todayPins || 0;
            if (lastDate !== today) {
                todayPins = 0;
            }

            todayPins += saved;

            chrome.storage.sync.set({
                todayPins,
                lastDate: today
            });
        });
    }

    setTimeout(() => {
        exitBatchMode();
    }, 5000);
}

// ============================================
// BATCH MODE CONTROL
// ============================================

function enterBatchMode() {
    if (batchMode) return;

    console.log('🚀 Entering batch mode...');
    batchMode = true;
    selectedImages.clear();

    // Create panel
    console.log('📦 Creating batch panel...');
    const { overlay, panel } = createBatchPanel();
    overlayElement = { overlay, panel };

    // Auto-select best images
    console.log('🎯 Auto-selecting best images...');
    const bestImages = autoSelectBestImages();
    console.log(`📸 Best images selected: ${bestImages.length}`);

    bestImages.forEach((img, index) => {
        selectedImages.set(img, {
            src: img.src,
            alt: img.alt || '',
            selected: true
        });
        console.log(`  ${index + 1}. Added to selection:`, img.src.substring(0, 60) + '...');
    });

    console.log(`📊 Total in selectedImages Map: ${selectedImages.size}`);

    // Render thumbnails
    console.log('🖼️ Rendering thumbnails...');
    renderThumbnails();
    updateSelectedCount();

    console.log('✅ Batch mode activated with thumbnail grid');
}

function exitBatchMode() {
    if (!batchMode) return;

    batchMode = false;

    if (overlayElement) {
        overlayElement.overlay.remove();
        overlayElement.panel.remove();
        overlayElement = null;
    }

    selectedImages.clear();

    console.log('Batch mode deactivated');
}

// ============================================
// MESSAGE LISTENER
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle-batch-mode') {
        if (batchMode) {
            exitBatchMode();
        } else {
            enterBatchMode();
        }
        sendResponse({ success: true, batchMode });
        return true;
    }
});

console.log('✅ Batch processing with thumbnail grid loaded');
