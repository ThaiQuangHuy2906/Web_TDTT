# 🧪 Testing Guide - OSM-VN Authentication & Firestore

## Pre-Testing Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env` file in project root:
```bash
# Copy from Firebase Console → Project Settings → Your apps → Web app
VITE_WEATHER_API_KEY=b510378a429a542bd77a95855a1c454f
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Deploy Firestore Security Rules
```bash
# Via Firebase Console (easier)
1. Go to Firebase Console → Firestore Database → Rules
2. Copy content from firestore.rules
3. Click "Publish"

# OR via Firebase CLI
firebase login
firebase init firestore  # Only first time
firebase deploy --only firestore:rules
```

### 4. Start Dev Server
```bash
npm run dev
```

---

## 📋 Manual Testing Checklist

### ✅ Phase 1: Authentication Flow

#### Test Case 1.1: Signup
- [ ] Open app → Should see Login screen
- [ ] Click "Đăng ký ngay"
- [ ] Try empty form → Should show validation error
- [ ] Try invalid email (e.g., "test") → Should show "Email không hợp lệ"
- [ ] Try password < 6 chars → Should show "Mật khẩu phải có ít nhất 6 ký tự"
- [ ] Try mismatched passwords → Should show "Mật khẩu xác nhận không khớp"
- [ ] Enter valid credentials:
  - Email: `test@example.com`
  - Password: `test123`
  - Confirm: `test123`
- [ ] Click "Đăng ký"
- [ ] Should show loading state ("Đang đăng ký...")
- [ ] Should redirect to main app
- [ ] Should see user email in top-right corner

**Expected Firebase Console:**
- New user in Authentication → Users
- New document in Firestore → users/{uid}/searchHistory (if localStorage had history)

#### Test Case 1.2: Logout
- [ ] Click on email dropdown in top-right
- [ ] Click "🚪 Đăng xuất"
- [ ] Should redirect to Login screen
- [ ] Refresh page → Should still be on Login screen (session cleared)

#### Test Case 1.3: Login
- [ ] Enter credentials from Test 1.1
- [ ] Click "Đăng nhập"
- [ ] Should redirect to main app
- [ ] Refresh page → Should stay logged in (session persists)

#### Test Case 1.4: Wrong Credentials
- [ ] Logout
- [ ] Try login with wrong password
- [ ] Should show "Sai mật khẩu"
- [ ] Try non-existent email
- [ ] Should show "Không tìm thấy tài khoản với email này"

#### Test Case 1.5: Password Reset
- [ ] From Login screen, click "Quên mật khẩu?"
- [ ] Try empty form → Should show validation
- [ ] Enter valid email: `test@example.com`
- [ ] Click "Gửi email đặt lại"
- [ ] Should show success message
- [ ] Check email inbox (including spam folder)
- [ ] Click reset link in email
- [ ] Should open Firebase password reset page
- [ ] Set new password
- [ ] Return to app and login with new password

---

### ✅ Phase 2: Search History (Firestore)

#### Test Case 2.1: Add to History
- [ ] Login
- [ ] Search for "Hồ Chí Minh"
- [ ] Click search icon (or press Enter)
- [ ] Open search dropdown → Should see "Hồ Chí Minh" at top
- [ ] Check Firestore Console → Should see new document in `users/{uid}/searchHistory`

#### Test Case 2.2: History Deduplication
- [ ] Search "Hồ Chí Minh" again
- [ ] Open dropdown → Should still have only 1 entry (moved to top)
- [ ] Check Firestore → Should not have duplicate

#### Test Case 2.3: Remove from History
- [ ] Open search dropdown
- [ ] Click ✕ button next to a query
- [ ] Query should disappear immediately
- [ ] Check Firestore → Document should be deleted

#### Test Case 2.4: Clear All History
- [ ] Add multiple searches (Hanoi, Danang, etc.)
- [ ] Open dropdown
- [ ] Click "Xóa tất cả"
- [ ] Confirm the alert
- [ ] Dropdown should show "Chưa có lịch sử"
- [ ] Check Firestore → Collection should be empty

#### Test Case 2.5: Real-time Sync
- [ ] Login on Chrome
- [ ] Login on Firefox (or incognito) with same account
- [ ] Add search in Chrome
- [ ] Check Firefox dropdown → Should see new search appear (real-time)
- [ ] Remove search in Firefox
- [ ] Check Chrome → Should disappear

---

### ✅ Phase 3: Migration from localStorage

#### Test Case 3.1: First-time Login with Existing localStorage
- [ ] Clear Firebase user (delete from Auth console)
- [ ] Open browser console
- [ ] Run: `localStorage.setItem('search_history_v1', JSON.stringify(['Hanoi', 'Saigon', 'Danang']))`
- [ ] Signup with new account
- [ ] After signup, check Firestore → Should have 3 documents migrated
- [ ] Check localStorage → Key `search_history_v1` should be removed
- [ ] Open search dropdown → Should see all 3 queries

---

### ✅ Phase 4: Security & Edge Cases

#### Test Case 4.1: Firestore Security Rules
- [ ] Open browser console
- [ ] Try to access another user's data:
```javascript
// This should FAIL with permission denied
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
const otherUserHistory = await getDocs(collection(db, 'users/OTHER_USER_ID/searchHistory'));
```
- [ ] Should see error: "Missing or insufficient permissions"

#### Test Case 4.2: Offline Behavior
- [ ] Login and load some searches
- [ ] Open DevTools → Network tab → Check "Offline"
- [ ] Add new search
- [ ] Should see entry added immediately (optimistic UI)
- [ ] Re-enable network
- [ ] Check Firestore → Should sync successfully

#### Test Case 4.3: Network Errors
- [ ] Block Firebase domains in hosts file (advanced)
- [ ] Try to signup → Should show "Lỗi kết nối mạng"
- [ ] Unblock and retry → Should work

#### Test Case 4.4: Concurrent Tab Test
- [ ] Open app in 2 tabs
- [ ] Login in both
- [ ] Add search in Tab 1
- [ ] Tab 2 should update immediately
- [ ] Check console → Should see warning about persistence (only first tab)

---

### ✅ Phase 5: UI/UX Polish

#### Test Case 5.1: Dark Mode
- [ ] Toggle dark mode button
- [ ] Login screen should adapt
- [ ] Main app should adapt
- [ ] Check all components (SearchBar dropdown, UserProfile dropdown, etc.)
- [ ] No white flashes or inconsistencies

#### Test Case 5.2: Mobile Responsive
- [ ] Open DevTools → Toggle device toolbar
- [ ] Test iPhone SE (375px)
- [ ] Test iPad (768px)
- [ ] Login form should be readable
- [ ] Map controls should not overflow
- [ ] UserProfile dropdown should fit screen

#### Test Case 5.3: Loading States
- [ ] Clear browser cache
- [ ] Reload page → Should see LoadingScreen spinner
- [ ] Should not flash login screen before loading
- [ ] Login → Should see "Đang đăng nhập..." button state
- [ ] Signup → Should see "Đang đăng ký..."

#### Test Case 5.4: Error Messages
- [ ] All errors should be in Vietnamese
- [ ] No console errors (except expected Firebase warnings)
- [ ] Error messages should be clear and helpful

---

## 🐛 Common Issues & Solutions

### Issue 1: "Missing environment variable"
**Solution:** 
- Check `.env` file exists in project root
- Restart dev server (`npm run dev`)
- Verify all `VITE_FIREBASE_*` variables are set

### Issue 2: Firestore permission denied
**Solution:**
- Check Firestore rules are deployed
- Verify user is logged in
- Check userId matches in rules

### Issue 3: History not syncing
**Solution:**
- Check Firestore Console → Enable real-time updates
- Check browser console for errors
- Verify offline persistence didn't fail

### Issue 4: Login loop (stuck on login screen)
**Solution:**
- Clear browser cache and localStorage
- Check Firebase Console → Authentication → User exists
- Check browser console for auth errors

### Issue 5: Migration not working
**Solution:**
- Check localStorage key is exactly `search_history_v1`
- Check format is valid JSON array
- Check console logs for migration messages

---

## 📊 Performance Checks

### Firestore Quota Usage
- [ ] Firebase Console → Firestore → Usage
- [ ] Verify reads < 50K/day
- [ ] Verify writes < 20K/day
- [ ] If over, optimize with more aggressive caching

### Bundle Size
```bash
npm run build
# Check dist/assets/*.js sizes
# Main bundle should be < 500KB (gzipped)
```

### Lighthouse Score
- [ ] Open Chrome DevTools → Lighthouse
- [ ] Run audit
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 90

---

## ✅ Final Checklist

Before considering feature DONE:

- [ ] All 20+ test cases pass
- [ ] No console errors in production build
- [ ] Dark mode works everywhere
- [ ] Mobile responsive (tested on real device or emulator)
- [ ] Firestore security rules deployed
- [ ] Environment variables documented
- [ ] Firebase quota within free tier limits
- [ ] Login/Signup/Logout flow smooth
- [ ] History syncs across devices
- [ ] Migration from localStorage works
- [ ] Error messages user-friendly
- [ ] Loading states visible
- [ ] Session persists after refresh

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Phase 1 (Auth): __ / 5 passed
Phase 2 (History): __ / 5 passed
Phase 3 (Migration): __ / 1 passed
Phase 4 (Security): __ / 4 passed
Phase 5 (UI/UX): __ / 4 passed

Total: __ / 19 passed

Issues found:
1. ___________
2. ___________

Notes:
___________
```