import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminKey, action } = req.body;

    // Validate admin key
    const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
    if (adminKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (action === 'unify-transport') {
            return await unifyTransport(res);
        } else if (action === 'delete-sports') {
            return await deleteSports(res);
        } else if (action === 'list-uncategorized') {
            return await listUncategorized(res);
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('Cleanup error:', error);
        return res.status(500).json({ error: 'Cleanup failed', message: error.message });
    }
}

async function unifyTransport(res: VercelResponse) {
    console.log('🔄 Unifying Transport → Transportation...');

    // Scan all pins
    const pinKeys: string[] = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
        cursor = result[0];
        pinKeys.push(...result[1]);
    } while (cursor !== 0);

    let updated = 0;

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = (pin as any).id;
        const tags: any = await kv.get(`pin-tags:${pinId}`);

        if (!tags || !tags.industry) continue;

        const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
        const hasTransport = industries.some((i: string) => i.toLowerCase() === 'transport');

        if (hasTransport) {
            const newIndustries = industries.map((i: string) =>
                i.toLowerCase() === 'transport' ? 'Transportation' : i
            );

            await kv.set(`pin-tags:${pinId}`, { ...tags, industry: newIndustries });
            updated++;
            console.log(`✅ Updated pin ${pinId}: Transport → Transportation`);
        }
    }

    return res.json({ success: true, updated, message: `Updated ${updated} pins` });
}

async function deleteSports(res: VercelResponse) {
    console.log('🗑️  Deleting Sports pins...');

    const pinKeys: string[] = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
        cursor = result[0];
        pinKeys.push(...result[1]);
    } while (cursor !== 0);

    let deleted = 0;

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = (pin as any).id;
        const tags: any = await kv.get(`pin-tags:${pinId}`);

        if (!tags || !tags.industry) continue;

        const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
        const hasSports = industries.some((i: string) => i.toLowerCase() === 'sports');

        if (hasSports) {
            await kv.del(`saved-pin:${pinId}`);
            await kv.del(`pin-tags:${pinId}`);
            deleted++;
            console.log(`🗑️  Deleted Sports pin: ${pinId}`);
        }
    }

    return res.json({ success: true, deleted, message: `Deleted ${deleted} Sports pins` });
}

async function listUncategorized(res: VercelResponse) {
    console.log('📋 Listing Uncategorized pins...');

    const pinKeys: string[] = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
        cursor = result[0];
        pinKeys.push(...result[1]);
    } while (cursor !== 0);

    const uncategorized = [];

    for (const key of pinKeys) {
        const pin: any = await kv.get(key);
        if (!pin) continue;

        const pinId = pin.id;
        const tags: any = await kv.get(`pin-tags:${pinId}`);

        if (!tags || !tags.industry) continue;

        const industries = Array.isArray(tags.industry) ? tags.industry : [tags.industry];
        const hasUncategorized = industries.some((i: string) => i.toLowerCase() === 'uncategorized');

        if (hasUncategorized) {
            uncategorized.push({
                pinId,
                title: pin.title || 'No title',
                url: pin.pinterestUrl || 'No URL',
                styles: tags.style || [],
                type: tags.type || []
            });
        }
    }

    return res.json({ success: true, count: uncategorized.length, pins: uncategorized });
}
