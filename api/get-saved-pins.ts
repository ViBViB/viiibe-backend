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
        const { category, pinId, color } = req.query;

        // If pinId is provided, get specific pin
        if (pinId && typeof pinId === 'string') {
            const pin: any = await kv.get(`saved-pin:${pinId}`);
            if (!pin) {
                return res.status(404).json({ error: 'Pin not found' });
            }

            // Fetch AI analysis tags from separate key
            const tags = await kv.get(`pin-tags:${pinId}`);
            if (tags) {
                pin.aiAnalysis = tags;
            }

            return res.status(200).json({ pin });
        }

        // If category is provided, get pins from that category
        if (category && typeof category === 'string') {
            const pinIds = await kv.smembers(`category:${category}`);
            const pins = [];

            for (const id of pinIds) {
                const pin: any = await kv.get(`saved-pin:${id}`);
                if (pin) {
                    // Fetch AI analysis tags
                    const tags = await kv.get(`pin-tags:${id}`);
                    if (tags) {
                        pin.aiAnalysis = tags;
                    }
                    pins.push(pin);
                }
            }

            return res.status(200).json({
                category,
                count: pins.length,
                pins
            });
        }


        // Get all saved pins with optional limit
        const keys = await kv.keys('saved-pin:*');
        const totalPins = keys.length; // Actual count in KV

        // Parse limit from query params (default 500, max 500)
        const limitParam = req.query.limit;
        const limit = limitParam ? Math.min(parseInt(limitParam as string, 10), 500) : 500;

        let pins = [];

        for (const key of keys.slice(0, limit)) {
            const pin: any = await kv.get(key);
            if (pin) {
                // Extract pin ID from key (saved-pin:123456)
                const pinId = key.toString().replace('saved-pin:', '');

                // Fetch AI analysis tags from separate key
                const tags = await kv.get(`pin-tags:${pinId}`);
                if (tags) {
                    pin.aiAnalysis = tags;
                }

                pins.push(pin);
            }
        }

        // If color filter is provided, filter by dominant color
        if (color && typeof color === 'string') {
            const colorLower = color.toLowerCase();
            pins = pins.filter((pin: any) => {
                // Check if pin has AI analysis with color tags
                if (pin.aiAnalysis && pin.aiAnalysis.color) {
                    // Check if any of the color tags match
                    return pin.aiAnalysis.color.some((c: string) =>
                        c.toLowerCase() === colorLower
                    );
                }
                return false;
            });
        }

        return res.status(200).json({
            total: totalPins, // Total pins in KV
            returned: pins.length, // Pins actually returned
            limit,
            ...(color && { filteredBy: `color: ${color}` }),
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
