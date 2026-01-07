#!/usr/bin/env node
/**
 * Local API server for color curation
 * Serves pins directly from KV database
 */

import { kv } from '@vercel/kv';
import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const PORT = 3000;

async function getAllPins() {
    const pins = [];
    let cursor = 0;

    do {
        const result = await kv.scan(cursor, { match: 'saved-pin:*', count: 100 });
        cursor = result[0];

        for (const key of result[1]) {
            const pin = await kv.get(key);
            if (pin) {
                const pinId = key.replace('saved-pin:', '');
                const tags = await kv.get(`pin-tags:${pinId}`);
                pins.push({ ...pin, id: pinId, aiAnalysis: tags });
            }
        }
    } while (cursor !== 0);

    return pins;
}

async function updatePinColor(pinId, color) {
    const tags = await kv.get(`pin-tags:${pinId}`);
    if (!tags) {
        throw new Error('Pin not found');
    }

    const updatedTags = {
        ...tags,
        color: [color],
        manuallyReviewed: true,
        reviewedAt: new Date().toISOString()
    };

    await kv.set(`pin-tags:${pinId}`, updatedTags);
    return { success: true };
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Serve HTML files
    if (req.url === '/' || req.url === '/color-curator.html') {
        const htmlPath = path.join(__dirname, 'color-curator.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
    }

    if (req.url === '/recategorize-colors.html') {
        const htmlPath = path.join(__dirname, 'recategorize-colors.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
    }

    // API: Get pins (for recategorize tool)
    if (req.url.startsWith('/api/pins') && req.method === 'GET') {
        try {
            const url = new URL(req.url, `http://localhost:${PORT}`);
            const offset = parseInt(url.searchParams.get('offset') || '0');
            const limit = parseInt(url.searchParams.get('limit') || '1');

            const allPins = await getAllPins();
            const pins = allPins.slice(offset, offset + limit).map(pin => ({
                ...pin,
                pinId: pin.id,
                currentIndustry: pin.aiAnalysis?.industry?.[0] || 'Unknown'
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                pins,
                total: allPins.length,
                hasMore: offset + limit < allPins.length
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // API: Get all pins (for color-curator.html)
    if (req.url === '/api/get-pins' && req.method === 'GET') {
        try {
            const pins = await getAllPins();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ pins }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // API: Update pin color
    if (req.url === '/api/update-pin-color' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { pinId, color } = JSON.parse(body);
                await updatePinColor(pinId, color);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, pinId, color }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`\n✅ Color Curator Server Running`);
    console.log(`📍 Open: http://localhost:${PORT}/\n`);
});
