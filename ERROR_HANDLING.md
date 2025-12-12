# 🛡️ Error Handling & Edge Cases

## Error Handling Strategy

### 1. Authentication Errors

**Location:** `src/contexts/AuthContext.jsx`

**Handled Errors:**
- `auth/email-already-in-use` → "Email này đã được sử dụng"
- `auth/invalid-email` → "Email không hợp lệ"
- `auth/weak-password` → "Mật khẩu quá yếu (tối thiểu 6 ký tự)"
- `auth/user-not-found` → "Không tìm thấy tài khoản với email này"
- `auth/wrong-password` → "Sai mật khẩu"
- `auth/too-many-requests` → "Quá nhiều lần thử. Vui lòng thử lại sau"
- `auth/network-request-failed` → "Lỗi kết nối mạng"

**User Experience:**
- Errors displayed in red box above form
- Cleared when user submits new attempt
- Don't block UI - user can retry immediately

---

### 2. Firestore Errors

**Location:** `src/firebase/firestore.js`

**Handled Operations:**
- `getUserHistory()` → Throws "Không thể tải lịch sử tìm kiếm"
- `addToHistory()` → Throws "Không thể lưu lịch sử tìm kiếm"
- `removeFromHistory()` → Throws "Không thể xóa lịch sử tìm kiếm"
- `clearHistory()` → Throws "Không thể xóa lịch sử tìm kiếm"
- `migrateLocalStorageHistory()` → Silent fail (non-critical)

**Error Recovery:**
- Real-time listener auto-reconnects on network restore
- Offline persistence provides cached data
- Migration failures don't block signup

---

### 3. Network Errors

**Scenarios Handled:**

#### Offline During Auth
```javascript
// Firebase Auth works offline with cached credentials
// User can still access app if previously logged in
```

#### Offline During Firestore Sync
```javascript
// Firestore offline persistence kicks in
// Writes queued until network restored
// User sees cached data
```

#### Connection Status Indicator (Optional Enhancement)
```javascript
// Could add to App.jsx:
const [online, setOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setOnline(true);
  const handleOffline = () => setOffline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Show banner when offline:
{!online && <div>⚠️ Đang ngoại tuyến</div>}
```

---

### 4. Validation Errors

**Client-side Validation:**

#### Login.jsx / Signup.jsx / ForgotPassword.jsx
- Empty fields → "Vui lòng nhập đầy đủ thông tin"
- Invalid email format → "Email không hợp lệ"
- Password too short → "Mật khẩu phải có ít nhất 6 ký tự"
- Password mismatch → "Mật khẩu xác nhận không khớp"

**Why Client-side First?**
- Instant feedback (no network round-trip)
- Reduces Firebase quota usage
- Better UX

---

### 5. Edge Cases Handled

#### Edge Case 1: Rapid Duplicate Searches
**Problem:** User searches same query 3x in 1 second
**Solution:** `addToHistory()` calls `removeFromHistory()` first
**Result:** Only 1 entry in Firestore

#### Edge Case 2: Multiple Tabs Open
**Problem:** Firestore persistence can only enable in 1 tab
**Solution:** Catch `failed-precondition` error, log warning, continue
**Result:** First tab has offline support, others work online-only

#### Edge Case 3: Browser Doesn't Support Persistence
**Problem:** Some browsers (older iOS Safari) don't support IndexedDB
**Solution:** Catch `unimplemented` error, log warning, continue
**Result:** App works without offline persistence

#### Edge Case 4: User Deletes Account in Firebase Console
**Problem:** App still has cached auth state
**Solution:** Firebase Auth listener detects deletion → `onAuthStateChanged(null)`
**Result:** User automatically redirected to login

#### Edge Case 5: Firestore Rules Not Deployed
**Problem:** User gets "permission denied" on all operations
**Solution:** Clear error in console + deployment guide in README
**Result:** Developer can quickly diagnose and fix

#### Edge Case 6: Migration During Active Search
**Problem:** User adds new search while migration is running
**Solution:** Migration checks for existing entries, merges unique ones
**Result:** No duplicates, no data loss

#### Edge Case 7: Very Long Search Query
**Problem:** User pastes 1000-char string
**Solution:** Firestore rules validate `query.size() <= 200`
**Result:** Write rejected, user sees error

#### Edge Case 8: Special Characters in Query
**Problem:** User searches "Hồ Chí Minh 🏙️"
**Solution:** Firestore supports UTF-8, emoji stored correctly
**Result:** Works as expected

#### Edge Case 9: Concurrent Writes from Multiple Devices
**Problem:** User adds same query from phone and laptop simultaneously
**Solution:** Firestore handles with last-write-wins (timestamp)
**Result:** Both writes succeed, real-time listener shows correct state

#### Edge Case 10: Auth Token Expiration
**Problem:** User leaves tab open for days, token expires
**Solution:** Firebase Auth auto-refreshes tokens
**Result:** User stays logged in, no manual re-login needed

---

## 🔥 Critical Error Scenarios

### Scenario 1: Firebase Project Deleted
**Symptoms:** All API calls return 404
**User Impact:** Cannot login, cannot access app
**Recovery:**
1. Developer must create new Firebase project
2. Update `.env` with new credentials
3. Redeploy rules
4. Users must re-register (data lost)

### Scenario 2: Firestore Quota Exceeded
**Symptoms:** Writes return "quota exceeded" error
**User Impact:** Cannot save new searches, can read existing
**Recovery:**
1. Upgrade to Blaze plan (pay-as-you-go)
2. OR wait until quota resets (daily)
3. OR optimize queries (add caching, reduce writes)

### Scenario 3: Invalid Firestore Rules
**Symptoms:** All operations return "permission denied"
**User Impact:** Cannot read/write history
**Recovery:**
1. Check Firebase Console → Firestore → Rules
2. Deploy correct rules from `firestore.rules`
3. Test with Simulator in Console

### Scenario 4: CORS Error (Wrong Domain)
**Symptoms:** Firebase requests blocked by browser
**User Impact:** Cannot authenticate
**Recovery:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your domain (localhost is pre-authorized)

---

## 🎯 Error Monitoring (Future Enhancement)

### Sentry Integration (Optional)
```javascript
// In main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});

// Wrap App
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <AuthProvider>
    <App />
  </AuthProvider>
</Sentry.ErrorBoundary>
```

### Firebase Crashlytics (For Mobile)
```javascript
// If building with Capacitor/React Native
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().log('User signed in.');
```

---

## ✅ Error Handling Checklist

Before deploying:

- [ ] All Firebase errors translated to Vietnamese
- [ ] All validation errors show in UI
- [ ] Network errors handled gracefully
- [ ] Offline persistence enabled and tested
- [ ] Edge cases documented
- [ ] Console logs removed (except warnings)
- [ ] Error messages user-friendly
- [ ] No stack traces shown to users
- [ ] Critical errors have recovery paths
- [ ] Quota limits monitored

---

## 📞 User Support Template

When users report issues:

```
Thank you for reporting this issue. Please help us diagnose:

1. What were you trying to do?
2. What error message did you see?
3. Are you on mobile or desktop?
4. What browser are you using?
5. Can you share a screenshot?

Common solutions:
- Clear browser cache and cookies
- Try incognito mode
- Check your internet connection
- Try a different browser

If problem persists, please share the following:
- Browser console logs (F12 → Console)
- Network requests (F12 → Network)
```