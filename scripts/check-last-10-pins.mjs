import 'dotenv/config';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function checkLastPins() {
    console.log('🔍 Checking last 10 saved pins...\n');

    // Get all pin keys
    const scanResponse = await fetch(`${KV_URL}/scan/0?match=saved-pin:*&count=1000`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const scanData = await scanResponse.json();
    const pinKeys = scanData.result.keys;

    console.log(`📊 Total pins: ${pinKeys.length}\n`);

    // Get last 10 pins with their tags
    const lastPins = pinKeys.slice(-10);

    for (const key of lastPins) {
        const pinId = key.replace('saved-pin:', '');

        // Get pin data
        const pinResponse = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const pin = await pinResponse.json();

        // Get tags
        const tagsResponse = await fetch(`${KV_URL}/get/pin-tags:${pinId}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const tags = await tagsResponse.json();

        console.log(`📌 Pin: ${pinId}`);
        console.log(`   Title: ${pin.result?.title || 'N/A'}`);
        console.log(`   Industry: ${tags.result?.industry || 'N/A'}`);
        console.log(`   Added: ${pin.result?.addedDate || 'N/A'}`);
        console.log('');
    }
}

checkLastPins().catch(console.error);
