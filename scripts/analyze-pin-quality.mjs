/**
 * ANALYZE PIN QUALITY
 * Check how many pins have /originals/ vs other resolutions
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function analyzePinQuality() {
    console.log('📊 Analyzing pin quality in database...\n');

    // Get all pin keys
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

    console.log(`Total pins: ${allKeys.length}\n`);

    const stats = {
        originals: 0,
        '736x': 0,
        '564x': 0,
        '474x': 0,
        '236x': 0,
        unknown: 0
    };

    for (const key of allKeys) {
        const pin = await kv.get(key);

        if (!pin || !pin.imageUrl) {
            stats.unknown++;
            continue;
        }

        const url = pin.imageUrl;

        if (url.includes('/originals/')) {
            stats.originals++;
        } else if (url.includes('/736x/')) {
            stats['736x']++;
        } else if (url.includes('/564x/')) {
            stats['564x']++;
        } else if (url.includes('/474x/')) {
            stats['474x']++;
        } else if (url.includes('/236x/')) {
            stats['236x']++;
        } else {
            stats.unknown++;
        }
    }

    console.log('📊 QUALITY BREAKDOWN');
    console.log('===================');
    console.log(`✅ /originals/: ${stats.originals} (${((stats.originals / allKeys.length) * 100).toFixed(1)}%)`);
    console.log(`⚠️  /736x/:     ${stats['736x']} (${((stats['736x'] / allKeys.length) * 100).toFixed(1)}%)`);
    console.log(`❌ /564x/:     ${stats['564x']} (${((stats['564x'] / allKeys.length) * 100).toFixed(1)}%)`);
    console.log(`❌ /474x/:     ${stats['474x']} (${((stats['474x'] / allKeys.length) * 100).toFixed(1)}%)`);
    console.log(`❌ /236x/:     ${stats['236x']} (${((stats['236x'] / allKeys.length) * 100).toFixed(1)}%)`);
    console.log(`❓ Unknown:    ${stats.unknown} (${((stats.unknown / allKeys.length) * 100).toFixed(1)}%)`);

    console.log('\n💡 RECOMMENDATION:');
    if (stats['736x'] > 0 || stats['236x'] > 0) {
        console.log(`   You have ${stats['736x'] + stats['236x']} pins with low/medium quality URLs.`);
        console.log(`   These will appear pixelated even with fallback.`);
        console.log(`   Consider running cleanup to remove non-/originals/ pins.`);
    } else {
        console.log(`   All pins are high quality! ✅`);
    }
}

analyzePinQuality()
    .then(() => {
        console.log('\n✅ Analysis complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
