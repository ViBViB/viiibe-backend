#!/usr/bin/env node

/**
 * Check Specific Pin Details
 * 
 * Usage: node scripts/check-pin.mjs <pinId>
 * Example: node scripts/check-pin.mjs 100064422967649525
 */

const API_BASE = 'https://moood-refactor.vercel.app/api';

async function checkPin(pinId) {
    if (!pinId) {
        console.log('❌ Error: Please provide a pin ID');
        console.log('\nUsage: node scripts/check-pin.mjs <pinId>');
        console.log('Example: node scripts/check-pin.mjs 100064422967649525\n');
        process.exit(1);
    }

    console.log(`🔍 Checking pin: ${pinId}\n`);

    try {
        const response = await fetch(`${API_BASE}/pins?pinId=${pinId}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.pin) {
            console.log('❌ Pin not found in database\n');
            return;
        }

        const pin = data.pin;

        console.log('📌 Pin Details:\n');
        console.log(`   ID: ${pin.id}`);
        console.log(`   Title: ${pin.title || 'Untitled'}`);
        console.log(`   Category: ${pin.category || 'uncategorized'}`);
        console.log(`   Quality: ${pin.quality || 'standard'}`);
        console.log(`   Added: ${pin.addedDate ? new Date(pin.addedDate).toLocaleString() : 'Unknown'}`);
        console.log(`   Source: ${pin.source || 'Unknown'}\n`);

        if (pin.aiAnalysis) {
            console.log('🤖 AI Analysis:\n');

            if (pin.aiAnalysis.industry && pin.aiAnalysis.industry.length > 0) {
                console.log(`   Industry: ${pin.aiAnalysis.industry.join(', ')}`);
            }

            if (pin.aiAnalysis.style && pin.aiAnalysis.style.length > 0) {
                console.log(`   Style: ${pin.aiAnalysis.style.join(', ')}`);
            }

            if (pin.aiAnalysis.color && pin.aiAnalysis.color.length > 0) {
                console.log(`   Colors: ${pin.aiAnalysis.color.join(', ')}`);
            }

            if (pin.aiAnalysis.type && pin.aiAnalysis.type.length > 0) {
                console.log(`   Type: ${pin.aiAnalysis.type.join(', ')}`);
            }

            if (pin.aiAnalysis.layout) {
                console.log(`   Layout: ${pin.aiAnalysis.layout}`);
            }

            if (pin.aiAnalysis.confidence) {
                console.log(`   Confidence: ${(pin.aiAnalysis.confidence * 100).toFixed(0)}%`);
            }

            console.log('');
        } else {
            console.log('⚠️  No AI analysis found for this pin\n');
        }

        console.log('🖼️  Image URL:');
        console.log(`   ${pin.imageUrl}\n`);

        console.log('🔗 Pinterest URL:');
        console.log(`   ${pin.pinterestUrl}\n`);

        console.log('✅ Pin verification complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('   1. Check your internet connection');
        console.error('   2. Verify the pin ID is correct');
        console.error('   3. Try again in a few seconds\n');
    }
}

const pinId = process.argv[2];
checkPin(pinId).catch(console.error);
