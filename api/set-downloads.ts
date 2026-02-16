import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { userId, downloads, secret } = req.query;

    // Validate secret
    if (secret !== 'viiibe-debug-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
    }

    const downloadsCount = parseInt(downloads as string, 10);
    if (isNaN(downloadsCount) || downloadsCount < 0 || downloadsCount > 3) {
        return res.status(400).json({ error: 'downloads must be between 0 and 3' });
    }

    try {
        const cleanUserId = userId.trim();
        const userKey = `user:${cleanUserId}`;

        // Get current user data
        const currentData = await kv.get(userKey) as any;

        // Update with new download count
        const userData = {
            ...(currentData || {}),
            figma_id: cleanUserId,
            downloads_count: downloadsCount,
            is_pro: false,
            last_updated: new Date().toISOString()
        };

        await kv.set(userKey, userData);

        return res.status(200).json({
            success: true,
            message: `✅ Downloads set to ${downloadsCount}/3`,
            userId: cleanUserId,
            downloads: downloadsCount
        });
    } catch (error: any) {
        console.error('Error setting downloads:', error);
        return res.status(500).json({
            error: 'Failed to set downloads',
            details: error.message
        });
    }
}
