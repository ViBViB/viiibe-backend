import { kv } from '@vercel/kv';

interface GapItem {
    category: string;
    attribute: string;
    attributeType: 'color' | 'style';
    count: number;
    suggestedQuery: string;
    priority: 'urgent' | 'low' | 'balanced';
}

interface CollectionAnalysis {
    lastUpdated: string;
    totalPins: number;
    urgent: GapItem[];
    low: GapItem[];
    balanced: GapItem[];
}

const CACHE_KEY = 'collection-analysis';
const CACHE_TTL = 3600; // 1 hour in seconds
const UPDATE_THRESHOLD = 10; // Update if 10+ new pins since last analysis

export default async function handler(req: any, res: any) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const forceRefresh = req.query?.refresh === 'true';

        // Check if we have cached analysis
        const cached = forceRefresh ? null : await kv.get<CollectionAnalysis>(CACHE_KEY);

        // Use SCAN instead of KEYS to avoid "too many keys" error with 500+ pins
        const pinKeys: string[] = [];
        let cursor = 0;

        do {
            const result = await kv.scan(cursor, {
                match: 'saved-pin:*',
                count: 100
            });

            cursor = result[0];
            pinKeys.push(...result[1]);
        } while (cursor !== 0);

        const currentPinCount = pinKeys.length;

        // Determine if we need to update
        const shouldUpdate = forceRefresh || !cached ||
            (currentPinCount - (cached.totalPins || 0)) >= UPDATE_THRESHOLD ||
            (Date.now() - new Date(cached.lastUpdated).getTime()) > (CACHE_TTL * 1000);

        if (cached && !shouldUpdate) {
            console.log('✅ Returning cached analysis');
            return res.status(200).json(cached);
        }

        // Fetch all pins
        console.log(`🔄 Fetching ${currentPinCount} pins...`);
        const pins = [];
        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (pin) {
                // Also fetch AI analysis tags (stored separately)
                const pinId = (pin as any).id;
                const aiTags = await kv.get(`pin-tags:${pinId}`);

                // Merge pin data with AI analysis
                pins.push({
                    ...pin,
                    aiAnalysis: aiTags || null
                });
            }
        }

        console.log(`✅ Fetched ${pins.length} pins with AI analysis`);

        // Perform analysis
        console.log('🔄 Performing fresh analysis...');
        const debugMode = req.query?.debug === 'true';
        const analysis = await analyzeCollection(pins, debugMode);

        // Cache the result
        await kv.set(CACHE_KEY, analysis, { ex: CACHE_TTL * 24 }); // 24 hour TTL

        console.log(`✅ Analysis complete: ${analysis.urgent.length} urgent, ${analysis.low.length} low, ${analysis.balanced.length} balanced`);
        return res.status(200).json(analysis);

    } catch (error: any) {
        console.error('❌ Error in collection-gaps:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Generate specific, actionable search queries based on industry
function generateSearchQuery(industry: string, count: number): string {
    const industryLower = industry.toLowerCase();

    // Map of industry-specific search terms (more specific than generic)
    const specificQueries: Record<string, string[]> = {
        'real estate': ['luxury real estate', 'property listing', 'real estate agency'],
        'tech': ['tech startup', 'software company', 'tech platform'],
        'finance': ['fintech', 'banking', 'investment platform'],
        'fitness': ['gym', 'fitness app', 'wellness center'],
        'healthcare': ['hospital', 'clinic', 'medical practice'],
        'saas': ['saas platform', 'software dashboard', 'cloud app'],
        'ecommerce': ['online store', 'ecommerce shop', 'product catalog'],
        'education': ['online course', 'university', 'learning platform'],
        'travel': ['travel agency', 'hotel booking', 'tourism'],
        'food': ['restaurant', 'food delivery', 'cafe'],
        'fashion': ['fashion brand', 'clothing store', 'boutique'],
        'logistics': ['logistics company', 'shipping service', 'delivery'],
        'furniture': ['furniture store', 'interior design shop', 'home decor'],
        'beauty': ['beauty salon', 'spa', 'cosmetics'],
        'transport': ['transportation service', 'fleet management', 'mobility'],
        'transportation': ['logistics company', 'shipping service', 'delivery'],
        'consulting': ['consulting agency', 'professional services', 'business consulting'],
        'construction': ['construction company', 'architecture firm', 'contractor'],
        'business': ['corporate website', 'business agency', 'professional services'],
        'legal': ['law firm', 'legal services', 'attorney'],
    };

    // Get specific terms or fallback to generic
    const terms = specificQueries[industryLower] || [industryLower];

    // Rotate through terms based on count (so you get variety)
    const termIndex = Math.floor(count / 20) % terms.length;
    const selectedTerm = terms[termIndex];

    return `${selectedTerm} website design`;
}

async function analyzeCollection(pins: any[], debugMode: boolean = false): Promise<CollectionAnalysis> {
    const industryCounts = new Map<string, number>();

    // Count pins by industry from AI analysis
    for (const pin of pins) {
        // Try to get industry from AI analysis first
        let industry = 'uncategorized';

        if (pin.aiAnalysis && pin.aiAnalysis.industry && Array.isArray(pin.aiAnalysis.industry) && pin.aiAnalysis.industry.length > 0) {
            industry = pin.aiAnalysis.industry[0];
        }

        industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
    }

    // Classify industries by pin count
    const urgent: GapItem[] = [];
    const low: GapItem[] = [];
    const balanced: GapItem[] = [];

    for (const [industry, count] of industryCounts.entries()) {
        const item: GapItem = {
            category: formatCategory(industry),
            attribute: '', // Not used for industry-only view
            attributeType: 'color', // Dummy value
            count,
            suggestedQuery: generateSearchQuery(industry, count),
            priority: count < 20 ? 'urgent' : count < 50 ? 'low' : 'balanced'
        };

        if (count < 20) {
            urgent.push(item);
        } else if (count < 50) {
            low.push(item);
        } else {
            balanced.push(item);
        }
    }

    // Sort by count (lowest first for urgent/low, highest first for balanced)
    urgent.sort((a, b) => a.count - b.count);
    low.sort((a, b) => a.count - b.count);
    balanced.sort((a, b) => b.count - a.count);

    return {
        lastUpdated: new Date().toISOString(),
        totalPins: pins.length,
        urgent: debugMode ? urgent : urgent.slice(0, 10),
        low: debugMode ? low : low.slice(0, 10),
        balanced: debugMode ? balanced : balanced.slice(0, 10)
    };
}

function formatCategory(category: string): string {
    return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatAttribute(attribute: string): string {
    return attribute.charAt(0).toUpperCase() + attribute.slice(1);
}

function generateQuery(category: string, attribute: string, type: string): string {
    const formattedCategory = formatCategory(category);
    const formattedAttribute = formatAttribute(attribute);

    if (type === 'color') {
        return `${formattedAttribute.toLowerCase()} ${formattedCategory.toLowerCase()} website design`;
    } else {
        return `${formattedAttribute.toLowerCase()} ${formattedCategory.toLowerCase()} design`;
    }
}
