# ✅ Quick Testing Checklist

## Setup
- [x] Account reset to FREE (0/3 downloads)
- [ ] Plugin closed and reopened
- [ ] Shows "3 FREE DOWNLOADS"

## Downloads 1-3
- [ ] Download 1 → Badge shows "2 FREE DOWNLOADS"
- [ ] Download 2 → Badge shows "1 FREE DOWNLOAD"
- [ ] Download 3 → Badge shows "0 FREE DOWNLOADS"

## Upgrade Flow
- [ ] Try to use PRO feature → Upgrade drawer opens
- [ ] Click "Unlock Lifetime Access"
- [ ] Stripe checkout opens
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Payment completes

## Success Page
- [ ] Shows "Verifying..." with spinner
- [ ] Changes to "PRO Unlocked!" (2-10s)
- [ ] Confetti animation plays
- [ ] Window auto-closes

## Plugin Update
- [ ] Toast: "🎉 Viiibe Pro Unlocked!"
- [ ] Badge: "VIIIBE! PRO ACTIVE" (green)
- [ ] All PRO toggles enabled
- [ ] No upgrade prompts

## Persistence
- [ ] Close and reopen plugin
- [ ] Still shows PRO ACTIVE
- [ ] Can use all PRO features

---

## 🚨 Red Flags

If you see any of these, STOP and report:
- ❌ CORS errors in console
- ❌ Success page stuck on "Verifying..." for > 60s
- ❌ Plugin doesn't update after payment
- ❌ PRO status doesn't persist

---

**Start**: Close/reopen plugin → Should show "3 FREE DOWNLOADS" ✅
