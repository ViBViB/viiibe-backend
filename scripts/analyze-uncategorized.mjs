import 'dotenv/config';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function analyzeUncategorized() {
    console.log('🔍 Analyzing Uncategorized pins...\n');

    // Get all pin keys
    let cursor = 0;
    const allKeys = [];

    do {
        const response = await fetch(`${KV_URL}/scan/${cursor}?match=pin-tags:*&count=1000`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const data = await response.json();

        if (data.result && Array.isArray(data.result)) {
            allKeys.push(...data.result);
            cursor = data.cursor || 0;
        } else {
            break;
        }
    } while (cursor !== 0);

    console.log(`📊 Scanning ${allKeys.length} pins...\n`);

    const uncategorized = [];

    for (const key of allKeys) {
        // Get tags
        const tagsResponse = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const tagsData = await tagsResponse.json();
        const tags = tagsData.result;

        if (!tags || !tags.industry) continue;

        const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
        const hasUncategorized = industries.some(i => i.toLowerCase() === 'uncategorized');

        if (hasUncategorized) {
            const pinId = key.replace('pin-tags:', '');

            // Get pin data
            const pinResponse = await fetch(`${KV_URL}/get/saved-pin:${pinId}`, {
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });
            const pinData = await pinResponse.json();
            const pin = pinData.result;

            uncategorized.push({
                pinId,
                title: pin?.title || 'No title',
                url: pin?.pinterestUrl || 'No URL',
                tags: tags
            });
        }
    }

    console.log(`\n📋 Found ${uncategorized.length} Uncategorized pins:\n`);

    uncategorized.forEach((pin, i) => {
        console.log(`${i + 1}. ${pin.title}`);
        console.log(`   URL: ${pin.url}`);
        console.log(`   Styles: ${pin.tags.style?.join(', ') || 'none'}`);
        console.log(`   Type: ${pin.tags.type?.join(', ') || 'none'}`);
        console.log('');
    });

    console.log('\n💡 Suggestion: Review these manually and recategorize using the recategorize tool');
}

analyzeUncategorized().catch(console.error);
