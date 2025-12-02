export default async function handler(req, res) {
    console.log('=== INCOMING REQUEST ===');
    console.log('Method:', req.method);
    console.log('Body:', JSON.stringify(req.body));

    // Set CORS headers FIRST
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight');
        return res.status(200).end();
    }

    // Parse request body
    const { action, token, boardName, boardId, pageSize } = req.body || {};

    console.log('Action:', action);
    console.log('Has token:', !!token);

    // Health check
    if (action === 'health') {
        return res.status(200).json({
            status: 'ok',
            message: 'Proxy is running',
            timestamp: new Date().toISOString()
        });
    }

    if (!action) {
        console.log('ERROR: Missing action');
        return res.status(400).json({ error: 'Missing action parameter' });
    }

    if (!token) {
        console.log('ERROR: Missing token');
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        let url;
        let method = 'GET';

        // Route based on action
        if (action === 'get-boards') {
            url = 'https://api.pinterest.com/v5/boards';
            console.log('Fetching boards');
        } else if (action === 'get-board-pins') {
            if (!boardId) {
                return res.status(400).json({ error: 'boardId is required for get-board-pins' });
            }
            const size = pageSize || 50;
            url = `https://api.pinterest.com/v5/boards/${boardId}/pins?page_size=${size}`;
            console.log(`Fetching pins for board ${boardId}`);
        } else if (action === 'search-pins') {
            // Global Pinterest search
            const { searchTerm, countryCode = 'US', limit = 50, bookmark } = req.body;
            if (!searchTerm) {
                return res.status(400).json({ error: 'searchTerm is required for search-pins' });
            }

            let searchUrl = `https://api.pinterest.com/v5/search/partner/pins?term=${encodeURIComponent(searchTerm)}&country_code=${countryCode}&limit=${limit}`;
            if (bookmark) {
                searchUrl += `&bookmark=${encodeURIComponent(bookmark)}`;
            }
            url = searchUrl;
            console.log(`Searching Pinterest globally for: ${searchTerm}`);
        } else if (action === 'find-board') {
            if (!boardName) {
                return res.status(400).json({ error: 'boardName is required for find-board' });
            }

            // First, get all boards
            console.log('Finding board:', boardName);
            const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!boardsResponse.ok) {
                const errorData = await boardsResponse.json();
                console.error('Error fetching boards:', errorData);
                return res.status(boardsResponse.status).json(errorData);
            }

            const boardsData = await boardsResponse.json();
            const boards = boardsData.items || [];

            // Find the board by name (case-insensitive)
            const board = boards.find(b =>
                b.name.toLowerCase() === boardName.toLowerCase()
            );

            if (!board) {
                console.log('Board not found:', boardName);
                return res.status(404).json({ error: 'Board not found' });
            }

            console.log('Board found:', board.name);
            return res.status(200).json(board);
        } else {
            console.log('ERROR: Unknown action:', action);
            return res.status(400).json({ error: 'Unknown action' });
        }

        // Make the API request
        console.log(`Making request to: ${url}`);
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Pinterest API response status:', response.status);

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            console.error('Pinterest API Error:', response.status, data);
            return res.status(response.status).json(data);
        }

        // Log first item to see structure
        if (data.items && data.items.length > 0) {
            console.log('Sample Pinterest pin structure:', JSON.stringify(data.items[0]));
        }

        console.log('Success! Returning data');
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Internal Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
