import { kv } from '@vercel/kv';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyColorRecategorization() {
    console.log('🔍 Verifying Color Recategorization\n');

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

    // Analyze color curation status
    const stats = {
        total: pinKeys.length,
        manuallyReviewed: 0,
        aiAnalyzed: 0,
        bothFlags: 0,
        neitherFlag: 0,
        withColors: 0,
        withoutColors: 0,
        recentlyReviewed: []
    };

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = pin.id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (!tags) {
            stats.neitherFlag++;
            continue;
        }

        const manuallyReviewed = tags.manuallyReviewed || false;
        const aiAnalyzed = tags.aiAnalyzed || false;
        const hasColors = tags.color && tags.color.length > 0;
        const reviewedAt = tags.reviewedAt ? new Date(tags.reviewedAt) : null;

        if (manuallyReviewed) stats.manuallyReviewed++;
        if (aiAnalyzed) stats.aiAnalyzed++;
        if (manuallyReviewed && aiAnalyzed) stats.bothFlags++;
        if (!manuallyReviewed && !aiAnalyzed) stats.neitherFlag++;
        if (hasColors) stats.withColors++;
        else stats.withoutColors++;

        // Track recently reviewed (last hour)
        if (reviewedAt && reviewedAt > oneHourAgo) {
            stats.recentlyReviewed.push({
                pinId,
                title: pin.title || 'Untitled',
                colors: tags.color || [],
                reviewedAt: tags.reviewedAt
            });
        }
    }

    // Sort recent reviews by time
    stats.recentlyReviewed.sort((a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    );

    console.log('═══════════════════════════════════════');
    console.log('📊 COLOR CURATION STATISTICS');
    console.log('═══════════════════════════════════════\n');

    console.log(`Total pins: ${stats.total}\n`);

    console.log('Curation Status:');
    console.log(`  ✅ Manually Reviewed: ${stats.manuallyReviewed} (${(stats.manuallyReviewed / stats.total * 100).toFixed(1)}%)`);
    console.log(`  🤖 AI Analyzed: ${stats.aiAnalyzed} (${(stats.aiAnalyzed / stats.total * 100).toFixed(1)}%)`);
    console.log(`  🔄 Both flags: ${stats.bothFlags} (${(stats.bothFlags / stats.total * 100).toFixed(1)}%)`);
    console.log(`  ⏳ Not processed: ${stats.neitherFlag} (${(stats.neitherFlag / stats.total * 100).toFixed(1)}%)\n`);

    console.log('Color Tags:');
    console.log(`  🎨 With colors: ${stats.withColors} (${(stats.withColors / stats.total * 100).toFixed(1)}%)`);
    console.log(`  ⚪ Without colors: ${stats.withoutColors} (${(stats.withoutColors / stats.total * 100).toFixed(1)}%)\n`);

    console.log('═══════════════════════════════════════');
    console.log(`📝 RECENTLY REVIEWED (Last hour): ${stats.recentlyReviewed.length}`);
    console.log('═══════════════════════════════════════\n');

    if (stats.recentlyReviewed.length > 0) {
        console.log(`Showing last ${Math.min(10, stats.recentlyReviewed.length)} reviews:\n`);

        stats.recentlyReviewed.slice(0, 10).forEach((review, index) => {
            const timeAgo = Math.round((now.getTime() - new Date(review.reviewedAt).getTime()) / 60000);
            console.log(`${index + 1}. ${review.title}`);
            console.log(`   Colors: ${review.colors.join(', ')}`);
            console.log(`   Reviewed: ${timeAgo} minutes ago`);
            console.log(`   Pin ID: ${review.pinId}\n`);
        });
    } else {
        console.log('No pins reviewed in the last hour.\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════\n');

    // Summary
    const totalProcessed = stats.manuallyReviewed + stats.aiAnalyzed - stats.bothFlags;
    const percentComplete = (totalProcessed / stats.total * 100).toFixed(1);

    console.log('📈 PROGRESS SUMMARY:');
    console.log(`   Total processed: ${totalProcessed}/${stats.total} (${percentComplete}%)`);
    console.log(`   Remaining: ${stats.neitherFlag} pins\n`);
}

verifyColorRecategorization()
    .then(() => {
        console.log('✅ Verification complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
