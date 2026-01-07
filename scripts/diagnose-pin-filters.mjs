import { kv } from '@vercel/kv';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function diagnosePins() {
    console.log('🔍 Diagnosing Pin Filters\n');

    // Get all saved pins
    const pinKeys = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });
        cursor = result[0];
        pinKeys.push(...result[1]);
    } while (cursor !== 0);

    console.log(`📊 Total pins in database: ${pinKeys.length}\n`);

    // Sample first 20 pins to diagnose
    const sampleSize = Math.min(20, pinKeys.length);
    const stats = {
        total: pinKeys.length,
        withTags: 0,
        withoutTags: 0,
        uncategorized: 0,
        categorized: 0,
        aiAnalyzed: 0,
        manuallyReviewed: 0,
        bothFlags: 0,
        wouldPass: 0
    };

    console.log(`Analyzing first ${sampleSize} pins...\n`);

    for (let i = 0; i < sampleSize; i++) {
        const key = pinKeys[i];
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = pin.id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        const industry = tags ? (tags.industry?.[0] || 'Uncategorized') : 'Uncategorized';
        const aiAnalyzed = tags ? (tags.aiAnalyzed || false) : false;
        const manuallyReviewed = tags ? (tags.manuallyReviewed || false) : false;

        const wouldPass = (industry === 'Uncategorized' || !tags) && !aiAnalyzed && !manuallyReviewed;

        if (tags) stats.withTags++;
        else stats.withoutTags++;

        if (industry === 'Uncategorized') stats.uncategorized++;
        else stats.categorized++;

        if (aiAnalyzed) stats.aiAnalyzed++;
        if (manuallyReviewed) stats.manuallyReviewed++;
        if (aiAnalyzed && manuallyReviewed) stats.bothFlags++;
        if (wouldPass) stats.wouldPass++;

        console.log(`Pin ${i + 1}/${sampleSize}:`);
        console.log(`  ID: ${pinId}`);
        console.log(`  Industry: ${industry}`);
        console.log(`  AI Analyzed: ${aiAnalyzed}`);
        console.log(`  Manually Reviewed: ${manuallyReviewed}`);
        console.log(`  Would Pass Filter: ${wouldPass ? '✅' : '❌'}`);
        console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 STATISTICS (from sample)');
    console.log('═══════════════════════════════════════\n');
    console.log(`Total pins: ${stats.total}`);
    console.log(`Sample size: ${sampleSize}\n`);
    console.log(`With tags: ${stats.withTags}`);
    console.log(`Without tags: ${stats.withoutTags}\n`);
    console.log(`Uncategorized: ${stats.uncategorized}`);
    console.log(`Categorized: ${stats.categorized}\n`);
    console.log(`AI Analyzed: ${stats.aiAnalyzed}`);
    console.log(`Manually Reviewed: ${stats.manuallyReviewed}`);
    console.log(`Both flags: ${stats.bothFlags}\n`);
    console.log(`Would pass filter: ${stats.wouldPass}/${sampleSize}\n`);

    // Estimate total
    const passRate = stats.wouldPass / sampleSize;
    const estimatedTotal = Math.round(stats.total * passRate);
    console.log(`📈 Estimated pins that would pass filter: ~${estimatedTotal}\n`);
}

diagnosePins()
    .then(() => {
        console.log('✅ Diagnosis complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
