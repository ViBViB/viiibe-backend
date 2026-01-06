/**
 * UPDATE PIN COLOR
 * 
 * Endpoint to update a pin's color classification
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pinId, color } = req.body;

        if (!pinId || !color) {
            return res.status(400).json({ error: 'Missing pinId or color' });
        }

        // Validate color
        const validColors = ['red', 'pink', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white', 'gray', 'beige'];
        if (!validColors.includes(color.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid color' });
        }

        // Get current tags
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (!tags) {
            return res.status(404).json({ error: 'Pin not found' });
        }

        // Update color (keep as array for consistency)
        const updatedTags = {
            ...tags,
            color: [color.toLowerCase()],
            manuallyReviewed: true,
            reviewedAt: new Date().toISOString()
        };

        // Save updated tags
        await kv.set(`pin-tags:${pinId}`, updatedTags);

        return res.status(200).json({
            success: true,
            pinId,
            color: color.toLowerCase()
        });

    } catch (error) {
        console.error('Error updating pin color:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
