/**
 * RE-CLASSIFY COLORS WITH IMPROVED GPT-4 VISION PROMPT
 * 
 * This script re-analyzes pins with "red" as primary color using a stricter
 * GPT-4 Vision prompt to eliminate false positives (pink, beige, orange, purple).
 * 
 * Cost estimate: ~$0.01 per pin × 85 pins = ~$0.85
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_COLOR = process.argv.find(arg => arg.startsWith('--color='))?.split('=')[1] || 'red';

if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    process.exit(1);
}

/**
 * Improved GPT-4 Vision prompt for strict color classification
 */
async function analyzeColorsWithGPT4(imageUrl) {
    const prompt = `Analyze this design and identify ONLY the dominant colors that occupy >30% of the visual space.

CRITICAL: Distinguish carefully between similar colors:
- RED (pure red, crimson, scarlet) vs PINK (light red, rose, salmon) vs ORANGE (red-yellow, coral)
- BLUE (pure blue, navy, royal blue) vs TEAL (blue-green, turquoise) vs PURPLE (blue-red, violet)
- BROWN (dark orange-red, chocolate) vs BEIGE (light brown, tan, cream)
- GREEN (pure green, forest) vs LIME (yellow-green) vs MINT (light green)

Return ONLY a JSON object with this exact structure:
{
  "colors": ["color1", "color2", "color3"],
  "reasoning": "Brief explanation of why each color was chosen"
}

Rules:
1. Only include colors that occupy >30% of the design
2. List colors in order of prominence (most dominant first)
3. Maximum 3 colors
4. Use lowercase color names: red, blue, green, yellow, orange, purple, pink, brown, beige, black, white, gray, teal, cyan, lime
5. Be STRICT: if a color is pink, don't call it red. If it's beige, don't call it red.

Return ONLY the JSON, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            }],
            max_tokens: 200
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content || '{}';

    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(content);
}

/**
 * Main re-classification function
 */
async function reclassifyColors() {
    console.log(`🎨 Re-classifying pins with "${TARGET_COLOR}" as primary color...\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No changes will be saved\n');
    }

    // Get all pin keys
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

    // Filter pins with target color as primary
    console.log(`🔍 Filtering pins with "${TARGET_COLOR}" as primary color...`);
    const targetPins = [];

    for (const key of allKeys) {
        const pinId = key.replace('saved-pin:', '');
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (tags?.color?.[0] === TARGET_COLOR) {
            const pin = await kv.get(key);
            targetPins.push({ pinId, pin, tags });
        }
    }

    console.log(`✅ Found ${targetPins.length} pins with "${TARGET_COLOR}" as primary color\n`);

    if (targetPins.length === 0) {
        console.log('✅ No pins to re-classify');
        return;
    }

    // Display cost estimate
    const estimatedCost = (targetPins.length * 0.01).toFixed(2);
    console.log(`💰 Estimated cost: $${estimatedCost} (${targetPins.length} pins × $0.01)\n`);

    if (!DRY_RUN) {
        console.log('⚠️  This will update the database. Press Ctrl+C to cancel.\n');
        console.log('Starting in 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Re-classify each pin
    const results = {
        correct: [],      // Still has target color as primary
        reclassified: [], // Changed to different primary color
        errors: []        // Failed to analyze
    };

    for (let i = 0; i < targetPins.length; i++) {
        const { pinId, pin, tags } = targetPins[i];
        const progress = `[${i + 1}/${targetPins.length}]`;

        console.log(`\n${progress} Analyzing pin: ${pinId}`);
        console.log(`   Title: ${pin.title?.substring(0, 60)}...`);
        console.log(`   Current colors: ${tags.color.join(', ')}`);

        try {
            if (!pin.imageUrl) {
                console.log(`   ⚠️  No image URL, skipping`);
                results.errors.push({ pinId, reason: 'No image URL' });
                continue;
            }

            // Analyze with improved prompt
            console.log(`   🤖 Analyzing with GPT-4 Vision...`);
            const analysis = await analyzeColorsWithGPT4(pin.imageUrl);

            console.log(`   📊 New colors: ${analysis.colors.join(', ')}`);
            console.log(`   💭 Reasoning: ${analysis.reasoning}`);

            const oldPrimaryColor = tags.color[0];
            const newPrimaryColor = analysis.colors[0];

            if (newPrimaryColor === TARGET_COLOR) {
                console.log(`   ✅ CORRECT: Still ${TARGET_COLOR}`);
                results.correct.push({ pinId, colors: analysis.colors });
            } else {
                console.log(`   🔄 RECLASSIFIED: ${oldPrimaryColor} → ${newPrimaryColor}`);
                results.reclassified.push({
                    pinId,
                    oldColors: tags.color,
                    newColors: analysis.colors,
                    reasoning: analysis.reasoning
                });

                // Update tags in database
                if (!DRY_RUN) {
                    const updatedTags = {
                        ...tags,
                        color: analysis.colors
                    };
                    await kv.set(`pin-tags:${pinId}`, updatedTags);
                    console.log(`   💾 Updated in database`);
                }
            }

            // Rate limiting: wait 1 second between API calls
            if (i < targetPins.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.errors.push({ pinId, reason: error.message });
        }
    }

    // Print summary
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 RE-CLASSIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`✅ Correct (still ${TARGET_COLOR}): ${results.correct.length}`);
    console.log(`🔄 Reclassified: ${results.reclassified.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log(`📊 Total processed: ${targetPins.length}\n`);

    if (results.reclassified.length > 0) {
        console.log('🔄 RECLASSIFIED PINS:');
        console.log('─────────────────────────────────────────────────────────\n');

        results.reclassified.forEach(({ pinId, oldColors, newColors, reasoning }) => {
            console.log(`Pin: ${pinId}`);
            console.log(`  Old: ${oldColors.join(', ')}`);
            console.log(`  New: ${newColors.join(', ')}`);
            console.log(`  Why: ${reasoning}`);
            console.log('');
        });
    }

    if (results.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        console.log('─────────────────────────────────────────────────────────\n');

        results.errors.forEach(({ pinId, reason }) => {
            console.log(`Pin: ${pinId} - ${reason}`);
        });
    }

    const actualCost = (targetPins.length * 0.01).toFixed(2);
    console.log(`\n💰 Actual cost: $${actualCost}\n`);

    if (DRY_RUN) {
        console.log('🔍 DRY RUN COMPLETE - No changes were saved');
        console.log('   Run without --dry-run to apply changes\n');
    } else {
        console.log('✅ RE-CLASSIFICATION COMPLETE\n');
    }
}

// Run the script
reclassifyColors()
    .then(() => {
        console.log('✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script error:', error);
        process.exit(1);
    });
