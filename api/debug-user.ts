import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
        const userKey = `user:${userId}`;

        // Get all keys that might match this user
        const allKeys = await kv.keys('user:*');
        const matchingKeys = allKeys.filter(k => k.includes(userId));

        // Get data for all matching keys
        const keyData: any = {};
        for (const key of matchingKeys) {
            keyData[key] = await kv.get(key);
        }

        // Get the specific user key
        const userData = await kv.get(userKey);

        return res.status(200).json({
            success: true,
            userId: userId,
            userKey: userKey,
            userData: userData,
            matchingKeys: matchingKeys,
            allMatchingData: keyData,
            totalUsers: allKeys.length
        });
    } catch (error: any) {
        console.error('❌ Debug error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
