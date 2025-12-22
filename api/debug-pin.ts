import { kv } from '@vercel/kv';

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Get first pin
        const pinKeys = await kv.keys('saved-pin:*');
        if (pinKeys.length === 0) {
            return res.json({ error: 'No pins found' });
        }

        const pin = await kv.get(pinKeys[0]);
        const pinId = (pin as any).id;
        const aiTags = await kv.get(`pin-tags:${pinId}`);

        return res.json({
            pinId,
            pin: pin,
            aiTags: aiTags,
            hasIndustry: !!(aiTags as any)?.industry,
            industryValue: (aiTags as any)?.industry
        });
    } catch (error: any) {
        return res.json({ error: error.message });
    }
}
