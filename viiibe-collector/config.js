/**
 * CENTRALIZED CONFIGURATION FOR CHROME EXTENSION
 * Single source of truth for all API endpoints and URLs
 * 
 * To update the backend URL, only change it here.
 */

// Backend API Base URL
// This is the ONLY place where the backend URL should be defined
const API_BASE_URL = 'https://moood-refactor.vercel.app/api';

// API Endpoints
const API_ENDPOINTS = {
    // Pin management
    savePin: `${API_BASE_URL}/save-pin`,
    getSavedPins: `${API_BASE_URL}/pins`,
    getPinsCount: `${API_BASE_URL}/pins?action=count`,
    deletePin: `${API_BASE_URL}/delete-pin`,

    // Image proxy
    imageProxy: `${API_BASE_URL}/image-proxy`,
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, API_ENDPOINTS };
}
