export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }

    // Only allow Pinterest image URLs for security
    if (!url.startsWith('https://i.pinimg.com/')) {
        return res.status(403).json({ error: 'Only Pinterest image URLs are allowed' });
    }

    try {
        console.log('Proxying image:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Failed to fetch image:', response.status);
            return res.status(response.status).json({ error: 'Failed to fetch image' });
        }

        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();

        console.log('Image fetched successfully, size:', buffer.byteLength);

        // Set appropriate content type
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Send the image
        res.status(200).send(Buffer.from(buffer));

    } catch (error) {
        console.error('Error proxying image:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
