/**
 * CENTRALIZED CONFIGURATION
 * Single source of truth for all API endpoints and URLs
 * 
 * To update the backend URL, only change it here.
 */

// Backend API Base URL
// This is the ONLY place where the backend URL should be defined
export const API_BASE_URL = 'https://viiibe-backend.vercel.app/api';

// API Endpoints
export const API_ENDPOINTS = {
    // Pin management
    savePin: `${API_BASE_URL}/save-pin`,
    getSavedPins: `${API_BASE_URL}/pins`,
    getPinsCount: `${API_BASE_URL}/pins?action=count`,
    deletePin: `${API_BASE_URL}/delete-pin`,

    // Pinterest proxy
    pinterestProxy: `${API_BASE_URL}/pinterest-proxy`,

    // Image proxy
    imageProxy: `${API_BASE_URL}/image-proxy`,

    // Curated boards
    curatedBoards: `${API_BASE_URL}/curated-boards`,

    // Analysis
    pinAnalysis: `${API_BASE_URL}/pin-analysis`,
    analysisStats: `${API_BASE_URL}/analysis-stats`,
};

// Helper function to build image proxy URL
export function getImageProxyUrl(imageUrl: string): string {
    return `${API_ENDPOINTS.imageProxy}?url=${encodeURIComponent(imageUrl)}`;
}

// Helper function to build Pinterest proxy URL
export function getPinterestProxyUrl(endpoint: string, params?: Record<string, string>): string {
    const queryParams = params ? '&' + new URLSearchParams(params).toString() : '';
    return `${API_ENDPOINTS.pinterestProxy}?endpoint=${encodeURIComponent(endpoint)}${queryParams}`;
}

/**
 * Upgrade Pinterest URL to high resolution (/736x/)
 * This is the optimal balance between quality and speed for moodboards
 */
export function upgradeTo736x(url: string): string {
    if (!url || typeof url !== 'string') return url;

    // If already 736x, return as is
    if (url.includes('/736x/')) {
        return url;
    }

    // Replace any resolution path with /736x/
    // This handles: /236x/, /474x/, /564x/
    // We don't downgrade /originals/ if it's already there
    if (url.includes('/originals/')) {
        return url;
    }

    return url.replace(/\/(236x|474x|564x)\//, '/736x/');
}

/**
 * Upgrade Pinterest URL to highest resolution (/originals/)
 * Handles existing pins in database that may have low-resolution URLs
 */
export function upgradeToOriginals(url: string): string {
    if (!url || typeof url !== 'string') return url;

    // If already originals, return as is
    if (url.includes('/originals/')) {
        return url;
    }

    // Replace any resolution path with /originals/
    // This handles: /236x/, /474x/, /564x/, /736x/
    return url.replace(/\/(236x|474x|564x|736x)\//, '/originals/');
}


