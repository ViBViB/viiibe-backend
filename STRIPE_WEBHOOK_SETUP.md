# 🔧 Stripe Webhook Configuration Guide

## 🚨 Problem Identified

The Stripe webhook is **NOT firing** after payment completion. This is why the success page gets stuck on "Verifying..." and PRO status is not automatically activated.

**Evidence from console**:
```
Poll attempt 41/60, 42/60, 43/60...
is_pro: false
status: 'FREE'
```

This means the payment completed in Stripe, but the webhook didn't update the database.

---

## ✅ Solution: Configure Stripe Webhook

### Step 1: Access Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Log in with your Stripe account

### Step 2: Check Existing Webhooks

Look for a webhook with:
- **Endpoint URL**: `https://viiibe-backend.vercel.app/api/stripe-webhook`
- **Events**: `checkout.session.completed`

**If it exists**:
- Click on it
- Check "Recent events" tab
- Look for errors (red indicators)
- Verify the endpoint is responding

**If it doesn't exist** → Continue to Step 3

### Step 3: Create New Webhook

1. Click **"Add endpoint"** button
2. **Endpoint URL**: 
   ```
   https://viiibe-backend.vercel.app/api/stripe-webhook
   ```
3. **Description**: `Viiibe PRO activation webhook`
4. **Events to send**:
   - Click "Select events"
   - Search for: `checkout.session.completed`
   - Check the box
   - Click "Add events"
5. Click **"Add endpoint"**

### Step 4: Get Webhook Signing Secret

After creating the webhook:
1. Click on the webhook you just created
2. In the "Signing secret" section, click **"Reveal"**
3. Copy the secret (starts with `whsec_...`)

### Step 5: Add Secret to Vercel

1. Go to: https://vercel.com/alberto-s-team/viiibe-backend/settings/environment-variables
2. Find or create: `STRIPE_WEBHOOK_SECRET`
3. Paste the signing secret from Step 4
4. Save

### Step 6: Redeploy Backend

After adding the environment variable:
```bash
cd /Users/elnegro/Figma-plugins/viiibe-plugin
vercel --prod
```

---

## 🧪 Test the Webhook

### Option 1: Send Test Event (Recommended)

1. In Stripe Dashboard → Webhooks
2. Click on your webhook
3. Click "Send test webhook"
4. Select event: `checkout.session.completed`
5. Click "Send test webhook"
6. Check if it shows "Success" (green checkmark)

### Option 2: Real Payment Test

1. Reset your account to FREE
2. Make a test payment
3. Watch the webhook events in Stripe Dashboard
4. Should see `checkout.session.completed` event
5. Should show 200 response (success)

---

## 🐛 Troubleshooting

### Webhook Shows Errors

**Common issues**:

1. **401 Unauthorized**
   - Webhook secret is wrong
   - Re-copy the secret from Stripe
   - Update in Vercel environment variables
   - Redeploy

2. **500 Internal Server Error**
   - Check Vercel logs: `vercel logs viiibe-backend --prod`
   - Look for errors in the webhook handler
   - Verify `STRIPE_SECRET_KEY` is set in Vercel

3. **Timeout**
   - Webhook endpoint is too slow
   - Check Vercel function logs
   - May need to optimize the webhook handler

### Webhook Not Firing

1. **Verify endpoint URL** is exactly:
   ```
   https://viiibe-backend.vercel.app/api/stripe-webhook
   ```
2. **Verify event** is `checkout.session.completed`
3. **Check Stripe mode**:
   - Test mode webhooks only fire for test payments
   - Live mode webhooks only fire for live payments

---

## 📊 Expected Behavior After Fix

### When Payment Completes:

1. **Stripe** fires `checkout.session.completed` event
2. **Webhook** receives event at `/api/stripe-webhook`
3. **Webhook** extracts `userId` from session
4. **Webhook** updates database: `is_pro = true`
5. **Success page** polls and detects PRO (2-10 seconds)
6. **Plugin** auto-updates to show PRO

### Console Logs (Webhook):
```
🎉 [Webhook] Payment successful! Unlocking PRO for user: 391237238395566146
✅ [Webhook] User 391237238395566146 is now PERMANENTLY PRO in database
```

### Console Logs (Success Page):
```
✅ [Success Page] PRO status confirmed!
🎊 [Success Page] PRO confirmed! Updating UI...
```

---

## 🎯 Current Workaround

Until the webhook is configured, you can manually activate PRO after each test payment:

```bash
curl "https://viiibe-backend.vercel.app/api/admin-check-user?userId=391237238395566146&secret=viiibe-debug-2026&force=true"
```

Then refresh the success page (F5) and it will detect PRO.

---

## 📝 Verification Checklist

- [ ] Webhook exists in Stripe Dashboard
- [ ] Endpoint URL is correct
- [ ] Event `checkout.session.completed` is selected
- [ ] Webhook signing secret is in Vercel env vars
- [ ] Backend redeployed after adding secret
- [ ] Test webhook shows success (200 response)
- [ ] Real payment triggers webhook
- [ ] Database updates automatically
- [ ] Success page detects PRO in < 10 seconds

---

## 🚀 Next Steps

1. **Check Stripe Dashboard** for existing webhook
2. **Create webhook** if it doesn't exist
3. **Add signing secret** to Vercel
4. **Redeploy** backend
5. **Test** with a new payment

Once configured, the payment flow will work 100% automatically! 🎉

---

**Need help?** Share screenshots of:
1. Stripe webhooks page
2. Vercel environment variables
3. Any error messages
