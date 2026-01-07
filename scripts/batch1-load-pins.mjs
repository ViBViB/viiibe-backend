/**
 * BATCH 1: LOAD 50 PINS FOR ANALYSIS
 * 
 * Loads the next 50 pending pins (after the initial 10 test pins)
 */

import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const BATCH_SIZE = 50;

async function loadBatch1() {
    console.log('📊 Loading batch 1: 50 pins for analysis...\n');

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

        if (allKeys.length >= 200) break; // Get enough to filter

    } while (cursor !== 0);

    console.log(`   Found ${allKeys.length} total pins`);

    // Filter for pending pins (not AI analyzed)
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

        if (pendingPins.length >= BATCH_SIZE) break;
    }

    console.log(`   ✅ Selected ${pendingPins.length} pins\n`);

    // Save to file
    fs.writeFileSync(
        'batch1-pins-to-analyze.json',
        JSON.stringify(pendingPins, null, 2)
    );

    console.log('💾 Saved to: batch1-pins-to-analyze.json\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📋 BATCH 1: ${pendingPins.length} PINS\n`);

    // Show first 5 as sample
    console.log('Sample pins:');
    pendingPins.slice(0, 5).forEach((pin, i) => {
        console.log(`${i + 1}. Pin ${pin.pinId}`);
        console.log(`   Title: ${pin.title.substring(0, 60)}`);
        console.log(`   Current: ${pin.currentColors.join(', ') || 'none'}`);
        console.log(`   URL: ${pin.imageUrl}\n`);
    });

    console.log(`... and ${pendingPins.length - 5} more pins\n`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ BATCH 1 LOADED\n');
    console.log('Next: Download images and analyze with AI\n');
}

loadBatch1()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
