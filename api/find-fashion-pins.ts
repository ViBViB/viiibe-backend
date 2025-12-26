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
        console.log('🔍 Searching for misclassified fashion pins...');

        // Scan all pins
        const pinKeys: string[] = [];
        let cursor = 0;

        do {
            const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
            cursor = result[0];
            pinKeys.push(...result[1]);
        } while (cursor !== 0);

        console.log(`📊 Scanning ${pinKeys.length} pins...`);

        const fashionKeywords = [
            'fashion', 'clothing', 'apparel', 'boutique', 'style', 'outfit',
            'wardrobe', 'designer', 'luxury fashion', 'streetwear', 'lookbook',
            'fashion brand', 'fashion store', 'fashion shop', 'fashion ecommerce',
            'fashion blog', 'fashion magazine', 'fashion catalog', 'fashion collection',
            'dress', 'shoes', 'accessories', 'handbag', 'jewelry', 'cosmetics'
        ];

        const misclassified = [];

        for (const key of pinKeys) {
            const pin: any = await kv.get(key);
            if (!pin) continue;

            const pinId = pin.id;
            const tags: any = await kv.get(`pin-tags:${pinId}`);

            if (!tags || !tags.industry) continue;

            const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
            const isFashion = industries.some((i: string) => i.toLowerCase() === 'fashion');

            // Skip if already in Fashion
            if (isFashion) continue;

            const title = (pin.title || '').toLowerCase();
            const description = (pin.description || '').toLowerCase();

            // Check if has fashion keywords
            const hasFashionKeyword = fashionKeywords.some(keyword =>
                title.includes(keyword) || description.includes(keyword)
            );

            if (hasFashionKeyword) {
                misclassified.push({
                    pinId,
                    title: pin.title,
                    currentIndustry: industries,
                    url: pin.pinterestUrl,
                    savedAt: pin.savedAt || 0,
                    matchedKeywords: fashionKeywords.filter(k =>
                        title.includes(k) || description.includes(k)
                    )
                });
            }
        }

        // Sort by savedAt (most recent first)
        misclassified.sort((a, b) => b.savedAt - a.savedAt);

        return res.json({
            success: true,
            found: misclassified.length,
            pins: misclassified.map(p => ({
                pinId: p.pinId,
                title: p.title,
                currentIndustry: p.currentIndustry,
                url: p.url,
                keywords: p.matchedKeywords
            }))
        });

    } catch (error: any) {
        console.error('Search error:', error);
        return res.status(500).json({ error: 'Failed', message: error.message });
    }
}
