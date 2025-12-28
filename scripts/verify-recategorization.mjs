#!/usr/bin/env node

/**
 * Verify Re-categorization Changes (API Version)
 * 
 * This script verifies that pins were actually re-categorized in the database
 * by querying the API and showing the current distribution.
 */

const API_BASE = 'https://moood-refactor.vercel.app/api';

async function verifyRecategorization() {
    console.log('🔍 Verifying re-categorization changes...\n');

    try {
        // Get collection gaps data (includes industry distribution)
        console.log('📡 Fetching data from API...');
        const response = await fetch(`${API_BASE}/collection-gaps?refresh=true`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Combine all industries
        const allIndustries = [...data.urgent, ...data.low, ...data.balanced];

        // Calculate totals
        const totalPins = allIndustries.reduce((sum, i) => sum + i.count, 0);

        console.log(`\n📊 Total pins in database: ${totalPins}\n`);

        // Sort by count (descending)
        const sorted = allIndustries.sort((a, b) => b.count - a.count);

        console.log('📈 Current Industry Distribution:\n');
        console.log('Industry'.padEnd(25) + 'Count'.padEnd(10) + 'Visual');
        console.log('─'.repeat(50));

        for (const industry of sorted) {
            const bar = '█'.repeat(Math.floor(industry.count / 5));
            console.log(`${industry.category.padEnd(25)} ${industry.count.toString().padStart(4)}      ${bar}`);
        }

        console.log('─'.repeat(50));
        console.log(`${'TOTAL'.padEnd(25)} ${totalPins.toString().padStart(4)}\n`);

        // Show statistics
        console.log('📊 Statistics:');
        console.log(`   📂 Total industries: ${allIndustries.length}`);
        console.log(`   📍 Total pins: ${totalPins}`);
        console.log(`   📈 Average per industry: ${Math.round(totalPins / allIndustries.length)}\n`);

        // Check for non-standard industries
        const standardIndustries = [
            'Agriculture', 'Beauty', 'Business', 'Consulting', 'Construction',
            'Digital Agency', 'Ecommerce', 'Education', 'Fashion', 'Finance',
            'Fitness', 'Food', 'Furniture', 'Healthcare', 'Home Services',
            'Legal', 'Logistics', 'NGO', 'Portfolio', 'Real Estate',
            'Saas', 'Sustainability', 'Tech', 'Transportation', 'Travel'
        ];

        const nonStandard = sorted
            .filter(i => !standardIndustries.includes(i.category))
            .filter(i => i.count > 0);

        if (nonStandard.length > 0) {
            console.log('⚠️  Non-standard industries found:');
            for (const industry of nonStandard) {
                console.log(`   ⚠️  ${industry.category}: ${industry.count} pins`);
            }
            console.log('\n   💡 These should be re-categorized to standard industries.\n');
        } else {
            console.log('✅ All industries are using standard categories!\n');
        }

        // Show industries by priority
        console.log('📋 Industries by Priority:\n');

        if (data.urgent.length > 0) {
            console.log('🔴 URGENT (need immediate attention):');
            for (const industry of data.urgent) {
                console.log(`   • ${industry.category}: ${industry.count} pins`);
            }
            console.log('');
        }

        if (data.low.length > 0) {
            console.log('🟡 LOW PRIORITY (well-represented):');
            for (const industry of data.low.slice(0, 5)) {
                console.log(`   • ${industry.category}: ${industry.count} pins`);
            }
            if (data.low.length > 5) {
                console.log(`   ... and ${data.low.length - 5} more`);
            }
            console.log('');
        }

        if (data.balanced.length > 0) {
            console.log('✅ BALANCED (good distribution):');
            for (const industry of data.balanced) {
                console.log(`   • ${industry.category}: ${industry.count} pins`);
            }
            console.log('');
        }

        console.log('✅ Verification complete!\n');

        // Provide guidance
        console.log('💡 How to verify your changes:');
        console.log('   1. Look at the distribution above');
        console.log('   2. Check if the industries you changed TO have increased counts');
        console.log('   3. Check if the industries you changed FROM have decreased counts');
        console.log('   4. Compare with a previous run of this script\n');

        console.log('📝 To see detailed pin-by-pin data:');
        console.log('   Run: node scripts/analyze-current-pins.mjs\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('   1. Check your internet connection');
        console.error('   2. Verify the API is accessible: https://moood-refactor.vercel.app/api/collection-gaps');
        console.error('   3. Try again in a few seconds\n');
    }
}

verifyRecategorization().catch(console.error);
