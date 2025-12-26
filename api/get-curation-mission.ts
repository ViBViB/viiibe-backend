import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// COMPLETELY REWRITTEN - Correct logic, no cache
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
        // Scan all pins
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

        // Count by industry (LOWERCASE for consistency)
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

        // Core industries
        const CORE = [
            'Finance', 'Fitness', 'Ecommerce', 'Tech',
            'Education', 'Saas', 'Healthcare'
        ];

        // Get incomplete, sort by HIGHEST count (complete one at a time)
        const incomplete = CORE
            .map(name => ({
                industry: name,
                count: counts.get(name.toLowerCase()) || 0,
                target: 100
            }))
            .filter(item => item.count < item.target)
            .sort((a, b) => b.count - a.count); // DESCENDING

        if (incomplete.length === 0) {
            // Core complete - check Secondary
            const SECONDARY = ['Real Estate', 'Food', 'Fashion', 'Travel'];

            const secondaryIncomplete = SECONDARY
                .map(name => ({
                    industry: name,
                    // FIX: Database has "Real estate" but we expect "Real Estate"
                    count: counts.get(name.toLowerCase()) || counts.get(name) || 0,
                    target: 50
                }))
                .filter(item => item.count < item.target)
                .sort((a, b) => b.count - a.count);

            if (secondaryIncomplete.length === 0) {
                // Both Core and Secondary complete
                return res.json({
                    isComplete: true,
                    message: 'All Core and Secondary industries complete!',
                    totalProgress: { current: pinKeys.length, target: 900, percentage: 100 },
                    allCounts: Object.fromEntries(
                        Array.from(counts.entries()).map(([k, v]) => [
                            k.charAt(0).toUpperCase() + k.slice(1),
                            v
                        ])
                    )
                });
            }

            // Return next Secondary industry
            const current = secondaryIncomplete[0];
            const next = secondaryIncomplete[1] || null;

            return res.json({
                industry: current.industry,
                currentCount: current.count,
                targetCount: current.target,
                progress: Math.round((current.count / current.target) * 100),
                nextIndustry: next?.industry || null,
                tier: 'secondary',
                isComplete: false,
                totalProgress: {
                    current: pinKeys.length,
                    target: 900,
                    percentage: Math.round((pinKeys.length / 900) * 100)
                },
                allCounts: Object.fromEntries(
                    Array.from(counts.entries()).map(([k, v]) => [
                        k.charAt(0).toUpperCase() + k.slice(1),
                        v
                    ])
                )
            });
        }

        const current = incomplete[0];
        const next = incomplete[1] || null;

        return res.json({
            industry: current.industry,
            currentCount: current.count,
            targetCount: current.target,
            progress: Math.round((current.count / current.target) * 100),
            nextIndustry: next?.industry || null,
            tier: 'core',
            isComplete: false,
            totalProgress: {
                current: pinKeys.length,
                target: 700,
                percentage: Math.round((pinKeys.length / 700) * 100)
            },
            // ALL COUNTS for syncing local storage
            allCounts: Object.fromEntries(
                Array.from(counts.entries()).map(([k, v]) => [
                    k.charAt(0).toUpperCase() + k.slice(1), // Capitalize
                    v
                ])
            )
        });

    } catch (error: any) {
        console.error('Mission error:', error);
        return res.status(500).json({ error: 'Failed', message: error.message });
    }
}
