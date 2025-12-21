/**
 * CHECK PIN URLs SCRIPT
 * Verify what URLs are actually stored in the database
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function checkPinUrls() {
    console.log('🔍 Checking pin URLs in database...\n');

    // Get first 10 pins
    const result = await kv.scan(0, {
        match: 'saved-pin:*',
        count: 10
    });

    const keys = result[1];
    console.log(`📊 Checking ${keys.length} pins:\n`);

    for (const key of keys) {
        const pin = await kv.get(key);
        if (pin && pin.imageUrl) {
            const url = pin.imageUrl;
            let quality = 'unknown';

            if (url.includes('/originals/')) quality = 'ORIGINALS ✅';
            else if (url.includes('/736x/')) quality = '736x ✅';
            else if (url.includes('/564x/')) quality = '564x ⚠️';
            else if (url.includes('/474x/')) quality = '474x ❌';
            else if (url.includes('/236x/')) quality = '236x ❌';

            console.log(`${quality} - ${key.replace('saved-pin:', '')}`);
            console.log(`   ${url}\n`);
        }
    }
}

checkPinUrls()
    .then(() => {
        console.log('\n✅ Check complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
