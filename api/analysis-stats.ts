import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

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
        // Get all saved pins
        const keys = await kv.keys('saved-pin:*');
        const total = keys.length;

        let analyzed = 0;
        let failed = 0;
        const failedPins: Array<{ id: string; reason: string }> = [];

        // Check each pin for AI analysis
        for (const key of keys) {
            const pin: any = await kv.get(key);
            if (!pin) continue;

            const pinId = key.toString().replace('saved-pin:', '');
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (tags && Object.keys(tags).length > 0) {
                analyzed++;
            } else {
                failed++;
                const reason = !pin.imageUrl ? 'No image URL' : 'Analysis pending';
                failedPins.push({ id: pinId, reason });
            }
        }

        return res.status(200).json({
            total,
            analyzed,
            pending: 0, // For now, we don't track pending analyses
            failed,
            failedPins: failedPins.slice(0, 10), // Limit to 10 for performance
            percentage: total > 0 ? Math.round((analyzed / total) * 100) : 0
        });

    } catch (error: any) {
        console.error('❌ Analysis stats error:', error);
        return res.status(500).json({
            error: 'Failed to get analysis stats',
            message: error.message
        });
    }
}
