const express = require('express');
const fetch = require('node-fetch');
const open = require('open');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Configuration
const CLIENT_ID = process.env.PINTEREST_APP_ID;
const CLIENT_SECRET = process.env.PINTEREST_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

// Scopes needed for the plugin setup
const SCOPES = [
    'boards:read',
    'boards:write',
    'boards:read_secret',
    'boards:write_secret',
    'pins:read',
    'pins:write',
    'pins:read_secret',
    'pins:write_secret',
    'user_accounts:read'
].join(',');

// Generate random state
const STATE = 'pinterest_oauth_' + Math.random().toString(36).substring(7);

app.get('/login', (req, res) => {
    const authUrl = `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES}&state=${STATE}`;
    console.log('Opening browser for authentication...');
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (state !== STATE) {
        return res.status(400).send('State mismatch error');
    }

    if (!code) {
        return res.status(400).send('No code received');
    }

    console.log('Code received, exchanging for token...');

    try {
        // Exchange code for token
        const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code.toString(),
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
            console.log('\n✅ SUCCESS! Access Token received:');
            console.log('---------------------------------------------------');
            console.log(tokenData.access_token);
            console.log('---------------------------------------------------');
            console.log('\nPlease copy this token to your .env file as PINTEREST_ACCESS_TOKEN');

            res.send(`
                <h1>Success!</h1>
                <p>Access Token received. Check your terminal.</p>
                <script>window.close()</script>
            `);

            // Exit after a brief delay
            setTimeout(() => process.exit(0), 1000);
        } else {
            console.error('Error getting token:', tokenData);
            res.status(500).json(tokenData);
        }
    } catch (error) {
        console.error('Request failed:', error);
        res.status(500).send(error.toString());
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('\n👉 Please open this URL in your browser to login:');
    console.log(`http://localhost:${PORT}/login`);
    console.log('\nWaiting for authentication...');
});
