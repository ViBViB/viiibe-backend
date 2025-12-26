import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminKey, recategorizations } = req.body;

    // Validate admin key
    const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
    if (adminKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!Array.isArray(recategorizations)) {
        return res.status(400).json({ error: 'recategorizations must be an array' });
    }

    try {
        const results = [];

        for (const item of recategorizations) {
            const { pinId, newCategory } = item;

            if (!pinId || !newCategory) {
                results.push({ pinId, success: false, error: 'Missing pinId or newCategory' });
                continue;
            }

            // Get current tags
            const tags: any = await kv.get(`pin-tags:${pinId}`);

            if (!tags) {
                results.push({ pinId, success: false, error: 'Tags not found' });
                continue;
            }

            // Update industry
            await kv.set(`pin-tags:${pinId}`, { ...tags, industry: [newCategory] });

            results.push({ pinId, success: true, newCategory });
            console.log(`✅ Recategorized ${pinId} → ${newCategory}`);
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return res.json({
            success: true,
            total: recategorizations.length,
            successful,
            failed,
            results
        });

    } catch (error: any) {
        console.error('Recategorize error:', error);
        return res.status(500).json({ error: 'Recategorization failed', message: error.message });
    }
}
