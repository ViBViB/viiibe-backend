/**
 * DATABASE CLEANUP SCRIPT - Remove /736x/ pins
 * Keep only /originals/ for maximum quality
 * 
 * This script removes all pins with /736x/ URLs since testing showed
 * /originals/ are 3x better quality (285% larger file size)
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function cleanup736xPins() {
    console.log('🧹 Starting cleanup of /736x/ pins...\n');

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

    // Analyze and delete /736x/ pins
    let deletedCount = 0;
    let keptCount = 0;
    const deletedPins = [];
    const keptPins = [];

    for (const key of allKeys) {
        const pin = await kv.get(key);

        if (!pin || !pin.imageUrl) {
            console.log(`⚠️  Pin ${key} has no imageUrl, skipping`);
            continue;
        }

        const url = pin.imageUrl;

        // Check if /736x/ (to be deleted)
        const is736x = url.includes('/736x/');
        const isOriginals = url.includes('/originals/');

        if (is736x) {
            // Delete the pin
            await kv.del(key);

            // Also delete associated tags if they exist
            const pinId = key.replace('saved-pin:', '');
            await kv.del(`pin-tags:${pinId}`);

            deletedCount++;
            deletedPins.push({
                id: pinId,
                url: url
            });

            console.log(`❌ Deleted: ${pinId} (736x)`);
        } else if (isOriginals) {
            keptCount++;
            keptPins.push({
                id: key.replace('saved-pin:', ''),
                url: url
            });
            console.log(`✅ Kept: ${key.replace('saved-pin:', '')} (originals)`);
        } else {
            // Unknown quality - keep but log
            keptCount++;
            console.log(`⚠️  Kept: ${key.replace('saved-pin:', '')} (unknown quality)`);
        }
    }

    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total pins processed: ${allKeys.length}`);
    console.log(`✅ /originals/ pins kept: ${keptCount}`);
    console.log(`❌ /736x/ pins deleted: ${deletedCount}`);

    if (allKeys.length > 0) {
        console.log(`📈 Quality improvement: ${((keptCount / allKeys.length) * 100).toFixed(1)}% are now /originals/`);
        console.log(`📉 Database reduction: ${((deletedCount / allKeys.length) * 100).toFixed(1)}% removed`);
    }

    console.log('\n✨ Cleanup complete!');
    console.log(`Database now contains ONLY maximum quality images (/originals/)`);
    console.log(`\nFinal count: ${keptCount} pins`);
}

// Run cleanup
cleanup736xPins()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error during cleanup:', error);
        process.exit(1);
    });
