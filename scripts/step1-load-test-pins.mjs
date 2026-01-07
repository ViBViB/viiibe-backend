/**
 * STEP 1: LOAD TEST PINS
 * 
 * Loads 10 pending pins and saves their data to a JSON file
 * for AI analysis.
 */

import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const TEST_LIMIT = 10;

async function loadTestPins() {
    console.log('📊 Loading 10 test pins for AI analysis...\n');

    console.log('   Scanning database...');
    const allKeys = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        allKeys.push(...result[1]);

        if (allKeys.length >= 100) break;

    } while (cursor !== 0);

    console.log(`   Found ${allKeys.length} total pins`);

    // Filter for pending pins
    const pendingPins = [];

    for (const key of allKeys) {
        const pinId = key.replace('saved-pin:', '');
        const pin = await kv.get(key);
        const tags = await kv.get(`pin-tags:${pinId}`);

        // Only include pins that haven't been AI analyzed
        if (!tags || !tags.aiAnalyzed) {
            if (pin && pin.imageUrl) {
                pendingPins.push({
                    pinId,
                    imageUrl: pin.imageUrl,
                    title: pin.title || 'Untitled',
                    currentColors: tags?.color || []
                });
            }
        }

        if (pendingPins.length >= TEST_LIMIT) break;
    }

    console.log(`   ✅ Selected ${pendingPins.length} pins\n`);

    // Save to file
    fs.writeFileSync(
        'test-pins-to-analyze.json',
        JSON.stringify(pendingPins, null, 2)
    );

    console.log('💾 Saved to: test-pins-to-analyze.json\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 PINS TO ANALYZE:\n');

    pendingPins.forEach((pin, i) => {
        console.log(`${i + 1}. Pin ${pin.pinId}`);
        console.log(`   Title: ${pin.title.substring(0, 60)}`);
        console.log(`   Current: ${pin.currentColors.join(', ') || 'none'}`);
        console.log(`   URL: ${pin.imageUrl}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ STEP 1 COMPLETE\n');
    console.log('Next: AI assistant will analyze these images and create');
    console.log('      test-pins-analyzed.json with color classifications\n');
}

loadTestPins()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
