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
        // Reset ALL versions of this user ID to FREE
        const variants = [
            userId.trim(),                    // Clean version
            userId.trim() + ' ',              // With trailing space
            '391237238395566146',             // Corrupted version
        ];

        const results = [];

        for (const id of variants) {
            const key = `user:${id}`;
            const existingData: any = await kv.get(key);

            if (existingData) {
                // Reset to FREE but keep download history
                const resetData = {
                    ...existingData,
                    is_pro: false,
                    is_pro_forced: false,
                    status: 'FREE',
                    downloads_count: 0, // Reset downloads too
                    reset_at: new Date().toISOString()
                };

                await kv.set(key, resetData);
                results.push({
                    key,
                    status: 'RESET TO FREE',
                    idLength: id.length
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: '✅ All user variants reset to FREE!',
            results,
            note: 'You can now test the payment flow again'
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
