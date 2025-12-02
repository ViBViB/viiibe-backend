import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

// Board ID mapping - Replace with your actual Pinterest board IDs
const boardIdMap: { [key: string]: string } = {
    'landing': '1105844952192711146',
    'dashboard': 'REPLACE_WITH_YOUR_DASHBOARD_BOARD_ID',
    'typography': 'REPLACE_WITH_YOUR_TYPOGRAPHY_BOARD_ID',
    'mobile-app': 'REPLACE_WITH_YOUR_MOBILE_APP_BOARD_ID'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { category, token } = req.body;

    if (!category || !token) {
        return res.status(400).json({ error: 'Category and token are required.' });
    }

    const boardId = boardIdMap[category];

    if (!boardId || boardId.startsWith('REPLACE')) {
        return res.status(404).json({ error: 'Category not found or Board ID not configured.' });
    }

    // Request media field explicitly to get images
    const pinterestApiUrl = `https://api.pinterest.com/v5/boards/${boardId}/pins?pin_fields=media`;

    try {
        const response = await fetch(pinterestApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Pinterest API responded with status ${response.status}: ${errorData.message}`);
        }

        const data: any = await response.json();

        // Extract images with priority: original -> 1200px -> 600px
        const pins = data.items.map((pin: any) => {
            const images = pin.media?.images;
            const fullsizeUrl = images?.originals?.url || images?.['1200x']?.url || images?.['600x']?.url || '';
            const thumbnailUrl = images?.['400x300']?.url || images?.['600x']?.url || fullsizeUrl;

            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                thumbnailUrl: thumbnailUrl,
                fullsizeUrl: fullsizeUrl,
            };
        });

        res.status(200).json(pins);

    } catch (e: any) {
        console.error('Error in get-pins function:', e);
        res.status(500).json({ error: e.message || 'Internal server error.' });
    }
}
