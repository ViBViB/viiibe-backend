#!/usr/bin/env node

/**
 * Verify AI analysis completeness
 * Check if pins have all required tags: industry, style, typography, layout, elements
 */

const API_BASE = 'https://moood-refactor.vercel.app/api';

async function verifyAnalysis() {
    console.log('🔍 Verifying AI Analysis Completeness\n');

    // This would need to query KV directly to check pin-tags
    // For now, we'll check via the collection-gaps endpoint

    const response = await fetch(`${API_BASE}/collection-gaps?refresh=true`);
    const data = await response.json();

    const allIndustries = [...data.urgent, ...data.low, ...data.balanced];
    const totalCategorized = allIndustries.reduce((sum, i) => sum + i.count, 0);

    console.log(`📊 Summary:`);
    console.log(`   Total pins with industry tags: ${totalCategorized}`);
    console.log(`   Total pins in database: 928 (from extension)`);
    console.log(`   Uncategorized: ${928 - totalCategorized}\n`);

    console.log('✅ CONCLUSION:');
    console.log(`   ${totalCategorized} pins have been analyzed by AI`);
    console.log('   They should have: industry, style, typography, layout, elements\n');

    console.log('❓ NEXT STEP:');
    console.log('   We need to verify if these tags include:');
    console.log('   - ✓ industry (we know this exists, but has errors)');
    console.log('   - ? style');
    console.log('   - ? typography');
    console.log('   - ? layout');
    console.log('   - ? elements\n');

    console.log('💡 RECOMMENDATION:');
    console.log('   If AI already extracted style/typography/layout/elements:');
    console.log('   → Just fix industry categorization manually (fastest)');
    console.log('   → Keep all other AI analysis');
    console.log('   → Cost: $0\n');

    console.log('   If AI only extracted industry:');
    console.log('   → Need to re-analyze for style/typography/layout/elements');
    console.log('   → Cost: $7.57 for missing analysis\n');
}

verifyAnalysis().catch(console.error);
