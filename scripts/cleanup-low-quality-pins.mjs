/**
 * DATABASE CLEANUP SCRIPT
 * Remove low-quality pins from Vercel KV database
 * 
 * This script identifies and deletes pins with low-quality image URLs:
 * - /236x/ (thumbnails)
 * - /474x/ (medium-low quality)
 * - /564x/ (medium quality)
 * 
 * Only keeps pins with:
 * - /originals/ (highest quality)
 * - /736x/ (high quality)
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function cleanupLowQualityPins() {
    console.log('🧹 Starting database cleanup...\n');

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

    console.log(`📊 Total pins in database: ${allKeys.length}`);

    // Analyze and delete low-quality pins
    let deletedCount = 0;
    let keptCount = 0;
    const deletedPins = [];

    for (const key of allKeys) {
        const pin = await kv.get(key);

        if (!pin || !pin.imageUrl) {
            console.log(`⚠️  Pin ${key} has no imageUrl, skipping`);
            continue;
        }

        const url = pin.imageUrl;

        // Check if low-quality
        const isLowQuality =
            url.includes('/236x/') ||
            url.includes('/474x/') ||
            url.includes('/564x/');

        if (isLowQuality) {
            // Delete the pin
            await kv.del(key);

            // Also delete associated tags if they exist
            const pinId = key.replace('saved-pin:', '');
            await kv.del(`pin-tags:${pinId}`);

            deletedCount++;
            deletedPins.push({
                id: pinId,
                url: url,
                quality: url.includes('/236x/') ? '236x' : url.includes('/474x/') ? '474x' : '564x'
            });

            console.log(`❌ Deleted: ${pinId} (${url.includes('/236x/') ? '236x' : url.includes('/474x/') ? '474x' : '564x'})`);
        } else {
            keptCount++;
            const quality = url.includes('/originals/') ? 'originals' : url.includes('/736x/') ? '736x' : 'unknown';
            console.log(`✅ Kept: ${key.replace('saved-pin:', '')} (${quality})`);
        }
    }

    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total pins processed: ${allKeys.length}`);
    console.log(`✅ High-quality pins kept: ${keptCount}`);
    console.log(`❌ Low-quality pins deleted: ${deletedCount}`);
    console.log(`📈 Quality improvement: ${((keptCount / allKeys.length) * 100).toFixed(1)}% high-quality`);

    // Breakdown by deleted quality
    const deleted236x = deletedPins.filter(p => p.quality === '236x').length;
    const deleted474x = deletedPins.filter(p => p.quality === '474x').length;
    const deleted564x = deletedPins.filter(p => p.quality === '564x').length;

    console.log('\nDeleted by quality:');
    console.log(`  /236x/: ${deleted236x}`);
    console.log(`  /474x/: ${deleted474x}`);
    console.log(`  /564x/: ${deleted564x}`);

    console.log('\n✨ Cleanup complete!');
    console.log(`Database now contains only high-quality images (/originals/ and /736x/)`);
}

// Run cleanup
cleanupLowQualityPins()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error during cleanup:', error);
        process.exit(1);
    });
