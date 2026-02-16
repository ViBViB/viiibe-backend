import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);

    const { secret } = req.query;

    if (secret !== 'viiibe-debug-2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const allKeys = await kv.keys('user:*');
        const allUsers = [];

        for (const key of allKeys) {
            const userData: any = await kv.get(key);
            const userId = key.replace('user:', '');

            // Convert to hex to see invisible characters
            const hexId = Buffer.from(userId).toString('hex');

            allUsers.push({
                key,
                userId,
                userIdLength: userId.length,
                userIdHex: hexId,
                isPro: userData?.is_pro,
                isProForced: userData?.is_pro_forced,
                status: userData?.status,
                downloadsCount: userData?.downloads_count
            });
        }

        // Sort by most recent first
        allUsers.sort((a, b) => b.userIdLength - a.userIdLength);

        return res.status(200).json({
            success: true,
            totalUsers: allUsers.length,
            users: allUsers,
            searchHelp: 'Look for IDs containing "39123723839556146"'
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
