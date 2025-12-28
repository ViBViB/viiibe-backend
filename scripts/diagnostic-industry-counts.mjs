import { kv } from '@vercel/kv';

async function diagnosticIndustryCounts() {
    console.log('🔍 DIAGNOSTIC: Industry Count Analysis\n');

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

    console.log(`Total pins found: ${pinKeys.length}\n`);

    // Count by EXACT industry name (case-sensitive)
    const exactCounts = new Map();
    // Count by lowercase industry name
    const lowercaseCounts = new Map();

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = pin.id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (tags && tags.industry && Array.isArray(tags.industry)) {
            const industry = tags.industry[0];

            // Exact count
            exactCounts.set(industry, (exactCounts.get(industry) || 0) + 1);

            // Lowercase count
            const lower = industry.toLowerCase();
            lowercaseCounts.set(lower, (lowercaseCounts.get(lower) || 0) + 1);
        }
    }

    console.log('📊 EXACT COUNTS (case-sensitive):');
    const exactSorted = Array.from(exactCounts.entries()).sort((a, b) => b[1] - a[1]);
    exactSorted.forEach(([industry, count]) => {
        console.log(`  ${industry}: ${count}`);
    });

    console.log('\n📊 LOWERCASE COUNTS:');
    const lowercaseSorted = Array.from(lowercaseCounts.entries()).sort((a, b) => b[1] - a[1]);
    lowercaseSorted.forEach(([industry, count]) => {
        console.log(`  ${industry}: ${count}`);
    });

    // Focus on Ecommerce/ecommerce
    console.log('\n🎯 ECOMMERCE SPECIFIC:');
    console.log(`  "Ecommerce" (capitalized): ${exactCounts.get('Ecommerce') || 0}`);
    console.log(`  "ecommerce" (lowercase): ${exactCounts.get('ecommerce') || 0}`);
    console.log(`  Total (normalized): ${lowercaseCounts.get('ecommerce') || 0}`);
}

diagnosticIndustryCounts().catch(console.error);
