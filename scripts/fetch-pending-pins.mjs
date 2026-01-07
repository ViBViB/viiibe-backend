import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function getPendingPins() {
    console.log('🔍 Fetching pins pending color re-categorization...\n');

    const result = await kv.scan(0, { match: 'saved-pin:*', count: 2000 });
    const pinKeys = result[1];

    const pendingPins = [];

    for (const key of pinKeys) {
        const pinId = key.replace('saved-pin:', '');
        const pin = await kv.get(key);
        const tags = await kv.get(`pin-tags:${pinId}`);

        // Only include pins that haven't been manually reviewed
        if (!tags || !tags.manuallyReviewed) {
            pendingPins.push({
                pinId,
                imageUrl: pin.imageUrl,
                title: pin.title,
                currentColors: tags?.color || []
            });
        }

        // Stop at 100
        if (pendingPins.length >= 100) break;
    }

    console.log(`Found ${pendingPins.length} pins pending review\n`);
    console.log('First 5 pins:');
    pendingPins.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}`);
        console.log(`   URL: ${p.imageUrl}`);
        console.log(`   Current: ${p.currentColors.join(', ') || 'none'}\n`);
    });

    // Save to file for processing
    fs.writeFileSync('pending-pins-batch1.json', JSON.stringify(pendingPins, null, 2));
    console.log('✅ Saved to pending-pins-batch1.json');
}

getPendingPins();
