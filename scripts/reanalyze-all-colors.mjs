/**
 * RE-ANALYZE ALL COLORS WITH IMPROVED ALGORITHM
 * 
 * This script re-analyzes all pins using Google Vision API and the improved
 * rgbToColorName() function to fix color classification issues.
 * 
 * Cost: ~$2.62 (1,746 pins × $0.0015)
 * Time: ~10-15 minutes
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0');

if (!GOOGLE_VISION_API_KEY) {
    console.error('❌ GOOGLE_VISION_API_KEY not found in .env.local');
    process.exit(1);
}

/**
 * Improved RGB to color name conversion (matches api/pin-analysis.ts)
 */
function rgbToColorName(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Calculate HSL values for better color detection
    const l = (max + min) / 2 / 255;
    const s = diff === 0 ? 0 : diff / (255 - Math.abs(2 * l * 255 - 255));

    // 1. GRAYSCALE (low saturation or low difference)
    if (diff < 30 || s < 0.15) {
        if (max < 50) return 'black';
        if (max > 200) return 'white';
        // Warm grays (beige family)
        if (r > g && r > b && r - b > 15) return 'beige';
        return 'gray';
    }

    // 2. YELLOW (r ≈ g, both high, b low) - MUST BE BEFORE RED/GREEN BLOCKS
    if (r > 150 && g > 150 && b < 130 && Math.abs(r - g) < 50) {
        return 'yellow';
    }

    // 3. CYAN (g ≈ b, both high, r low) - MUST BE BEFORE GREEN/BLUE BLOCKS
    if (g > 150 && b > 150 && r < 130 && Math.abs(g - b) < 50) {
        return 'cyan';
    }

    // 4. PINK (r and b high, g lower) - MUST BE BEFORE RED/BLUE BLOCKS
    if (r > 150 && b > 120 && b > g && l > 0.45) {
        return 'pink';
    }

    // 5. RED FAMILY (r dominant)
    if (r > g && r > b) {
        // Pure red (high saturation, red very dominant)
        if (r > 180 && g < 120 && b < 120 && s > 0.5) {
            return 'red';
        }
        // Orange (r > g > b)
        if (g > b + 30 && g > 100) {
            if (l > 0.7) return 'beige';
            if (l < 0.35) return 'brown';
            return 'orange';
        }
        // Pink (light red-blue mix)
        if (b > g && l > 0.5) return 'pink';
        // Brown (dark red)
        if (l < 0.35) return 'brown';
        // Burgundy/dark red
        if (s > 0.4) return 'red';
        // Default to beige for low saturation warm tones
        return 'beige';
    }

    // 6. GREEN FAMILY (g dominant)
    if (g > r && g > b) {
        // Cyan (blue-green, b close to g)
        if (b > r + 40 && Math.abs(g - b) < 60) return 'cyan';
        // Lime (yellow-green, r close to g)
        if (r > b + 40 && l > 0.45) return 'lime';
        return 'green';
    }

    // 7. BLUE FAMILY (b dominant)
    if (b > r && b > g) {
        // Purple (red-blue, r close to b)
        if (r > g + 40 && Math.abs(b - r) < 80) return 'purple';
        // Cyan (green-blue, g close to b)
        if (g > r + 40 && Math.abs(b - g) < 60) return 'cyan';
        return 'blue';
    }

    // 8. COLORFUL (high saturation, no clear dominant color)
    if (s > 0.5 && diff > 60) {
        return 'colorful';
    }

    // Fallback
    return 'gray';
}

/**
 * Call Google Vision API to analyze image
 */
async function analyzeWithVision(imageUrl) {
    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { source: { imageUri: imageUrl } },
                    features: [
                        { type: 'IMAGE_PROPERTIES' }
                    ]
                }]
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vision API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const result = data.responses[0];

    const colorInfo = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const colors = colorInfo.slice(0, 10).map(colorData => ({
        name: rgbToColorName(
            colorData.color?.red || 0,
            colorData.color?.green || 0,
            colorData.color?.blue || 0
        ),
        score: colorData.score || 0,
        rgb: {
            r: colorData.color?.red || 0,
            g: colorData.color?.green || 0,
            b: colorData.color?.blue || 0
        }
    }));

    return colors;
}

/**
 * Combine colors with prioritization
 */
function combineColors(visionColors) {
    // Filter by 2% threshold
    const significantColors = visionColors.filter(c => c.score > 0.02);

    // Prioritize saturated colors
    const neutralColors = ['white', 'black', 'gray', 'beige'];
    const saturated = significantColors.filter(c => !neutralColors.includes(c.name));
    const neutral = significantColors.filter(c => neutralColors.includes(c.name));
    const prioritized = [...saturated, ...neutral];

    // Remove duplicates
    const uniqueColors = [];
    const seen = new Set();

    for (const color of prioritized) {
        if (!seen.has(color.name)) {
            uniqueColors.push(color.name);
            seen.add(color.name);
        }
    }

    return uniqueColors.slice(0, 3);
}

