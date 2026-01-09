function hslToHex(h: number, s: number, l: number) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

// Detect color intent from user query
function detectColorIntent(query: string): string | null {
    const lowerQuery = query.toLowerCase();
    const colorKeywords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'black', 'white'];

    for (const color of colorKeywords) {
        if (lowerQuery.includes(color)) {
            console.log(`🎨 Detected color intent from query: "${color}"`);
            return color;
        }
    }

    return null;
}

// Check if a color cluster matches the user's intent
function doesColorMatchIntent(h: number, s: number, l: number, intent: string): boolean {
    const COLOR_RANGES: { [key: string]: any } = {
        'red': { hMin: 345, hMax: 15 },
        'orange': { hMin: 15, hMax: 45 },
        'yellow': { hMin: 40, hMax: 70 },
        'green': { hMin: 70, hMax: 160 },
        'cyan': { hMin: 160, hMax: 190 },
        'blue': { hMin: 190, hMax: 260 },
        'purple': { hMin: 260, hMax: 300 },
        'pink': { hMin: 300, hMax: 345 },
        'black': { lMax: 30, sMax: 20 }, // Low lightness AND low saturation
        'white': { lMin: 80, sMax: 20 }  // High lightness AND low saturation
    };

    const range = COLOR_RANGES[intent];
    if (!range) return false;

    // Check lightness-based colors (black, white)
    if (intent === 'black') {
        return l <= range.lMax && s <= range.sMax;
    }
    if (intent === 'white') {
        return l >= range.lMin && s <= range.sMax;
    }

    // Check hue-based colors
    if (range.hMin !== undefined && range.hMax !== undefined) {
        if (s < 20) return false; // Must have some saturation for chromatic colors

        if (range.hMin > range.hMax) {
            // Wrap around (like red: 345-15)
            return h >= range.hMin || h <= range.hMax;
        } else {
            return h >= range.hMin && h <= range.hMax;
        }
    }

    return false;
}

