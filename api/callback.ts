import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from "node-fetch";
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const code = req.query.code as string;
        const state = req.query.state as string;
        console.log('Callback received - code:', code ? 'present' : 'missing', 'state:', state);

        if (!code) {
            return res.status(400).send("Missing authorization code");
        }

        const CLIENT_ID = process.env.PINTEREST_CLIENT_ID!;
        const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET!;
        const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI!;

        console.log('Environment check - CLIENT_ID:', CLIENT_ID ? 'present' : 'missing');
        console.log('REDIRECT_URI:', REDIRECT_URI);

        const tokenUrl = "https://api.pinterest.com/v5/oauth/token";
        // Use URLSearchParams for form-encoded body
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI,
        });

        const authHeader = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": authHeader
            },
            body: params.toString(),
        });

        const tokenJson: any = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error('❌ Token exchange failed!');
            console.error('Status:', tokenRes.status, tokenRes.statusText);
            console.error('Response body:', JSON.stringify(tokenJson, null, 2));
            console.error('Sent params:', {
                grant_type: "authorization_code",
                code: code ? (code.substring(0, 5) + '...') : 'missing',
                redirect_uri: REDIRECT_URI
            });
            return res.status(tokenRes.status).send("Error exchanging token: " + (tokenJson.message || tokenJson.error_description || tokenRes.statusText));
        }

        console.log('Token received:', tokenJson.access_token ? 'present' : 'missing');

        // Extract sessionId from state
        const urlParams = new URLSearchParams(state.split('?')[1]);
        const sessionId = urlParams.get('sessionId');

        if (!sessionId) {
            console.error('Session ID missing from state');
            return res.status(400).send("Session ID missing from state");
        }

        console.log('Session ID from state:', sessionId);

        // Store token in Vercel KV
        const key = `auth:${sessionId}`;
        const value = {
            access_token: tokenJson.access_token,
            refresh_token: tokenJson.refresh_token,
            timestamp: Date.now()
        };

        console.log('💾 Storing in Vercel KV - key:', key);

        // Store with 5 minute expiration
        await kv.setex(key, 300, JSON.stringify(value));

        console.log('✅ Token stored successfully in Vercel KV');

        // Success page
        return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
      <title>Authentication Successful</title>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .box { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #000; margin: 0 0 10px 0; }
        p { color: #666; }
      </style>
      </head>
      <body>
      <div class="box">
        <h1>✓ Connected!</h1>
        <p>You can close this window and return to Figma.</p>
      </div>
      </body>
      </html>
    `);

    } catch (err: any) {
        console.error('Callback error:', err);
        return res.status(500).send("OAuth callback error: " + err.message);
    }
}
