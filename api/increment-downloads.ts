import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Reflect origin for Figma (origin 'null')
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId in request body' });
    }

    try {
        // Find ALL keys that match this userId (handles variants with/without spaces)
        const allUserKeys = await kv.keys('user:*');
        const matchingKeys = allUserKeys.filter(k => k.includes(userId.trim()));

        console.log(`📊 Incrementing downloads for ${matchingKeys.length} matching keys`);

        let finalCount = 0;

        // Increment ALL matching keys to keep them in sync
        for (const key of matchingKeys) {
            let userData: any = await kv.get(key);

            if (!userData) {
                const extractedId = key.replace('user:', '');
                userData = {
                    figma_id: extractedId,
                    is_pro: false,
                    downloads_count: 0,
                    first_seen: new Date().toISOString()
                };
            }

            // Increment the count
            userData.downloads_count = (userData.downloads_count || 0) + 1;
            userData.last_download = new Date().toISOString();

            await kv.set(key, userData);

            finalCount = userData.downloads_count;
            console.log(`✅ Incremented ${key} to ${finalCount}`);
        }

        return res.status(200).json({
            success: true,
            downloadsCount: finalCount,
            keysUpdated: matchingKeys.length
        });

    } catch (error: any) {
        console.error('❌ Increment downloads API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
