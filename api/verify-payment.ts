import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
        console.log(`🔍 [Manual Check] Checking Stripe for userId: ${userId}`);

        // Search for successful checkout sessions for this user
        const sessions = await stripe.checkout.sessions.list({
            limit: 10,
        });

        // Find any successful session with this user's ID
        const userSession = sessions.data.find(session =>
            session.client_reference_id === userId.trim() &&
            session.payment_status === 'paid'
        );

        if (userSession) {
            console.log(`✅ [Manual Check] Found paid session for ${userId}: ${userSession.id}`);

            // Activate PRO for ALL variants of this ID
            const variants = [
                userId.trim(),
                userId.trim() + ' ',
                '391237238395566146', // The corrupted one
            ];

            for (const id of variants) {
                const userKey = `user:${id}`;
                const userData = {
                    figma_id: id,
                    is_pro: true,
                    is_pro_forced: false,
                    downloads_count: 0,
                    payment_verified_at: new Date().toISOString(),
                    stripe_session_id: userSession.id,
                    status: 'PRO_VERIFIED'
                };
                await kv.set(userKey, userData);
                console.log(`✅ [Manual Check] Activated PRO for: ${userKey}`);
            }

            return res.status(200).json({
                success: true,
                isPro: true,
                message: 'Payment verified and PRO activated!',
                sessionId: userSession.id
            });
        } else {
            console.log(`❌ [Manual Check] No paid session found for ${userId}`);
            return res.status(200).json({
                success: true,
                isPro: false,
                message: 'No payment found yet'
            });
        }

    } catch (error: any) {
        console.error('❌ Manual check error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
