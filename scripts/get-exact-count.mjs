// EXACT PIN COUNT SCRIPT
// This will give you the EXACT number from Vercel KV
// Run this in Node.js or in a Vercel function

import { kv } from '@vercel/kv';

async function getExactPinCount() {
    console.log('🔍 Counting pins in Vercel KV...');

    const allKeys = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        allKeys.push(...result[1]);

        console.log(`  Found ${allKeys.length} pins so far...`);
    } while (cursor !== 0);

    const exactCount = allKeys.length;

    console.log('\n📊 EXACT PIN COUNT:', exactCount);
    console.log('📊 Limit remaining:', 1000 - exactCount);
    console.log('📊 Percentage used:', ((exactCount / 1000) * 100).toFixed(1) + '%');

    return exactCount;
}

getExactPinCount();
