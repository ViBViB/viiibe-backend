import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const limit = parseInt(req.query.limit as string) || 50;

    try {
        console.log(`🔍 Getting last ${limit} pins...`);

        // Scan all pins
        const pinKeys: string[] = [];
        let cursor = 0;

        do {
            const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
            cursor = result[0];
            pinKeys.push(...result[1]);
        } while (cursor !== 0);

        console.log(`📊 Found ${pinKeys.length} total pins`);

        // Get all pins with timestamps
        const pinsWithData = [];

        for (const key of pinKeys) {
            const pin: any = await kv.get(key);
            if (!pin) continue;

            const pinId = pin.id;
            const tags: any = await kv.get(`pin-tags:${pinId}`);

            pinsWithData.push({
                pinId,
                title: pin.title || 'No title',
                url: pin.pinterestUrl,
                savedAt: pin.savedAt || pin.createdAt || 0,
                industry: tags?.industry || ['uncategorized']
            });
        }

        // Sort by savedAt (most recent first)
        pinsWithData.sort((a, b) => b.savedAt - a.savedAt);

        // Take last N pins
        const recentPins = pinsWithData.slice(0, limit);

        // Group by industry
        const byIndustry: Record<string, number> = {};
        recentPins.forEach(pin => {
            const industries = Array.isArray(pin.industry) ? pin.industry : [pin.industry];
            industries.forEach(ind => {
                byIndustry[ind] = (byIndustry[ind] || 0) + 1;
            });
        });

        return res.json({
            success: true,
            total: pinKeys.length,
            recent: recentPins.length,
            pins: recentPins.map(p => ({
                title: p.title,
                industry: p.industry,
                url: p.url,
                savedAt: new Date(p.savedAt).toISOString()
            })),
            summary: byIndustry
        });

    } catch (error: any) {
        console.error('Recent pins error:', error);
        return res.status(500).json({ error: 'Failed', message: error.message });
    }
}
