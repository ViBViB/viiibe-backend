import { showView, tabs, sections } from './views';
import { extractAndGeneratePalette, scoreImageForColor } from './palette';
import { generateTypographySystem } from './typography';

let imgUrls: string[] = [];
let currIdx = 0;

export function switchTab(activeTabId: string) {
    [tabs.moodboard, tabs.colors, tabs.typography, tabs.layout].forEach(t => t?.classList.remove('active'));
    [sections.moodboard, sections.colors, sections.typography, sections.layout].forEach(s => s && (s.style.display = 'none'));

    if (activeTabId === 'moodboard') {
        tabs.moodboard?.classList.add('active');
        if (sections.moodboard) sections.moodboard.style.display = 'block';
    }
    else if (activeTabId === 'colors') {
        tabs.colors?.classList.add('active');
        if (sections.colors) sections.colors.style.display = 'block';
        extractAndGeneratePalette();
    }
    else if (activeTabId === 'typography') {
        tabs.typography?.classList.add('active');
        if (sections.typography) sections.typography.style.display = 'block';
        generateTypographySystem();
    }
    else if (activeTabId === 'layout') {
        tabs.layout?.classList.add('active');
        if (sections.layout) sections.style.display = 'block';
    }
}

// Progress tracking
let currentStep = 0;
const MIN_STEP_DURATION = 500; // Minimum 500ms per step for readability
let lastStepTime = 0;
let pendingSteps: number[] = []; // Queue of steps waiting to be shown
let isProcessing = false; // Flag to prevent concurrent processing

export function updateProgress(step: number) {
    // If this step is already completed or active, ignore
    if (step <= currentStep) return;

    // Add to pending queue
    if (!pendingSteps.includes(step)) {
        pendingSteps.push(step);
        pendingSteps.sort((a, b) => a - b); // Keep sorted
    }

    // Process queue
    processNextStep();
}

function processNextStep() {
    if (pendingSteps.length === 0 || isProcessing) return;

    // Check if we can show the next step
    const nextStep = pendingSteps[0];

    // Must be sequential (can't skip steps)
    if (nextStep !== currentStep + 1) return;

    isProcessing = true;

    // Ensure minimum time since last step
    const now = Date.now();
    const timeSinceLastStep = now - lastStepTime;
    const delay = Math.max(0, MIN_STEP_DURATION - timeSinceLastStep);

    setTimeout(() => {
        const progressItems = document.querySelectorAll('.progress-item');
        const item = progressItems[nextStep - 1] as HTMLElement;

        if (!item) {
            isProcessing = false;
            return;
        }

        // Mark current step as active
        item.classList.add('active');

        // After a brief moment, mark as completed with checkmark
        setTimeout(() => {
            const checkbox = item.querySelector('.checkbox');
            if (checkbox) {
                checkbox.textContent = '✓';
            }
            item.classList.remove('active');
            item.classList.add('completed');

            // Update state
            currentStep = nextStep;
            lastStepTime = Date.now();
            pendingSteps.shift(); // Remove from queue
            isProcessing = false;

            // If this was the last step (7), show the moodboard
            if (nextStep === 7) {
                setTimeout(() => {
                    showView('moodboard');
                    switchTab('moodboard');
                }, 2000); // Wait 2s so user sees the final checkmark and message
            } else {
                // Process next step if any
                processNextStep();
            }
        }, 200);
    }, delay);
}

export function resetProgress() {
    currentStep = 0;
    lastStepTime = Date.now();
    pendingSteps = [];
    isProcessing = false;
    const progressItems = document.querySelectorAll('.progress-item');
    progressItems.forEach(item => {
        item.classList.remove('active', 'completed');
        const checkbox = item.querySelector('.checkbox');
        if (checkbox) checkbox.textContent = '☐';
    });
}

export function startSearch(query: string) {
    const val = (query || '').trim();
    if (!val) return;

    // Reset and show loading view
    resetProgress();
    showView('loading');

    // Start step 1 immediately
    updateProgress(1);

    const grid = document.getElementById('moodboardGrid');
    if (grid) {
        grid.innerHTML = '';
        grid.style.display = 'block';
    }

    // Use smart-search for NLP-based intelligent search
    parent.postMessage({ pluginMessage: { type: 'smart-search', query: val } }, '*');
}

