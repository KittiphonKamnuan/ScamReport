# Authentication System - Fixes Applied

## วันที่: 30 ตุลาคม 2025

---

## สรุปปัญหาที่พบและแก้ไข

### 🔴 1. Token Storage Mismatch (CRITICAL) - แก้ไขแล้ว ✅

**ปัญหา:**
```javascript
// AuthContext.jsx: เก็บ token แบบนี้
localStorage.setItem('user', JSON.stringify(userData));
// userData = { token, email, name, role, groups }

// api.js & complaintApi.js: แต่ดึงแบบนี้
const token = localStorage.getItem('authToken');  // ❌ KEY MISMATCH!
```

**ผลกระทบ:**
- Token ไม่ถูก attach ใน API request headers
- API requests ถูกปฏิเสธด้วย 401 Unauthorized
- ผู้ใช้ถูก redirect ไปหน้า login ทันที

**วิธีแก้:**
- แก้ไข `AuthContext.jsx` ให้เก็บ token แยก:
  ```javascript
  localStorage.setItem('authToken', userData.token);
  localStorage.setItem('user', JSON.stringify(userData));
  ```
- ตอนนี้ API จะดึง token ได้อย่างถูกต้อง

**ไฟล์ที่แก้:** `src/context/AuthContext.jsx` (lines 76-77, 108-109)

---

### 🔴 2. Missing Token Refresh Logic - แก้ไขแล้ว ✅

**ปัญหา:**
- JWT tokens มีอายุจำกัด (โดยทั่วไป 1 ชั่วโมง)
- ไม่มีกลไกการ refresh token อัตโนมัติ
- Session หลุดหลังจาก token หมดอายุ

**วิธีแก้:**
- เพิ่ม `startTokenRefresh()` function ใน AuthContext
- ตั้ง interval ให้ refresh token ทุก 50 นาที
- ใช้ `cognitoService.refreshToken()` เพื่อขอ token ใหม่
- หาก refresh ล้มเหลว → force logout

```javascript
// Auto-refresh token every 50 minutes
refreshTimerRef.current = setInterval(async () => {
  try {
    const newToken = await cognitoService.refreshToken();
    // Update token in state and storage
  } catch (error) {
    logout(); // Force logout if refresh fails
  }
}, 50 * 60 * 1000);
```

**ไฟล์ที่แก้:** `src/context/AuthContext.jsx` (lines 26-54)

---

### 🔴 3. Unsafe `localStorage.clear()` - แก้ไขแล้ว ✅

**ปัญหา:**
```javascript
// cognito.js - logout function
logout: async () => {
  await signOut({ global: true });
  localStorage.clear();  // ❌ ลบ ALL localStorage!
}
```

**ผลกระทบ:**
- ลบข้อมูลทั้งหมดใน localStorage ไม่ใช่แค่ auth-related
- สูญเสีย user preferences, app settings
- อาจส่งผลต่อฟีเจอร์อื่นๆ

**วิธีแก้:**
```javascript
logout: async () => {
  try {
    await signOut({ global: true });
  } finally {
    // Only clear auth-related items
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.clear();
  }
}
```

**ไฟล์ที่แก้:**
- `src/services/cognito.js` (lines 53-64)
- `src/context/AuthContext.jsx` (lines 124-142)

---

### 🔴 4. Hardcoded Test Credentials - แก้ไขแล้ว ✅

**ปัญหา:**
```javascript
// Login.jsx
const fillTestAccount = (type) => {
  setEmail('admin@thaipbs.or.th');
  setPassword('Admin@2025');  // ❌ Hardcoded!
}
```

**ความเสี่ยง:**
- Credentials visible ใน source code
- ถูกเก็บใน Git history
- Anyone can steal credentials

**วิธีแก้:**
1. ย้าย credentials ไปไว้ใน `.env` file
2. ซ่อนปุ่ม test accounts ใน production mode
3. เพิ่ม warning เมื่อใช้ใน production

```javascript
// Only show in development
{import.meta.env.MODE === 'development' && (
  <div>Test Accounts...</div>
)}

// Use environment variables
setEmail(import.meta.env.VITE_TEST_ADMIN_EMAIL || '');
setPassword(import.meta.env.VITE_TEST_ADMIN_PASSWORD || '');
```

**ไฟล์ที่แก้:**
- `src/components/auth/Login.jsx` (lines 37-54, 145-163)
- `.env` (lines 11-15)

---

### ✅ 5. Improved Error Handling

