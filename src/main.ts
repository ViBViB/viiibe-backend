import './styles/main.css';
import { showView, showToast, tabs } from './ui/views';
import { switchTab, startSearch, applyVisualFilter, updateProgress } from './ui/moodboard';
import { startAuthFlow } from './ui/auth';

// ==============================================================
// STYLE GUIDE DATA COLLECTION
// ==============================================================

import { calculatePaletteFromImages } from './ui/palette';

// ==============================================================
// DRAWER STATE MANAGEMENT
// ==============================================================

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
    }
}

function closeDrawer() {
    const drawer = document.getElementById('styleGuideDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('active');
        drawer.classList.remove('active');
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
        if (img.src && img.src.startsWith('blob:')) {
            const originalUrl = img.getAttribute('data-url');

            const promise = fetch(img.src)
                .then(res => res.arrayBuffer())
                .then(buffer => ({
                    url: originalUrl,
                    bytes: Array.from(new Uint8Array(buffer)),
                    width: img.naturalWidth,
                    height: img.naturalHeight
                }));

            imagePromises.push(promise);
        }
    });

    const images = await Promise.all(imagePromises);

    // Collect colors
    let colors: any[] = [];

    // Calculate palette directly from images
    if (imageElements.length > 0) {
        try {
            console.log("🎨 [collectAllData] Calculating palette...");
            colors = await calculatePaletteFromImages(imageElements);
            console.log("🎨 [collectAllData] Calculated colors:", colors.length);
        } catch (e) {
            console.error("🎨 [collectAllData] Error calculating palette:", e);
        }
    } else {
        console.log("🎨 [collectAllData] No images found for palette extraction");
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
    // INIT CHECK
    parent.postMessage({ pluginMessage: { type: 'check-auth-status' } }, '*');

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

    const connectButton = document.getElementById('connectButton');
    const confirmButton = document.getElementById('confirmButton');

    if (connectButton) connectButton.onclick = () => {
        startAuthFlow();
    };

    if (confirmButton) confirmButton.onclick = () => {
        const t = (document.getElementById('tokenInput') as HTMLInputElement).value;
        if (t) {
            parent.postMessage({ pluginMessage: { type: 'token-received', token: t } }, '*');
            setTimeout(() => showView('search'), 500);
        }
    };

    const backButton = document.getElementById('backButton');
    if (backButton) backButton.onclick = () => {
        // Clear search input when going back
        if (searchInput) searchInput.value = '';
        showView('search');
    };

    // Search terms bar click handler - goes back to search with query preloaded
    const searchTermsBar = document.getElementById('searchTermsBar');
    if (searchTermsBar) searchTermsBar.onclick = () => {
        const searchTermsText = document.getElementById('searchTermsDisplay');
        const query = searchTermsText?.getAttribute('data-original-query') || '';
        if (searchInput && query) searchInput.value = query;
        showView('search');
    };

    // DETAILS & LIGHTBOX LOGIC
    let imgUrls: string[] = [];
    let currIdx = -1;
    const dImg = document.getElementById('detailsImage') as HTMLImageElement;

    window.onmessage = (event) => {
        const msg = event?.data?.pluginMessage;
        if (!msg) return;

        if (msg.type === 'show-view') {
            console.log('📨 Received show-view message:', msg.view);
            // If it's moodboard view, DON'T show immediately - let progress handler do it
            if (msg.view !== 'moodboard') {
                console.log('✅ Showing view:', msg.view);
                showView(msg.view);
            } else {
                console.log('⏸️ Skipping immediate moodboard view (handled by progress)');
            }

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
                        msg.data.pins.forEach((pin: any) => {
                            const srcUrl = pin.fullsizeUrl || pin.thumbnailUrl;
                            if (!srcUrl) return;
                            imgUrls.push(srcUrl);
                            const div = document.createElement('div');
                            div.className = 'pin-container';
                            div.innerHTML = `<img class="pin-image" data-url="${srcUrl}" src="" crossOrigin="Anonymous"/><div class="pin-overlay"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></div>`;
                            // @ts-ignore
                            div.querySelector('.pin-overlay').onclick = () => {
                                currIdx = imgUrls.indexOf(srcUrl);
                                showView('details');
                                dImg.src = '';
                                parent.postMessage({ pluginMessage: { type: 'fetch-image', url: srcUrl, target: 'lightbox' } }, '*');
                            };
                            grid.appendChild(div);
                            parent.postMessage({ pluginMessage: { type: 'fetch-image', url: srcUrl, target: 'grid' } }, '*');
                        });

                        // Progress: Step 4 - Images loading
                        updateProgress(4);

                        // Apply Visual Filtering if color intent exists
                        if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                            // Progress: Step 5 - Color analysis
                            updateProgress(5);
                            applyVisualFilter(msg.data.intent.colors[0]);
                        } else {
                            // No color filtering, skip to step 7
                            updateProgress(5);
                            updateProgress(6);
                            updateProgress(7);
                            // View switch handled in updateProgress
                        }
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
        else if (msg.type === 'open-auth-window') {
            window.open(msg.url);
        }
        else if (msg.type === 'image-loaded') {
            const url = URL.createObjectURL(new Blob([msg.imageBytes]));
            if (msg.target === 'lightbox') dImg.src = url;
            else {
                const i = document.querySelector(`img[data-url="${msg.url}"]`) as HTMLImageElement;
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
    if (detailsNextBtn) detailsNextBtn.onclick = () => {
        currIdx = (currIdx + 1) % imgUrls.length;
        dImg.src = '';
        parent.postMessage({ pluginMessage: { type: 'fetch-image', url: imgUrls[currIdx], target: 'lightbox' } }, '*');
    };

    const detailsPrevBtn = document.getElementById('detailsPrevBtn');
    if (detailsPrevBtn) detailsPrevBtn.onclick = () => {
        currIdx = (currIdx - 1 + imgUrls.length) % imgUrls.length;
        dImg.src = '';
        parent.postMessage({ pluginMessage: { type: 'fetch-image', url: imgUrls[currIdx], target: 'lightbox' } }, '*');
    };

    const detailsDeleteBtn = document.getElementById('detailsDeleteBtn');
    if (detailsDeleteBtn) detailsDeleteBtn.onclick = () => {
        if (currIdx > -1 && imgUrls[currIdx]) {
            const urlToDelete = imgUrls[currIdx];

            // Find the pin-container by matching the data-url attribute
            const allContainers = document.querySelectorAll('.pin-container');
            let containerToRemove: Element | null = null;

            allContainers.forEach(container => {
                const img = container.querySelector('img[data-url]') as HTMLImageElement;
                if (img && img.dataset.url === urlToDelete) {
                    containerToRemove = container;
                }
            });

            // Remove the container if found
            if (containerToRemove) {
                containerToRemove.remove();
            }

            // Remove from imgUrls array
            imgUrls.splice(currIdx, 1);

            if (imgUrls.length === 0) {
                showView('moodboard');
            } else {
                if (currIdx >= imgUrls.length) currIdx = 0;
                dImg.src = '';
                parent.postMessage({ pluginMessage: { type: 'fetch-image', url: imgUrls[currIdx], target: 'lightbox' } }, '*');
            }
        }
    };

    // DRAWER LISTENERS
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const generateStyleGuideBtn = document.getElementById('generateStyleGuideBtn');

    if (drawerCloseBtn) drawerCloseBtn.onclick = () => closeDrawer();
    if (drawerBackdrop) drawerBackdrop.onclick = () => closeDrawer();

    if (generateStyleGuideBtn) {
        generateStyleGuideBtn.onclick = async () => {
            const config = getStyleGuideConfig();
            console.log('🎨 Style guide configuration:', config);

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
            parent.postMessage({
                pluginMessage: {
                    type: "generate-full-styleguide",
                    images: data.images,
                    palette: data.colors,
                    typography: data.typography,
                    config: config
                }
            }, "*");
        };
    }
});