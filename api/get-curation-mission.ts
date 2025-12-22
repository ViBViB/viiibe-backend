import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface CurationMission {
    industry: string;
    currentCount: number;
    targetCount: number;
    progress: number;
    queries: string[];
    isComplete: boolean;
    nextIndustry?: string;
    totalProgress: {
        current: number;
        target: number;
        percentage: number;
    };
}

// Generate 3 specific search queries for an industry
function generateQueries(industry: string): string[] {
    const industryLower = industry.toLowerCase();

    const queryMap: Record<string, string[]> = {
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

    const queries = queryMap[industryLower] || [industryLower, `${industryLower} company`, `${industryLower} service`];
    return queries.map(q => `${q} website design`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        // Get all pins using SCAN
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

        // Count by industry
        const industryCounts = new Map<string, number>();

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = (pin as any).id;
            const aiTags = await kv.get(`pin-tags:${pinId}`);

            if (aiTags && (aiTags as any).industry && Array.isArray((aiTags as any).industry) && (aiTags as any).industry.length > 0) {
                const industry = (aiTags as any).industry[0];
                industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
            }
        }

        // Define all expected industries (from queryMap)
        const allIndustries = [
            'real estate', 'tech', 'finance', 'fitness', 'healthcare', 'saas',
            'ecommerce', 'education', 'travel', 'food', 'fashion', 'logistics',
            'furniture', 'beauty', 'transport', 'transportation', 'consulting',
            'construction', 'business', 'legal'
        ];

        // Build complete list with counts (0 for missing industries) - case insensitive
        const allIndustryCounts = allIndustries.map(industry => {
            // Find count with case-insensitive match and return original industry name
            let count = 0;
            let originalIndustry = industry; // Default to lowercase
            for (const [key, value] of industryCounts.entries()) {
                if (key.toLowerCase() === industry.toLowerCase()) {
                    count = value;
                    originalIndustry = key; // Use the original capitalized name
                    break;
                }
            }
            return [originalIndustry, count] as [string, number];
        });

        // Add any industries found in data but not in our list
        for (const [industry, count] of industryCounts.entries()) {
            if (!allIndustries.includes(industry.toLowerCase())) {
                allIndustryCounts.push([industry, count]);
            }
        }

        // Find industries that need curation (< 100 pins)
        const needsCuration = allIndustryCounts
            .filter(([_, count]) => count < 100)
            .sort((a, b) => a[1] - b[1]); // Sort by count (lowest first)

        const totalPins = pinKeys.length;
        const targetPins = 2100; // 21 industries × 100 pins
        const totalProgress = Math.round((totalPins / targetPins) * 100);

        // If all industries are balanced
        if (needsCuration.length === 0) {
            return res.json({
                isComplete: true,
                message: 'All industries balanced! 🎉',
                totalProgress: {
                    current: totalPins,
                    target: targetPins,
                    percentage: 100
                }
            });
        }

        // Get current mission (most urgent industry)
        const [currentIndustry, currentCount] = needsCuration[0];
        const nextIndustry = needsCuration.length > 1 ? needsCuration[1][0] : null;

        const mission: CurationMission = {
            industry: currentIndustry,
            currentCount,
            targetCount: 100,
            progress: Math.round((currentCount / 100) * 100),
            queries: generateQueries(currentIndustry),
            isComplete: false,
            nextIndustry: nextIndustry || undefined,
            totalProgress: {
                current: totalPins,
                target: targetPins,
                percentage: totalProgress
            }
        };

        return res.json(mission);

    } catch (error: any) {
        console.error('Error getting curation mission:', error);
        return res.status(500).json({
            error: 'Failed to get curation mission',
            message: error.message
        });
    }
}
