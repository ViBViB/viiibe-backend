#!/usr/bin/env node

/**
 * Delete excess pins via API endpoint
 * Target: 60 pins per industry
 */

const TARGET_PER_INDUSTRY = 60;
const API_BASE = 'https://moood-refactor.vercel.app/api';

async function deleteExcessPins() {
    console.log('🗑️  Starting excess pin deletion...\n');

    // Get current distribution
    const response = await fetch(`${API_BASE}/collection-gaps?refresh=true`);
    const data = await response.json();

    const allIndustries = [...data.urgent, ...data.low, ...data.balanced];

    console.log('📊 Current distribution:');
    for (const industry of allIndustries) {
        const status = industry.count > TARGET_PER_INDUSTRY ? '🔴' : industry.count === TARGET_PER_INDUSTRY ? '✅' : '🟡';
        console.log(`   ${status} ${industry.category}: ${industry.count} pins`);
    }

    // Find industries with excess
    const toBalance = allIndustries.filter(i => i.count > TARGET_PER_INDUSTRY);

    if (toBalance.length === 0) {
        console.log('\n✅ No excess pins to delete!');
        return;
    }

    console.log(`\n🗑️  Industries to balance: ${toBalance.length}`);
    for (const industry of toBalance) {
        const excess = industry.count - TARGET_PER_INDUSTRY;
        console.log(`   ${industry.category}: delete ${excess} pins`);
    }

    console.log('\n⚠️  Manual deletion required:');
    console.log('   1. Go to Vercel KV dashboard');
    console.log('   2. Filter pins by industry');
    console.log('   3. Delete oldest pins until reaching 60 per industry');
    console.log('\n   OR use Vercel CLI with proper env vars');
}

deleteExcessPins().catch(console.error);
