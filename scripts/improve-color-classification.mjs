/**
 * IMPROVED COLOR CLASSIFICATION
 * 
 * This script updates the color classification logic to:
 * 1. Lower threshold from 5% to 2% to capture visually important colors
 * 2. Prioritize saturated colors over neutrals
 * 3. Improve rgbToColorName() to better distinguish similar colors
 * 
 * Cost: $0 (uses existing Google Vision data)
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Improved RGB to color name conversion
 * More strict distinction between similar colors
 */
function improvedRgbToColorName(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Grayscale detection
    if (diff < 30) {
        if (max < 50) return 'black';
        if (max > 200) return 'white';
        return 'gray';
    }

    // Calculate lightness and saturation
    const l = (max + min) / 2 / 255;
    const s = diff / (255 - Math.abs(2 * l * 255 - 255));

    // Low saturation = neutral/muted tones
    if (s < 0.25) {
        if (l > 0.75) return 'white';
        if (l < 0.25) return 'black';
        // Warm neutrals (beige, tan, cream)
        if (r > g && r > b && r - b > 20) return 'beige';
        return 'gray';
    }

    // STRICT RED DETECTION
    if (r > g && r > b) {
        // Pure red: high saturation, red dominant, low green/blue
        if (r > 180 && g < 120 && b < 120 && s > 0.5) {
            return 'red';
        }

        // Pink: light red with high lightness
        if (l > 0.6 && b > g) {
            return 'pink';
        }

        // Orange: red-yellow mix
        if (g > b + 30 && g > 100) {
            // Light orange/peach
            if (l > 0.65) return 'beige';
            // Pure orange
            if (s > 0.4) return 'orange';
            // Brown
            if (l < 0.4) return 'brown';
            return 'orange';
        }

        // Pink again (red-blue mix with high lightness)
        if (b > g && l > 0.55) return 'pink';

        // Burgundy/dark red
        if (l < 0.4 && s > 0.3) return 'red';

        // Default: if mostly red but doesn't fit above, it's probably pink or beige
        if (l > 0.6) return 'pink';
        return 'red';
    }

    // Green tones
    if (g > r && g > b) {
        // Cyan (blue-green)
        if (b > r + 30) return 'cyan';
        // Lime (yellow-green)
        if (r > b + 30 && l > 0.5) return 'lime';
        return 'green';
    }

    // Blue tones
    if (b > r && b > g) {
        // Purple (red-blue)
        if (r > g + 30) return 'purple';
        // Cyan (green-blue)
        if (g > r + 30) return 'cyan';
        return 'blue';
    }

    // Yellow (high red and green, low blue)
    if (r > 150 && g > 150 && b < 120) return 'yellow';

    // Pink (high red and blue)
    if (r > 150 && b > 150 && g < 150) return 'pink';

    return 'colorful';
}

/**
 * Improved color combination logic
 * Prioritizes saturated colors over neutrals
 */
function improvedCombineColors(visionColors) {
    // Convert vision colors with improved algorithm
    const colorData = visionColors.map(c => ({
        name: improvedRgbToColorName(
            c.rgb.r || 0,
            c.rgb.g || 0,
            c.rgb.b || 0
        ),
        score: c.score,
        rgb: c.rgb
    }));

    // Filter by lower threshold (2% instead of 5%)
    const significantColors = colorData.filter(c => c.score > 0.02);

    // Categorize colors
    const neutrals = ['white', 'black', 'gray', 'beige'];
    const saturated = significantColors.filter(c => !neutrals.includes(c.name));
    const neutral = significantColors.filter(c => neutrals.includes(c.name));

    // Prioritize saturated colors
    const prioritized = [...saturated, ...neutral];

    // Remove duplicates while preserving order
    const uniqueColors = [];
    const seen = new Set();

    for (const color of prioritized) {
        if (!seen.has(color.name)) {
            uniqueColors.push(color.name);
            seen.add(color.name);
        }
    }

    // Return top 3
    return uniqueColors.slice(0, 3);
}

/**
 * Re-classify colors using improved algorithm
 */
async function reclassifyWithImprovedAlgorithm() {
    console.log('🎨 Re-classifying colors with improved algorithm...\n');

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be saved\n');
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

    // Process each pin
    const stats = {
        processed: 0,
        changed: 0,
        unchanged: 0,
        noVisionData: 0
    };

    const changes = [];

    for (const key of allKeys) {
        const pinId = key.replace('saved-pin:', '');
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (!tags) continue;

        // Get vision data (stored during original analysis)
        // We need to check if we have the raw RGB data
        // For now, we'll re-analyze using the stored color data

        // This is a limitation: we don't have the raw Vision API data stored
        // We only have the processed color names

        // ALTERNATIVE: Re-run Google Vision API (much cheaper than GPT-4)
        // Google Vision: ~$0.0015 per image
        // GPT-4 Vision: ~$0.01 per image

        stats.processed++;
    }

    console.log('\n📊 STATISTICS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Processed: ${stats.processed}`);
    console.log(`Changed: ${stats.changed}`);
    console.log(`Unchanged: ${stats.unchanged}`);
    console.log(`No vision data: ${stats.noVisionData}`);
}

reclassifyWithImprovedAlgorithm()
    .then(() => {
        console.log('\n✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script error:', error);
        process.exit(1);
    });
