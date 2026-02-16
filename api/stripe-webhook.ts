import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import Stripe from 'stripe';

export const config = {
    api: {
        bodyParser: false, // Stripe webhooks need raw body for signature verification
    },
};

// Helper to get raw body
async function getRawBody(readable: any) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const endpointSecretLive = process.env.STRIPE_WEBHOOK_SECRET;
    const endpointSecretTest = process.env.STRIPE_WEBHOOK_SECRET_TEST;

    if (!stripeSecret) {
        console.error('❌ STRIPE_SECRET_KEY is not configured');
        return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' });
    }

    const stripe = new Stripe(stripeSecret, {
        apiVersion: '2023-10-16' as any,
    });
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const rawBody = await getRawBody(req);

    let event;

    // Try to verify with both Test and Live mode secrets
    try {
        if (!sig) {
            console.error('❌ Missing signature');
            return res.status(400).send('Webhook Error: Missing signature');
        }

        // Try Test mode secret first (most common during development)
        if (endpointSecretTest) {
            try {
                event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecretTest);
                console.log('✅ [Webhook] Verified with TEST mode secret');
            } catch (testErr) {
                // If Test mode fails, try Live mode
                if (endpointSecretLive) {
                    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecretLive);
                    console.log('✅ [Webhook] Verified with LIVE mode secret');
                } else {
                    throw testErr; // Re-throw if no Live secret available
                }
            }
        } else if (endpointSecretLive) {
            // Only Live mode secret available
            event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecretLive);
            console.log('✅ [Webhook] Verified with LIVE mode secret');
        } else {
            console.error('❌ No webhook secrets configured');
            return res.status(400).send('Webhook Error: No webhook secrets configured');
        }
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        // Try multiple places for userId
        const userId = session.client_reference_id || (session.metadata ? session.metadata.figmaUserId : null);

        if (userId) {
            console.log(`🎉 [Webhook] Payment successful! Unlocking PRO for user: ${userId} (session: ${session.id})`);

            const userKey = `user:${userId}`;
            let userData: any = await kv.get(userKey);

            if (!userData) {
                console.log(`ℹ️ [Webhook] User ${userId} not found in DB. Creating new PRO entry.`);
                userData = { figma_id: userId, downloads_count: 0 };
            } else {
                console.log(`ℹ️ [Webhook] Existing user found. Current status: ${userData.is_pro ? 'PRO' : 'FREE'}`);
            }

            // UNLOCK PRO STATUS
            userData.is_pro = true;
            userData.last_payment = new Date().toISOString();
            userData.payment_id = session.id;

            await kv.set(userKey, userData);
            console.log(`✅ [Webhook] User ${userId} is now PERMANENTLY PRO in database.`);
        } else {
            console.error('⚠️ [Webhook] client_reference_id (userId) missing in session object:', session.id);
        }
    }

    res.status(200).json({ received: true });
}
