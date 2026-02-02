
import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const TARGET_HASH = '8e2740d41c8b4aab3589f404aad32907';

async function findAndDeletePin() {
    console.log('🔍 Scanning database for target pin...');
    console.log(`   Target Hash: ${TARGET_HASH}`);

    const allKeys = [];
    let cursor = 0;

    // 1. Scan all keys
    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        allKeys.push(...result[1]);
    } while (cursor !== 0);

    console.log(`📊 Checked ${allKeys.length} total pins keys. Searching content...`);

    // 2. Iterate and check content in batches
    const BATCH_SIZE = 50;
    let found = false;

    for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
        const batchKeys = allKeys.slice(i, i + BATCH_SIZE);
        if (found) break;

        // Fetch batch in parallel
        const pinsData = await Promise.all(
            batchKeys.map(async (key) => {
                try {
                    const pin = await kv.get(key);
                    return { key, pin };
                } catch (e) {
                    return null;
                }
            })
        );

        for (const item of pinsData) {
            if (!item || !item.pin) continue;
            const { key, pin } = item;
            const pinId = key.replace('saved-pin:', '');

            const imageUrl = pin.imageUrl || (pin.image && pin.image.url) || '';

            if (imageUrl.includes(TARGET_HASH)) {
                console.log('\n✅ FOUND TARGET PIN:');
                console.log(`   ID: ${pinId}`);
                console.log(`   Key: ${key}`);
                console.log(`   Title: ${pin.title}`);
                console.log(`   Image: ${imageUrl}`);

                console.log('🗑️  Deleting pin and tags...');

                // Delete pin data
                await kv.del(key);
                // Delete tags data
                await kv.del(`pin-tags:${pinId}`);

                console.log('🎉 Deleted successfully!');
                found = true;
                break;
            }
        }

        // Progress log
        if ((i + BATCH_SIZE) % 500 === 0) {
            process.stdout.write('.');
        }
    }

    if (!found) {
        console.log('\n❌ Target image not found in the database.');
    }
}

findAndDeletePin()
    .then(() => {
        console.log('✅ Done');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
