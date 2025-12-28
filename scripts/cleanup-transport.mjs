import 'dotenv/config';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function unifyTransport() {
    console.log('🔄 Unifying Transport → Transportation...\n');

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

    console.log(`📊 Found ${allKeys.length} pin-tags keys\n`);

    let updated = 0;
    let skipped = 0;

    for (const key of allKeys) {
        // Get tags
        const response = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const data = await response.json();
        const tags = data.result;

        if (!tags || !tags.industry) {
            skipped++;
            continue;
        }

        // Check if industry contains "Transport" (not "Transportation")
        const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
        const hasTransport = industries.some(i => i.toLowerCase() === 'transport');

        if (hasTransport) {
            // Replace "Transport" with "Transportation"
            const newIndustries = industries.map(i =>
                i.toLowerCase() === 'transport' ? 'Transportation' : i
            );

            // Update tags
            const updatedTags = { ...tags, industry: newIndustries };

            await fetch(`${KV_URL}/set/${key}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${KV_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTags)
            });

            updated++;
            console.log(`✅ Updated ${key}: Transport → Transportation`);
        } else {
            skipped++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${allKeys.length}`);
}

unifyTransport().catch(console.error);
