import 'dotenv/config';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function deleteSports() {
    console.log('🗑️  Deleting Sports category...\n');

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

    let deleted = 0;

    for (const key of allKeys) {
        // Get tags
        const response = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const data = await response.json();
        const tags = data.result;

        if (!tags || !tags.industry) continue;

        const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
        const hasSports = industries.some(i => i.toLowerCase() === 'sports');

        if (hasSports) {
            // Get pin ID from key
            const pinId = key.replace('pin-tags:', '');

            console.log(`🗑️  Deleting Sports pin: ${pinId}`);

            // Delete pin and tags
            await fetch(`${KV_URL}/del/saved-pin:${pinId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });

            await fetch(`${KV_URL}/del/${key}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });

            deleted++;
        }
    }

    console.log(`\n✅ Deleted ${deleted} Sports pins`);
}

deleteSports().catch(console.error);
