// Moood! Collector PRO - Batch Processing in Popup
// Handles image scanning, selection, and batch saving

let scannedImages = [];
let selectedImages = new Set();

// ============================================
// SCAN PAGE FOR IMAGES
// ============================================

document.getElementById('scanButton').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if on Pinterest
    if (!tab.url.includes('pinterest.com') && !tab.url.includes('pinterest.cl')) {
        alert('Please navigate to Pinterest first!');
        return;
    }

    // Disable button while scanning
    const btn = document.getElementById('scanButton');
    btn.disabled = true;
    btn.textContent = '🔍 Scanning...';

    try {
        // Send message to content script to scan images
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'scan-images-for-popup'
        });

        console.log('✅ Scan response:', response);

        if (response && response.images && response.images.length > 0) {
            scannedImages = response.images;
            renderThumbnails();

            // Update UI
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('thumbnailContainer').style.display = 'grid';
            document.getElementById('batchActions').style.display = 'block';

            btn.disabled = false;
            btn.textContent = `✓ Found ${scannedImages.length} images`;

            setTimeout(() => {
                btn.textContent = '🔍 Scan Page for Images';
            }, 3000);
        } else {
            btn.disabled = false;
            btn.textContent = '❌ No images found';
            alert('No images found on this page.\n\nMake sure you are on a Pinterest search or board page with visible images.');
            setTimeout(() => {
                btn.textContent = '🔍 Scan Page for Images';
            }, 3000);
        }
    } catch (err) {
        console.error('❌ Scan error:', err);
        btn.disabled = false;
        btn.textContent = '❌ Scan failed';

        // More specific error message
        let errorMsg = 'Could not scan page. Please try the following:\n\n';

        if (err.message && err.message.includes('Receiving end does not exist')) {
            errorMsg += '1. Refresh the Pinterest page\n';
            errorMsg += '2. Reload the extension (chrome://extensions/)\n';
            errorMsg += '3. Try again\n\n';
            errorMsg += 'Error: Content script not loaded';
        } else {
            errorMsg += '1. Refresh the Pinterest page\n';
            errorMsg += '2. Try again\n\n';
            errorMsg += `Error: ${err.message || 'Unknown error'}`;
        }

        alert(errorMsg);

        setTimeout(() => {
            btn.textContent = '🔍 Scan Page for Images';
        }, 3000);
    }
});

// ============================================
// RENDER THUMBNAILS
// ============================================

function renderThumbnails() {
    const container = document.getElementById('thumbnailContainer');
    container.innerHTML = '';

    scannedImages.forEach((imageData, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        if (imageData.selected) {
            thumbnail.classList.add('selected');
            selectedImages.add(index);
        }

        thumbnail.innerHTML = `
            <img src="${imageData.src}" alt="">
            <div class="thumbnail-checkbox">${imageData.selected ? '✓' : ''}</div>
        `;

        thumbnail.addEventListener('click', () => {
            toggleSelection(index);
        });

        container.appendChild(thumbnail);
    });

    updateSelectedCount();
    updateSaveButton();
}

// ============================================
// TOGGLE SELECTION
// ============================================

function toggleSelection(index) {
    scannedImages[index].selected = !scannedImages[index].selected;

    if (scannedImages[index].selected) {
        selectedImages.add(index);
    } else {
        selectedImages.delete(index);
    }

    renderThumbnails();
}

// ============================================
// SELECT/DESELECT ALL
// ============================================

document.getElementById('selectAllButton').addEventListener('click', () => {
    scannedImages.forEach((img, index) => {
        img.selected = true;
        selectedImages.add(index);
    });
    renderThumbnails();
});

document.getElementById('deselectAllButton').addEventListener('click', () => {
    scannedImages.forEach(img => {
        img.selected = false;
    });
    selectedImages.clear();
    renderThumbnails();
});

// ============================================
// UPDATE UI
// ============================================

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedImages.size;
}

function updateSaveButton() {
    const btn = document.getElementById('saveSelectedButton');
    btn.disabled = selectedImages.size === 0;
    btn.textContent = selectedImages.size > 0
        ? `Save ${selectedImages.size} Selected`
        : 'Save Selected';
}

// ============================================
// SAVE SELECTED
// ============================================

document.getElementById('saveSelectedButton').addEventListener('click', async () => {
    if (selectedImages.size === 0) return;

    // Hide actions, show progress
    document.getElementById('batchActions').style.display = 'none';
    document.getElementById('thumbnailContainer').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'block';

    const selectedImageData = scannedImages.filter((_, index) => selectedImages.has(index));

    let saved = 0;
    let duplicates = 0;
    let failed = 0;
    let processed = 0;
    const total = selectedImageData.length;

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    for (const imageData of selectedImageData) {
        try {
            // Send message to content script to extract and save
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'save-image-from-popup',
                imageData
            });

            if (response && response.success) {
                if (response.duplicate) {
                    duplicates++;
                } else {
                    saved++;
                }
            } else {
                failed++;
            }
        } catch (error) {
            console.error('Error saving image:', error);
            failed++;
        }

        processed++;

        // Update progress
        const progress = (processed / total) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${processed} / ${total}`;

        // Small delay between saves
        if (processed < total) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    // Show results
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('savedCount').textContent = saved;
    document.getElementById('duplicatesCount').textContent = duplicates;
    document.getElementById('failedCount').textContent = failed;

    // Update storage
    if (saved > 0) {
        chrome.storage.sync.set({ lastBatchCount: saved });

        chrome.runtime.sendMessage({
            action: 'batch-completed',
            saved,
            duplicates,
            failed
        });

        chrome.storage.sync.get(['todayPins', 'lastDate', 'totalPins'], (result) => {
            const today = new Date().toDateString();
            const lastDate = result.lastDate || '';

            let todayPins = result.todayPins || 0;
            if (lastDate !== today) {
                todayPins = 0;
            }

            todayPins += saved;
            const totalPins = (result.totalPins || 0) + saved;

            chrome.storage.sync.set({
                todayPins,
                totalPins,
                lastDate: today
            });
        });
    }

    // Reset after 5 seconds
    setTimeout(() => {
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('batchActions').style.display = 'none';
        scannedImages = [];
        selectedImages.clear();
        updateSelectedCount();
    }, 5000);
});

console.log('✅ Batch processing popup script loaded');
