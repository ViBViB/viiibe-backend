import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);

    const { secret } = req.query;

    if (secret !== 'viiibe-debug-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Nuclear option: Delete ALL user entries and recreate them as fresh FREE accounts
        const allUserKeys = await kv.keys('user:*');

        const results = [];

        for (const key of allUserKeys) {
            // Delete the old entry
            await kv.del(key);

            // Extract userId from key
            const userId = key.replace('user:', '');

            // Create fresh FREE account
            const freshData = {
                figma_id: userId,
                is_pro: false,
                is_pro_forced: false,
                downloads_count: 0,
                status: 'FREE',
                first_seen: new Date().toISOString(),
                nuclear_reset_at: new Date().toISOString()
            };

            await kv.set(key, freshData);

            results.push({
                key,
                action: 'DELETED_AND_RECREATED',
                idLength: userId.length
            });
        }

        return res.status(200).json({
            success: true,
            message: '💥 NUCLEAR RESET COMPLETE! All users deleted and recreated as FREE.',
            totalUsersReset: results.length,
            results
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
