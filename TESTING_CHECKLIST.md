# ✅ Payment Flow Testing Checklist

## 🎯 Quick Test Guide

Use this checklist to verify the payment flow is working correctly.

---

## Pre-Test Setup

- [ ] Plugin built: `npm run build` ✅ (Already done)
- [ ] Backend deployed: `vercel --prod` ✅ (Already done)
- [ ] Figma plugin loaded from `dist/index.html`
- [ ] Browser Developer Tools open (Console tab)

---

## Test 1: Initial State ✅

- [ ] Plugin loads without errors
- [ ] Console shows: `🚀 Viiibe Plugin Loaded`
- [ ] Console shows: `📡 [Backend Sync] Checking status...`
- [ ] **NO CORS errors in console** ⚠️ CRITICAL
- [ ] Badge shows current download count or PRO status

**If you see CORS errors, STOP and report them.**

---

## Test 2: Payment Initiation ✅

- [ ] Click "Unlock Pro" button
- [ ] Console shows: `💳 Initiating Stripe Checkout...`
- [ ] Console shows: `✅ Checkout URL received: ...`
- [ ] Stripe checkout page opens in new window/tab
- [ ] Console shows: `🔄 Starting payment verification polling...`

---

## Test 3: Complete Payment ✅

### In Stripe Checkout:
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Enter any future expiry date (e.g., 12/34)
- [ ] Enter any 3-digit CVC (e.g., 123)
- [ ] Click "Pay" button
- [ ] Payment processes successfully

---

## Test 4: Success Page Verification ✅

### Visual Checks:
- [ ] Success page loads with checkmark icon
- [ ] Shows "Payment Successful!" title
- [ ] Shows spinner with "Verifying your PRO status..."
- [ ] Has 3 animated dots below status message
- [ ] "Close Window" button is disabled (grayed out)

### Console Checks (in success page):
- [ ] `🎉 [Success Page] Payment successful for user: ...`
- [ ] `🚀 [Success Page] Starting PRO status verification...`
- [ ] `🔍 [Success Page] Verification attempt 1/30`
- [ ] `📡 [Success Page] Status response: {...}`
- [ ] Multiple polling attempts (every 2 seconds)

### Success Detection (within 10 seconds):
- [ ] Console shows: `✅ [Success Page] PRO status confirmed!`
- [ ] Console shows: `🎊 [Success Page] PRO confirmed! Updating UI...`
- [ ] Icon changes to 🎉
- [ ] Title changes to "Viiibe Pro Unlocked!"
- [ ] Status shows: "✅ Your PRO status has been activated!"
- [ ] Confetti animation plays 🎊
- [ ] "Close Window" button becomes enabled
- [ ] Page auto-closes after 5 seconds

**If verification doesn't happen in 10 seconds, check console for errors.**

---

## Test 5: Plugin Auto-Update ✅

### Return to Plugin (or it should auto-update):

#### Console Checks:
- [ ] `🎊 [Payment Monitor] Detected PRO activation flag!`
- [ ] `📡 [Backend Sync] Checking status...`
- [ ] `✨ [Sync] PRO status just activated!`
- [ ] `⏹️ [Polling] Stopped polling - PRO confirmed`
- [ ] Toast notification appears

#### Visual Checks:
- [ ] Toast shows: "🎉 Viiibe Pro Unlocked!"
- [ ] Badge changes to "VIIIBE! PRO ACTIVE" (green text)
- [ ] "Unlock Pro" button disappears or is hidden
- [ ] All PRO toggles are now enabled
- [ ] No "3 free downloads" message

---

## Test 6: PRO Features Unlocked ✅

- [ ] Can toggle "Figma Styles" ON
- [ ] Can toggle "Figma Variables" ON
- [ ] Can toggle "Basic Components" ON
- [ ] No upgrade prompts appear
- [ ] Download counter shows 0 (or doesn't show for PRO)

---

## Test 7: Persistence Check ✅

- [ ] Close and reopen the plugin
- [ ] PRO status is still active
- [ ] Badge still shows "VIIIBE! PRO ACTIVE"
- [ ] No need to verify payment again

---

## 🐛 Common Issues & Solutions

### Issue: CORS Errors
```
❌ Access to fetch ... has been blocked by CORS policy
```
**Solution**: 
- Hard refresh plugin (Cmd+Shift+R)
- Verify deployment completed
- Check API is responding: `curl https://viiibe-backend.vercel.app/api/user-status?userId=test`

### Issue: Success Page Doesn't Verify
```
⏳ [Success Page] Not PRO yet, will retry...
```
**Possible causes**:
- Webhook hasn't fired yet (wait up to 60s)
- Stripe webhook not configured
- Check Stripe dashboard for webhook events

### Issue: Plugin Doesn't Auto-Update
```
No logs in plugin console
```
**Solution**:
- Check localStorage flag: `localStorage.getItem('viiibe_pro_activated')`
- Manually refresh plugin
- Check if polling is running: Look for `🔄 Poll attempt` logs

### Issue: PRO Status Not Persisting
**Solution**:
- Check Vercel KV database
- Verify user ID is correct
- Try manual verification: `/api/verify-payment?userId=YOUR_ID`

---

## 📊 Success Criteria

All of these should be TRUE:

✅ No CORS errors in console  
✅ Payment completes successfully  
✅ Success page verifies PRO in < 10 seconds  
✅ Plugin auto-updates to show PRO  
✅ PRO features are unlocked  
✅ Status persists after plugin reload  

---

## 🎯 Test Results

**Date**: _______________  
**Tester**: _______________  

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1. Initial State | ☐ | ☐ | |
| 2. Payment Initiation | ☐ | ☐ | |
| 3. Complete Payment | ☐ | ☐ | |
| 4. Success Page | ☐ | ☐ | |
| 5. Plugin Update | ☐ | ☐ | |
| 6. PRO Features | ☐ | ☐ | |
| 7. Persistence | ☐ | ☐ | |

**Overall Result**: ☐ PASS | ☐ FAIL

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🚀 Quick Commands

### Check API Status
```bash
curl -I https://viiibe-backend.vercel.app/api/user-status?userId=test
```

### Rebuild Plugin
```bash
npm run build
```

### Redeploy Backend
```bash
vercel --prod
```

### Check Vercel Logs
```bash
vercel logs viiibe-backend --prod
```

---

**Ready to test?** Start with Test 1 and work your way down! ✅
