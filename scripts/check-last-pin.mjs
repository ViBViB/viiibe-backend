import { createClient } from '@vercel/kv';
import 'dotenv/config';

const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

console.log('🔍 Checking last saved pin...\n');

// Get all pins
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

// Get all pins with timestamps
const pinsWithTime = [];
for (const key of pinKeys) {
    const pin = await kv.get(key);
    if (pin) {
        pinsWithTime.push({
            id: pin.id,
            title: pin.title,
            addedDate: pin.addedDate,
            url: pin.pinterestUrl
        });
    }
}

// Sort by date (newest first)
pinsWithTime.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));

// Get last 5 pins
const lastPins = pinsWithTime.slice(0, 5);

console.log('📌 Last 5 pins saved:\n');

for (const pin of lastPins) {
    // Get AI tags
    const tags = await kv.get(`pin-tags:${pin.id}`);
    const industry = tags?.industry?.[0] || 'No industry';
    const style = tags?.style?.[0] || 'No style';

    console.log(`ID: ${pin.id}`);
    console.log(`Title: ${pin.title}`);
    console.log(`Industry: ${industry}`);
    console.log(`Style: ${style}`);
    console.log(`Saved: ${new Date(pin.addedDate).toLocaleString()}`);
    console.log(`URL: ${pin.url}`);
    console.log('---\n');
}
