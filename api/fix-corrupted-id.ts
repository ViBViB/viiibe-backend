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
        // Force PRO on the corrupted ID that Figma is actually sending
        const corruptedId = '391237238395566146';
        const key = `user:${corruptedId}`;

        const userData = {
            figma_id: corruptedId,
            is_pro: true,
            is_pro_forced: true,
            downloads_count: 3,
            first_seen: new Date().toISOString(),
            forced_at: new Date().toISOString(),
            status: 'PRO_FORCED',
            note: 'Corrupted ID from Figma - missing first 3'
        };

        await kv.set(key, userData);

        return res.status(200).json({
            success: true,
            message: '✅ PRO forced on corrupted ID!',
            key,
            data: userData
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
