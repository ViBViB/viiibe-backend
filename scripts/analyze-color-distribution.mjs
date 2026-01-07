/**
 * ANALYZE COLOR DISTRIBUTION
 * 
 * This script analyzes all pins in the database to:
 * 1. Show the distribution of primary colors
 * 2. Identify potential misclassifications
 * 3. Generate a report for each color
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function analyzeColorDistribution() {
    console.log('🎨 Analyzing color distribution in database...\n');

    // Get all pins
    console.log('📊 Scanning database for pins...');
    const allKeys = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        allKeys.push(...result[1]);
    } while (cursor !== 0);

    console.log(`✅ Found ${allKeys.length} total pins\n`);

    // Analyze color distribution
    const colorStats = {};
    const colorExamples = {};

    for (const key of allKeys) {
        const pinId = key.replace('saved-pin:', '');
        const tags = await kv.get(`pin-tags:${pinId}`);
        const pin = await kv.get(key);

        if (!tags || !tags.color || tags.color.length === 0) continue;

        const primaryColor = tags.color[0];

        // Count primary colors
        if (!colorStats[primaryColor]) {
            colorStats[primaryColor] = {
                count: 0,
                asSecondary: 0,
                asTertiary: 0,
                examples: []
            };
        }

        colorStats[primaryColor].count++;

        // Store examples (first 3 for each color)
        if (colorStats[primaryColor].examples.length < 3) {
            colorStats[primaryColor].examples.push({
                pinId,
                title: pin.title || 'Untitled',
                colors: tags.color,
                imageUrl: pin.imageUrl,
                pinterestUrl: pin.pinterestUrl
            });
        }

        // Count secondary colors
        if (tags.color.length > 1) {
            const secondaryColor = tags.color[1];
            if (!colorStats[secondaryColor]) {
                colorStats[secondaryColor] = {
                    count: 0,
                    asSecondary: 0,
                    asTertiary: 0,
                    examples: []
                };
            }
            colorStats[secondaryColor].asSecondary++;
        }

        // Count tertiary colors
        if (tags.color.length > 2) {
            const tertiaryColor = tags.color[2];
            if (!colorStats[tertiaryColor]) {
                colorStats[tertiaryColor] = {
                    count: 0,
                    asSecondary: 0,
                    asTertiary: 0,
                    examples: []
                };
            }
            colorStats[tertiaryColor].asTertiary++;
        }
    }

    // Sort colors by primary count
    const sortedColors = Object.entries(colorStats)
        .sort((a, b) => b[1].count - a[1].count);

    // Print results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 COLOR DISTRIBUTION ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Color'.padEnd(15) + 'Primary'.padEnd(12) + 'Secondary'.padEnd(12) + 'Tertiary'.padEnd(12) + 'Total');
    console.log('─'.repeat(65));

    for (const [color, stats] of sortedColors) {
        const total = stats.count + stats.asSecondary + stats.asTertiary;
        console.log(
            color.padEnd(15) +
            stats.count.toString().padEnd(12) +
            stats.asSecondary.toString().padEnd(12) +
            stats.asTertiary.toString().padEnd(12) +
            total.toString()
        );
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 POTENTIAL ISSUES TO INVESTIGATE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Identify potential issues
    const issues = [];

    // Issue 1: Colors with unusually high primary counts
    const avgPrimaryCount = sortedColors.reduce((sum, [_, stats]) => sum + stats.count, 0) / sortedColors.length;

    for (const [color, stats] of sortedColors) {
        if (stats.count > avgPrimaryCount * 2) {
            issues.push({
                color,
                type: 'High primary count',
                count: stats.count,
                reason: `${stats.count} pins (${((stats.count / allKeys.length) * 100).toFixed(1)}% of total) - may include misclassifications`
            });
        }
    }

    // Issue 2: Similar colors (red/pink/orange, blue/purple/cyan, etc.)
    const similarColorGroups = [
        { name: 'Red family', colors: ['red', 'pink', 'orange', 'brown', 'beige'] },
        { name: 'Blue family', colors: ['blue', 'purple', 'cyan', 'teal'] },
        { name: 'Green family', colors: ['green', 'lime', 'mint'] },
        { name: 'Neutrals', colors: ['white', 'black', 'gray'] }
    ];

    for (const group of similarColorGroups) {
        const groupStats = group.colors
            .filter(c => colorStats[c])
            .map(c => ({ color: c, count: colorStats[c].count }));

        if (groupStats.length > 0) {
            console.log(`\n${group.name}:`);
            for (const { color, count } of groupStats) {
                console.log(`  ${color}: ${count} pins`);
            }
        }
    }

    // Print issues
    if (issues.length > 0) {
        console.log('\n⚠️  COLORS TO REVIEW:');
        console.log('─'.repeat(65));
        for (const issue of issues) {
            console.log(`\n${issue.color.toUpperCase()}`);
            console.log(`  Type: ${issue.type}`);
            console.log(`  ${issue.reason}`);
        }
    }

    // Print examples for each color
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📸 EXAMPLES FOR EACH COLOR (First 3 pins)');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const [color, stats] of sortedColors) {
        if (stats.examples.length > 0) {
            console.log(`\n${color.toUpperCase()} (${stats.count} pins):`);
            console.log('─'.repeat(65));

            for (const example of stats.examples) {
                console.log(`\n  Pin ID: ${example.pinId}`);
                console.log(`  Title: ${example.title.substring(0, 60)}...`);
                console.log(`  Colors: ${example.colors.join(', ')}`);
                console.log(`  Pinterest: ${example.pinterestUrl}`);
            }
        }
    }

    // Generate summary
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Total pins analyzed: ${allKeys.length}`);
    console.log(`Unique colors found: ${sortedColors.length}`);
    console.log(`Most common primary color: ${sortedColors[0][0]} (${sortedColors[0][1].count} pins)`);
    console.log(`Least common primary color: ${sortedColors[sortedColors.length - 1][0]} (${sortedColors[sortedColors.length - 1][1].count} pins)`);

    // Export data for further analysis
    const exportData = {
        totalPins: allKeys.length,
        colors: Object.fromEntries(sortedColors),
        timestamp: new Date().toISOString()
    };

    const fs = await import('fs');
    fs.writeFileSync('color-distribution.json', JSON.stringify(exportData, null, 2));
    console.log('\n✅ Detailed data exported to: color-distribution.json');
}

analyzeColorDistribution()
    .then(() => {
        console.log('\n✅ Analysis complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