**การปรับปรุง:**
- เพิ่ม try-catch blocks ที่ครอบคลุม
- แสดง error messages ที่เป็นภาษาไทย
- Log errors เพื่อ debugging
- Graceful fallback เมื่อเกิด error

**ตัวอย่าง:**
```javascript
const login = async (email, password) => {
  try {
    setError(null);
    setLoading(true);
    const userData = await cognitoService.login(email, password);
    // ...
  } catch (err) {
    console.error('Login error:', err);
    setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    throw err;
  } finally {
    setLoading(false);
  }
};
```

---

### ✅ 6. Session Management Improvements

**การปรับปรุง:**
- เพิ่ม `checkUser()` function ที่แข็งแกร่ง
- ตรวจสอบ session เมื่อ app load
- Clear data เมื่อเกิด error
- Cleanup timer เมื่อ component unmount

```javascript
useEffect(() => {
  return () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
  };
}, []);
```

---

## โครงสร้างการทำงานใหม่

### Authentication Flow
```
1. User เข้าสู่ระบบ
   ↓
2. Cognito authenticate → return tokens
   ↓
3. Store tokens:
   - localStorage.setItem('authToken', token)
   - localStorage.setItem('user', userData)
   ↓
4. Start token refresh timer (50 minutes)
   ↓
5. API calls → attach token from 'authToken' key
   ↓
6. Token refresh every 50 minutes
   ↓
7. Logout → clear only auth-related storage
```

### Token Storage Structure
```javascript
// localStorage
{
  "authToken": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "user": {
    "email": "admin@thaipbs.or.th",
    "name": "Admin User",
    "role": "Admins",
    "groups": ["Admins"],
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI..."
  }
}
```

---

## ไฟล์ที่ได้รับการแก้ไข

| ไฟล์ | การเปลี่ยนแปลง | Status |
|------|----------------|--------|
| `src/context/AuthContext.jsx` | - แก้ token storage mismatch<br>- เพิ่ม token refresh logic<br>- ปรับปรุง error handling<br>- เพิ่ม cleanup logic | ✅ แก้ไขแล้ว |
| `src/services/cognito.js` | - แก้ logout ให้ไม่ clear all localStorage<br>- เพิ่ม error handling | ✅ แก้ไขแล้ว |
| `src/components/auth/Login.jsx` | - ลบ hardcoded credentials<br>- ใช้ environment variables<br>- ซ่อนปุ่มใน production | ✅ แก้ไขแล้ว |
| `.env` | - เพิ่ม test credentials variables | ✅ แก้ไขแล้ว |

---

## การทดสอบที่แนะนำ

### 1. Login Flow
```bash
# Test login
1. เปิดหน้า /login
2. กด "Admin" test button (development mode)
3. คลิก Login
4. ตรวจสอบ:
   ✓ Redirect ไป /admin/dashboard
   ✓ localStorage มี 'authToken' และ 'user'
   ✓ ไม่มี error ใน console
```

### 2. Token Refresh
```bash
# Test token refresh
1. Login สำเร็จ
2. เปิด Console → พิมพ์:
   localStorage.getItem('authToken')
3. รอ 50 นาที (หรือเปลี่ยน interval เป็น 1 นาทีเพื่อทดสอบ)
4. ตรวจสอบ console log:
   ✓ "Refreshing token..."
   ✓ "Token refreshed successfully"
5. Check localStorage:
   ✓ 'authToken' ถูกอัพเดท (token ใหม่)
```

### 3. API Calls with Token
```bash
# Test API with token
1. Login สำเร็จ
2. Navigate ไป /admin/complaints
3. เปิด Network tab ใน DevTools
4. ตรวจสอบ API requests:
   ✓ Headers มี: Authorization: Bearer eyJ...
   ✓ Status: 200 OK
   ✓ ไม่ถูก redirect ไป /login
```

### 4. Logout
```bash
# Test logout
1. Login สำเร็จ
2. คลิก Logout
3. ตรวจสอบ:
   ✓ Redirect ไป /login
   ✓ localStorage ไม่มี 'authToken' และ 'user'
   ✓ sessionStorage ถูก clear
   ✓ Cognito session ถูก terminate
```

### 5. Production Mode
```bash
# Test production behavior
1. Build for production:
   npm run build
2. Preview:
   npm run preview
3. ตรวจสอบ:
   ✓ ปุ่ม test accounts ถูกซ่อน
   ✓ console.warn แสดงเมื่อพยายามใช้ test accounts
```

---

## Environment Variables ที่ต้องตั้งค่า

