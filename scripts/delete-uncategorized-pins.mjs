#!/usr/bin/env node

/**
 * Delete Uncategorized Pins
 * 
 * This script removes all pins from the database that don't have AI analysis tags
 * (marked as "Uncategorized"). Run this AFTER completing the re-categorization process.
 * 
 * Usage: node scripts/delete-uncategorized-pins.mjs
 */

import { config } from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function deleteUncategorizedPins() {
    console.log('🗑️  Starting deletion of uncategorized pins...\n');

    try {
        // Get all saved pins using SCAN
        const pinKeys = [];
        let cursor = 0;

        console.log('📡 Scanning database for all pins...');
        do {
            const result = await kv.scan(cursor, {
                match: 'saved-pin:*',
                count: 100
            });
            cursor = result[0];
            pinKeys.push(...result[1]);
        } while (cursor !== 0);

        console.log(`📊 Found ${pinKeys.length} total pins\n`);

        // Check each pin for tags
        const uncategorizedPins = [];
        const categorizedPins = [];

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = pin.id;
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (!tags || !tags.industry || tags.industry.length === 0) {
                uncategorizedPins.push({ key, pinId, pin });
            } else {
                categorizedPins.push({ key, pinId, pin });
            }
        }

        console.log('📈 Analysis:');
        console.log(`   ✅ Categorized pins: ${categorizedPins.length}`);
        console.log(`   ❌ Uncategorized pins: ${uncategorizedPins.length}\n`);

        if (uncategorizedPins.length === 0) {
            console.log('✨ No uncategorized pins found! Database is clean.\n');
            return;
        }

        // Show sample of pins to be deleted
        console.log('🔍 Sample of pins to be deleted:');
        for (const { pinId, pin } of uncategorizedPins.slice(0, 5)) {
            console.log(`   • ${pinId}: ${pin.title?.substring(0, 60) || 'Untitled'}...`);
        }
        if (uncategorizedPins.length > 5) {
            console.log(`   ... and ${uncategorizedPins.length - 5} more\n`);
        } else {
            console.log('');
        }

        // Confirm deletion
        console.log('⚠️  WARNING: This will permanently delete these pins!');
        console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Delete uncategorized pins
        console.log('🗑️  Deleting uncategorized pins...\n');
        let deletedCount = 0;

        for (const { key, pinId } of uncategorizedPins) {
            try {
                // Delete the pin
                await kv.del(key);

                // Delete the tags (if they exist)
                await kv.del(`pin-tags:${pinId}`);

                deletedCount++;

                if (deletedCount % 10 === 0) {
                    console.log(`   Deleted ${deletedCount}/${uncategorizedPins.length} pins...`);
                }
            } catch (error) {
                console.error(`   ❌ Error deleting pin ${pinId}:`, error.message);
            }
        }

        console.log(`\n✅ Deletion complete!`);
        console.log(`   Deleted: ${deletedCount} pins`);
        console.log(`   Remaining: ${categorizedPins.length} pins\n`);

        // Show final stats
        const finalTotal = categorizedPins.length;
        console.log('📊 Final Database Stats:');
        console.log(`   Total pins: ${finalTotal}`);
        console.log(`   All pins have AI analysis: ✅\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('   1. Make sure you have the correct environment variables set');
        console.error('   2. Check your internet connection');
        console.error('   3. Verify KV database access\n');
        process.exit(1);
    }
}

deleteUncategorizedPins().catch(console.error);
