import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { boardUrl, token } = req.body;

        if (!boardUrl) {
            return res.status(400).json({ error: 'boardUrl is required' });
        }

        // Extract username and board slug from URL
        // Format: https://www.pinterest.com/{username}/{board-slug}/
        const urlMatch = boardUrl.match(/pinterest\.com\/([^\/]+)\/([^\/]+)/);

        if (!urlMatch) {
            return res.status(400).json({
                error: 'Invalid Pinterest board URL format',
                expected: 'https://www.pinterest.com/{username}/{board-slug}/'
            });
        }

        const [, username, boardSlug] = urlMatch;

        console.log(`🔍 Validating board: ${username}/${boardSlug}`);

        // Try to find the board using Pinterest API
        // First, get all boards for the authenticated user to see if we can access it
        const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!boardsResponse.ok) {
            return res.status(400).json({
                error: 'Unable to validate board. Make sure you are authenticated with Pinterest.',
                details: await boardsResponse.text()
            });
        }

        const boardsData: any = await boardsResponse.json();
        const boards = boardsData.items || [];

        // Try to find matching board
        const matchingBoard = boards.find((b: any) =>
            b.name.toLowerCase().includes(boardSlug.replace(/-/g, ' ').toLowerCase())
        );

        if (matchingBoard) {
            return res.status(200).json({
                valid: true,
                board: {
                    id: matchingBoard.id,
                    name: matchingBoard.name,
                    username: username,
                    boardSlug: boardSlug,
                    pinCount: matchingBoard.pin_count || 0,
                    description: matchingBoard.description || ''
                }
            });
        }

        // If not found in user's boards, return info for manual entry
        return res.status(200).json({
            valid: false,
            message: 'Board not found in your accessible boards. You can still add it manually.',
            extracted: {
                username,
                boardSlug
            }
        });

    } catch (error: any) {
        console.error('❌ Board validation error:', error);
        return res.status(500).json({
            error: 'Validation failed',
            message: error.message
        });
    }
}
