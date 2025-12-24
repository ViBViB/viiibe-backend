import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

        // Count by exact and lowercase
        const exactCounts = new Map<string, number>();
        const lowercaseCounts = new Map<string, number>();

        for (const key of pinKeys) {
            const pin = await kv.get(key);
            if (!pin) continue;

            const pinId = (pin as any).id;
            const tags = await kv.get(`pin-tags:${pinId}`);

            if (tags && (tags as any).industry && Array.isArray((tags as any).industry)) {
                const industry = (tags as any).industry[0];
                exactCounts.set(industry, (exactCounts.get(industry) || 0) + 1);

                const lower = industry.toLowerCase();
                lowercaseCounts.set(lower, (lowercaseCounts.get(lower) || 0) + 1);
            }
        }

        res.status(200).json({
            totalPins: pinKeys.length,
            ecommerce: {
                capitalized: exactCounts.get('Ecommerce') || 0,
                lowercase: exactCounts.get('ecommerce') || 0,
                normalized: lowercaseCounts.get('ecommerce') || 0
            },
            healthcare: {
                capitalized: exactCounts.get('Healthcare') || 0,
                lowercase: exactCounts.get('healthcare') || 0,
                normalized: lowercaseCounts.get('healthcare') || 0
            },
            allExact: Object.fromEntries(Array.from(exactCounts.entries()).sort((a, b) => b[1] - a[1])),
            allNormalized: Object.fromEntries(Array.from(lowercaseCounts.entries()).sort((a, b) => b[1] - a[1]))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
