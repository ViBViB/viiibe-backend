import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
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
        const { adminKey } = req.query;

        // Verify admin key
        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Use SCAN to count all pin keys efficiently
        // This avoids the "too many keys" error from KEYS command
        const keys: string[] = [];
        let cursor = 0;

        do {
            const result = await kv.scan(cursor, {
                match: 'saved-pin:*',
                count: 100
            });

            cursor = result[0];
            keys.push(...result[1]);
        } while (cursor !== 0);

        const count = keys.length;

        console.log(`📊 Total pins count: ${count}`);

        return res.status(200).json({
            success: true,
            count: count,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Error counting pins:', error);
        return res.status(500).json({
            error: 'Failed to count pins',
            message: error.message
        });
    }
}
