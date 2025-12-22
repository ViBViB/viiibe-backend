import { kv } from '@vercel/kv';

async function analyzeAllIndustries() {
    console.log('🔍 Scanning all pins for industry distribution...\n');

    // Use SCAN to get all pins
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

    console.log(`📊 Total pins found: ${pinKeys.length}\n`);

    // Count by industry
    const industryCounts = new Map();
    let withIndustry = 0;
    let withoutIndustry = 0;

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = pin.id;
        const aiTags = await kv.get(`pin-tags:${pinId}`);

        if (aiTags && aiTags.industry && Array.isArray(aiTags.industry) && aiTags.industry.length > 0) {
            const industry = aiTags.industry[0];
            industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
            withIndustry++;
        } else {
            withoutIndustry++;
        }
    }

    // Sort by count
    const sorted = Array.from(industryCounts.entries())
        .sort((a, b) => b[1] - a[1]);

    console.log('📈 Industry Distribution:\n');
    console.log('Industry'.padEnd(25) + 'Count');
    console.log('─'.repeat(35));

    for (const [industry, count] of sorted) {
        console.log(industry.padEnd(25) + count);
    }

    console.log('─'.repeat(35));
    console.log('Uncategorized'.padEnd(25) + withoutIndustry);
    console.log('\n');
    console.log(`✅ With industry: ${withIndustry}`);
    console.log(`❌ Without industry: ${withoutIndustry}`);
    console.log(`📊 Total industries: ${industryCounts.size}`);
}

analyzeAllIndustries().catch(console.error);
