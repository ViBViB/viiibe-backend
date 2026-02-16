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
        return res.status(400).json({ error: 'Missing userId' });
    }

    const cleanUserId = userId.trim();

    try {
        const userKey = `user:${cleanUserId}`;

        // FORCED ACTIVATION MODE
        if (req.query.force === 'true') {
            const userData = {
                figma_id: cleanUserId,
                is_pro: true,
                is_pro_forced: true,
                downloads_count: 3,
                first_seen: new Date().toISOString(),
                forced_at: new Date().toISOString(),
                status: 'PRO_FORCED'
            };
            await kv.set(userKey, userData);
            return res.status(200).json({
                success: true,
                message: '✅ PRO status forced successfully!',
                userId: cleanUserId,
                data: userData
            });
        }

        const userData = await kv.get(userKey);
        const allKeys = await kv.keys('user:*');

        return res.status(200).json({
            exists: !!userData,
            targetKey: userKey,
            data: userData,
            databaseOverview: {
                totalUsers: allKeys.length,
                allKeys: allKeys
            },
            envChecks: {
                has_kv: !!process.env.KV_REST_API_URL,
                has_stripe: !!process.env.STRIPE_SECRET_KEY
            }
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
