/**
 * APPLY COLOR REVIEW CHANGES
 * 
 * Extracts color changes from color-review-report.html and applies them to the database
 */

import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Parse HTML report to extract color changes
 */
function parseColorChanges(htmlContent) {
    const changes = [];

    // Split by card divs
    const cardSections = htmlContent.split('<div class="card" data-type="reclassify">');

    for (let i = 1; i < cardSections.length; i++) {
        const section = cardSections[i];

        // Extract Pinterest URL to get pin ID
        const urlMatch = section.match(/https:\/\/cl\.pinterest\.com\/pin\/(\d+)\//);
        if (!urlMatch) continue;

        const pinId = urlMatch[1];

        // Extract new colors - they appear after "New Colors" label
        const newColorsSection = section.match(/New Colors[\s\S]*?<div class="color-tags">([\s\S]*?)<\/div>/);
        if (!newColorsSection) continue;

        const colorTags = newColorsSection[1];
        const colorMatches = colorTags.matchAll(/<span class="color-tag new">([^<]+)<\/span>/g);
        const newColors = Array.from(colorMatches, m => m[1]);

        if (newColors.length > 0) {
            changes.push({ pinId, newColors });
        }
    }

    return changes;
}

/**
 * Apply color changes to database
 */
async function applyColorChanges() {
    console.log('🎨 Applying color changes from review report...\n');

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be saved\n');
    }

    // Read HTML report
    console.log('📄 Reading color-review-report.html...');
    const htmlContent = readFileSync('color-review-report.html', 'utf-8');

    // Parse changes
    console.log('🔍 Parsing color changes...');
    const changes = parseColorChanges(htmlContent);
    console.log(`✅ Found ${changes.length} pins to update\n`);

    if (changes.length === 0) {
        console.log('⚠️  No changes found in report');
        return;
    }

    // Show first few changes for verification
    console.log('📋 Sample changes:');
    changes.slice(0, 3).forEach(({ pinId, newColors }) => {
        console.log(`   Pin ${pinId}: ${newColors.join(', ')}`);
    });
    console.log('');

    // Apply changes
    const results = {
        updated: 0,
        notFound: 0,
        errors: 0
    };

    for (let i = 0; i < changes.length; i++) {
        const { pinId, newColors } = changes[i];
        const progress = `[${i + 1}/${changes.length}]`;

        try {
            // Get current tags
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (!tags) {
                console.log(`${progress} ⚠️  Pin ${pinId} not found in database`);
                results.notFound++;
                continue;
            }

            const oldColors = tags.color || [];

            console.log(`${progress} Pin ${pinId}`);
            console.log(`   Old: ${oldColors.join(', ')}`);
            console.log(`   New: ${newColors.join(', ')}`);

            if (!DRY_RUN) {
                // Update tags
                const updatedTags = {
                    ...tags,
                    color: newColors
                };

                await kv.set(`pin-tags:${pinId}`, updatedTags);
                console.log(`   ✅ Updated`);
            }

            results.updated++;

        } catch (error) {
            console.log(`${progress} ❌ Error updating pin ${pinId}: ${error.message}`);
            results.errors++;
        }
    }

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 UPDATE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`✅ Updated: ${results.updated}`);
    console.log(`⚠️  Not found: ${results.notFound}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log(`📊 Total processed: ${changes.length}\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN COMPLETE - No changes were saved');
        console.log('   Run without --dry-run to apply changes\n');
    } else {
        console.log('✅ COLOR CHANGES APPLIED\n');
        console.log('Next steps:');
        console.log('1. Test searches in Figma plugin');
        console.log('2. Verify color accuracy improved');
        console.log('3. Check for any remaining infiltrators\n');
    }
}

// Run the script
applyColorChanges()
    .then(() => {
        console.log('✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script error:', error);
        process.exit(1);
    });
