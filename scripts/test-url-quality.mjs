/**
 * TEST URL QUALITY
 * Compare /736x/ vs /originals/ for the same image
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testUrlQuality() {
    console.log('🔍 Testing URL quality...\n');

    // Get one pin with /736x/ URL
    const result = await kv.scan(0, {
        match: 'saved-pin:*',
        count: 1
    });

    const key = result[1][0];
    const pin = await kv.get(key);

    if (!pin || !pin.imageUrl) {
        console.log('❌ No pin found');
        return;
    }

    const url736x = pin.imageUrl;
    const urlOriginals = url736x.replace('/736x/', '/originals/');

    console.log('📊 Testing URLs:');
    console.log(`\n/736x/ URL:\n${url736x}`);
    console.log(`\n/originals/ URL:\n${urlOriginals}\n`);

    // Fetch both versions
    console.log('⬇️  Downloading /736x/ version...');
    const response736x = await fetch(url736x);
    const buffer736x = await response736x.arrayBuffer();
    const size736x = buffer736x.byteLength;

    console.log('⬇️  Downloading /originals/ version...');
    const responseOriginals = await fetch(urlOriginals);

    if (!responseOriginals.ok) {
        console.log(`\n❌ /originals/ URL failed with status: ${responseOriginals.status}`);
        console.log('   This image may not have an /originals/ version available');
    } else {
        const bufferOriginals = await responseOriginals.arrayBuffer();
        const sizeOriginals = bufferOriginals.byteLength;

        console.log('\n📊 COMPARISON:');
        console.log('================');
        console.log(`/736x/ size:     ${(size736x / 1024).toFixed(2)} KB`);
        console.log(`/originals/ size: ${(sizeOriginals / 1024).toFixed(2)} KB`);
        console.log(`\nDifference: ${((sizeOriginals / size736x) * 100).toFixed(1)}% larger`);
        console.log(`Quality gain: ${((sizeOriginals - size736x) / 1024).toFixed(2)} KB`);

        if (sizeOriginals > size736x * 1.5) {
            console.log('\n✅ RECOMMENDATION: /originals/ provides significantly better quality');
            console.log('   Consider upgrading quality gate to prefer /originals/');
        } else if (sizeOriginals > size736x * 1.2) {
            console.log('\n⚠️  RECOMMENDATION: /originals/ provides moderately better quality');
            console.log('   Consider implementing URL upgrade with fallback');
        } else {
            console.log('\n✅ RECOMMENDATION: /736x/ quality is acceptable');
            console.log('   Current quality gate is sufficient');
        }
    }

    console.log('\n📝 Test URLs for manual verification:');
    console.log(`/736x/:     ${url736x}`);
    console.log(`/originals/: ${urlOriginals}`);
}

testUrlQuality()
    .then(() => {
        console.log('\n✅ Test complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
