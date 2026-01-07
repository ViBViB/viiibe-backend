import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function removeDuplicates(dryRun = true) {
    console.log(`🧹 Removing Duplicate Pins ${dryRun ? '(DRY RUN)' : '(LIVE)'}\n`);

    // Load report
    const report = JSON.parse(fs.readFileSync('duplicate-pins-report.json', 'utf8'));

    console.log(`📊 Report summary:`);
    console.log(`   Total pins: ${report.totalPins}`);
    console.log(`   Duplicate groups: ${report.duplicateGroups}`);
    console.log(`   Pins to remove: ${report.totalDuplicates}\n`);

    const toKeep = [];
    const toRemove = [];
    const removalLog = [];

    // Process each duplicate group
    for (const group of report.details) {
        toKeep.push(group.keeper);

        for (const pin of group.toRemove) {
            toRemove.push(pin);
            removalLog.push({
                id: pin.id,
                title: pin.title,
                imageUrl: group.imageUrl,
                reason: pin.reason,
                keptInstead: group.keeper.id,
                timestamp: new Date().toISOString()
            });
        }
    }

    console.log('═══════════════════════════════════════');
    console.log('📋 REMOVAL PLAN');
    console.log('═══════════════════════════════════════\n');

    console.log(`Will keep: ${toKeep.length} pins`);
    console.log(`Will remove: ${toRemove.length} pins\n`);

    console.log('Pins to remove:\n');
    toRemove.forEach((pin, index) => {
        console.log(`${index + 1}. ${pin.title}`);
        console.log(`   ID: ${pin.id}`);
        console.log(`   Colors: ${pin.tags.color?.join(', ') || 'none'}`);
        console.log('');
    });

    if (!dryRun) {
        console.log('═══════════════════════════════════════');
        console.log('🗑️  EXECUTING REMOVAL');
        console.log('═══════════════════════════════════════\n');

        for (const pin of toRemove) {
            console.log(`Removing pin: ${pin.id}...`);

            // Delete pin data
            await kv.del(`saved-pin:${pin.id}`);
            await kv.del(`pin-tags:${pin.id}`);

            // Remove from category sets
            const industry = pin.tags?.industry?.[0];
            if (industry) {
                await kv.srem(`category:${industry}`, pin.id);
            }

            console.log(`✅ Removed`);
        }

        // Save removal log
        fs.writeFileSync('removal-log.json', JSON.stringify(removalLog, null, 2));

        console.log('\n═══════════════════════════════════════');
        console.log('✅ REMOVAL COMPLETE');
        console.log('═══════════════════════════════════════\n');

        console.log(`Removed: ${toRemove.length} pins`);
        console.log(`Kept: ${toKeep.length} pins`);
        console.log(`Log saved to: removal-log.json\n`);
    } else {
        console.log('═══════════════════════════════════════');
        console.log('ℹ️  DRY RUN COMPLETE');
        console.log('═══════════════════════════════════════\n');

        console.log('No changes were made to the database.');
        console.log('Run with --execute flag to perform actual removal.\n');
    }

    return { toKeep, toRemove, removalLog };
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

if (!dryRun) {
    console.log('⚠️  WARNING: This will permanently delete pins from the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
}

removeDuplicates(dryRun)
    .then((result) => {
        console.log('✅ Script complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
