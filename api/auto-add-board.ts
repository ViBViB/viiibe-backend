import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import https from 'https';

interface CuratedBoard {
    id: string;
    name: string;
    username: string;
    boardSlug: string;
    category: string;
    pinCount: number;
    quality: 'premium' | 'standard';
    addedDate: string;
    addedBy: string;
}

// Scrape board ID from Pinterest page
async function scrapeBoardId(url: string): Promise<string | null> {
    return new Promise((resolve) => {
        const cleanUrl = url.replace('cl.pinterest.com', 'www.pinterest.com');

        https.get(cleanUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const pwsMatch = data.match(/"id":"(\d+)"/);
                const resourceMatch = data.match(/"resourceId":"(\d+)"/);
                const boardMatch = data.match(/"board":\{"id":"(\d+)"/);
                const boardId = pwsMatch?.[1] || resourceMatch?.[1] || boardMatch?.[1];
                resolve(boardId || null);
            });
        }).on('error', () => resolve(null));
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { boardUrl, category, quality, adminKey } = req.body;

        // Validate admin key
        const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
        if (adminKey !== ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!boardUrl || !category) {
            return res.status(400).json({
                error: 'Missing required fields: boardUrl, category'
            });
        }

        // Extract username and board slug
        const urlMatch = boardUrl.match(/pinterest\.com\/([^\/]+)\/([^\/]+)/);
        if (!urlMatch) {
            return res.status(400).json({
                error: 'Invalid Pinterest board URL format'
            });
        }

        const [, username, boardSlug] = urlMatch;

        console.log(`🔍 Auto-adding board: ${username}/${boardSlug}`);

        // Scrape board ID
        const boardId = await scrapeBoardId(boardUrl);

        if (!boardId) {
            return res.status(400).json({
                error: 'Could not extract board ID from page. Board may be private or deleted.'
            });
        }

        console.log(`✅ Found board ID: ${boardId}`);

        // Create board object
        const board: CuratedBoard = {
            id: boardId,
            name: boardSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            username,
            boardSlug,
            category,
            pinCount: 0, // Will be updated when fetched
            quality: quality || 'standard',
            addedDate: new Date().toISOString(),
            addedBy: 'auto-curator'
        };

        // Save to KV
        await kv.set(`curated:board:${boardId}`, board);

        console.log(`✅ Auto-added curated board: ${board.name} (${boardId})`);

        return res.status(201).json({
            success: true,
            board,
            message: 'Board automatically added to curated collection'
        });

    } catch (error: any) {
        console.error('❌ Auto-add error:', error);
        return res.status(500).json({
            error: 'Failed to auto-add board',
            message: error.message
        });
    }
}
