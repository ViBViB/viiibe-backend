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

    try {
        const results = [];

        // Version 1: Trimmed (17 chars)
        const cleanId = userId.trim();
        const key1 = `user:${cleanId}`;
        const userData1 = {
            figma_id: cleanId,
            is_pro: true,
            is_pro_forced: true,
            downloads_count: 3,
            first_seen: new Date().toISOString(),
            forced_at: new Date().toISOString(),
            status: 'PRO_FORCED'
        };
        await kv.set(key1, userData1);
        results.push({ key: key1, length: cleanId.length, status: 'FORCED PRO' });

        // Version 2: With trailing space (18 chars) - the one Figma is using
        const paddedId = cleanId + ' ';
        const key2 = `user:${paddedId}`;
        const userData2 = {
            figma_id: paddedId,
            is_pro: true,
            is_pro_forced: true,
            downloads_count: 3,
            first_seen: new Date().toISOString(),
            forced_at: new Date().toISOString(),
            status: 'PRO_FORCED'
        };
        await kv.set(key2, userData2);
        results.push({ key: key2, length: paddedId.length, status: 'FORCED PRO' });

        return res.status(200).json({
            success: true,
            message: '✅ PRO status forced on BOTH ID versions!',
            results
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
