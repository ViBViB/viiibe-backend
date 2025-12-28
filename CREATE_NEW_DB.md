# Create New Upstash Database - Step by Step

## Option: Create Fresh Database (Immediate Solution)

This allows you to continue working immediately while you decide about upgrading.

### Steps:

1. **Go to Upstash Console**
   - https://console.upstash.com

2. **Create New Database**
   - Click "Create Database"
   - Name: `viiibe-plugin-new`
   - Region: Choose closest to you
   - Type: Regional (cheaper)
   - Click "Create"

3. **Get New Credentials**
   - Click on new database
   - Go to "REST API" tab
   - Copy:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

4. **Update Vercel Environment Variables**
   - Go to https://vercel.com/dashboard
   - Select `moood-refactor` project
   - Settings → Environment Variables
   - Update:
     - `KV_REST_API_URL` = new REST URL
     - `KV_REST_API_TOKEN` = new REST token
   - Click "Save"

5. **Redeploy**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Uncheck "Use existing Build Cache"
   - Click "Redeploy"

6. **Update Local .env.local**
   ```bash
   KV_REST_API_URL=your_new_url_here
   KV_REST_API_TOKEN=your_new_token_here
   ```

7. **Test**
   - Try saving a pin
   - Should work now!

## ⚠️ Important Notes

- **Old pins are in old database** - they won't appear in new one
- This is a **temporary solution** to unblock you
- You'll start fresh with 0 pins
- Old database still has 500K limit

## After This Works

You can decide:
- Keep new database and start fresh
- Or upgrade old database plan and migrate data back

## Need Help?

Let me know when you're ready and I'll help you through each step.
