/**
 * Pinterest Image Fetcher
 * Gets the actual image URL from a Pinterest pin
 */

interface PinterestPin {
    id: string;
    images: {
        orig: {
            url: string;
            width: number;
            height: number;
        };
    };
}

/**
 * Fetch image URL from Pinterest pin
 * Uses Pinterest API to get the actual image URL for analysis
 */
export async function getPinterestImageUrl(
    pinterestUrl: string,
    accessToken?: string
): Promise<string> {
    try {
        // Extract pin ID from URL
        const match = pinterestUrl.match(/\/pin\/(\d+)/);
        if (!match) {
            throw new Error('Invalid Pinterest URL');
        }

        const pinId = match[1];

        // Method 1: Try with access token if available
        if (accessToken) {
            const response = await fetch(
                `https://api.pinterest.com/v5/pins/${pinId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                const data: PinterestPin = await response.json();
                return data.images.orig.url;
            }
        }

        // Method 2: Extract from Pinterest page HTML (fallback)
        const pageResponse = await fetch(pinterestUrl);
        const html = await pageResponse.text();

        // Look for og:image meta tag
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (ogImageMatch) {
            return ogImageMatch[1];
        }

        // Look for image in JSON-LD
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
        if (jsonLdMatch) {
            const jsonLd = JSON.parse(jsonLdMatch[1]);
            if (jsonLd.image) {
                return Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
            }
        }

        throw new Error('Could not extract image URL from Pinterest');

    } catch (error) {
        console.error('Error fetching Pinterest image:', error);
        throw error;
    }
}

/**
 * Validate that an image URL is accessible
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        return response.ok && (contentType?.startsWith('image/') ?? false);
    } catch {
        return false;
    }
}
