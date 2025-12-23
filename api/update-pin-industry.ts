import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Update industry tag for a pin
 * Keeps all other AI analysis intact
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pinId, industry } = req.body;

        if (!pinId || !industry) {
            return res.status(400).json({ error: 'Missing pinId or industry' });
        }

        // Get existing tags
        const existingTags = await kv.get(`pin-tags:${pinId}`);

        if (!existingTags) {
            return res.status(404).json({ error: 'Pin tags not found' });
        }

        // Update only the industry field
        const updatedTags = {
            ...existingTags,
            industry: [industry] // Keep as array for consistency
        };

        // Save updated tags
        await kv.set(`pin-tags:${pinId}`, updatedTags);

        res.status(200).json({
            success: true,
            pinId,
            newIndustry: industry
        });

    } catch (error: any) {
        console.error('Error updating pin industry:', error);
        res.status(500).json({ error: error.message });
    }
}
