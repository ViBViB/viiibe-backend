# Behance API Registration Guide

## Correct URL
**Adobe Developer Console:** https://console.adobe.io

(NOT https://www.behance.net/dev - that URL doesn't exist)

## Registration Steps

### 1. Access Adobe Developer Console
- Go to https://console.adobe.io
- Sign in with your Adobe/Behance account
- If you don't have one, create a Behance account first at behance.net

### 2. Create New Project
- Click "Create new project"
- Select "Add API"
- Choose "Behance" from the list of available APIs

### 3. Configure Application
You'll need to provide:
- **Application Name:** "Viiibe - Figma Design Plugin"
- **Description:** "Design inspiration plugin for Figma that helps designers create mood boards"
- **Website URL:** https://github.com/ViBViB/viiibe-backend
- **Redirect URI:** (optional, leave empty for now)

### 4. Get API Key
- After registration, you'll receive a **Client ID** (API Key)
- Copy this key - you'll need it for Vercel environment variables

### 5. Review Terms
- Read and accept Behance API Terms of Use
- Note: API is for non-commercial use by default
- For commercial use, may need additional approval

## Rate Limits
- **150 requests per hour** per API key
- Measured against your application's usage
- Should be sufficient for initial launch

## Next Steps
1. Copy your API Key
2. Add to Vercel: `BEHANCE_API_KEY=your_key_here`
3. Test API access with curl
4. Proceed with backend implementation

## API Documentation
https://www.behance.net/dev/api/endpoints/