export async function calculatePaletteFromImages(images: NodeListOf<Element> | HTMLImageElement[], userQuery?: string): Promise<any[]> {
    // Analyze ALL images, not just first 6
    const candidates: any[] = [];

    // Extract color intent from user query
    const colorIntent = detectColorIntent(userQuery || '');

    console.log(`🎨 Analyzing ${images.length} images for palette generation...`);

    for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        // Ensure image is loaded/has src
        if (img.src) {
            const pixels = await getSamplePixels(img);
            candidates.push(...pixels);
        }
    }

    if (candidates.length === 0) return [];

    // Cluster pixels by hue (for chromatic) or lightness (for achromatic)
    const clusters: any[] = [];
    candidates.forEach(p => {
        const isAchromatic = p.s < 15; // Low saturation = gray/black/white

        if (isAchromatic) {
            // Cluster achromatic colors by lightness
            let cluster = clusters.find(c => c.isAchromatic && Math.abs(c.avgL - p.l) < 20);
            if (cluster) {
                cluster.pixels.push(p);
                cluster.avgL = (cluster.avgL * (cluster.pixels.length - 1) + p.l) / cluster.pixels.length;
            } else {
                clusters.push({
                    isAchromatic: true,
                    avgL: p.l,
                    pixels: [p],
                    h: 0,
                    s: p.s
                });
            }
        } else {
            // Cluster chromatic colors by hue
            let cluster = clusters.find(c => !c.isAchromatic && Math.abs(c.h - p.h) < 15);
            if (cluster) {
                cluster.pixels.push(p);
            } else {
                clusters.push({
                    isAchromatic: false,
                    h: p.h,
                    pixels: [p]
                });
            }
        }
    });

    // Score clusters by dominance (frequency + visual weight)
    clusters.forEach(c => {
        const pixelCount = c.pixels.length;
        const avgSaturation = c.pixels.reduce((sum: number, p: any) => sum + p.s, 0) / pixelCount;
        const avgLightness = c.pixels.reduce((sum: number, p: any) => sum + p.l, 0) / pixelCount;

        // Detect background colors (very light grays/whites)
        const isBackgroundColor = c.isAchromatic && avgLightness > 85;

        // Dominance score = frequency + saturation bonus + achromatic bonus - background penalty
        c.score = (pixelCount * 2) + // Frequency is most important
            (avgSaturation / 10) + // Slight saturation bonus
            (c.isAchromatic && avgLightness < 25 ? 15 : 0) - // Bonus for true blacks
            (isBackgroundColor ? 1000 : 0); // Heavy penalty for background whites/grays

        c.avgS = avgSaturation;
        c.avgL = avgLightness;
        c.isBackground = isBackgroundColor;

        // Boost score if cluster matches user's color intent
        if (colorIntent && !c.isAchromatic) {
            const matchesIntent = doesColorMatchIntent(c.h, c.avgS, c.avgL, colorIntent);
            if (matchesIntent) {
                c.score += 10000; // Massive boost to ensure user-requested color wins
                c.matchesIntent = true;
                console.log(`🎯 Cluster matches user intent "${colorIntent}":`, {
                    h: Math.round(c.h),
                    s: Math.round(c.avgS),
                    l: Math.round(c.avgL),
                    boostedScore: Math.round(c.score)
                });
            }
        }
    });

    // Sort by dominance score
    clusters.sort((a, b) => b.score - a.score);

    console.log('🎯 Top 5 clusters by dominance:', clusters.slice(0, 5).map(c => ({
        isAchromatic: c.isAchromatic,
        isBackground: c.isBackground,
        h: Math.round(c.isAchromatic ? 0 : c.h),
        s: Math.round(c.avgS),
        l: Math.round(c.avgL),
        pixels: c.pixels.length,
        score: Math.round(c.score)
    })));

    // Primary = most dominant cluster
    const primaryCluster = clusters[0];
    let primaryPixel;

    if (primaryCluster.isAchromatic) {
        // For achromatic, use average lightness
        primaryPixel = {
            h: 0,
            s: 0,
            l: primaryCluster.avgL
        };
    } else {
        // For chromatic, pick most vibrant pixel in cluster
        primaryPixel = primaryCluster.pixels.reduce((prev: any, curr: any) =>
            (curr.s - Math.abs(curr.l - 50) * 0.5) > (prev.s - Math.abs(prev.l - 50) * 0.5)
                ? curr : prev
        );
    }

    const primaryHex = hslToHex(primaryPixel.h, primaryPixel.s, primaryPixel.l);

    console.log('🎯 Primary cluster:', {
        isAchromatic: primaryCluster.isAchromatic,
        h: Math.round(primaryPixel.h),
        s: Math.round(primaryPixel.s),
        l: Math.round(primaryPixel.l),
        hex: primaryHex,
        pixels: primaryCluster.pixels.length
    });

    // Accent = most vibrant chromatic color (different from primary)
    let accentHex, accentPrim;

    // FIRST: Calculate secondary to know which cluster to exclude
    // Find chromatic clusters excluding primary (less strict than accent)
    const secondaryCandidates = clusters.filter(c =>
        !c.isAchromatic &&
        c !== primaryCluster &&
        c.avgS > 20 // Lower threshold than accent
    );

    // Sort by dominance (pixel count * saturation)
    secondaryCandidates.sort((a, b) => {
        const scoreA = a.pixels.length * (1 + a.avgS / 100);
        const scoreB = b.pixels.length * (1 + b.avgS / 100);
        return scoreB - scoreA;
    });

    const secondaryCluster = secondaryCandidates.length > 0 ? secondaryCandidates[0] : null;

    // NOW: Find accent excluding both primary AND secondary
    const accentCandidates = clusters.filter(c =>
        !c.isAchromatic &&
        c !== primaryCluster && // Exclude primary
        c !== secondaryCluster && // Exclude secondary
        c.avgS > 40 &&          // Must be vibrant (not washed out)
        c.avgL > 25 &&          // Not too dark
        c.avgL < 75             // Not too light
    );

    // Sort by vibrancy (saturation * pixel count)
    accentCandidates.sort((a, b) => {
        const vibrancyA = a.avgS * a.pixels.length;
        const vibrancyB = b.avgS * b.pixels.length;
        return vibrancyB - vibrancyA;
    });

    console.log('🎨 Accent candidates (excluding primary & secondary):', accentCandidates.map(c => ({
        h: Math.round(c.h),
        s: Math.round(c.avgS),
        l: Math.round(c.avgL),
        pixels: c.pixels.length,
        vibrancy: Math.round(c.avgS * c.pixels.length)
    })));

    if (accentCandidates.length > 0) {
        // Use most vibrant color (no hue difference requirement)
        const accentCluster = accentCandidates[0];
        const accentPixel = accentCluster.pixels.reduce((prev: any, curr: any) =>
            curr.s > prev.s ? curr : prev
        );
        accentHex = hslToHex(accentPixel.h, accentPixel.s, accentPixel.l);
        accentPrim = `Accent-Vibrant-${Math.round(accentPixel.h)}`;
        console.log('✅ Found accent:', { h: accentPixel.h, s: accentPixel.s, l: accentPixel.l, hex: accentHex });
    } else {
        // No vibrant colors found, use neutral gray
        accentHex = hslToHex(0, 0, 65);
        accentPrim = 'Neutral-400';
        console.log('⚠️ No vibrant colors found, using neutral gray');
    }


    // Secondary = use the cluster we already calculated above
    let secondaryHex, secondaryPrim;

    if (secondaryCluster) {
        const secondaryPixel = secondaryCluster.pixels.reduce((prev: any, curr: any) =>
            (curr.s - Math.abs(curr.l - 50) * 0.5) > (prev.s - Math.abs(prev.l - 50) * 0.5) ? curr : prev
        );
        secondaryHex = hslToHex(secondaryPixel.h, secondaryPixel.s, secondaryPixel.l);
        secondaryPrim = `Brand-Alt-${Math.round(secondaryPixel.h)}`;
        console.log('✅ Found secondary from images:', { h: secondaryPixel.h, s: secondaryPixel.s, l: secondaryPixel.l, hex: secondaryHex });
    } else {
        // Fallback: use lighter/darker variation of primary
        const isLightPrimary = primaryPixel.l > 50;
        secondaryHex = hslToHex(
            primaryPixel.h,
            Math.max(10, primaryPixel.s - 10),
            isLightPrimary ? primaryPixel.l - 15 : primaryPixel.l + 15
        );
        secondaryPrim = 'Brand-Alt';
        console.log('⚠️ No secondary color in images, using primary variation');
    }

    // Foreground/Background based on primary lightness
    const isDarkPrimary = primaryPixel.l < 50;
    const foregroundHex = isDarkPrimary ? '#FFFFFF' : '#111111';
    const backgroundHex = isDarkPrimary ? '#111111' : '#FFFFFF';

    return [
        { role: 'Primary', hex: primaryHex, primitive: `Brand-${Math.round(primaryPixel.h)}` },
        { role: 'Secondary', hex: secondaryHex, primitive: secondaryPrim },
        { role: 'Accent', hex: accentHex, primitive: accentPrim },
        { role: 'Background', hex: backgroundHex, primitive: isDarkPrimary ? 'Base-Black' : 'Base-White' },
        { role: 'Foreground', hex: foregroundHex, primitive: isDarkPrimary ? 'Base-White' : 'Base-Black' },
        { role: 'Neutral', hex: hslToHex(primaryPixel.h, 5, 50), primitive: 'Neutral-500' },
        { role: 'Border', hex: hslToHex(primaryPixel.h, 5, 90), primitive: 'Neutral-200' },
        { role: 'Success', hex: hslToHex(140, 70, 45), primitive: 'Green' },
        { role: 'Warning', hex: hslToHex(35, 90, 55), primitive: 'Amber' },
        { role: 'Error', hex: hslToHex(0, 80, 55), primitive: 'Red' }
    ];
}

