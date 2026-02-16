import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);

    const { userId, secret } = req.query;

    if (secret !== 'viiibe-debug-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
        // Reset ALL variants of this user ID to FREE with 0 downloads
        const variants = [
            userId.trim(),                    // Clean version (17 chars)
            userId.trim() + ' ',              // With trailing space (18 chars)
            '391237238395566146',             // Corrupted version (18 chars)
        ];

        const results = [];

        for (const id of variants) {
            const key = `user:${id}`;

            // Create a fresh FREE account with 0 downloads
            const freshData = {
                figma_id: id,
                is_pro: false,
                is_pro_forced: false,
                downloads_count: 0,
                status: 'FREE',
                first_seen: new Date().toISOString(),
                reset_at: new Date().toISOString()
            };

            await kv.set(key, freshData);
            results.push({
                key,
                status: 'RESET TO FRESH FREE',
                idLength: id.length,
                downloads: 0
            });
        }

        return res.status(200).json({
            success: true,
            message: '✅ Complete reset! User is now FREE with 0/3 downloads used.',
            results,
            instructions: [
                '1. Close and reopen the Figma plugin',
                '2. You should see "3/3 remaining" for free downloads',
                '3. After 3 downloads, you\'ll be prompted to upgrade',
                '4. Complete payment to unlock PRO'
            ]
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
