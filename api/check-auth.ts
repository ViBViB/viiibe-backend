import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const state = req.query.state as string;

        console.log('🔍 check-auth called with state:', state);

        if (!state) {
            return res.status(400).json({ ready: false, error: "Missing state" });
        }

        const key = `auth:${state}`;

        console.log('🔍 Fetching from Vercel KV with key:', key);

        // Get token from Vercel KV
        const result = await kv.get(key);

        console.log('📦 Vercel KV response:', result ? 'found' : 'not found');

        if (result) {
            console.log('✅ Found token in Vercel KV');

            const tokenData = typeof result === 'string'
                ? JSON.parse(result)
                : result;

            console.log('✅ Parsed tokenData:', JSON.stringify(tokenData));
            console.log('✅ Access token:', tokenData.access_token);

            const response = {
                ready: true,
                token: tokenData.access_token,
                refresh_token: tokenData.refresh_token
            };

            console.log('📤 Sending response:', JSON.stringify(response));

            return res.status(200).json(response);
        }

        console.log('❌ No token found in Vercel KV');
        return res.json({ ready: false });

    } catch (err: any) {
        console.error('❌ Check auth error:', err);
        return res.status(500).json({ ready: false, error: err.message });
    }
}