// Helper: Calculate how well an image represents target colors
function calculateColorRepresentation(pixels: any[], targetHues: number[]): number {
    if (pixels.length === 0 || targetHues.length === 0) return 0;

    let score = 0;
    const chromaticPixels = pixels.filter(p => p.s > 20);

    // For each target hue, count how many pixels are close to it
    targetHues.forEach(targetH => {
        const matchingPixels = chromaticPixels.filter(p => {
            const hueDiff = Math.abs(p.h - targetH);
            const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
            return normalizedDiff < 30; // Within 30° of target
        });
        score += matchingPixels.length;
    });

    return score;
}

// New simplified extractColorMap function
async function extractColorMap(images: NodeListOf<Element> | HTMLImageElement[], userQuery?: string): Promise<any> {
    console.log(`🗺️ Analyzing ALL ${images.length} images...`);

    // STEP 1: Detect color intent
    const colorIntent = detectColorIntent(userQuery || '');
    if (colorIntent) {
        console.log(`🎯 User searching for "${colorIntent}" - will prioritize`);
    }

    // STEP 2: Gather pixels from ALL images
    const allPixels: any[] = [];
    for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        if (img.src) {
            const pixels = await getSamplePixels(img);
            allPixels.push(...pixels);
        }
    }

    if (allPixels.length === 0) return { colorMap: [], neutrals: [], statusColors: [] };

    // STEP 3: Filter background pixels
    const contentPixels = allPixels.filter(p => {
        return !(p.s < 10 && p.l > 85); // Remove white/gray backgrounds
    });

    console.log(`🗺️ Filtered ${allPixels.length - contentPixels.length} background pixels, analyzing ${contentPixels.length} content pixels`);

    if (contentPixels.length === 0) return { colorMap: [], neutrals: [], statusColors: [] };

    // STEP 4: Cluster colors by hue
    const clusters: any[] = [];
    contentPixels.forEach(p => {
        const isAchromatic = p.s < 15;

        if (isAchromatic) {
            // Cluster by lightness
            let cluster = clusters.find(c => c.isAchromatic && Math.abs(c.avgL - p.l) < 20);
            if (cluster) {
                cluster.pixels.push(p);
                cluster.avgL = (cluster.avgL * (cluster.pixels.length - 1) + p.l) / cluster.pixels.length;
            } else {
                clusters.push({ isAchromatic: true, avgL: p.l, pixels: [p] });
            }
        } else {
            // Cluster by hue
            let cluster = clusters.find(c => !c.isAchromatic && Math.abs(c.h - p.h) < 15);
            if (cluster) {
                cluster.pixels.push(p);
            } else {
                clusters.push({ isAchromatic: false, h: p.h, pixels: [p] });
            }
        }
    });

    // STEP 5: Calculate cluster stats
    clusters.forEach(c => {
        const pixelCount = c.pixels.length;
        const avgH = c.isAchromatic ? 0 : c.pixels.reduce((sum: number, p: any) => sum + p.h, 0) / pixelCount;
        const avgS = c.pixels.reduce((sum: number, p: any) => sum + p.s, 0) / pixelCount;
        const avgL = c.pixels.reduce((sum: number, p: any) => sum + p.l, 0) / pixelCount;

        c.avgH = avgH;
        c.avgS = avgS;
        c.avgL = avgL;
        c.pixelCount = pixelCount;
        c.percentage = (pixelCount / contentPixels.length) * 100;
    });

    // STEP 6: Find priority color
    let priorityColor: any = null;
    let usedClusters: any[] = [];

    if (colorIntent) {
        // SCENARIO 1: User specified color - combine ALL matching clusters
        const matchingClusters = clusters.filter(c =>
            doesColorMatchIntent(c.avgH, c.avgS, c.avgL, colorIntent)
        );

        if (matchingClusters.length > 0) {
            console.log(`🎯 Found ${matchingClusters.length} clusters matching "${colorIntent}"`);

            // Combine all matching clusters
            const totalPixels = matchingClusters.reduce((sum, c) => sum + c.pixelCount, 0);
            const totalPercentage = matchingClusters.reduce((sum, c) => sum + c.percentage, 0);

            // Calculate weighted average HSL
            // For hue, use circular mean to handle wrap-around (e.g., 350° + 10° = 0°, not 180°)
            let sumSinH = 0, sumCosH = 0, sumS = 0, sumL = 0;
            matchingClusters.forEach(c => {
                const weight = c.pixelCount / totalPixels;
                const hRad = (c.avgH * Math.PI) / 180; // Convert to radians
                sumSinH += Math.sin(hRad) * weight;
                sumCosH += Math.cos(hRad) * weight;
                sumS += c.avgS * weight;
                sumL += c.avgL * weight;
            });

            // Convert back to degrees
            let avgH = (Math.atan2(sumSinH, sumCosH) * 180) / Math.PI;
            if (avgH < 0) avgH += 360; // Normalize to 0-360

            priorityColor = {
                hex: hslToHex(avgH, sumS, sumL),
                percentage: Math.round(totalPercentage),
                h: Math.round(avgH),
                s: Math.round(sumS),
                l: Math.round(sumL),
                isIntent: true
            };

            usedClusters = matchingClusters;

            console.log(`🎯 Combined priority color:`, priorityColor);
        }
    }

    if (!priorityColor) {
        // SCENARIO 2: No color specified or no matches - use most dominant
        clusters.sort((a, b) => b.percentage - a.percentage);
        const topCluster = clusters[0];

        priorityColor = {
            hex: hslToHex(topCluster.avgH, topCluster.avgS, topCluster.avgL),
            percentage: Math.round(topCluster.percentage),
            h: Math.round(topCluster.avgH),
            s: Math.round(topCluster.avgS),
            l: Math.round(topCluster.avgL),
            isIntent: false
        };

        usedClusters = [topCluster];

        console.log(`🗺️ Most dominant color:`, priorityColor);
    }

    // STEP 7: Find top 3 accent colors
    const remainingClusters = clusters.filter(c => !usedClusters.includes(c));
    remainingClusters.sort((a, b) => b.percentage - a.percentage);

    const accentColors = remainingClusters.slice(0, 3).map(c => ({
        hex: hslToHex(c.avgH, c.avgS, c.avgL),
        percentage: Math.round(c.percentage),
        h: Math.round(c.avgH),
        s: Math.round(c.avgS),
        l: Math.round(c.avgL),
        isIntent: false
    }));

    // STEP 8: Build final color map
    const colorMap = [priorityColor, ...accentColors];

    // Filter out colors with very low percentage (< 1%), BUT always keep priority
    const filteredColorMap = colorMap.filter((c, index) =>
        index === 0 || c.percentage >= 1
    );

    console.log('🗺️ Final Color Map:', filteredColorMap);

    // Extract neutrals (keeping existing logic for now)
    const neutrals: any[] = [];
    const achromatic = clusters.filter(c => c.isAchromatic || c.avgS <= 20);
    achromatic.sort((a, b) => b.pixelCount - a.pixelCount);

    const blackCluster = achromatic.find(c => c.avgL < 25);
    if (blackCluster) neutrals.push({ name: 'Black', hex: '#111111' });

    const whiteCluster = achromatic.find(c => c.avgL > 80);
    if (whiteCluster) neutrals.push({ name: 'White', hex: '#FFFFFF' });

    const grayCluster = achromatic.find(c => c.avgL >= 25 && c.avgL <= 80);
    if (grayCluster) neutrals.push({ name: 'Gray', hex: hslToHex(0, 0, grayCluster.avgL) });

    const statusColors = [
        { name: 'Success', hex: hslToHex(140, 70, 45) },
        { name: 'Warning', hex: hslToHex(35, 90, 55) },
        { name: 'Error', hex: hslToHex(0, 80, 55) }
    ];

    return { colorMap: filteredColorMap, neutrals, statusColors };
}

