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
        'orange': { hMin: 15, hMax: 40 },
        'yellow': { hMin: 40, hMax: 70 },
        'green': { hMin: 70, hMax: 160 },
        'cyan': { hMin: 160, hMax: 190 },
        'blue': { hMin: 190, hMax: 260 },
        'purple': { hMin: 260, hMax: 300 },
        'pink': { hMin: 300, hMax: 345 },
        'black': { lMax: 25 },
        'white': { lMin: 80 }
    };

    const range = COLOR_RANGES[intent];
    if (!range) return false;

    // Check lightness-based colors (black, white)
    if (range.lMax !== undefined && l <= range.lMax) return true;
    if (range.lMin !== undefined && l >= range.lMin) return true;

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

// New function: Extract color distribution map (top 4 colors with percentages)
async function extractColorMap(images: NodeListOf<Element> | HTMLImageElement[], userQuery?: string): Promise<any> {
    console.log(`🗺️ PHASE 1: Analyzing ALL ${images.length} images for global colors...`);

    // Detect color intent from user query
    const colorIntent = detectColorIntent(userQuery || '');
    if (colorIntent) {
        console.log(`🎯 User is searching for "${colorIntent}" - will prioritize this color`);
    }

    // PHASE 1: Analyze ALL images to find global dominant colors
    const allPixels: any[] = [];
    const imagePixels: Array<{ img: HTMLImageElement, index: number, pixels: any[] }> = [];

    for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        if (img.src) {
            const pixels = await getSamplePixels(img);
            allPixels.push(...pixels);
            imagePixels.push({ img, index: i, pixels });
        }
    }

    if (allPixels.length === 0) return { colorMap: [], neutrals: [], statusColors: [] };

    // Filter backgrounds from global analysis
    const globalContentPixels = allPixels.filter(p => {
        const isBackground = p.s < 10 && p.l > 85;
        return !isBackground;
    });

    // Quick clustering to find global dominant hues
    const globalClusters: any[] = [];
    globalContentPixels.forEach(p => {
        if (p.s > 20) { // Only chromatic
            let cluster = globalClusters.find(c => Math.abs(c.h - p.h) < 15);
            if (cluster) {
                cluster.pixels.push(p);
            } else {
                globalClusters.push({ h: p.h, pixels: [p] });
            }
        }
    });

    // Calculate scores with color intent boost
    globalClusters.forEach(c => {
        const avgH = c.pixels.reduce((sum: number, p: any) => sum + p.h, 0) / c.pixels.length;
        const avgS = c.pixels.reduce((sum: number, p: any) => sum + p.s, 0) / c.pixels.length;
        const avgL = c.pixels.reduce((sum: number, p: any) => sum + p.l, 0) / c.pixels.length;

        // Base score = pixel count * saturation (favor vibrant colors)
        let score = c.pixels.length * (1 + avgS / 100);

        // MASSIVE BOOST if matches user intent
        if (colorIntent && doesColorMatchIntent(avgH, avgS, avgL, colorIntent)) {
            score *= 10000; // Ensure it's in top 4
            c.matchesIntent = true;
            console.log(`🎯 Cluster matches "${colorIntent}" intent:`, {
                h: Math.round(avgH),
                s: Math.round(avgS),
                l: Math.round(avgL),
                boostedScore: Math.round(score)
            });
        }

        c.score = score;
        c.avgH = avgH;
        c.avgS = avgS;
        c.avgL = avgL;
    });

    // Sort by score (includes intent boost)
    globalClusters.sort((a, b) => b.score - a.score);
    const topGlobalHues = globalClusters.slice(0, 4).map(c => {
        const avgH = c.pixels.reduce((sum: number, p: any) => sum + p.h, 0) / c.pixels.length;
        return avgH;
    });

    console.log(`🗺️ Global dominant hues:`, topGlobalHues.map(h => Math.round(h)));

    // PHASE 2: Select 4 images
    let imageScores;

    if (colorIntent) {
        // When user has color intent, select images with MOST of that color
        console.log(`🎯 PHASE 2: Selecting images with most "${colorIntent}" color...`);

        imageScores = imagePixels.map(({ img, index, pixels }) => {
            // Count pixels that match the intent color
            const intentPixels = pixels.filter(p => {
                if (p.s < 20) return false; // Must be chromatic
                return doesColorMatchIntent(p.h, p.s, p.l, colorIntent);
            });

            return {
                img,
                index,
                score: intentPixels.length // More intent pixels = higher score
            };
        });
    } else {
        // No intent: select images that best represent global colors
        imageScores = imagePixels.map(({ img, index, pixels }) => ({
            img,
            index,
            score: calculateColorRepresentation(pixels, topGlobalHues)
        }));
    }

    imageScores.sort((a, b) => b.score - a.score);
    const topImages = imageScores.slice(0, 4);

    console.log(`🗺️ PHASE 2: Selected 4 images:`, topImages.map(s => ({
        index: s.index,
        score: s.score
    })));

    // PHASE 3: Extract final color map from these 4 representative images
    const candidates: any[] = [];

    for (const { img } of topImages) {
        const pixels = await getSamplePixels(img);
        candidates.push(...pixels);
    }

    if (candidates.length === 0) return { colorMap: [], neutrals: [], statusColors: [] };

    // FILTER OUT BACKGROUNDS FIRST (before clustering)
    // This ensures percentages reflect actual content colors, not white/gray backgrounds
    const contentPixels = candidates.filter(p => {
        const isBackground = p.s < 10 && p.l > 85; // Very light, desaturated = background
        return !isBackground;
    });

    console.log(`🗺️ Filtered ${candidates.length - contentPixels.length} background pixels, analyzing ${contentPixels.length} content pixels`);

    if (contentPixels.length === 0) return { colorMap: [], neutrals: [], statusColors: [] };

    // Cluster pixels by hue (chromatic) or lightness (achromatic)
    const clusters: any[] = [];
    contentPixels.forEach(p => {
        const isAchromatic = p.s < 15;

        if (isAchromatic) {
            let cluster = clusters.find(c => c.isAchromatic && Math.abs(c.avgL - p.l) < 20);
            if (cluster) {
                cluster.pixels.push(p);
                cluster.avgL = (cluster.avgL * (cluster.pixels.length - 1) + p.l) / cluster.pixels.length;
            } else {
                clusters.push({ isAchromatic: true, avgL: p.l, pixels: [p], h: 0, s: p.s });
            }
        } else {
            let cluster = clusters.find(c => !c.isAchromatic && Math.abs(c.h - p.h) < 15);
            if (cluster) {
                cluster.pixels.push(p);
            } else {
                clusters.push({ isAchromatic: false, h: p.h, pixels: [p] });
            }
        }
    });

    // Calculate stats with color intent boost
    clusters.forEach(c => {
        const pixelCount = c.pixels.length;
        const avgS = c.pixels.reduce((sum: number, p: any) => sum + p.s, 0) / pixelCount;
        const avgL = c.pixels.reduce((sum: number, p: any) => sum + p.l, 0) / pixelCount;
        const avgH = c.isAchromatic ? 0 : c.pixels.reduce((sum: number, p: any) => sum + p.h, 0) / pixelCount;

        c.avgS = avgS;
        c.avgL = avgL;
        c.avgH = avgH;
        c.pixelCount = pixelCount;

        // APPLY COLOR INTENT BOOST IN FINAL CLUSTERING TOO
        if (colorIntent && !c.isAchromatic && doesColorMatchIntent(avgH, avgS, avgL, colorIntent)) {
            c.intentMatch = true;
            console.log(`🎯 PHASE 3: Final cluster matches "${colorIntent}":`, {
                h: Math.round(avgH),
                s: Math.round(avgS),
                l: Math.round(avgL),
                pixels: pixelCount
            });
        }
    });

    // Get chromatic and achromatic
    const chromatic = clusters.filter(c => !c.isAchromatic && c.avgS > 20);
    const achromatic = clusters.filter(c => c.isAchromatic || c.avgS <= 20);

    // Sort chromatic: INTENT MATCHES FIRST, then by dominance
    chromatic.sort((a, b) => {
        // Intent matches always come first
        if (a.intentMatch && !b.intentMatch) return -1;
        if (!a.intentMatch && b.intentMatch) return 1;
        // Otherwise sort by pixel count
        return b.pixelCount - a.pixelCount;
    });

    // Top 4 colors for map
    const topColors = chromatic.slice(0, 4);
    const totalPixels = contentPixels.length; // Use content pixels for percentage, not all candidates

    const colorMap = topColors.map((cluster, index) => {
        // Use AVERAGE HSL of the cluster instead of most saturated pixel
        // This gives us the actual representative color from the images
        const avgH = cluster.pixels.reduce((sum: number, p: any) => sum + p.h, 0) / cluster.pixels.length;
        const avgS = cluster.avgS; // Already calculated
        const avgL = cluster.avgL; // Already calculated

        const hex = hslToHex(avgH, avgS, avgL);
        const percentage = Math.round((cluster.pixelCount / totalPixels) * 100);

        return {
            name: `Color ${index + 1}`,
            hex: hex,
            percentage: percentage,
            h: Math.round(avgH),
            s: Math.round(avgS),
            l: Math.round(avgL)
        };
    });

    // Extract neutrals
    const neutrals: any[] = [];
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

    console.log('🗺️ Color Map:', colorMap);

    return { colorMap, neutrals, statusColors };
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
