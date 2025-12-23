import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Get pins that need re-categorization
 * Returns pins with their current tags for manual review
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { offset = '0', limit = '1' } = req.query;
        const offsetNum = parseInt(offset as string);
        const limitNum = parseInt(limit as string);

        // Get all saved pins
        const pinKeys = await kv.keys('saved-pin:*');

        // Get pins with their tags
        const pinsWithTags = [];

        for (let i = offsetNum; i < Math.min(offsetNum + limitNum, pinKeys.length); i++) {
            const key = pinKeys[i];
            const pin = await kv.get(key);

            if (!pin) continue;

            const pinId = (pin as any).id;
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (tags) {
                pinsWithTags.push({
                    pinId,
                    imageUrl: (pin as any).imageUrl,
                    title: (pin as any).title || 'Untitled',
                    currentIndustry: (tags as any).industry?.[0] || 'Unknown',
                    allTags: tags
                });
            }
        }

        res.status(200).json({
            pins: pinsWithTags,
            total: pinKeys.length,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < pinKeys.length
        });

    } catch (error: any) {
        console.error('Error fetching pins:', error);
        res.status(500).json({ error: error.message });
    }
}
