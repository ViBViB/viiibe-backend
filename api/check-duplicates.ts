import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Check Duplicates API
 * Checks if pin IDs already exist in database
 * Used by Chrome extension to filter out duplicates during scanning
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pinIds } = req.body;

        if (!pinIds || !Array.isArray(pinIds)) {
            return res.status(400).json({
                error: 'pinIds array required',
                example: { pinIds: ['123', '456', '789'] }
            });
        }

        console.log(`Checking ${pinIds.length} pins for duplicates...`);

        // Check each pin ID in database
        const duplicates: Record<string, boolean> = {};

        for (const pinId of pinIds) {
            const exists = await kv.exists(`saved-pin:${pinId}`);
            duplicates[pinId] = exists === 1;
        }

        const duplicateCount = Object.values(duplicates).filter(d => d).length;
        console.log(`Found ${duplicateCount} duplicates out of ${pinIds.length} pins`);

        return res.status(200).json({
            duplicates,
            summary: {
                total: pinIds.length,
                duplicates: duplicateCount,
                new: pinIds.length - duplicateCount
            }
        });

    } catch (error: any) {
        console.error('Error checking duplicates:', error);
        return res.status(500).json({
            error: 'Failed to check duplicates',
            message: error.message
        });
    }
}
