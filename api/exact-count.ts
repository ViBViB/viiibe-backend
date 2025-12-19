import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// TEMPORARY ENDPOINT - Get exact pin count
// This bypasses all the pin fetching and just counts
export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { adminKey } = req.query;

        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('🔍 Starting exact count...');

        // Use SCAN to get all keys
        const allKeys: string[] = [];
        let cursor = 0;
        let iterations = 0;

        do {
            const result = await kv.scan(cursor, {
                match: 'saved-pin:*',
                count: 100
            });

            cursor = result[0];
            allKeys.push(...result[1]);
            iterations++;

            console.log(`  Iteration ${iterations}: Found ${allKeys.length} total pins`);
        } while (cursor !== 0);

        const exactCount = allKeys.length;
        const remaining = 1000 - exactCount;
        const percentageUsed = ((exactCount / 1000) * 100).toFixed(1);

        console.log(`✅ EXACT COUNT: ${exactCount} pins`);
        console.log(`📊 Remaining: ${remaining} pins`);
        console.log(`📊 Usage: ${percentageUsed}%`);

        return res.status(200).json({
            success: true,
            exactCount,
            remaining,
            percentageUsed: parseFloat(percentageUsed),
            limit: 1000,
            timestamp: new Date().toISOString(),
            iterations
        });

    } catch (error: any) {
        console.error('❌ Count error:', error);
        return res.status(500).json({
            error: 'Failed to count pins',
            message: error.message
        });
    }
}
