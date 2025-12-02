import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    try {
        // GET - Retrieve all curated boards
        if (req.method === 'GET') {
            const { category } = req.query;

            // Get all boards from KV
            const boardKeys = await kv.keys('curated:board:*');
            const boards: CuratedBoard[] = [];

            for (const key of boardKeys) {
                const board = await kv.get<CuratedBoard>(key);
                if (board) {
                    // Filter by category if specified
                    if (!category || board.category === category) {
                        boards.push(board);
                    }
                }
            }

            // Sort by quality (premium first) then by pin count
            boards.sort((a, b) => {
                if (a.quality === 'premium' && b.quality !== 'premium') return -1;
                if (a.quality !== 'premium' && b.quality === 'premium') return 1;
                return b.pinCount - a.pinCount;
            });

            console.log(`📚 Retrieved ${boards.length} curated boards`);
            return res.status(200).json({ boards, count: boards.length });
        }

        // POST - Add a new curated board
        if (req.method === 'POST') {
            const { boardId, name, username, boardSlug, category, pinCount, quality, adminKey } = req.body;

            // Simple admin authentication
            const ADMIN_KEY = process.env.CURATOR_ADMIN_KEY || 'change-me-in-production';
            if (adminKey !== ADMIN_KEY) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Validate required fields
            if (!boardId || !name || !username || !category) {
                return res.status(400).json({
                    error: 'Missing required fields: boardId, name, username, category'
                });
            }

            // Create board object
            const board: CuratedBoard = {
                id: boardId,
                name,
                username,
                boardSlug: boardSlug || '',
                category,
                pinCount: pinCount || 0,
                quality: quality || 'standard',
                addedDate: new Date().toISOString(),
                addedBy: 'curator'
            };

            // Save to KV
            await kv.set(`curated:board:${boardId}`, board);

            console.log(`✅ Added curated board: ${name} (${boardId})`);
            return res.status(201).json({ success: true, board });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error('❌ Curated boards error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
