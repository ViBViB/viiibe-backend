#!/usr/bin/env node

/**
 * Check curation progress - shows current count per industry
 * Target: 60 pins per industry minimum
 */

const API_BASE = 'https://moood-refactor.vercel.app/api';
const TARGET = 60;

async function checkProgress() {
    console.log('📊 Checking curation progress...\n');

    const response = await fetch(`${API_BASE}/collection-gaps?refresh=true`);
    const data = await response.json();

    const allIndustries = [...data.urgent, ...data.low, ...data.balanced];

    // Group by status
    const complete = allIndustries.filter(i => i.count >= TARGET);
    const inProgress = allIndustries.filter(i => i.count > 0 && i.count < TARGET);
    const missing = allIndustries.filter(i => i.count === 0);

    console.log('✅ COMPLETE (≥60 pins):');
    if (complete.length === 0) {
        console.log('   (none yet)');
    } else {
        for (const industry of complete.sort((a, b) => b.count - a.count)) {
            console.log(`   ✅ ${industry.category}: ${industry.count} pins`);
        }
    }

    console.log('\n🟡 IN PROGRESS (<60 pins):');
    if (inProgress.length === 0) {
        console.log('   (none)');
    } else {
        for (const industry of inProgress.sort((a, b) => b.count - a.count)) {
            const needed = TARGET - industry.count;
            console.log(`   🟡 ${industry.category}: ${industry.count}/${TARGET} pins (need ${needed} more)`);
        }
    }

    console.log('\n🔴 MISSING (0 pins):');
    if (missing.length === 0) {
        console.log('   (none)');
    } else {
        for (const industry of missing) {
            console.log(`   🔴 ${industry.category}: 0/${TARGET} pins`);
        }
    }

    console.log('\n📈 SUMMARY:');
    console.log(`   Complete: ${complete.length}/21 industries`);
    console.log(`   In Progress: ${inProgress.length}/21 industries`);
    console.log(`   Missing: ${missing.length}/21 industries`);

    const totalPins = allIndustries.reduce((sum, i) => sum + i.count, 0);
    const targetTotal = 21 * TARGET;
    const percentage = Math.round((totalPins / targetTotal) * 100);
    console.log(`   Total: ${totalPins}/${targetTotal} pins (${percentage}%)`);

    if (complete.length === 21) {
        console.log('\n🎉 ALL INDUSTRIES COMPLETE! Ready for Mini-PRD!');
    } else {
        console.log(`\n🎯 Next: Curate ${missing.length > 0 ? missing[0].category : inProgress[0].category}`);
    }
}

checkProgress().catch(console.error);
