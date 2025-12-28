import { kv } from '@vercel/kv';

async function checkIndustryCounts() {
    console.log('Fetching all pins...\n');

    // Get all saved pins
    const pinKeys = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });
        cursor = result[0];
        pinKeys.push(...result[1]);
    } while (cursor !== 0);

    console.log(`Total pins: ${pinKeys.length}\n`);

    // Count by industry
    const industryCounts = new Map();

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = (pin as any).id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (tags && (tags as any).industry) {
            const industry = (tags as any).industry[0];
            industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
        }
    }

    // Sort by count descending
    const sorted = Array.from(industryCounts.entries())
        .sort((a, b) => b[1] - a[1]);

    console.log('Industry counts:\n');
    sorted.forEach(([industry, count]) => {
        console.log(`${industry}: ${count}`);
    });
}

checkIndustryCounts().catch(console.error);
