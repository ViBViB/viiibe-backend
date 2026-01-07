import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 Investigating Uncategorized pins...');

        // Get all saved pins
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

        // Categorize pins by their status
        const categorized = [];
        const uncategorizedWithTags = [];
        const noTags = [];
        const errors = [];

        for (const key of pinKeys) {
            try {
                const pin: any = await kv.get(key);
                if (!pin) {
                    errors.push({ key, reason: 'Pin data not found' });
                    continue;
                }

                const pinId = pin.id;
                const tags: any = await kv.get(`pin-tags:${pinId}`);

                if (!tags) {
                    // No tags at all
                    noTags.push({
                        pinId,
                        title: pin.title || 'Untitled',
                        imageUrl: pin.imageUrl,
                        category: pin.category || 'none'
                    });
                } else {
                    const industry = tags.industry?.[0];

                    if (!industry || industry === 'Uncategorized') {
                        // Has tags but industry is Uncategorized
                        uncategorizedWithTags.push({
                            pinId,
                            title: pin.title || 'Untitled',
                            imageUrl: pin.imageUrl,
                            category: pin.category || 'none',
                            tags: tags
                        });
                    } else {
                        categorized.push({
                            pinId,
                            industry
                        });
                    }
                }
            } catch (error: any) {
                errors.push({ key, reason: error.message });
            }
        }

        // Count by industry for categorized pins
        const industryCounts: Record<string, number> = {};
        categorized.forEach((pin: any) => {
            const ind = pin.industry.toLowerCase();
            industryCounts[ind] = (industryCounts[ind] || 0) + 1;
        });

        return res.status(200).json({
            summary: {
                total: pinKeys.length,
                categorized: categorized.length,
                uncategorizedWithTags: uncategorizedWithTags.length,
                noTags: noTags.length,
                errors: errors.length
            },
            uncategorizedWithTags,
            noTags: noTags.slice(0, 20), // First 20
            errors,
            industryCounts: Object.entries(industryCounts)
                .sort((a, b) => a[1] - b[1])
                .map(([industry, count]) => ({ industry, count }))
        });

    } catch (error: any) {
        console.error('Error investigating pins:', error);
        return res.status(500).json({
            error: 'Failed to investigate pins',
            message: error.message
        });
    }
}