/**
 * Main re-analysis function
 */
async function reanalyzeAllColors() {
    console.log('🎨 Re-analyzing all pins with improved color algorithm...\n');

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be saved\n');
    }

    if (LIMIT > 0) {
        console.log(`⚠️  LIMIT MODE - Only processing first ${LIMIT} pins\n`);
    }

    // Get all pins
    console.log('📊 Scanning database for pins...');
    const allKeys = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        allKeys.push(...result[1]);
    } while (cursor !== 0);

    console.log(`✅ Found ${allKeys.length} total pins\n`);

    // Apply limit if specified
    const pinsToProcess = LIMIT > 0 ? allKeys.slice(0, LIMIT) : allKeys;
    console.log(`📝 Processing ${pinsToProcess.length} pins\n`);

    // Stats
    const stats = {
        processed: 0,
        updated: 0,
        unchanged: 0,
        noImage: 0,
        errors: 0
    };

    const colorChanges = {};
    const startTime = Date.now();

    // Process each pin
    for (let i = 0; i < pinsToProcess.length; i++) {
        const key = pinsToProcess[i];
        const pinId = key.replace('saved-pin:', '');
        const progress = `[${i + 1}/${pinsToProcess.length}]`;

        try {
            const pin = await kv.get(key);
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (!pin || !tags) {
                stats.noImage++;
                continue;
            }

            if (!pin.imageUrl) {
                console.log(`${progress} Pin ${pinId} - No image URL, skipping`);
                stats.noImage++;
                continue;
            }

            // Get old colors
            const oldColors = tags.color || [];

            // Analyze with Vision API
            const visionColors = await analyzeWithVision(pin.imageUrl);
            const newColors = combineColors(visionColors);

            // Check if colors changed
            const colorsChanged = JSON.stringify(oldColors) !== JSON.stringify(newColors);

            if (colorsChanged) {
                console.log(`${progress} Pin ${pinId}`);
                console.log(`   Old: ${oldColors.join(', ')}`);
                console.log(`   New: ${newColors.join(', ')}`);

                // Track color changes
                const oldPrimary = oldColors[0] || 'none';
                const newPrimary = newColors[0] || 'none';

                if (oldPrimary !== newPrimary) {
                    const key = `${oldPrimary} → ${newPrimary}`;
                    colorChanges[key] = (colorChanges[key] || 0) + 1;
                }

                // Update database
                if (!DRY_RUN) {
                    await kv.set(`pin-tags:${pinId}`, {
                        ...tags,
                        color: newColors
                    });
                }

                stats.updated++;
            } else {
                stats.unchanged++;
            }

            stats.processed++;

            // Progress update every 50 pins
            if ((i + 1) % 50 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = stats.processed / elapsed;
                const remaining = pinsToProcess.length - stats.processed;
                const eta = Math.round(remaining / rate);

                console.log(`\n📊 Progress: ${stats.processed}/${pinsToProcess.length} (${((stats.processed / pinsToProcess.length) * 100).toFixed(1)}%)`);
                console.log(`   Updated: ${stats.updated}, Unchanged: ${stats.unchanged}, No image: ${stats.noImage}`);
                console.log(`   Rate: ${rate.toFixed(1)} pins/sec, ETA: ${eta}s\n`);
            }

            // Rate limiting: 10 requests per second
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.log(`${progress} Pin ${pinId} - ERROR: ${error.message}`);
            stats.errors++;
        }
    }

    // Print summary
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 RE-ANALYSIS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Processed: ${stats.processed}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Unchanged: ${stats.unchanged}`);
    console.log(`No image: ${stats.noImage}`);
    console.log(`Errors: ${stats.errors}`);

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\nTotal time: ${Math.round(totalTime)}s (${(stats.processed / totalTime).toFixed(1)} pins/sec)`);

    // Print color changes
    if (Object.keys(colorChanges).length > 0) {
        console.log('\n🔄 PRIMARY COLOR CHANGES:');
        console.log('─────────────────────────────────────────────────────────\n');

        const sortedChanges = Object.entries(colorChanges)
            .sort((a, b) => b[1] - a[1]);

        for (const [change, count] of sortedChanges) {
            console.log(`${change}: ${count} pins`);
        }
    }

    const estimatedCost = (stats.processed * 0.0015).toFixed(2);
    console.log(`\n💰 Estimated cost: $${estimatedCost}`);

    if (DRY_RUN) {
        console.log('\n🔍 DRY RUN COMPLETE - No changes were saved');
        console.log('   Run without --dry-run to apply changes\n');
    } else {
        console.log('\n✅ RE-ANALYSIS COMPLETE\n');
    }
}

// Run the script
reanalyzeAllColors()
    .then(() => {
        console.log('✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script error:', error);
        process.exit(1);
    });
