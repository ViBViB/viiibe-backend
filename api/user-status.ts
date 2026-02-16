import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Reflect origin for Figma (origin 'null')
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { userId: rawUserId } = req.query;
    const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
        const userKey = `user:${userId}`;

        // Try to get fresh data by scanning all possible user keys
        const allUserKeys = await kv.keys('user:*');
        const matchingKeys = allUserKeys.filter(k => k.includes(userId));

        console.log(`🔍 Found ${matchingKeys.length} keys matching ${userId}:`, matchingKeys);

        // Get data from all matching keys and use the most recent one
        let userData: any = null;
        let mostRecentTimestamp = 0;

        for (const key of matchingKeys) {
            const data: any = await kv.get(key);
            if (data) {
                const timestamp = new Date(data.nuclear_reset_at || data.reset_at || data.first_seen || 0).getTime();
                if (timestamp > mostRecentTimestamp) {
                    mostRecentTimestamp = timestamp;
                    userData = data;
                }
            }
        }

        // If no data found, create default
        if (!userData) {
            console.log(`🆕 Creating default entry for: ${userKey}`);
            userData = {
                figma_id: userId,
                is_pro: false,
                downloads_count: 0,
                status: 'FREE',
                first_seen: new Date().toISOString()
            };
            await kv.set(userKey, userData);
        }

        // Set no-cache headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Use the data from the most recent entry
        const finalDownloadsCount = userData.downloads_count || 0;
        const finalIsPro = Boolean(userData.is_pro || userData.is_pro_forced);

        return res.status(200).json({
            success: true,
            isPro: finalIsPro,
            downloadsCount: finalDownloadsCount,
            raw_data: userData,
            debug: {
                key_used: userKey,
                id_length: userId.length,
                matching_keys_found: matchingKeys.length,
                is_pro_val: userData.is_pro,
                is_pro_forced: userData.is_pro_forced || false,
                status: userData.status,
                server_time: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('❌ User status API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
