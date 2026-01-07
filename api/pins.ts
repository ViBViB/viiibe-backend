import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

/**
 * Unified Pins API Endpoint
 * Consolidates get-saved-pins, get-pins-for-recategorization, and get-pins-count
 * 
 * Routes:
 * - GET /api/pins?action=count&adminKey=XXX - Count total pins
 * - GET /api/pins?action=recategorize&offset=0&limit=1 - Get pins for recategorization
 * - GET /api/pins - Get all saved pins (default)
 * - GET /api/pins?category=X - Filter by category
 * - GET /api/pins?color=X - Filter by color
 * - GET /api/pins?pinId=X - Get specific pin
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action } = req.query;

        // Route 1: Count pins
        if (action === 'count') {
            return await handleCount(req, res);
        }

        // Route 2: Get pins for recategorization
        if (action === 'recategorize') {
            return await handleRecategorize(req, res);
        }

        // Route 3: Get saved pins (default)
        return await handleGetSavedPins(req, res);

    } catch (error: any) {
        console.error('❌ Pins API error:', error);
        return res.status(500).json({
            error: 'Failed to process request',
            message: error.message
        });
    }
}

/**
 * Handle pin count request
 * Requires adminKey for authentication
 */
async function handleCount(req: VercelRequest, res: VercelResponse) {
    const { adminKey } = req.query;

    // Verify admin key
    if (!adminKey || adminKey !== process.env.CURATOR_ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Use SCAN to count all pin keys efficiently
    const keys: string[] = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        keys.push(...result[1]);
    } while (cursor !== 0);

    const count = keys.length;

    console.log(`📊 Total pins count: ${count}`);

    return res.status(200).json({
        success: true,
        count: count,
        timestamp: new Date().toISOString()
    });
}

/**
 * Handle recategorization request
 * Returns pins that need COLOR curation (not industry categorization)
 * Excludes pins that have been AI-analyzed OR manually reviewed for colors
 */
async function handleRecategorize(req: VercelRequest, res: VercelResponse) {
    const { offset = '0', limit = '1' } = req.query;
    const offsetNum = parseInt(offset as string);
    const limitNum = parseInt(limit as string);

    // Get all saved pins using SCAN
    const pinKeys: string[] = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });
        cursor = result[0];
        pinKeys.push(...result[1]);
    } while (cursor !== 0);

    // IMPORTANT: Sort keys to ensure consistent ordering across requests
    pinKeys.sort();

    // Filter to get pins that need color curation
    const pinsNeedingColorCuration = [];

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = (pin as any).id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        // Exclude pins that have been AI-analyzed OR manually reviewed for colors
        const aiAnalyzed = tags ? ((tags as any).aiAnalyzed || false) : false;
        const manuallyReviewed = tags ? ((tags as any).manuallyReviewed || false) : false;

        // Include pins that haven't been processed for colors yet
        if (!aiAnalyzed && !manuallyReviewed) {
            pinsNeedingColorCuration.push({
                pinId,
                imageUrl: (pin as any).imageUrl,
                title: (pin as any).title || 'Untitled',
                aiAnalysis: tags || {}
            });
        }
    }

    // Apply pagination to filtered results
    const paginatedPins = pinsNeedingColorCuration.slice(offsetNum, offsetNum + limitNum);

    return res.status(200).json({
        pins: paginatedPins,
        total: pinsNeedingColorCuration.length,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < pinsNeedingColorCuration.length
    });
}

/**
 * Handle get saved pins request
 * Supports filtering by pinId, category, color, and limit
 */
async function handleGetSavedPins(req: VercelRequest, res: VercelResponse) {
    const { category, pinId, color } = req.query;

    // If pinId is provided, get specific pin
    if (pinId && typeof pinId === 'string') {
        const pin: any = await kv.get(`saved-pin:${pinId}`);
        if (!pin) {
            return res.status(404).json({ error: 'Pin not found' });
        }

        // Fetch AI analysis tags from separate key
        const tags = await kv.get(`pin-tags:${pinId}`);
        if (tags) {
            pin.aiAnalysis = tags;
        }

        return res.status(200).json({ pin });
    }

    // If category is provided, get pins from that category
    if (category && typeof category === 'string') {
        const pinIds = await kv.smembers(`category:${category}`);
        const pins = [];

        for (const id of pinIds) {
            const pin: any = await kv.get(`saved-pin:${id}`);
            if (pin) {
                // Fetch AI analysis tags
                const tags = await kv.get(`pin-tags:${id}`);
                if (tags) {
                    pin.aiAnalysis = tags;
                }
                pins.push(pin);
            }
        }

        return res.status(200).json({
            category,
            count: pins.length,
            pins
        });
    }

    // Get all saved pins with optional limit
    // Use SCAN instead of KEYS to avoid "too many keys" error
    const allKeys: string[] = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, {
            match: 'saved-pin:*',
            count: 100
        });

        cursor = result[0];
        allKeys.push(...result[1]);
    } while (cursor !== 0);

    const totalPins = allKeys.length; // Actual count in KV

    // Parse limit from query params (default 2000, max 2000)
    const limitParam = req.query.limit;
    const limit = limitParam ? Math.min(parseInt(limitParam as string, 10), 2000) : 2000;

    // Only fetch the pins we need (up to limit)
    const keysToFetch = allKeys.slice(0, limit);
    let pins = [];

    for (const key of keysToFetch) {
        const pin: any = await kv.get(key);
        if (pin) {
            // Extract pin ID from key (saved-pin:123456)
            const pinId = key.toString().replace('saved-pin:', '');

            // Fetch AI analysis tags from separate key
            const tags = await kv.get(`pin-tags:${pinId}`);
            if (tags) {
                pin.aiAnalysis = tags;
            }

            pins.push(pin);
        }
    }

    // If color filter is provided, filter by dominant color
    if (color && typeof color === 'string') {
        const colorLower = color.toLowerCase();
        pins = pins.filter((pin: any) => {
            // Check if pin has AI analysis with color tags
            if (pin.aiAnalysis && pin.aiAnalysis.color) {
                // Check if any of the color tags match
                return pin.aiAnalysis.color.some((c: string) =>
                    c.toLowerCase() === colorLower
                );
            }
            return false;
        });
    }

    return res.status(200).json({
        total: totalPins, // Total pins in KV
        returned: pins.length, // Pins actually returned
        limit,
        ...(color && { filteredBy: `color: ${color}` }),
        pins
    });
}