export async function getImagesData() {
    const images = document.querySelectorAll('.pin-image');
    const data = [];
    for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        if (!img.src) continue;
        try {
            const resp = await fetch(img.src);
            const blob = await resp.blob();
            const buf = await new Response(blob).arrayBuffer();
            data.push({ bytes: new Uint8Array(buf), width: img.naturalWidth || 1000, height: img.naturalHeight || 1000 });
        } catch (e) { console.error(e); }
    }
    return data;
}

export function showMoodboard(data: any) {
    const grid = document.getElementById('moodboardGrid');
    const searchTerms = document.getElementById('searchTermsDisplay');

    if (searchTerms) {
        searchTerms.textContent = data.category || 'Mood Board';
    }

    if (!grid) return;

    grid.innerHTML = '';
    imgUrls = []; // Reset global urls

    if (data.pins && data.pins.length > 0) {
        data.pins.forEach((pin: any, index: number) => {
            const div = document.createElement('div');
            div.className = 'pin-container';

            // Store original index for stability
            div.dataset.originalIndex = String(index);

            // Create image
            const img = document.createElement('img');
            img.className = 'pin-image';
            img.alt = pin.title || 'Pin';
            img.dataset.url = pin.image; // Store original URL

            // Add to global list for lightbox
            imgUrls.push(pin.image);

            // Click to open lightbox
            div.onclick = () => {
                currIdx = index;
                const dImg = document.getElementById('detailsImg') as HTMLImageElement;
                if (dImg) {
                    dImg.src = ''; // Clear previous
                    showView('details');
                    // Use proxy for lightbox too
                    parent.postMessage({ pluginMessage: { type: 'fetch-image', url: pin.image, target: 'lightbox' } }, '*');
                }
            };

            div.appendChild(img);
            grid.appendChild(div);

            // Fetch image through proxy
            parent.postMessage({ pluginMessage: { type: 'fetch-image', url: pin.image, target: 'grid' } }, '*');
        });

        // Apply Visual Filtering if color intent exists
        if (data.intent && data.intent.colors && data.intent.colors.length > 0) {
            applyVisualFilter(data.intent.colors[0]);
        }

    } else {
        grid.innerHTML = '<p style="text-align:center; width:100%; margin-top: 20px;">No pins found.</p>';
    }
}

export async function applyVisualFilter(colorName: string) {
    const grid = document.getElementById('moodboardGrid');
    if (!grid) return;

    // Title is now in searchTermsDisplay, no need to update it here

    const images = Array.from(grid.querySelectorAll('.pin-image')) as HTMLImageElement[];

    // Wait for images to load (proxy fetch takes time)
    // We'll check every 500ms if enough images have src
    let attempts = 0;
    const checkLoaded = async () => {
        const loadedImages = images.filter(img => img.src && img.src.length > 0);

        // If we have at least 50% images or too many attempts
        if (loadedImages.length > images.length * 0.5 || attempts > 10) {
            console.log(`🎨 Starting visual analysis for ${colorName} on ${loadedImages.length} images`);

            const scores = await Promise.all(images.map(async (img) => {
                const container = img.closest('.pin-container') as HTMLElement;
                if (!img.src) return { container, score: -1, url: '' };

                const score = await scoreImageForColor(img, colorName);
                const url = img.getAttribute('data-url') || '';
                return { container, score, url };
            }));

            // Sort: High score first
            scores.sort((a, b) => b.score - a.score);

            // Re-append in new order AND filter out low scores
            let visibleCount = 0;
            const visibleUrls: string[] = [];
            scores.forEach(item => {
                if (item.container) {
                    // Threshold: Score must be > 0.15 to be considered a match (stricter filtering)
                    if (item.score > 0.15) {
                        grid.appendChild(item.container);
                        visibleUrls.push(item.url);
                        visibleCount++;
                    } else {
                        item.container.remove(); // Remove from DOM
                    }
                }
            });

            // CRITICAL FIX: Update the global imgUrls array in main.ts
            // This ensures lightbox only navigates through visible images
            window.postMessage({
                type: 'update-lightbox-urls',
                urls: visibleUrls
            }, '*');

            console.log("🎨 Visual sort complete. Visible:", visibleCount);
            // Title update removed for cleaner UI (no debug info)

            // Progress: Step 6 - Filtering complete
            updateProgress(6);

            // Progress: Step 7 - Ready!
            updateProgress(7);

            // View switch is now handled in updateProgress when step 7 completes
        } else {
            attempts++;
            setTimeout(checkLoaded, 500);
        }
    };

    setTimeout(checkLoaded, 1000); // Initial wait
}
