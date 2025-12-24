import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// NEW ENDPOINT - Fresh deployment, no cache issues
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
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
        // Get all pins
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

        // Count by industry (LOWERCASE normalized)
        const industryCounts = new Map<string, number>();

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = (pin as any).id;
            const aiTags = await kv.get(`pin-tags:${pinId}`);

            if (aiTags && (aiTags as any).industry && Array.isArray((aiTags as any).industry) && (aiTags as any).industry.length > 0) {
                const industry = (aiTags as any).industry[0];
                const normalized = industry.toLowerCase();
                industryCounts.set(normalized, (industryCounts.get(normalized) || 0) + 1);
            }
        }

        // Core industries with targets
        const CORE = [
            { name: 'Finance', target: 100 },
            { name: 'Fitness', target: 100 },
            { name: 'Ecommerce', target: 100 },
            { name: 'Tech', target: 100 },
            { name: 'Education', target: 100 },
            { name: 'Saas', target: 100 },
            { name: 'Healthcare', target: 100 }
        ];

        // Get incomplete, sort by HIGHEST count first
        const incomplete = CORE
            .map(item => ({
                industry: item.name,
                count: industryCounts.get(item.name.toLowerCase()) || 0,
                target: item.target
            }))
            .filter(item => item.count < item.target)
            .sort((a, b) => b.count - a.count); // DESCENDING

        if (incomplete.length === 0) {
            return res.json({
                isComplete: true,
                message: 'All Core industries complete!',
                totalPins: pinKeys.length
            });
        }

        const current = incomplete[0];
        const next = incomplete.length > 1 ? incomplete[1] : null;

        return res.json({
            industry: current.industry,
            currentCount: current.count,
            targetCount: current.target,
            progress: Math.round((current.count / current.target) * 100),
            nextIndustry: next?.industry || null,
            tier: 'core',
            isComplete: false,
            totalProgress: {
                current: pinKeys.length,
                target: 700, // 7 industries × 100
                percentage: Math.round((pinKeys.length / 700) * 100)
            }
        });

    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Failed to get mission',
            message: error.message
        });
    }
}
