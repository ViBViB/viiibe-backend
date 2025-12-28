import 'dotenv/config';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function getExactCounts() {
    console.log('🔍 Getting EXACT pin counts from Upstash...\n');

    // Get all saved-pin keys
    let cursor = 0;
    let allPinKeys = [];

    do {
        const scanResponse = await fetch(`${KV_URL}/scan/${cursor}?match=saved-pin:*&count=1000`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const scanData = await scanResponse.json();

        if (scanData.result) {
            allPinKeys = allPinKeys.concat(scanData.result);
            cursor = scanData.cursor || 0;
        } else {
            break;
        }
    } while (cursor !== 0);

    console.log(`📊 Total pins in database: ${allPinKeys.length}\n`);

    // Count by industry
    const industryCounts = {};
    let pinsWithoutTags = 0;
    let pinsWithTags = 0;

    for (const key of allPinKeys) {
        const pinId = key.replace('saved-pin:', '');

        // Get tags
        const tagsResponse = await fetch(`${KV_URL}/get/pin-tags:${pinId}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const tagsData = await tagsResponse.json();
        const tags = tagsData.result;

        if (tags && tags.industry) {
            pinsWithTags++;
            const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];

            industries.forEach(industry => {
                const normalizedIndustry = industry.toLowerCase();
                industryCounts[normalizedIndustry] = (industryCounts[normalizedIndustry] || 0) + 1;
            });
        } else {
            pinsWithoutTags++;
        }
    }

    console.log(`✅ Pins with tags: ${pinsWithTags}`);
    console.log(`❌ Pins without tags: ${pinsWithoutTags}\n`);

    // Sort by count
    const sorted = Object.entries(industryCounts)
        .sort((a, b) => b[1] - a[1]);

    console.log('📈 EXACT COUNTS BY INDUSTRY:\n');
    sorted.forEach(([industry, count]) => {
        console.log(`${industry}: ${count}`);
    });

    console.log('\n🎯 CORE INDUSTRIES:');
    const core = ['finance', 'fitness', 'healthcare', 'tech', 'education', 'saas', 'ecommerce'];
    core.forEach(industry => {
        const count = industryCounts[industry] || 0;
        const status = count >= 100 ? '✅' : '❌';
        console.log(`${status} ${industry}: ${count}/100`);
    });
}

getExactCounts().catch(console.error);
