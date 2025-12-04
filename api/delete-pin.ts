import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pinId, adminKey } = req.body;

        // Validate admin key
        const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
        if (adminKey !== ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate required fields
        if (!pinId) {
            return res.status(400).json({
                error: 'Missing required field: pinId'
            });
        }

        console.log(`🗑️  Deleting pin: ${pinId}`);

        // Delete pin from KV
        await kv.del(`saved-pin:${pinId}`);

        // Also delete associated tags if they exist
        await kv.del(`pin-tags:${pinId}`);

        console.log(`✅ Pin deleted: ${pinId}`);

        return res.status(200).json({
            success: true,
            pinId,
            message: 'Pin deleted successfully'
        });

    } catch (error: any) {
        console.error('❌ Delete pin error:', error);
        return res.status(500).json({
            error: 'Failed to delete pin',
            message: error.message
        });
    }
}