export async function extractAndGeneratePalette() {
    const container = document.getElementById('paletteGrid');
    const sourceContainer = document.getElementById('sourceImagesGrid');
    const images = document.querySelectorAll('.pin-image');
    if (!container) return;

    // Get user's search query for color intent detection
    const searchTermsEl = document.getElementById('searchTermsDisplay');
    const userQuery = searchTermsEl?.getAttribute('data-original-query') || '';

    if (images.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#999;">Add images first.</p>';
        if (sourceContainer) sourceContainer.innerHTML = '';
        return;
    }

    // Always Regen
    container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#999;">Analyzing color distribution...</p>';
    if (sourceContainer) sourceContainer.innerHTML = '';

    // Show ALL source images
    if (sourceContainer) {
        for (let i = 0; i < images.length; i++) {
            const img = images[i] as HTMLImageElement;
            if (img.src) {
                const thumb = document.createElement('img');
                thumb.src = img.src;
                thumb.className = 'source-thumb';
                sourceContainer.appendChild(thumb);
            }
        }
    }

    const colorData = await extractColorMap(images, userQuery);
    renderColorMapUI(colorData);
}

function getSamplePixels(imgEl: HTMLImageElement): Promise<any[]> {
    return new Promise(resolve => {
        if (!imgEl.src) {
            console.log("🎨 Image has no src");
            resolve([]); return;
        }
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        if (!ctx) {
            console.log("🎨 Could not get canvas context");
            return resolve([]);
        }
        c.width = 50; c.height = 50;

        // Create a new image to ensure it's loaded and CORS-ready if needed
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            try {
                ctx.drawImage(img, 0, 0, 50, 50);
                const data = ctx.getImageData(0, 0, 50, 50).data;
                const pts = [];
                for (let i = 0; i < data.length; i += 16) {
                    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
                    if (l > 5 && l < 98) pts.push({ h, s, l });
                }
                resolve(pts);
            } catch (e) {
                console.error("🎨 Canvas error:", e);
                resolve([]);
            }
        };
        img.onerror = (e) => {
            console.error("🎨 Image load error:", e);
            resolve([]);
        };
        img.src = imgEl.src;
    });
}

