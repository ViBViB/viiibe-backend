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
    tier?: 'core' | 'secondary' | 'nicho';
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
        'transportation': ['logistics company', 'shipping service', 'delivery'],
        'consulting': ['consulting agency', 'professional services', 'business consulting'],
        'construction': ['construction company', 'architecture firm', 'contractor'],
        'business': ['corporate website', 'business agency', 'professional services'],
        'legal': ['law firm', 'legal services', 'attorney'],
        'home services': ['cleaning service', 'plumbing company', 'landscaping service'],
        'agriculture': ['farm', 'agriculture company', 'organic farming'],
        'sustainability': ['green energy', 'eco-friendly', 'sustainable business'],
        'ngo': ['non-profit', 'charity', 'foundation'],
        'portfolio': ['designer portfolio', 'creative portfolio', 'personal website'],
        'digital agency': ['digital agency', 'creative agency', 'marketing agency'],
    };

    const queries = queryMap[industryLower] || [industryLower, `${industryLower} company`, `${industryLower} service`];
    return queries.map(q => `${q} website design`);
}

// 3-Tier Target System
const INDUSTRY_TIERS = {
    core: {
        target: 100,
        industries: ['Real Estate', 'Finance', 'Tech', 'Saas', 'Healthcare', 'Ecommerce', 'Fitness', 'Education']
    },
    secondary: {
        target: 50,
        industries: ['Food', 'Fashion', 'Construction', 'Furniture', 'Home Services', 'Digital Agency', 'Sustainability', 'Travel']
    },
    nicho: {
        target: 30,
        industries: ['Consulting', 'Business', 'Transportation', 'Beauty', 'Agriculture', 'Logistics']
    }
};

// Get target count for a specific industry
function getTargetForIndustry(industry: string): number {
    // Check each tier
    if (INDUSTRY_TIERS.core.industries.includes(industry)) {
        return INDUSTRY_TIERS.core.target;
    }
    if (INDUSTRY_TIERS.secondary.industries.includes(industry)) {
        return INDUSTRY_TIERS.secondary.target;
    }
    if (INDUSTRY_TIERS.nicho.industries.includes(industry)) {
        return INDUSTRY_TIERS.nicho.target;
    }
    // Default to secondary tier for unknown industries
    return INDUSTRY_TIERS.secondary.target;
}

// Get tier name for an industry
function getTierForIndustry(industry: string): 'core' | 'secondary' | 'nicho' {
    if (INDUSTRY_TIERS.core.industries.includes(industry)) return 'core';
    if (INDUSTRY_TIERS.secondary.industries.includes(industry)) return 'secondary';
    return 'nicho';
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

        // Count by industry (use AI's exact categorization)
        const industryCounts = new Map<string, number>();

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = (pin as any).id;
            const aiTags = await kv.get(`pin-tags:${pinId}`);

            if (aiTags && (aiTags as any).industry && Array.isArray((aiTags as any).industry) && (aiTags as any).industry.length > 0) {
                const industry = (aiTags as any).industry[0];
                // Normalize to lowercase for consistent counting
                const normalizedIndustry = industry.toLowerCase();
                industryCounts.set(normalizedIndustry, (industryCounts.get(normalizedIndustry) || 0) + 1);
            }
        }

        // LEVEL-BY-LEVEL PRIORITIZATION
        // Complete all Core industries first, then Secondary, then Nicho

        // 1. Check Core industries (Nivel 1)
        const coreIncomplete = INDUSTRY_TIERS.core.industries
            .map(industry => ({
                industry,
                count: industryCounts.get(industry.toLowerCase()) || 0,
                target: INDUSTRY_TIERS.core.target
            }))
            .filter(item => item.count < item.target)
            .sort((a, b) => b.count - a.count); // Highest count first - complete one at a time

        console.log('🔍 Core incomplete (sorted):', coreIncomplete.map(i => `${i.industry}:${i.count}`));

        // 2. Check Secondary industries (Nivel 2)
        const secondaryIncomplete = INDUSTRY_TIERS.secondary.industries
            .map(industry => ({
                industry,
                count: industryCounts.get(industry.toLowerCase()) || 0,
                target: INDUSTRY_TIERS.secondary.target
            }))
            .filter(item => item.count < item.target)
            .sort((a, b) => b.count - a.count); // Highest count first

        // 3. Check Nicho industries (Nivel 3)
        const nichoIncomplete = INDUSTRY_TIERS.nicho.industries
            .map(industry => ({
                industry,
                count: industryCounts.get(industry.toLowerCase()) || 0,
                target: INDUSTRY_TIERS.nicho.target
            }))
            .filter(item => item.count < item.target)
            .sort((a, b) => b.count - a.count); // Highest count first

        const totalPins = pinKeys.length;
        const targetPins = 1380; // 8×100 + 8×50 + 6×30 = 1380 pins
        const totalProgress = Math.round((totalPins / targetPins) * 100);

        // Determine current mission based on level priority
        let currentMission: { industry: string; count: number; target: number; tier: 'core' | 'secondary' | 'nicho' } | null = null;
        let nextMission: { industry: string; count: number; target: number } | null = null;

        if (coreIncomplete.length > 0) {
            // Work on Core first
            currentMission = { ...coreIncomplete[0], tier: 'core' };
            nextMission = coreIncomplete.length > 1 ? coreIncomplete[1] :
                (secondaryIncomplete.length > 0 ? secondaryIncomplete[0] :
                    (nichoIncomplete.length > 0 ? nichoIncomplete[0] : null));
        } else if (secondaryIncomplete.length > 0) {
            // Core complete, work on Secondary
            currentMission = { ...secondaryIncomplete[0], tier: 'secondary' };
            nextMission = secondaryIncomplete.length > 1 ? secondaryIncomplete[1] :
                (nichoIncomplete.length > 0 ? nichoIncomplete[0] : null);
        } else if (nichoIncomplete.length > 0) {
            // Core and Secondary complete, work on Nicho
            currentMission = { ...nichoIncomplete[0], tier: 'nicho' };
            nextMission = nichoIncomplete.length > 1 ? nichoIncomplete[1] : null;
        }

        // If all industries are balanced
        if (!currentMission) {
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

        const mission: CurationMission = {
            industry: currentMission.industry,
            currentCount: currentMission.count,
            targetCount: currentMission.target,
            progress: Math.round((currentMission.count / currentMission.target) * 100),
            queries: generateQueries(currentMission.industry),
            isComplete: false,
            nextIndustry: nextMission?.industry || undefined,
            totalProgress: {
                current: totalPins,
                target: targetPins,
                percentage: totalProgress
            },
            tier: currentMission.tier
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
