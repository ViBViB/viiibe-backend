/**
 * CLEANUP NON-ORIGINALS PINS
 * Remove all pins that don't have /originals/ URLs
 * Keep only maximum quality images
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function cleanupNonOriginals() {
    console.log('🧹 Starting cleanup of non-/originals/ pins...\n');

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

    console.log(`📊 Total pins in database: ${allKeys.length}\n`);

    let keptCount = 0;
    let deletedCount = 0;

    for (const key of allKeys) {
        const pin = await kv.get(key);

        if (!pin || !pin.imageUrl) {
            console.log(`⚠️  Pin ${key} has no imageUrl, deleting...`);
            await kv.del(key);
            deletedCount++;
            continue;
        }

        const url = pin.imageUrl;
        const pinId = key.replace('saved-pin:', '');

        // Keep only /originals/ URLs
        if (url.includes('/originals/')) {
            console.log(`✅ Kept: ${pinId} (originals)`);
            keptCount++;
        } else {
            // Delete pin and its tags
            await kv.del(key);
            await kv.del(`pin-tags:${pinId}`);

            const quality = url.includes('/236x/') ? '236x' :
                url.includes('/474x/') ? '474x' :
                    url.includes('/564x/') ? '564x' :
                        url.includes('/736x/') ? '736x' :
                            'unknown';

            console.log(`❌ Deleted: ${pinId} (${quality})`);
            deletedCount++;
        }
    }

    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total pins processed: ${allKeys.length}`);
    console.log(`✅ /originals/ pins kept: ${keptCount} (${((keptCount / allKeys.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Non-/originals/ deleted: ${deletedCount} (${((deletedCount / allKeys.length) * 100).toFixed(1)}%)`);

    console.log('\n✨ Cleanup complete!');
    console.log(`Database now contains ONLY maximum quality images (/originals/)`);
    console.log(`\nFinal count: ${keptCount} pins`);
}

// Run cleanup
cleanupNonOriginals()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error during cleanup:', error);
        process.exit(1);
    });
