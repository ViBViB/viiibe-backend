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

    try {
        console.log('🔍 Searching for Home Services pins...');

        // Scan all pins
        const pinKeys: string[] = [];
        let cursor = 0;

        do {
            const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
            cursor = result[0];
            pinKeys.push(...result[1]);
        } while (cursor !== 0);

        console.log(`📊 Scanning ${pinKeys.length} pins...`);

        const homeServicesPins = [];
        const miscategorized = [];

        for (const key of pinKeys) {
            const pin: any = await kv.get(key);
            if (!pin) continue;

            const pinId = pin.id;
            const tags: any = await kv.get(`pin-tags:${pinId}`);

            if (!tags || !tags.industry) continue;

            const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
            const title = (pin.title || '').toLowerCase();
            const description = (pin.description || '').toLowerCase();

            // Keywords that indicate Home Services
            const homeKeywords = [
                'home', 'house', 'interior', 'furniture', 'decor', 'renovation',
                'cleaning', 'plumbing', 'electrical', 'hvac', 'landscaping',
                'painting', 'roofing', 'flooring', 'kitchen', 'bathroom'
            ];

            const hasHomeKeyword = homeKeywords.some(keyword =>
                title.includes(keyword) || description.includes(keyword)
            );

            const isHomeServices = industries.some((i: string) =>
                i.toLowerCase() === 'home services' || i.toLowerCase() === 'home'
            );

            if (isHomeServices) {
                homeServicesPins.push({
                    pinId,
                    title: pin.title,
                    industry: industries,
                    url: pin.pinterestUrl
                });
            } else if (hasHomeKeyword) {
                // Has home keywords but NOT categorized as Home Services
                miscategorized.push({
                    pinId,
                    title: pin.title,
                    currentIndustry: industries,
                    url: pin.pinterestUrl,
                    matchedKeywords: homeKeywords.filter(k =>
                        title.includes(k) || description.includes(k)
                    )
                });
            }
        }

        return res.json({
            success: true,
            summary: {
                totalPins: pinKeys.length,
                correctlyTagged: homeServicesPins.length,
                potentiallyMiscategorized: miscategorized.length
            },
            correctlyTagged: homeServicesPins,
            miscategorized: miscategorized.slice(0, 50) // Limit to first 50
        });

    } catch (error: any) {
        console.error('Search error:', error);
        return res.status(500).json({ error: 'Search failed', message: error.message });
    }
}
