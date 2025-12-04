#!/usr/bin/env node

/**
 * Delete All Pins Script
 * 
 * This script deletes all saved pins from Vercel KV database.
 * Use with caution - this action cannot be undone!
 * 
 * Usage:
 *   node delete-all-pins.js <admin-key>
 */

const API_BASE = 'https://viiibe-backend-l7t6xxnca-alberto-contreras-projects-101c33ba.vercel.app/api';

async function getAllPins() {
    console.log('📥 Fetching all saved pins...');

    const response = await fetch(`${API_BASE}/get-saved-pins`);
    if (!response.ok) {
        throw new Error(`Failed to fetch pins: ${response.status}`);
    }

    const data = await response.json();
    return data.pins || [];
}

async function deletePin(pinId, adminKey) {
    const response = await fetch(`${API_BASE}/delete-pin`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            pinId,
            adminKey
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete pin');
    }

    return await response.json();
}

async function deleteAllPins(adminKey) {
    console.log('🗑️  Starting pin deletion...\n');

    // 1. Get all pins
    const pins = await getAllPins();
    console.log(`📊 Found ${pins.length} pins to delete\n`);

    if (pins.length === 0) {
        console.log('✅ No pins to delete. Database is already empty.');
        return;
    }

    // 2. Show pins that will be deleted
    console.log('The following pins will be deleted:');
    console.log('─'.repeat(60));
    pins.forEach((pin, i) => {
        console.log(`${i + 1}. ${pin.id} - ${pin.title}`);
    });
    console.log('─'.repeat(60));
    console.log();

    // 3. Delete each pin
    console.log('🗑️  Deleting pins from database...\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        console.log(`[${i + 1}/${pins.length}] Deleting pin: ${pin.id}`);
        console.log(`  Title: ${pin.title}`);

        try {
            await deletePin(pin.id, adminKey);
            console.log(`  ✅ Deleted successfully`);
            successCount++;

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            console.error(`  ❌ Error:`, error.message);
            failCount++;
        }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Deletion Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully deleted: ${successCount} pins`);
    console.log(`❌ Failed: ${failCount} pins`);
    console.log(`📦 Total processed: ${pins.length} pins`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n🎉 Deletion completed! Database is now clean.');
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error('❌ Error: Missing admin key\n');
        console.log('Usage: node delete-all-pins.js <admin-key>\n');
        console.log('Example:');
        console.log('  node delete-all-pins.js viiibe-curator-2025\n');
        process.exit(1);
    }

    const [adminKey] = args;

    try {
        await deleteAllPins(adminKey);
    } catch (error) {
        console.error('\n❌ Deletion failed:', error.message);
        process.exit(1);
    }
}

main();
