#!/usr/bin/env node

/**
 * Normalize Industry Capitalization
 * 
 * This script fixes inconsistent capitalization in industry tags.
 * For example: 'real-estate' → 'Real Estate', 'finance' → 'Finance'
 * 
 * Usage: node scripts/normalize-industries.mjs
 */

import { config } from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Standard industry names (proper capitalization)
const STANDARD_INDUSTRIES = {
    'agriculture': 'Agriculture',
    'beauty': 'Beauty',
    'business': 'Business',
    'consulting': 'Consulting',
    'construction': 'Construction',
    'digital agency': 'Digital Agency',
    'ecommerce': 'Ecommerce',
    'education': 'Education',
    'fashion': 'Fashion',
    'finance': 'Finance',
    'fitness': 'Fitness',
    'food': 'Food',
    'furniture': 'Furniture',
    'healthcare': 'Healthcare',
    'home services': 'Home Services',
    'legal': 'Legal',
    'logistics': 'Logistics',
    'ngo': 'NGO',
    'portfolio': 'Portfolio',
    'real estate': 'Real Estate',
    'real-estate': 'Real Estate',
    'saas': 'Saas',
    'sustainability': 'Sustainability',
    'tech': 'Tech',
    'transportation': 'Transportation',
    'travel': 'Travel'
};

async function normalizeIndustries() {
    console.log('🔧 Starting industry capitalization normalization...\n');

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

        // Track changes
        let updatedCount = 0;
        let unchangedCount = 0;
        const changeLog = new Map(); // old -> new mapping with counts

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = pin.id;
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (!tags || !tags.industry || !Array.isArray(tags.industry) || tags.industry.length === 0) {
                unchangedCount++;
                continue;
            }

            const oldIndustry = tags.industry[0];
            const normalizedKey = oldIndustry.toLowerCase().trim();
            const newIndustry = STANDARD_INDUSTRIES[normalizedKey];

            if (!newIndustry) {
                console.log(`⚠️  Unknown industry: "${oldIndustry}" (pin: ${pinId})`);
                unchangedCount++;
                continue;
            }

            if (oldIndustry !== newIndustry) {
                // Update the tags
                tags.industry = [newIndustry];
                await kv.set(`pin-tags:${pinId}`, tags);

                updatedCount++;

                // Track the change
                const changeKey = `${oldIndustry} → ${newIndustry}`;
                changeLog.set(changeKey, (changeLog.get(changeKey) || 0) + 1);

                if (updatedCount % 10 === 0) {
                    console.log(`   Updated ${updatedCount} pins...`);
                }
            } else {
                unchangedCount++;
            }
        }

        console.log(`\n✅ Normalization complete!\n`);
        console.log(`📊 Summary:`);
        console.log(`   Updated: ${updatedCount} pins`);
        console.log(`   Unchanged: ${unchangedCount} pins`);
        console.log(`   Total: ${pinKeys.length} pins\n`);

        if (changeLog.size > 0) {
            console.log('📝 Changes made:\n');
            const sortedChanges = Array.from(changeLog.entries())
                .sort((a, b) => b[1] - a[1]);

            for (const [change, count] of sortedChanges) {
                console.log(`   ${change}: ${count} pins`);
            }
            console.log('');
        }

        // Show final distribution
        console.log('💡 Run this to verify the changes:');
        console.log('   node scripts/analyze-current-pins.mjs\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('   1. Make sure you have the correct environment variables set');
        console.error('   2. Check your internet connection');
        console.error('   3. Verify KV database access\n');
        process.exit(1);
    }
}

normalizeIndustries().catch(console.error);
