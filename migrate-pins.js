#!/usr/bin/env node

/**
 * Migration Script: Add imageUrl to existing pins
 * 
 * This script:
 * 1. Fetches all saved pins from Vercel KV
 * 2. For each pin without imageUrl, fetches it from Pinterest API
 * 3. Updates the pin in KV with the imageUrl
 * 
 * Usage:
 *   node migrate-pins.js <pinterest-access-token> <admin-key>
 */

const API_BASE = 'https://viiibe-backend-cfa11rb4u-alberto-contreras-projects-101c33ba.vercel.app/api';

async function getAllPins() {
    console.log('📥 Fetching all saved pins...');

    const response = await fetch(`${API_BASE}/get-saved-pins`);
    if (!response.ok) {
        throw new Error(`Failed to fetch pins: ${response.status}`);
    }

    const data = await response.json();
    return data.pins || [];
}

async function getPinImageFromPinterest(pinId, accessToken) {
    console.log(`  📷 Fetching image URL for pin ${pinId}...`);

    try {
        const response = await fetch(
            `https://api.pinterest.com/v5/pins/${pinId}?pin_fields=media`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error(`  ❌ Pinterest API error for pin ${pinId}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const images = data.media?.images;
        const imageUrl = images?.originals?.url ||
            images?.['1200x']?.url ||
            images?.['600x']?.url;

        if (imageUrl) {
            console.log(`  ✅ Found image URL: ${imageUrl.substring(0, 50)}...`);
        } else {
            console.log(`  ⚠️  No image URL found in Pinterest API response`);
        }

        return imageUrl;
    } catch (error) {
        console.error(`  ❌ Error fetching image for pin ${pinId}:`, error.message);
        return null;
    }
}

async function updatePin(pin, adminKey) {
    console.log(`  💾 Updating pin ${pin.id} in database...`);

    const response = await fetch(`${API_BASE}/save-pin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pinId: pin.id,
            title: pin.title,
            description: pin.description,
            pinterestUrl: pin.pinterestUrl,
            imageUrl: pin.imageUrl,
            tags: pin.tags || [],
            category: pin.category || 'uncategorized',
            quality: pin.quality || 'standard',
            adminKey
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update pin');
    }

    console.log(`  ✅ Pin ${pin.id} updated successfully`);
    return true;
}

async function migratePins(accessToken, adminKey) {
    console.log('🚀 Starting pin migration...\n');

    // 1. Get all pins
    const pins = await getAllPins();
    console.log(`📊 Found ${pins.length} pins\n`);

    // 2. Filter pins that need imageUrl
    const pinsNeedingUpdate = pins.filter(pin => !pin.imageUrl);
    const pinsAlreadyHaveUrl = pins.filter(pin => pin.imageUrl);

    console.log(`✅ ${pinsAlreadyHaveUrl.length} pins already have imageUrl`);
    console.log(`⚠️  ${pinsNeedingUpdate.length} pins need imageUrl\n`);

    if (pinsNeedingUpdate.length === 0) {
        console.log('🎉 All pins already have imageUrl! Nothing to migrate.');
        return;
    }

    // 3. Update each pin
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pinsNeedingUpdate.length; i++) {
        const pin = pinsNeedingUpdate[i];
        console.log(`\n[${i + 1}/${pinsNeedingUpdate.length}] Processing pin: ${pin.id}`);
        console.log(`  Title: ${pin.title}`);

        try {
            // Get imageUrl from Pinterest API
            const imageUrl = await getPinImageFromPinterest(pin.id, accessToken);

            if (!imageUrl) {
                console.log(`  ⚠️  Skipping pin ${pin.id} - no image URL found`);
                failCount++;
                continue;
            }

            // Update pin with imageUrl
            pin.imageUrl = imageUrl;
            await updatePin(pin, adminKey);
            successCount++;

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`  ❌ Error processing pin ${pin.id}:`, error.message);
            failCount++;
        }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount} pins`);
    console.log(`❌ Failed: ${failCount} pins`);
    console.log(`📦 Total processed: ${pinsNeedingUpdate.length} pins`);
    console.log(`🎯 Pins with imageUrl: ${pinsAlreadyHaveUrl.length + successCount}/${pins.length}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n🎉 Migration completed! You can now use AI analysis on these pins.');
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('❌ Error: Missing required arguments\n');
        console.log('Usage: node migrate-pins.js <pinterest-access-token> <admin-key>\n');
        console.log('Example:');
        console.log('  node migrate-pins.js pina_ABC123... viiibe-curator-2025\n');
        console.log('To get your Pinterest access token:');
        console.log('  1. Go to https://developers.pinterest.com/');
        console.log('  2. Create an app or use existing one');
        console.log('  3. Generate an access token with "pins:read" scope\n');
        process.exit(1);
    }

    const [accessToken, adminKey] = args;

    try {
        await migratePins(accessToken, adminKey);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

main();
