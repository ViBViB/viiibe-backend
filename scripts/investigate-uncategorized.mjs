import { kv } from '@vercel/kv';

console.log('🔍 Investigating Uncategorized pins...\n');

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

console.log(`Total pins in database: ${pinKeys.length}\n`);

// Categorize pins by their status
const categorized = [];
const uncategorizedWithTags = [];
const noTags = [];
const errors = [];

for (const key of pinKeys) {
    try {
        const pin = await kv.get(key);
        if (!pin) {
            errors.push({ key, reason: 'Pin data not found' });
            continue;
        }

        const pinId = pin.id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (!tags) {
            // No tags at all
            noTags.push({
                pinId,
                title: pin.title || 'Untitled',
                imageUrl: pin.imageUrl,
                category: pin.category || 'none'
            });
        } else {
            const industry = tags.industry?.[0];

            if (!industry || industry === 'Uncategorized') {
                // Has tags but industry is Uncategorized
                uncategorizedWithTags.push({
                    pinId,
                    title: pin.title || 'Untitled',
                    imageUrl: pin.imageUrl,
                    category: pin.category || 'none',
                    tags: tags
                });
            } else {
                categorized.push({
                    pinId,
                    industry
                });
            }
        }
    } catch (error) {
        errors.push({ key, reason: error.message });
    }
}

console.log('📊 SUMMARY:');
console.log(`✅ Categorized pins: ${categorized.length}`);
console.log(`⚠️  Uncategorized (with tags): ${uncategorizedWithTags.length}`);
console.log(`❌ No tags at all: ${noTags.length}`);
console.log(`🔴 Errors: ${errors.length}`);
console.log(`\nTotal: ${categorized.length + uncategorizedWithTags.length + noTags.length + errors.length}\n`);

// Show details of uncategorized pins
if (uncategorizedWithTags.length > 0) {
    console.log('⚠️  UNCATEGORIZED PINS (with tags):');
    uncategorizedWithTags.forEach((pin, i) => {
        console.log(`\n${i + 1}. ${pin.title}`);
        console.log(`   Pin ID: ${pin.pinId}`);
        console.log(`   Category: ${pin.category}`);
        console.log(`   Image: ${pin.imageUrl?.substring(0, 60)}...`);
        console.log(`   Tags: ${JSON.stringify(pin.tags, null, 2)}`);
    });
}

if (noTags.length > 0) {
    console.log('\n\n❌ PINS WITHOUT TAGS:');
    noTags.slice(0, 10).forEach((pin, i) => {
        console.log(`\n${i + 1}. ${pin.title}`);
        console.log(`   Pin ID: ${pin.pinId}`);
        console.log(`   Category: ${pin.category}`);
        console.log(`   Image: ${pin.imageUrl?.substring(0, 60)}...`);
    });

    if (noTags.length > 10) {
        console.log(`\n... and ${noTags.length - 10} more`);
    }
}

if (errors.length > 0) {
    console.log('\n\n🔴 ERRORS:');
    errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.key}: ${err.reason}`);
    });
}

// Count by industry for categorized pins
const industryCounts = {};
categorized.forEach(pin => {
    const ind = pin.industry.toLowerCase();
    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
});

console.log('\n\n📈 INDUSTRY DISTRIBUTION:');
Object.entries(industryCounts)
    .sort((a, b) => a[1] - b[1])
    .forEach(([industry, count]) => {
        console.log(`${industry}: ${count}`);
    });

console.log('\n✅ Investigation complete!');
