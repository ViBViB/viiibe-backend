/**
 * GENERATE COLOR REVIEW REPORT
 * 
 * Creates an interactive HTML report showing all pins that would be re-classified,
 * with images and color comparisons for manual review.
 */

import dotenv from 'dotenv';
import { kv } from '@vercel/kv';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TARGET_COLOR = process.argv.find(arg => arg.startsWith('--color='))?.split('=')[1] || 'red';
const OUTPUT_FILE = 'color-review-report.html';

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
 * Generate HTML report
 */
async function generateReport() {
    console.log(`🎨 Generating color review report for "${TARGET_COLOR}" pins...\n`);

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
        console.log('✅ No pins to review');
        return;
    }

    // Analyze each pin
    console.log('🤖 Analyzing pins with GPT-4 Vision...\n');
    const reviewData = [];

    for (let i = 0; i < targetPins.length; i++) {
        const { pinId, pin, tags } = targetPins[i];
        const progress = `[${i + 1}/${targetPins.length}]`;

        console.log(`${progress} Analyzing pin: ${pinId}`);

        try {
            if (!pin.imageUrl) {
                console.log(`   ⚠️  No image URL, skipping`);
                continue;
            }

            const analysis = await analyzeColorsWithGPT4(pin.imageUrl);

            reviewData.push({
                pinId,
                title: pin.title || 'Untitled',
                imageUrl: pin.imageUrl,
                pinterestUrl: pin.pinterestUrl,
                oldColors: tags.color,
                newColors: analysis.colors,
                reasoning: analysis.reasoning,
                isCorrect: analysis.colors[0] === TARGET_COLOR
            });

            console.log(`   ${analysis.colors[0] === TARGET_COLOR ? '✅' : '🔄'} ${tags.color[0]} → ${analysis.colors[0]}`);

            // Rate limiting
            if (i < targetPins.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
    }

    // Generate HTML
    console.log('\n📝 Generating HTML report...');

    const html = generateHTML(reviewData, TARGET_COLOR);
    fs.writeFileSync(OUTPUT_FILE, html);

    console.log(`\n✅ Report generated: ${OUTPUT_FILE}`);
    console.log(`📊 Total pins: ${reviewData.length}`);
    console.log(`✅ Correct: ${reviewData.filter(d => d.isCorrect).length}`);
    console.log(`🔄 To reclassify: ${reviewData.filter(d => !d.isCorrect).length}`);
    console.log(`\n💡 Open ${OUTPUT_FILE} in your browser to review\n`);
}

function generateHTML(data, targetColor) {
    const correct = data.filter(d => d.isCorrect);
    const reclassify = data.filter(d => !d.isCorrect);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Review Report - ${targetColor.toUpperCase()}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            padding: 40px 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 60px;
        }

        h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .stats {
            display: flex;
            gap: 24px;
            justify-content: center;
            margin-top: 24px;
        }

        .stat {
            background: #1a1a1a;
            padding: 20px 32px;
            border-radius: 12px;
            border: 1px solid #333;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 14px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .stat.correct .stat-value { color: #10b981; }
        .stat.reclassify .stat-value { color: #f59e0b; }

        .section {
            margin-bottom: 60px;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #333;
        }

        .section-title {
            font-size: 24px;
            font-weight: 600;
        }

        .section-count {
            background: #333;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 24px;
        }

        .card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            overflow: hidden;
            transition: transform 0.2s, border-color 0.2s;
        }

        .card:hover {
            transform: translateY(-4px);
            border-color: #667eea;
        }

        .card-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            background: #0a0a0a;
        }

        .card-content {
            padding: 20px;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #fff;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .color-comparison {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
        }

        .color-group {
            flex: 1;
        }

        .color-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 6px;
        }

        .color-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .color-tag {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid;
        }

        .color-tag.old {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }

        .color-tag.new {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10b981;
        }

        .color-tag.correct {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10b981;
        }

        .reasoning {
            font-size: 13px;
            color: #aaa;
            line-height: 1.6;
            margin-bottom: 12px;
            padding: 12px;
            background: #0a0a0a;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }

        .card-footer {
            display: flex;
            gap: 8px;
        }

        .btn {
            flex: 1;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
            transition: all 0.2s;
        }

        .btn-pinterest {
            background: #e60023;
            color: white;
        }

        .btn-pinterest:hover {
            background: #c5001e;
        }

        .empty {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .filter-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            justify-content: center;
        }

        .filter-btn {
            padding: 10px 20px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            color: #e0e0e0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
        }

        .filter-btn:hover {
            border-color: #667eea;
        }

        .filter-btn.active {
            background: #667eea;
            border-color: #667eea;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎨 Color Review Report</h1>
            <p style="font-size: 18px; color: #888; margin-top: 8px;">
                Reviewing pins classified as <strong style="color: #667eea;">${targetColor.toUpperCase()}</strong>
            </p>
            
            <div class="stats">
                <div class="stat correct">
                    <div class="stat-value">${correct.length}</div>
                    <div class="stat-label">Correct</div>
                </div>
                <div class="stat reclassify">
                    <div class="stat-value">${reclassify.length}</div>
                    <div class="stat-label">To Reclassify</div>
                </div>
                <div class="stat">
                    <div class="stat-value" style="color: #667eea;">${data.length}</div>
                    <div class="stat-label">Total</div>
                </div>
            </div>

            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterPins('all')">All (${data.length})</button>
                <button class="filter-btn" onclick="filterPins('reclassify')">To Reclassify (${reclassify.length})</button>
                <button class="filter-btn" onclick="filterPins('correct')">Correct (${correct.length})</button>
            </div>
        </header>

        <div class="section" id="reclassify-section">
            <div class="section-header">
                <div class="section-title">🔄 Pins to Reclassify</div>
                <div class="section-count">${reclassify.length}</div>
            </div>
            ${reclassify.length > 0 ? `
                <div class="grid">
                    ${reclassify.map(pin => `
                        <div class="card" data-type="reclassify">
                            <img src="${pin.imageUrl}" alt="${pin.title}" class="card-image" loading="lazy">
                            <div class="card-content">
                                <div class="card-title">${pin.title}</div>
                                
                                <div class="color-comparison">
                                    <div class="color-group">
                                        <div class="color-label">Old Colors</div>
                                        <div class="color-tags">
                                            ${pin.oldColors.map(c => `<span class="color-tag old">${c}</span>`).join('')}
                                        </div>
                                    </div>
                                    <div class="color-group">
                                        <div class="color-label">New Colors</div>
                                        <div class="color-tags">
                                            ${pin.newColors.map(c => `<span class="color-tag new">${c}</span>`).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="reasoning">${pin.reasoning}</div>

                                <div class="card-footer">
                                    <a href="${pin.pinterestUrl}" target="_blank" class="btn btn-pinterest">
                                        View on Pinterest
                                    </a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="empty">No pins to reclassify</div>'}
        </div>

        <div class="section" id="correct-section">
            <div class="section-header">
                <div class="section-title">✅ Correctly Classified</div>
                <div class="section-count">${correct.length}</div>
            </div>
            ${correct.length > 0 ? `
                <div class="grid">
                    ${correct.map(pin => `
                        <div class="card" data-type="correct">
                            <img src="${pin.imageUrl}" alt="${pin.title}" class="card-image" loading="lazy">
                            <div class="card-content">
                                <div class="card-title">${pin.title}</div>
                                
                                <div class="color-comparison">
                                    <div class="color-group">
                                        <div class="color-label">Colors</div>
                                        <div class="color-tags">
                                            ${pin.newColors.map(c => `<span class="color-tag correct">${c}</span>`).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="reasoning">${pin.reasoning}</div>

                                <div class="card-footer">
                                    <a href="${pin.pinterestUrl}" target="_blank" class="btn btn-pinterest">
                                        View on Pinterest
                                    </a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="empty">No correctly classified pins</div>'}
        </div>
    </div>

    <script>
        function filterPins(type) {
            const cards = document.querySelectorAll('.card');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update button states
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // Filter cards
            cards.forEach(card => {
                if (type === 'all') {
                    card.style.display = 'block';
                } else {
                    card.style.display = card.dataset.type === type ? 'block' : 'none';
                }
            });
        }
    </script>
</body>
</html>`;
}

// Run the script
generateReport()
    .then(() => {
        console.log('✅ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script error:', error);
        process.exit(1);
    });