### Development (.env)
```env
# Cognito
VITE_USER_POOL_ID=us-east-1_HLIRkxHcy
VITE_CLIENT_ID=655kqsglcp5ggp6ciffvgckc9h
VITE_REGION=us-east-1

# API
VITE_API_BASE_URL=https://clri55iabcwyy7763456lqxhl40owzlg.lambda-url.us-east-1.on.aws

# Test Credentials (Development Only)
VITE_TEST_ADMIN_EMAIL=admin@thaipbs.or.th
VITE_TEST_ADMIN_PASSWORD=Admin@2025
VITE_TEST_JOURNALIST_EMAIL=journalist@thaipbs.or.th
VITE_TEST_JOURNALIST_PASSWORD=Journalist@2025
```

### Production (.env.production)
```env
# Cognito
VITE_USER_POOL_ID=your_production_pool_id
VITE_CLIENT_ID=your_production_client_id
VITE_REGION=us-east-1

# API
VITE_API_BASE_URL=https://your-production-api.com

# NO TEST CREDENTIALS IN PRODUCTION!
```

---

## Security Improvements

### ✅ Implemented
1. Token storage consistency (authToken key)
2. Automatic token refresh (50 minutes)
3. Selective localStorage clearing
4. Environment-based credential management
5. Development-only test accounts
6. Improved error handling

### 🟡 Recommended (Future)
1. **HttpOnly Cookies**: ย้าย token จาก localStorage ไป HttpOnly cookies
2. **CSRF Protection**: เพิ่ม CSRF token ใน API requests
3. **Rate Limiting**: จำกัดจำนวนครั้งการ login
4. **MFA**: เพิ่ม Multi-Factor Authentication
5. **Session Timeout Warning**: แจ้งเตือนก่อน token หมดอายุ
6. **Audit Logging**: บันทึก login/logout events

---

## Breaking Changes

### สำหรับ Developers
1. **Token Key Changed**:
   - เดิม: `localStorage.getItem('user').token`
   - ใหม่: `localStorage.getItem('authToken')`

2. **Logout Behavior**:
   - เดิม: ลบ all localStorage
   - ใหม่: ลบเฉพาะ auth-related keys

3. **Test Accounts**:
   - เดิม: Hardcoded ในโค้ด
   - ใหม่: อ่านจาก environment variables

---

## Troubleshooting

### ปัญหา: API ยังได้ 401 Unauthorized
**สาเหตุ:**
- Token ไม่ได้ถูกส่งใน headers
- Token หมดอายุ

**วิธีแก้:**
1. ตรวจสอบ localStorage:
   ```javascript
   console.log(localStorage.getItem('authToken'));
   ```
2. ตรวจสอบ API headers ใน Network tab
3. Force refresh:
   ```javascript
   const { refreshSession } = useAuth();
   await refreshSession();
   ```

### ปัญหา: Token refresh ไม่ทำงาน
**สาเหตุ:**
- Cognito session หมดอายุ
- Network error

**วิธีแก้:**
1. ตรวจสอบ console logs
2. Login ใหม่
3. ตรวจสอบ Cognito configuration

### ปัญหา: Test accounts ไม่ปรากฏ
**สาเหตุ:**
- รันใน production mode

**วิธีแก้:**
1. ตรวจสอบ:
   ```javascript
   console.log(import.meta.env.MODE);
   ```
2. รันด้วย:
   ```bash
   npm run dev  # development mode
   ```

---

## API Changes Required (Backend)

เพื่อให้ระบบ authentication สมบูรณ์แบบ Backend ควรมี:

1. **Token Validation Middleware**
   ```javascript
   // Validate JWT token ในทุก protected routes
   const validateToken = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     // Verify with Cognito
   };
   ```

2. **Role-Based Access Control**
   ```javascript
   // Check user roles/groups
   const checkRole = (requiredRole) => (req, res, next) => {
     if (!user.groups.includes(requiredRole)) {
       return res.status(403).json({ error: 'Forbidden' });
     }
     next();
   };
   ```

3. **CSRF Token Endpoint**
   ```javascript
   app.get('/api/csrf-token', (req, res) => {
     res.json({ csrfToken: generateCSRFToken() });
   });
   ```

---

## Support

หากพบปัญหาหรือมีคำถาม:
1. ตรวจสอบ Console logs
2. ตรวจสอบ Network tab ใน DevTools
3. ตรวจสอบ localStorage values
4. ดูเอกสารเพิ่มเติมที่ `docs/API_DOCUMENTATION.md`

---

**Last Updated:** 30 ตุลาคม 2025
**Version:** 1.0.0
**Status:** ✅ All Critical Issues Fixed
