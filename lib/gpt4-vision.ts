/**
 * GPT-4 Vision Integration (Lightweight)
 * Uses direct REST API calls instead of heavy SDK
 */

export interface GPT4Analysis {
    style: string[];
    industry: string[];
    typography: string;
    layout: string;
    elements: string[];
}

/**
 * Analyze image with GPT-4 Vision using REST API
 */
export async function analyzeWithGPT4(imageUrl: string): Promise<GPT4Analysis> {
    try {
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

        // Call OpenAI API directly
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
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl }
                        }
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

        // Parse JSON response
        const analysis: GPT4Analysis = JSON.parse(content);

        console.log(`✅ GPT-4 Vision analysis complete: ${analysis.style.length} styles, ${analysis.industry.length} industries`);

        return analysis;

    } catch (error) {
        console.error('❌ GPT-4 Vision error:', error);

        // Fallback to basic analysis if GPT-4 fails
        return {
            style: ['modern'],
            industry: ['tech'],
            typography: 'sans-serif',
            layout: 'hero-section',
            elements: []
        };
    }
}
