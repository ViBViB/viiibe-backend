import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface SavedPin {
    id: string;
    title: string;
    description: string;
    pinterestUrl: string;
    imageUrl?: string;  // Image URL for AI analysis
    tags: string[];
    category: string;
    quality: 'premium' | 'standard';
    addedDate: string;
    addedBy: string;
    source: 'pinterest';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pinId, title, description, pinterestUrl, imageUrl, tags, category, quality, adminKey } = req.body;

        // Validate admin key
        const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
        if (adminKey !== ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate required fields
        if (!pinId || !pinterestUrl) {
            return res.status(400).json({
                error: 'Missing required fields: pinId, pinterestUrl'
            });
        }

        console.log(`💾 Saving pin: ${pinId} - ${title}`);

        // Check if pin already exists
        const existingPin = await kv.get(`saved-pin:${pinId}`);
        if (existingPin) {
            console.log(`ℹ️  Pin ${pinId} already exists, skipping save`);
            return res.status(200).json({
                success: true,
                pin: existingPin,
                message: 'Pin already saved',
                duplicate: true
            });
        }

        // Create pin object
        const pin: SavedPin = {
            id: pinId,
            title: title || 'Untitled Pin',
            description: description || '',
            pinterestUrl,
            imageUrl: imageUrl || undefined,  // Store image URL if provided
            tags: tags || [],
            category: category || 'uncategorized',
            quality: quality || 'standard',
            addedDate: new Date().toISOString(),
            addedBy: 'extension',
            source: 'pinterest'
        };

        // Save to Vercel KV
        await kv.set(`saved-pin:${pinId}`, pin);

        // Also add to category index for faster queries
        const categoryKey = `category:${category}`;
        await kv.sadd(categoryKey, pinId);

        console.log(`✅ Pin saved: ${pinId} in category ${category}`);

        return res.status(201).json({
            success: true,
            pin,
            message: 'Pin saved successfully'
        });

    } catch (error: any) {
        console.error('❌ Save pin error:', error);
        return res.status(500).json({
            error: 'Failed to save pin',
            message: error.message
        });
    }
}
