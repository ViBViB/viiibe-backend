/**
 * MANUAL COLOR CURATION - TERMINAL INTERFACE (OPTIMIZED)
 * 
 * Loads pins on-demand instead of all at once
 */

import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import readline from 'readline';
import { exec } from 'child_process';

dotenv.config({ path: '.env.local' });

const COLORS = {
    '1': 'red', '2': 'pink', '3': 'orange', '4': 'yellow',
    '5': 'green', '6': 'blue', '7': 'purple', '8': 'brown',
    '9': 'black', '0': 'white', 'q': 'gray', 'w': 'beige',
    's': 'skip', 'x': 'exit'
};

let allKeys = [];
let currentIndex = 0;
let updated = 0;
let skipped = 0;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function loadPinKeys() {
    console.log('📊 Loading pin list...\n');

    let cursor = 0;
    do {
        const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
        cursor = result[0];
        allKeys.push(...result[1]);
        process.stdout.write(`\r   Found ${allKeys.length} pins...`);
    } while (cursor !== 0);

    console.log(`\n✅ Ready to curate ${allKeys.length} pins\n`);
}

async function showPin(index) {
    if (index >= allKeys.length) {
        console.log('\n✅ ALL PINS REVIEWED!');
        console.log(`\n📊 Summary:`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${allKeys.length}\n`);
        rl.close();
        process.exit(0);
    }

    // Load pin on-demand
    const key = allKeys[index];
    const pinId = key.replace('saved-pin:', '');
    const pin = await kv.get(key);
    const tags = await kv.get(`pin-tags:${pinId}`);

    if (!pin) {
        showPin(index + 1);
        return;
    }

    const currentColor = tags?.color?.[0] || 'none';

    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎨 COLOR CURATOR - Pin ${index + 1}/${allKeys.length} (${Math.round((index / allKeys.length) * 100)}%)`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📌 Title: ${(pin.title || 'Untitled').substring(0, 60)}`);
    console.log(`🎨 Current: ${currentColor}`);
    console.log(`📊 Progress: Updated ${updated}, Skipped ${skipped}\n`);

    // Open image in browser
    if (pin.imageUrl) {
        exec(`open "${pin.imageUrl}"`);
    }

    console.log('Select color:');
    console.log('  1=Red  2=Pink  3=Orange  4=Yellow  5=Green  6=Blue');
    console.log('  7=Purple  8=Brown  9=Black  0=White  Q=Gray  W=Beige');
    console.log('  S=Skip  X=Exit\n');

    rl.question('> ', async (answer) => {
        const key = answer.toLowerCase().trim();

        if (key === 'x') {
            console.log('\n👋 Exiting...');
            console.log(`📊 Updated: ${updated}, Skipped: ${skipped}\n`);
            rl.close();
            process.exit(0);
        }

        if (key === 's') {
            skipped++;
            showPin(index + 1);
            return;
        }

        const color = COLORS[key];

        if (!color) {
            console.log('❌ Invalid. Try again.');
            setTimeout(() => showPin(index), 500);
            return;
        }

        try {
            const updatedTags = {
                ...tags,
                color: [color],
                manuallyReviewed: true,
                reviewedAt: new Date().toISOString()
            };

            await kv.set(`pin-tags:${pinId}`, updatedTags);

            console.log(`✅ Saved: ${color}`);
            updated++;

            setTimeout(() => showPin(index + 1), 300);

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            setTimeout(() => showPin(index), 500);
        }
    });
}

async function main() {
    console.log('🎨 Manual Color Curation Tool\n');
    await loadPinKeys();
    showPin(0);
}

main().catch(console.error);
