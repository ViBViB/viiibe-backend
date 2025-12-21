import './styles/main.css';
import { showView, showToast, tabs } from './ui/views';
import { switchTab, startSearch, applyVisualFilter, updateProgress } from './ui/moodboard';
import { getImageProxyUrl, upgradeToOriginals } from './config';

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

    // Auth handlers removed - plugin now uses saved pins from Vercel KV

    const backButton = document.getElementById('backButton');
    if (backButton) backButton.onclick = () => {
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
        e.stopPropagation(); // Prevent searchTermsBar click
        const searchTermsText = document.getElementById('searchTermsDisplay');
        const query = searchTermsText?.getAttribute('data-original-query') || '';
        if (query) {
            console.log('🔄 Reloading search with different results...');
            startSearch(query, true); // Pass true to indicate reload
        }
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
                        let loadedCount = 0;
                        const totalImages = msg.data.pins.length;

                        msg.data.pins.forEach((pin: any, index: number) => {
                            const srcUrl = pin.imageUrl || pin.image;
                            if (!srcUrl) return;

                            // Use URL as-is from database (don't upgrade to /originals/)
                            // The URLs in database already work - upgrading breaks them
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

                                // Continue to next step when most images are loaded (80%)
                                if (loadedCount >= Math.ceil(totalImages * 0.8)) {
                                    updateProgress(4);
                                    // Apply Visual Filtering if color intent exists
                                    if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                                        updateProgress(5);
                                        applyVisualFilter(msg.data.intent.colors[0]);
                                    } else {
                                        updateProgress(5);
                                        updateProgress(6);
                                        updateProgress(7);
                                    }
                                }
                            };

                            // Handle load errors with fallback
                            img.onerror = () => {
                                // If /originals/ URL failed, try downgrading to /736x/
                                if (srcUrl.includes('/originals/') && !img.getAttribute('data-fallback-tried')) {
                                    const fallbackUrl = srcUrl.replace('/originals/', '/736x/');
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
                                    if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                                        updateProgress(5);
                                        applyVisualFilter(msg.data.intent.colors[0]);
                                    } else {
                                        updateProgress(5);
                                        updateProgress(6);
                                        updateProgress(7);
                                    }
                                }
                            };

                            // Set image source (same for grid and lightbox)
                            img.src = proxyUrl;

                            // Create overlay
                            const overlay = document.createElement('div');
                            overlay.className = 'pin-overlay';
                            overlay.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
                            overlay.onclick = () => {
                                currIdx = urlIndex;  // Use index directly instead of searching
                                showView('details');
                                dImg.src = imgUrls[urlIndex];  // Use URL from array (may be fallback)
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
                                if (msg.data.intent && msg.data.intent.colors && msg.data.intent.colors.length > 0) {
                                    updateProgress(5);
                                    applyVisualFilter(msg.data.intent.colors[0]);
                                } else {
                                    updateProgress(5);
                                    updateProgress(6);
                                    updateProgress(7);
                                }
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
    if (detailsNextBtn) detailsNextBtn.onclick = () => {
        currIdx = (currIdx + 1) % imgUrls.length;
        dImg.src = imgUrls[currIdx];
    };

    const detailsPrevBtn = document.getElementById('detailsPrevBtn');
    if (detailsPrevBtn) detailsPrevBtn.onclick = () => {
        currIdx = (currIdx - 1 + imgUrls.length) % imgUrls.length;
        dImg.src = imgUrls[currIdx];
    };

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
                containerToRemove.remove();
            }

            // Remove from imgUrls array
            imgUrls.splice(currIdx, 1);

            if (imgUrls.length === 0) {
                showView('moodboard');
            } else {
                // Adjust index if we deleted the last image
                if (currIdx >= imgUrls.length) currIdx = 0;
                // Load the next image directly
                dImg.src = imgUrls[currIdx];
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