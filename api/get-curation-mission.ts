import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// OPTIMIZED: Uses cached counts, updates in background
// Cache key for industry counts
const CACHE_KEY = 'industry-counts-cache';
const CACHE_TTL = 300; // 5 minutes in seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        // Check for force refresh parameter
        const forceRefresh = req.query.refresh === 'true';

        // Try to get cached counts first (FAST path)
        if (!forceRefresh) {
            const cached = await kv.get(CACHE_KEY) as any;
            if (cached && cached.allCounts) {
                console.log('Using cached counts, age:', Date.now() - cached.timestamp, 'ms');
                return res.json({
                    ...cached,
                    fromCache: true
                });
            }
        }

        // No cache or force refresh - calculate counts (SLOW path)
        console.log('Calculating fresh counts...');
        const counts = await calculateIndustryCounts();

        // Build response
        const response = buildMissionResponse(counts);

        // Cache the result
        await kv.set(CACHE_KEY, {
            ...response,
            timestamp: Date.now()
        }, { ex: CACHE_TTL });

        return res.json(response);

    } catch (error: any) {
        console.error('Mission error:', error);
        return res.status(500).json({ error: 'Failed', message: error.message });
    }
}

async function calculateIndustryCounts(): Promise<Map<string, number>> {
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

    const counts = new Map<string, number>();

    for (const key of pinKeys) {
        const pin = await kv.get(key);
        if (!pin) continue;

        const pinId = (pin as any).id;
        const tags = await kv.get(`pin-tags:${pinId}`);

        if (tags && (tags as any).industry && Array.isArray((tags as any).industry)) {
            const industry = (tags as any).industry[0].toLowerCase();
            counts.set(industry, (counts.get(industry) || 0) + 1);
        }
    }

    return counts;
}

function buildMissionResponse(counts: Map<string, number>) {
    const totalPins = Array.from(counts.values()).reduce((a, b) => a + b, 0);

    // Core industries
    const CORE = ['Finance', 'Fitness', 'Ecommerce', 'Tech', 'Education', 'Saas', 'Healthcare'];

    const incomplete = CORE
        .map(name => ({
            industry: name,
            count: counts.get(name.toLowerCase()) || 0,
            target: 100
        }))
        .filter(item => item.count < item.target)
        .sort((a, b) => b.count - a.count);

    const allCountsObj = Object.fromEntries(
        Array.from(counts.entries()).map(([k, v]) => {
            // Special case for acronyms
            if (k === 'ngo') return ['NGO', v];
            // Standard capitalization
            return [k.charAt(0).toUpperCase() + k.slice(1), v];
        })
    );

    if (incomplete.length === 0) {
        // Core complete - check ALL Secondary categories (target: 50 each)
        const SECONDARY = [
            'Real estate', 'Food', 'Fashion', 'Travel',
            'Construction', 'Furniture', 'Home services', 'Logistics',
            'Business', 'Sustainability', 'Consulting', 'Transportation',
            'Digital agency', 'Beauty', 'Agriculture', 'NGO', 'Portfolio'
        ];

        const secondaryIncomplete = SECONDARY
            .map(name => ({
                industry: name,
                count: counts.get(name.toLowerCase()) || 0,
                target: 50
            }))
            .filter(item => item.count < item.target)
            .sort((a, b) => a.count - b.count); // Sort by LOWEST count first

        if (secondaryIncomplete.length === 0) {
            return {
                isComplete: true,
                message: 'All Core and Secondary industries complete!',
                totalProgress: { current: totalPins, target: 900, percentage: 100 },
                allCounts: allCountsObj
            };
        }

        const current = secondaryIncomplete[0];
        const next = secondaryIncomplete[1] || null;

        return {
            industry: current.industry,
            currentCount: current.count,
            targetCount: current.target,
            progress: Math.round((current.count / current.target) * 100),
            nextIndustry: next?.industry || null,
            tier: 'secondary',
            isComplete: false,
            totalProgress: { current: totalPins, target: 900, percentage: Math.round((totalPins / 900) * 100) },
            allCounts: allCountsObj
        };
    }

    const current = incomplete[0];
    const next = incomplete[1] || null;

    return {
        industry: current.industry,
        currentCount: current.count,
        targetCount: current.target,
        progress: Math.round((current.count / current.target) * 100),
        nextIndustry: next?.industry || null,
        tier: 'core',
        isComplete: false,
        totalProgress: { current: totalPins, target: 700, percentage: Math.round((totalPins / 700) * 100) },
        allCounts: allCountsObj
    };
}
