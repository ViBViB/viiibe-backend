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
        const { category, pinId } = req.query;

        // If pinId is provided, get specific pin
        if (pinId && typeof pinId === 'string') {
            const pin = await kv.get(`saved-pin:${pinId}`);
            if (!pin) {
                return res.status(404).json({ error: 'Pin not found' });
            }
            return res.status(200).json({ pin });
        }

        // If category is provided, get pins from that category
        if (category && typeof category === 'string') {
            const pinIds = await kv.smembers(`category:${category}`);
            const pins = [];

            for (const id of pinIds) {
                const pin = await kv.get(`saved-pin:${id}`);
                if (pin) pins.push(pin);
            }

            return res.status(200).json({
                category,
                count: pins.length,
                pins
            });
        }

        // Get all saved pins (limit to 100)
        const keys = await kv.keys('saved-pin:*');
        const pins = [];

        for (const key of keys.slice(0, 200)) {
            const pin = await kv.get(key);
            if (pin) pins.push(pin);
        }

        return res.status(200).json({
            total: pins.length,
            pins
        });

    } catch (error: any) {
        console.error('❌ Get pins error:', error);
        return res.status(500).json({
            error: 'Failed to get pins',
            message: error.message
        });
    }
}
