/**
 * CENTRALIZED CONFIGURATION FOR FIGMA PLUGIN (code.js)
 * Single source of truth for all API endpoints and URLs
 * 
 * To update the backend URL, only change it here.
 */

// Backend API Base URL
const API_BASE_URL = 'https://moood-refactor.vercel.app/api';

// API Endpoints
const API_ENDPOINTS = {
    pinterestProxy: `${API_BASE_URL}/pinterest-proxy`,
    curatedBoards: `${API_BASE_URL}/curated-boards`,
    getSavedPins: `${API_BASE_URL}/get-saved-pins`,
    imageProxy: `${API_BASE_URL}/image-proxy`,
};

// Helper function to build image proxy URL
function getImageProxyUrl(imageUrl) {
    return `${API_ENDPOINTS.imageProxy}?url=${encodeURIComponent(imageUrl)}`;
}
