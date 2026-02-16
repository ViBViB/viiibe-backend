import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Reflect origin for Figma (origin 'null')
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, priceId } = req.body;

    if (!userId || !priceId) {
        return res.status(400).json({ error: 'Missing userId or priceId' });
    }

    // Safe diagnostic logging
    const envVars = Object.keys(process.env)
        .filter(k => k.startsWith('STRIPE_') || k.startsWith('KV_'))
        .map(k => `${k}: ${process.env[k] ? 'EXISTS' : 'MISSING'}`);
    console.log('🔍 [Diagnostics] Available variables:', envVars);

    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('❌ Missing STRIPE_SECRET_KEY. Available env keys:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
            throw new Error('STRIPE_SECRET_KEY is not configured on the server');
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16' as any,
        });

        console.log(`💳 [Stripe] Creating checkout session for user: ${userId}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Crucial: Pass Figma ID to the backend when payment is complete
            client_reference_id: userId,
            // Redirect back to Figma (custom scheme or generic success page)
            success_url: `https://viiibe-backend.vercel.app/success.html?userId=${userId}`,
            cancel_url: `https://viiibe-backend.vercel.app/cancel.html`,
            // Add metadata for easier tracking in Stripe
            metadata: {
                figmaUserId: userId,
            },
        });

        return res.status(200).json({
            success: true,
            url: session.url
        });

    } catch (error: any) {
        console.error('❌ Stripe Checkout error:', error);
        return res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message || 'Internal server error',
            debug: {
                host: req.headers.host,
                hasKey: !!process.env.STRIPE_SECRET_KEY,
                envKeys: Object.keys(process.env).filter(k => k.startsWith('STRIPE_') || k.startsWith('KV_'))
            }
        });
    }
}
