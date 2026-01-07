/**
 * STEP 3: APPLY AI ANALYSIS RESULTS
 * 
 * Applies the AI color analysis results to the database
 */

import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

async function applyResults() {
    console.log('🎨 Applying AI Color Analysis Results\n');

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be saved\n');
    }

    // Load analysis results
    const resultsFile = 'batch1-complete-analyzed.json';
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

    console.log(`📊 Processing ${results.length} analyzed pins...\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    const stats = {
        updated: 0,
        unchanged: 0,
        errors: 0
    };

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const { pinId, title, currentColors, newColors, confidence, reasoning } = result;

        console.log(`[${i + 1}/${results.length}] Pin ${pinId}`);
        console.log(`   Title: ${title.substring(0, 60)}`);
        console.log(`   Current: ${currentColors.join(', ')}`);
        console.log(`   New: ${newColors.join(', ')}`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

        // Check if colors changed
        const colorsChanged = JSON.stringify(currentColors) !== JSON.stringify(newColors);

        if (colorsChanged) {
            console.log(`   💭 ${reasoning}`);

            if (!DRY_RUN) {
                try {
                    const tags = await kv.get(`pin-tags:${pinId}`) || {};

                    await kv.set(`pin-tags:${pinId}`, {
                        ...tags,
                        color: newColors,
                        aiAnalyzed: true,
                        analyzedAt: new Date().toISOString(),
                        aiConfidence: confidence
                    });

                    console.log(`   ✅ Updated in database`);
                    stats.updated++;
                } catch (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                    stats.errors++;
                }
            } else {
                console.log(`   🔍 Would update (dry run)`);
                stats.updated++;
            }
        } else {
            console.log(`   ⏭️  Colors unchanged`);
            stats.unchanged++;
        }

        console.log('');
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Updated: ${stats.updated}`);
    console.log(`Unchanged: ${stats.unchanged}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Total: ${results.length}\n`);

    // Calculate accuracy
    const totalChanges = stats.updated;
    const accuracy = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    console.log(`Average confidence: ${(accuracy * 100).toFixed(1)}%\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN COMPLETE - No changes were saved');
        console.log('   Run without --dry-run to apply changes\n');
    } else {
        console.log('✅ ANALYSIS APPLIED\n');
        console.log('Next steps:');
        console.log('1. Test color searches in Figma plugin');
        console.log('2. Verify accuracy of updated pins');
        console.log('3. If satisfied, proceed with full 1600 pin batch\n');
    }
}

applyResults()
    .then(() => {
        console.log('✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script error:', error);
        process.exit(1);
    });
