import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

function normalizeImageUrl(url) {
    // Remove size variants from Pinterest URLs
    // Example: /736x/ or /564x/ or /originals/
    return url
        .replace(/\/\d+x\//g, '/SIZE/')
        .replace(/\/originals\//g, '/SIZE/')
        .replace(/\.(jpg|png|webp)$/, '.EXT');
}

async function detectDuplicates() {
    console.log('🔍 Detecting Duplicate Pins (Including Size Variants)\n');

    // Load all pins
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

    // Load all pin data
    const pins = [];
    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = pin.id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        pins.push({
            id: pinId,
            imageUrl: pin.imageUrl,
            normalizedUrl: normalizeImageUrl(pin.imageUrl),
            title: pin.title || 'Untitled',
            tags: tags || {},
            savedAt: pin.savedAt || null
        });
    }

    // Group by normalized URL (catches size variants)
    const byNormalizedUrl = {};
    for (const pin of pins) {
        const url = pin.normalizedUrl;
        if (!byNormalizedUrl[url]) {
            byNormalizedUrl[url] = [];
        }
        byNormalizedUrl[url].push(pin);
    }

    // Find duplicate groups
    const duplicateGroups = Object.entries(byNormalizedUrl)
        .filter(([url, pins]) => pins.length > 1)
        .map(([url, pins]) => ({
            normalizedUrl: url,
            count: pins.length,
            pins: pins
        }));

    // Generate report
    const report = {
        timestamp: new Date().toISOString(),
        totalPins: pins.length,
        uniqueImages: Object.keys(byNormalizedUrl).length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0),
        details: duplicateGroups.map(group => {
            // Sort pins by priority (most complete first)
            const sorted = group.pins.sort((a, b) => {
                // 1. Prefer larger images (higher resolution)
                const aSize = a.imageUrl.match(/\/(\d+)x\//)?.[1] || 0;
                const bSize = b.imageUrl.match(/\/(\d+)x\//)?.[1] || 0;
                if (parseInt(bSize) !== parseInt(aSize)) return parseInt(bSize) - parseInt(aSize);

                // 2. Most tags
                const aTags = Object.keys(a.tags).length;
                const bTags = Object.keys(b.tags).length;
                if (bTags !== aTags) return bTags - aTags;

                // 3. Manual review flag
                const aManual = a.tags.manuallyReviewed || false;
                const bManual = b.tags.manuallyReviewed || false;
                if (bManual !== aManual) return bManual ? 1 : -1;

                // 4. AI analyzed flag
                const aAI = a.tags.aiAnalyzed || false;
                const bAI = b.tags.aiAnalyzed || false;
                if (bAI !== aAI) return bAI ? 1 : -1;

                // 5. Most recent review
                const aDate = new Date(a.tags.reviewedAt || 0);
                const bDate = new Date(b.tags.reviewedAt || 0);
                if (bDate.getTime() !== aDate.getTime()) return bDate.getTime() - aDate.getTime();

                // 6. Lowest ID (oldest)
                return a.id.localeCompare(b.id);
            });

            const keeper = sorted[0];
            const toRemove = sorted.slice(1);

            return {
                normalizedUrl: group.normalizedUrl,
                count: group.count,
                imageUrls: group.pins.map(p => p.imageUrl),
                keeper: {
                    id: keeper.id,
                    title: keeper.title,
                    imageUrl: keeper.imageUrl,
                    tags: keeper.tags,
                    reason: 'Highest resolution + most complete'
                },
                toRemove: toRemove.map(pin => ({
                    id: pin.id,
                    title: pin.title,
                    imageUrl: pin.imageUrl,
                    tags: pin.tags,
                    reason: 'Duplicate (size variant or exact)'
                }))
            };
        })
    };

    // Save report
    fs.writeFileSync('duplicate-pins-report.json', JSON.stringify(report, null, 2));

    // Print summary
    console.log('═══════════════════════════════════════');
    console.log('📊 DUPLICATE DETECTION RESULTS');
    console.log('═══════════════════════════════════════\n');

    console.log(`Total pins: ${report.totalPins}`);
    console.log(`Unique images: ${report.uniqueImages}`);
    console.log(`Duplicate groups: ${report.duplicateGroups}`);
    console.log(`Total duplicates to remove: ${report.totalDuplicates}\n`);

    if (report.duplicateGroups > 0) {
        console.log('Top 20 duplicate groups:\n');
        report.details.slice(0, 20).forEach((group, index) => {
            console.log(`${index + 1}. ${group.count} copies`);
            console.log(`   Keeper: ${group.keeper.title.substring(0, 60)}...`);
            console.log(`   Keeper URL: ${group.keeper.imageUrl}`);
            console.log(`   Remove: ${group.toRemove.length} duplicates`);
            group.toRemove.forEach(dup => {
                console.log(`     - ${dup.imageUrl}`);
            });
            console.log('');
        });
    }

    console.log('═══════════════════════════════════════');
    console.log('📄 Report saved to: duplicate-pins-report.json');
    console.log('═══════════════════════════════════════\n');

    return report;
}

detectDuplicates()
    .then((report) => {
        console.log('✅ Detection complete');
        console.log(`\nNext steps:`);
        console.log(`1. Review duplicate-pins-report.json`);
        console.log(`2. Run removal script if satisfied`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
