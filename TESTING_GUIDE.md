# 🧪 Payment Flow Testing Guide - Complete Circuit

## ✅ Pre-Test Setup Complete

**User ID**: 391237238395566146  
**Status**: FREE (0/3 downloads used)  
**Ready**: ✅ Yes

---

## 📋 Test Steps

### Step 1: Verify Initial State ✅

1. **Close and reopen the plugin** in Figma
2. **Expected**:
   - Badge shows: "3 FREE DOWNLOADS"
   - All PRO toggles are OFF and disabled
   - No "PRO ACTIVE" badge

**Console should show**:
```
📡 [Backend Sync] Status: FREE, Downloads: 0
```

---

### Step 2: First Download (1/3) ✅

1. Search for something (e.g., "landing page")
2. Toggle ON "Mood board" only
3. Click the download button (FAB)
4. **Expected**:
   - Download succeeds
   - Badge updates to: "2 FREE DOWNLOADS"
   - Console shows: `Downloads: 1/3`

---

### Step 3: Second Download (2/3) ✅

1. Do another search
2. Toggle ON "Mood board" only
3. Click download
4. **Expected**:
   - Download succeeds
   - Badge updates to: "1 FREE DOWNLOAD"
   - Console shows: `Downloads: 2/3`

---

### Step 4: Third Download (3/3) ✅

1. Do another search
2. Toggle ON "Mood board" only
3. Click download
4. **Expected**:
   - Download succeeds
   - Badge updates to: "0 FREE DOWNLOADS"
   - Console shows: `Downloads: 3/3`
   - **PRO toggles become disabled** (grayed out)

---

### Step 5: Fourth Download - Triggers Upgrade ⚠️

1. Do another search
2. Try to toggle ON any PRO feature (Color palette, Type scale, Figma styles, etc.)
3. **Expected**:
   - Toggle doesn't turn ON
   - **Upgrade drawer opens automatically**
   - Shows "Unlock Lifetime Access" button
   - Shows pricing and features

**Console should show**:
```
🚫 [Limit] Free downloads exhausted. Showing upgrade prompt.
```

---

### Step 6: Initiate Payment 💳

1. In the upgrade drawer, click **"Unlock Lifetime Access"**
2. **Expected**:
   - Button changes to "Processing..."
   - Console shows: `💳 Initiating Stripe Checkout...`
   - Stripe checkout opens in new window
   - Console shows: `🔄 Starting payment verification polling...`

---

### Step 7: Complete Payment 💰

**In Stripe Checkout Window**:
1. Enter test card: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., `12/34`)
3. CVC: Any 3 digits (e.g., `123`)
4. Email: Any email
5. Click **"Pay"**

**Expected**:
- Payment processes successfully
- Redirects to success page

---

### Step 8: Success Page Verification ✨

**On Success Page**:

**Phase 1 - Verifying (0-10 seconds)**:
- ✅ Shows checkmark icon
- ✅ Title: "Payment Successful!"
- ✅ Spinner with "Verifying your PRO status..."
- ✅ Three animated dots
- ✅ "Close Window" button disabled (grayed)

**Console should show**:
```
🎉 [Success Page] Payment successful for user: 391237238395566146
🚀 [Success Page] Starting PRO status verification...
🔍 [Success Page] Verification attempt 1/30
📡 [Success Page] Status response: {...}
```

**Phase 2 - Confirmed (after 2-10 seconds)**:
- ✅ Icon changes to 🎉
- ✅ Title: "Viiibe Pro Unlocked!"
- ✅ Status: "✅ Your PRO status has been activated!"
- ✅ Confetti animation plays 🎊
- ✅ "Close Window" button enabled
- ✅ Window auto-closes after 5 seconds

**Console should show**:
```
✅ [Success Page] PRO status confirmed!
🎊 [Success Page] PRO confirmed! Updating UI...
🎉 [Success Page] Setting localStorage flag for plugin...
```

---

### Step 9: Plugin Auto-Update 🔄

**Back in Figma Plugin** (should happen automatically):

**Console should show**:
```
🎊 [Payment Monitor] Detected PRO activation flag!
📡 [Backend Sync] Checking status for user: 391237238395566146
✨ [Sync] PRO status just activated!
⏹️ [Polling] Stopped polling - PRO confirmed
```

**Visual Changes**:
- ✅ Toast notification: "🎉 Viiibe Pro Unlocked!"
- ✅ Badge changes to: "VIIIBE! PRO ACTIVE" (green)
- ✅ "Unlock Pro" button disappears
- ✅ Upgrade drawer closes automatically
- ✅ All PRO toggles become enabled

---

### Step 10: Verify PRO Features Unlocked ✅

1. Do a new search
2. Try toggling ON all options:
   - ✅ Mood board
   - ✅ Color palette
   - ✅ Type scale
   - ✅ Figma styles
   - ✅ Figma variables
   - ✅ Basic components

3. Click download
4. **Expected**:
   - All selected features download successfully
   - No upgrade prompts
   - No download limits

---

### Step 11: Persistence Check 🔒

1. **Close the plugin completely**
2. **Reopen the plugin**
3. **Expected**:
   - Badge still shows: "VIIIBE! PRO ACTIVE"
   - All PRO features still enabled
   - No need to verify payment again

**Console should show**:
```
📡 [Backend Sync] Status: PRO, Downloads: 0
```

---

## ✅ Success Criteria

All of these must be TRUE:

- [ ] Initial state shows 3 FREE DOWNLOADS
- [ ] First 3 downloads work correctly
- [ ] 4th download triggers upgrade prompt
- [ ] Payment checkout opens successfully
- [ ] Success page verifies PRO (< 10 seconds)
- [ ] Plugin auto-updates to show PRO
- [ ] All PRO features unlock
- [ ] PRO status persists after plugin reload
- [ ] No CORS errors in console
- [ ] No manual refresh needed

---

## 🐛 Troubleshooting

### Issue: Success page doesn't verify
**Wait up to 60 seconds** - webhook may be slow

### Issue: Plugin doesn't auto-update
1. Check console for localStorage monitor logs
2. Manually close success window
3. Refresh plugin (close/reopen)

### Issue: Still shows FREE after payment
1. Check console for errors
2. Use debug tool: https://viiibe-backend.vercel.app/debug-payment.html
3. Verify userId: 391237238395566146

---

## 📊 Expected Timeline

| Event | Time |
|-------|------|
| Downloads 1-3 | Instant |
| 4th download → Upgrade | Instant |
| Payment → Success page | ~5 seconds |
| Success page → PRO verified | 2-10 seconds |
| Plugin auto-update | 1-3 seconds |
| **Total time** | **< 20 seconds** |

---

## 🎯 Current Status

**Your account is ready for testing:**
- ✅ Reset to FREE
- ✅ 0/3 downloads used
- ✅ Plugin compiled with fixes
- ✅ Backend deployed with fixes

**Next step**: Close and reopen the plugin to start testing! 🚀

---

## 📝 Notes

- Use Stripe test mode card: `4242 4242 4242 4242`
- All console logs are prefixed with emojis for easy filtering
- Success page has detailed logging for debugging
- Plugin has localStorage monitor running in background
- Polling is aggressive (2-3 second intervals) for fast detection

---

**Ready to test?** Start with Step 1! ✅