function renderPaletteUI(palette: any[]) {
    const container = document.getElementById('paletteGrid');
    if (!container) return;
    container.innerHTML = '';
    palette.forEach(item => {
        const div = document.createElement('div'); div.className = 'role-card';
        const rgb = hexToRgb(item.hex);
        const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
        const dot = yiq >= 128 ? '#000' : '#fff';
        div.innerHTML = `<div class="role-preview" style="background-color:${item.hex}"><div class="contrast-dot" style="background-color:${dot}"></div></div><div class="role-info"><span class="role-name">${item.role}</span><span class="role-hex">${item.hex}</span><span class="role-primitive">${item.primitive}</span></div>`;
        container.appendChild(div);
    });
}

function renderColorMapUI(data: any) {
    const container = document.getElementById('paletteGrid');
    if (!container) return;

    container.innerHTML = '';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Color Map';
    title.style.cssText = 'grid-column: 1/-1; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Color distribution from moodboard';
    subtitle.style.cssText = 'grid-column: 1/-1; margin: 0 0 16px 0; font-size: 12px; color: #999;';
    container.appendChild(subtitle);

    // Color Map Container (stacked stripes)
    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = 'grid-column: 1/-1; display: flex; flex-direction: column; border-radius: 8px; overflow: hidden; min-height: 300px;';

    data.colorMap.forEach((color: any) => {
        const stripe = document.createElement('div');
        stripe.style.cssText = `
            background-color: ${color.hex};
            flex: 0 0 ${color.percentage}%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            min-height: 60px;
            position: relative;
        `;

        // Determine text color based on background
        const rgb = hexToRgb(color.hex);
        const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
        const textColor = yiq >= 128 ? '#000' : '#fff';

        stripe.innerHTML = `
            <div style="text-align: center; color: ${textColor};">
                <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${color.percentage}%</div>
                <div style="font-size: 11px; opacity: 0.8;">${color.hex}</div>
            </div>
        `;

        mapContainer.appendChild(stripe);
    });

    container.appendChild(mapContainer);

    // Neutrals section
    if (data.neutrals.length > 0) {
        const neutralsTitle = document.createElement('h4');
        neutralsTitle.textContent = 'Neutrals';
        neutralsTitle.style.cssText = 'grid-column: 1/-1; margin: 24px 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #666;';
        container.appendChild(neutralsTitle);

        data.neutrals.forEach((neutral: any) => {
            const div = document.createElement('div');
            div.className = 'role-card';
            const rgb = hexToRgb(neutral.hex);
            const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
            const dot = yiq >= 128 ? '#000' : '#fff';
            div.innerHTML = `<div class="role-preview" style="background-color:${neutral.hex}"><div class="contrast-dot" style="background-color:${dot}"></div></div><div class="role-info"><span class="role-name">${neutral.name}</span><span class="role-hex">${neutral.hex}</span></div>`;
            container.appendChild(div);
        });
    }

    // Status colors section
    const statusTitle = document.createElement('h4');
    statusTitle.textContent = 'Status Colors';
    statusTitle.style.cssText = 'grid-column: 1/-1; margin: 24px 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #666;';
    container.appendChild(statusTitle);

    data.statusColors.forEach((status: any) => {
        const div = document.createElement('div');
        div.className = 'role-card';
        const rgb = hexToRgb(status.hex);
        const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
        const dot = yiq >= 128 ? '#000' : '#fff';
        div.innerHTML = `<div class="role-preview" style="background-color:${status.hex}"><div class="contrast-dot" style="background-color:${dot}"></div></div><div class="role-info"><span class="role-name">${status.name}</span><span class="role-hex">${status.hex}</span></div>`;
        container.appendChild(div);
    });
}

