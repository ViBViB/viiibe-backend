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
        // Get first 10 pin IDs
        const pinKeys = await kv.keys('saved-pin:*');
        const first10 = pinKeys.slice(0, 10);

        const results = [];

        for (const key of first10) {
            const pinId = key.toString().replace('saved-pin:', '');
            const pin: any = await kv.get(key);
            const tags = await kv.get(`pin-tags:${pinId}`);

            results.push({
                pinId,
                hasPin: !!pin,
                hasTags: !!tags,
                title: pin?.title || 'N/A',
                tags: tags || null
            });
        }

        return res.status(200).json({
            totalPinKeys: pinKeys.length,
            sample: results
        });

    } catch (error: any) {
        console.error('❌ Debug error:', error);
        return res.status(500).json({
            error: 'Failed to debug',
            message: error.message
        });
    }
}
