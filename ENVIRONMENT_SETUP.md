# Environment Variables Setup Guide

## Required Environment Variables

After replacing the heavy AI SDKs with direct REST API calls, you need to update your Vercel environment variables.

### 1. Google Vision API Key

**Old (SDK-based):**
- Variable: `GOOGLE_VISION_CREDENTIALS`
- Type: JSON service account credentials
- Size: Large (~2KB JSON)

**New (REST API-based):**
- Variable: `GOOGLE_VISION_API_KEY`
- Type: Simple API key string
- Size: Small (~40 characters)

#### How to Create Google Vision API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Enable the **Cloud Vision API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
5. (Optional) Restrict the API key:
   - Click on the API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "Cloud Vision API"
   - Save

#### Add to Vercel:

```bash
# Add the environment variable
vercel env add GOOGLE_VISION_API_KEY

# When prompted:
# - Value: <paste your API key>
# - Environments: Production, Preview, Development (select all)
```

Or via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add new variable:
   - Name: `GOOGLE_VISION_API_KEY`
   - Value: Your API key
   - Environments: Production, Preview, Development

---

### 2. OpenAI API Key

**No change needed!** ✅

- Variable: `OPENAI_API_KEY`
- Already configured correctly

---

## Verification

After adding the environment variable:

1. **Redeploy:**
   ```bash
   vercel --prod
   ```

2. **Test the endpoint:**
   ```bash
   curl -X POST "https://your-deployment.vercel.app/api/pin-analysis" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "analyze",
       "adminKey": "change-me-in-production",
       "pinId": "11751649023082334"
     }'
   ```

3. **Expected response:**
   ```json
   {
     "success": true,
     "pinId": "11751649023082334",
     "tags": {
       "style": ["modern", "minimal"],
       "color": ["blue", "white"],
       "type": ["landing-page"],
       ...
     }
   }
   ```

---

## Current Status

- ✅ Code updated to use REST APIs
- ✅ Heavy dependencies removed
- ✅ Deployed successfully (25s build time)
- ⚠️ Need to add `GOOGLE_VISION_API_KEY` environment variable
- ✅ `OPENAI_API_KEY` already configured

---

## Next Steps

1. Create Google Vision API Key (see instructions above)
2. Add `GOOGLE_VISION_API_KEY` to Vercel
3. Redeploy: `vercel --prod`
4. Test with real pin data
5. (Optional) Remove old `GOOGLE_VISION_CREDENTIALS` variable
