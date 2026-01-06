/**
 * UPDATE PIN COLOR
 * 
 * Endpoint to update a pin's color classification
 */

import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pinId, color, colors } = req.body;

        if (!pinId || (!color && !colors)) {
            return res.status(400).json({ error: 'Missing pinId or color/colors' });
        }

        // Support both single color and multiple colors
        const colorArray = colors || [color];

        // Validate colors
        const validColors = ['red', 'pink', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white', 'gray', 'beige'];
        const invalidColors = colorArray.filter((c: string) => !validColors.includes(c.toLowerCase()));

        if (invalidColors.length > 0) {
            return res.status(400).json({ error: `Invalid colors: ${invalidColors.join(', ')}` });
        }

        // Get current tags
        const tags = await kv.get(`pin-tags:${pinId}`) || {};

        // Update colors (store as array)
        const updatedTags = {
            ...tags,
            color: colorArray.map((c: string) => c.toLowerCase()),
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
