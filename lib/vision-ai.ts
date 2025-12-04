/**
 * Google Vision AI Integration (Lightweight)
 * Uses direct REST API calls instead of heavy SDK
 */

export interface VisionAnalysis {
    labels: string[];
    colors: Array<{
        color: string;
        score: number;
        rgb: { r: number; g: number; b: number };
    }>;
    text?: string;
}

/**
 * Analyze image with Google Vision AI using REST API
 */
export async function analyzeWithVision(imageUrl: string): Promise<VisionAnalysis> {
    try {
        const apiKey = process.env.GOOGLE_VISION_API_KEY;

        if (!apiKey) {
            throw new Error('GOOGLE_VISION_API_KEY not configured');
        }

        // Call Google Vision API directly
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        image: {
                            source: {
                                imageUri: imageUrl
                            }
                        },
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

        // Extract labels
        const labels = (result.labelAnnotations || [])
            .map((label: any) => label.description?.toLowerCase() || '')
            .filter(Boolean);

        // Extract dominant colors
        const colorInfo = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
        const colors = colorInfo
            .slice(0, 5) // Top 5 colors
            .map((colorData: any) => ({
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

        // Extract text if any
        const text = result.textAnnotations?.[0]?.description || undefined;

        console.log(`✅ Vision AI analysis complete: ${labels.length} labels, ${colors.length} colors`);

        return { labels, colors, text };

    } catch (error) {
        console.error('❌ Vision AI error:', error);
        throw error;
    }
}

/**
 * Convert RGB to color name
 */
function rgbToColorName(r: number, g: number, b: number): string {
    // Simple color detection logic
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Grayscale
    if (diff < 30) {
        if (max < 50) return 'black';
        if (max > 200) return 'white';
        return 'gray';
    }

    // Chromatic colors
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