const COLOR_RANGES: { [key: string]: any } = {
    'red': { hMin: 345, hMax: 15 }, // Wrap around 360
    'blue': { hMin: 190, hMax: 260 },
    'green': { hMin: 70, hMax: 160 },
    'lime': { hMin: 60, hMax: 100 }, // Yellow-green, bright greens
    'yellow': { hMin: 40, hMax: 70 },
    'orange': { hMin: 15, hMax: 40 },
    'purple': { hMin: 260, hMax: 300 },
    'pink': { hMin: 300, hMax: 345 }, // Expanded: includes magenta and rose
    'cyan': { hMin: 160, hMax: 190 },
    'black': { lMax: 25 },
    'white': { lMin: 80 },
    'gray': { sMax: 15 },
    'dark': { lMax: 30 },
    'light': { lMin: 70 },
    'beige': { hMin: 20, hMax: 50, sMax: 40, lMin: 50 }, // Warm, low sat, light (relaxed lMin)
    'brown': { hMin: 15, hMax: 45, lMax: 50 }, // Warm, darker
    'colorful': { sMin: 35 } // Lowered threshold for more matches
};

export async function scoreImageForColor(imgEl: HTMLImageElement, colorName: string): Promise<number> {
    const target = COLOR_RANGES[colorName.toLowerCase()];
    if (!target) return 0;

    const pixels = await getSamplePixels(imgEl);
    if (pixels.length === 0) return 0;

    let matchCount = 0;
    let totalWeight = 0;

    pixels.forEach((p: any) => {
        let isMatch = true; // Start as true and check all conditions
        const weight = Math.max(0.1, (p.s / 100) * (1 - Math.abs(p.l - 50) / 50));

        // Check saturation minimum (colorful)
        if (target.sMin !== undefined && p.s < target.sMin) isMatch = false;

        // Check saturation maximum (gray, beige)
        if (target.sMax !== undefined && p.s > target.sMax) isMatch = false;

        // Check lightness minimum (white, light, beige)
        if (target.lMin !== undefined && p.l < target.lMin) isMatch = false;

        // Check lightness maximum (black, dark, brown)
        if (target.lMax !== undefined && p.l > target.lMax) isMatch = false;

        // Check hue range (colors with hMin and hMax)
        if (target.hMin !== undefined && target.hMax !== undefined) {
            // For hue-based colors, also need minimum saturation
            if (p.s < 10) {
                isMatch = false;
            } else if (target.hMin > target.hMax) {
                // Wrap around (like red: 330-20)
                if (!(p.h >= target.hMin || p.h <= target.hMax)) isMatch = false;
            } else {
                if (!(p.h >= target.hMin && p.h <= target.hMax)) isMatch = false;
            }
        }

        if (isMatch) {
            matchCount += weight;
        }
        totalWeight += weight;
    });

    return totalWeight > 0 ? matchCount / totalWeight : 0;
}
