import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, adminKey, pinId } = req.body;

        // Validate admin key
        const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
        if (adminKey !== ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Route to appropriate handler
        if (action === 'analyze') {
            await analyzePin(pinId, res);
        } else if (action === 'auto-add-board') {
            return res.status(200).json({
                success: true,
                message: 'auto-add-board not yet implemented'
            });
        } else {
            return res.status(400).json({
                error: 'Invalid action',
                validActions: ['analyze', 'auto-add-board']
            });
        }

    } catch (error: any) {
        console.error('❌ Pin analysis error:', error);
        return res.status(500).json({
            error: 'Failed to process request',
            message: error.message
        });
    }
}

/**
 * Analyze a pin with AI
 */
async function analyzePin(pinId: string, res: VercelResponse) {
    if (!pinId) {
        return res.status(400).json({ error: 'Missing pinId' });
    }

    console.log(`🔍 Analyzing pin: ${pinId}`);

    // 1. Get pin from KV
    const pin: any = await kv.get(`saved-pin:${pinId}`);
    if (!pin) {
        return res.status(404).json({ error: 'Pin not found' });
    }

    try {
        // 2. Get image URL from saved pin data
        console.log(`📷 Getting image URL for pin ${pinId}`);

        if (!pin.imageUrl) {
            return res.status(400).json({
                error: 'Image URL not available',
                message: 'Pin was saved without imageUrl. Please re-save the pin with imageUrl included.',
                pinId
            });
        }

        const imageUrl = pin.imageUrl;
        console.log(`✅ Image URL found: ${imageUrl.substring(0, 50)}...`);

        // 3. Analyze with Vision AI
        console.log(`🤖 Running Vision AI analysis...`);
        const visionAnalysis = await analyzeWithVision(imageUrl);

        // 4. Analyze with GPT-4 Vision
        console.log(`🧠 Running GPT-4 Vision analysis...`);
        const gptAnalysis = await analyzeWithGPT4(imageUrl);

        // 5. Combine tags
        console.log(`🏷️  Combining tags...`);
        const tags = combineTags(visionAnalysis, gptAnalysis, {
            title: pin.title,
            description: pin.description,
            pinterestUrl: pin.pinterestUrl
        });

        // 6. Save tags to KV
        await kv.set(`pin-tags:${pinId}`, tags);

        console.log(`✅ Pin ${pinId} analyzed successfully`);

        return res.status(200).json({
            success: true,
            pinId,
            tags,
            message: 'Pin analyzed successfully'
        });

    } catch (error: any) {
        console.error(`❌ Analysis error for pin ${pinId}:`, error);
        return res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            pinId
        });
    }
}

/**
 * Analyze with Google Vision AI
 */
async function analyzeWithVision(imageUrl: string) {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_VISION_API_KEY not configured');
    }

    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { source: { imageUri: imageUrl } },
                    features: [
                        { type: 'LABEL_DETECTION', maxResults: 15 },
                        { type: 'IMAGE_PROPERTIES' },
                        { type: 'TEXT_DETECTION', maxResults: 1 }
                    ]
                }]
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vision API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const result = data.responses[0];

    const labels = (result.labelAnnotations || [])
        .map((label: any) => label.description?.toLowerCase() || '')
        .filter(Boolean);

    const colorInfo = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const colors = colorInfo.slice(0, 5).map((colorData: any) => ({
        color: rgbToColorName(
            colorData.color?.red || 0,
            colorData.color?.green || 0,
            colorData.color?.blue || 0
        ),
        score: colorData.score || 0,
        rgb: {
            r: colorData.color?.red || 0,
            g: colorData.color?.green || 0,
            b: colorData.color?.blue || 0
        }
    }));

    const text = result.textAnnotations?.[0]?.description || undefined;

    return { labels, colors, text };
}

/**
 * Analyze with GPT-4 Vision
 */
async function analyzeWithGPT4(imageUrl: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `Analyze this design image and return ONLY a JSON object with these exact fields:
{
  "style": array of 2-4 style tags from: minimal, bold, clean, dark, light, gradient, flat, 3d, glassmorphism, neumorphism, modern, retro, elegant, playful,
  "industry": array of 1-3 industry tags from: tech, finance, healthcare, beauty, fashion, food, travel, education, real-estate, fitness, saas, ecommerce,
  "typography": one tag from: sans-serif, serif, display, monospace, handwritten, bold-headers, minimal-text,
  "layout": one tag from: hero-section, grid-layout, cards, split-screen, full-width, sidebar, centered, asymmetric,
  "elements": array of 2-5 key design elements like: gradient-background, large-cta-button, product-screenshot, testimonials, pricing-table, etc.
}

Return ONLY the JSON, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            }],
            max_tokens: 300
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content || '{}';
    return JSON.parse(content);
}

/**
 * Combine tags from both AI analyses
 */
function combineTags(visionData: any, gptData: any, pinMetadata: any) {
    return {
        style: gptData.style || ['modern'],
        color: visionData.colors.map((c: any) => c.color).slice(0, 3),
        type: extractTypeTags(visionData.labels, pinMetadata.title),
        typography: gptData.typography || 'sans-serif',
        imagery: extractImageryTags(visionData.labels),
        industry: gptData.industry || ['tech'],
        layout: gptData.layout || 'hero-section',
        elements: gptData.elements || [],
        confidence: 0.8
    };
}

function extractTypeTags(labels: string[], title: string): string[] {
    const tags = new Set<string>();
    const typeKeywords: Record<string, string[]> = {
        'landing-page': ['landing', 'homepage', 'website'],
        'dashboard': ['dashboard', 'analytics', 'chart'],
        'mobile-app': ['mobile', 'app', 'phone', 'ios', 'android'],
        'ecommerce': ['shop', 'store', 'product', 'cart'],
        'saas': ['software', 'platform', 'tool'],
        'portfolio': ['portfolio', 'gallery']
    };

    labels.forEach(label => {
        Object.entries(typeKeywords).forEach(([type, keywords]) => {
            if (keywords.some(kw => label.includes(kw))) {
                tags.add(type);
            }
        });
    });

    if (tags.size === 0) tags.add('website');
    return Array.from(tags).slice(0, 3);
}

function extractImageryTags(labels: string[]): string[] {
    const tags = new Set<string>();
    const imageryKeywords: Record<string, string[]> = {
        'photography': ['photo', 'photograph', 'camera'],
        'illustration': ['illustration', 'drawing', 'art'],
        '3d-render': ['3d', 'render', 'cgi'],
        'icons': ['icon', 'symbol'],
        'abstract': ['abstract', 'pattern'],
        'product-shots': ['product', 'item'],
        'people': ['person', 'people', 'human', 'face'],
        'nature': ['nature', 'landscape', 'outdoor']
    };

    labels.forEach(label => {
        Object.entries(imageryKeywords).forEach(([imagery, keywords]) => {
            if (keywords.some(kw => label.includes(kw))) {
                tags.add(imagery);
            }
        });
    });

    return Array.from(tags).slice(0, 3);
}

function rgbToColorName(r: number, g: number, b: number): string {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    if (diff < 30) {
        if (max < 50) return 'black';
        if (max > 200) return 'white';
        return 'gray';
    }

    if (r > g && r > b) {
        if (g > 100) return 'orange';
        return 'red';
    }
    if (g > r && g > b) {
        if (b > 100) return 'cyan';
        return 'green';
    }
    if (b > r && b > g) {
        if (r > 100) return 'purple';
        return 'blue';
    }
    if (r > 150 && g > 150) return 'yellow';
    if (r > 150 && b > 150) return 'pink';

    return 'colorful';
}
