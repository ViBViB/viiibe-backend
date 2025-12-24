import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Simple endpoint to get industry counts
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

    try {
        // Scan all pins
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

        // Count by industry (lowercase)
        const counts: Record<string, number> = {};

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = (pin as any).id;
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (tags && (tags as any).industry && Array.isArray((tags as any).industry)) {
                const industry = (tags as any).industry[0];
                // Capitalize first letter for consistency with extension
                const normalized = industry.charAt(0).toUpperCase() + industry.slice(1).toLowerCase();
                counts[normalized] = (counts[normalized] || 0) + 1;
            }
        }

        return res.json({ counts, total: pinKeys.length });

    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed', message: error.message });
    }
}
