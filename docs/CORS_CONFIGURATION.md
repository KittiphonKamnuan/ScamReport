# 🔒 CORS Configuration Guide

**Project:** ScamReport API
**Last Updated:** 2025-11-13
**Status:** ✅ Configured and Tested

---

## 📖 สารบัญ

1. [CORS คืออะไร](#cors-คืออะไร)
2. [การตั้งค่า CORS](#การตั้งค่า-cors)
3. [ผลการทดสอบ](#ผลการทดสอบ)
4. [วิธีการทดสอบ](#วิธีการทดสอบ)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 CORS คืออะไร

**CORS (Cross-Origin Resource Sharing)** คือกลไกความปลอดภัยของ browser ที่ป้องกันไม่ให้เว็บไซต์หนึ่งเข้าถึง API ของอีกเว็บไซต์หนึ่งโดยไม่ได้รับอนุญาต

### ตัวอย่างปัญหา

```
Frontend:  https://scamreport.vercel.app
API:       https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws

❌ ถ้าไม่มี CORS:
   Browser จะบล็อกการ request จาก frontend ไป API

✅ ถ้ามี CORS:
   API บอก browser ว่า "อนุญาตให้ scamreport.vercel.app เข้าถึงได้"
```

---

## ⚙️ การตั้งค่า CORS

### 1. Lambda Function URL Configuration

**Location:** AWS Lambda Console → Function URL → CORS

```yaml
Allow Origin:
  - http://localhost:5173
  - http://localhost:3000
  - https://scam-report.vercel.app

Allow Methods:
  - GET
  - POST
  - PUT
  - DELETE
  - OPTIONS

Allow Headers:
  - Content-Type
  - Authorization
  - X-Requested-With

Max Age: 3600 seconds
Allow Credentials: true
```

### 2. Environment Variables

**Location:** AWS Lambda Console → Configuration → Environment variables

```bash
Key:   ALLOWED_ORIGINS
Value: http://localhost:5173,http://localhost:3000,https://scam-report.vercel.app
```

**⚠️ Important:**
- ไม่มี space หลัง comma
- ไม่มี trailing slash (`/`)
- ตรวจสอบ http vs https ให้ถูกต้อง
- ห้ามใช้ wildcard `*` ใน production

### 3. Lambda Code Implementation

**File:** `lambda/index.js`

```javascript
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

function getCorsHeaders(origin) {
    const allowedOriginsList = ALLOWED_ORIGINS.split(',').map(o => o.trim());
    const allowedOrigin = allowedOriginsList.includes('*')
        ? '*'
        : (allowedOriginsList.includes(origin) ? origin : allowedOriginsList[0]);

    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '3600'
    };
}
```

---

## ✅ ผลการทดสอบ

**Test Date:** 2025-11-13
**API URL:** `https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws`

### Test Results Summary

| # | Origin | Expected | Result | Status |
|---|--------|----------|--------|--------|
| 1 | `http://localhost:5173` | Allow | `Access-Control-Allow-Origin: http://localhost:5173` | ✅ Pass |
| 2 | `http://localhost:3000` | Allow | Not tested yet | ⏳ Pending |
| 3 | `https://scam-report.vercel.app` | Allow | `Access-Control-Allow-Origin: https://scam-report.vercel.app` | ✅ Pass |
| 4 | `https://evil-hacker.com` | Block | `Access-Control-Allow-Origin: http://localhost:5173` | ✅ Blocked |
| 5 | OPTIONS Preflight | Allow | `200 OK` with CORS headers | ✅ Pass |

### Detailed Test Logs

#### ✅ Test 1: Localhost Development

**Request:**
```bash
curl -X GET "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/" \
  -H "Origin: http://localhost:5173"
```

**Response Headers:**
```http
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:5173
access-control-allow-headers: Content-Type,Authorization,X-Requested-With
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
access-control-max-age: 3600
access-control-allow-credentials: true
```

**Result:** ✅ **PASS** - Origin matched, request allowed

---

#### ✅ Test 2: Production URL

**Request:**
```bash
curl -X GET "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/" \
  -H "Origin: https://scam-report.vercel.app"
```

**Response Headers:**
```http
HTTP/1.1 200 OK
access-control-allow-origin: https://scam-report.vercel.app
access-control-allow-headers: Content-Type,Authorization,X-Requested-With
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
access-control-max-age: 3600
access-control-allow-credentials: true
```

**Result:** ✅ **PASS** - Production origin allowed

---

#### ✅ Test 3: Unauthorized Origin (Security Test)

**Request:**
```bash
curl -X GET "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/" \
  -H "Origin: https://evil-hacker.com"
```

**Response Headers:**
```http
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:5173
```

**Analysis:**
- Request origin: `https://evil-hacker.com`
- Response origin: `http://localhost:5173`
- **Origins don't match** → Browser will block! ✅

**Result:** ✅ **PASS** - Unauthorized origin blocked by browser CORS policy

---

#### ✅ Test 4: OPTIONS Preflight Request

**Request:**
```bash
curl -X OPTIONS "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/complaints" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
```

**Response Headers:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Headers: content-type,authorization,x-requested-with
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Max-Age: 3600
Access-Control-Allow-Credentials: true
```

**Result:** ✅ **PASS** - Preflight request handled correctly

---

## 🧪 วิธีการทดสอบ

### Method 1: Using cURL (Command Line)

#### Test Allowed Origin
```bash
curl -X GET "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/" \
  -H "Origin: http://localhost:5173" \
  -i
```

**Expected:** `access-control-allow-origin: http://localhost:5173`

#### Test Blocked Origin
```bash
curl -X GET "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/" \
  -H "Origin: https://unauthorized-site.com" \
  -i
```

**Expected:** `access-control-allow-origin: http://localhost:5173` (not matching request origin)

#### Test OPTIONS Preflight
```bash
curl -X OPTIONS "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/table/complaints" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -i
```

**Expected:** `200 OK` with CORS headers

---

### Method 2: Using Browser Console

**Open Developer Tools → Console:**

```javascript
// Test API call from frontend
fetch('https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/')
  .then(response => response.json())
  .then(data => {
    console.log('✅ CORS Working!', data);
  })
  .catch(error => {
    console.error('❌ CORS Error:', error);
  });
```

**Expected Result:**
- ✅ No CORS error
- ✅ Data returned successfully

---

### Method 3: Using React App

**File:** `src/App.jsx`

```javascript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Test CORS on component mount
    fetch('https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws/')
      .then(r => r.json())
      .then(data => {
        console.log('✅ CORS OK:', data);
      })
      .catch(err => {
        console.error('❌ CORS Error:', err);
      });
  }, []);

  return <div>Check console for CORS test results</div>;
}
```

---

## 🔐 Security Best Practices

### ✅ DO's

1. **Specify Exact Origins**
   ```bash
   ALLOWED_ORIGINS=http://localhost:5173,https://scam-report.vercel.app
   ```

2. **Use HTTPS in Production**
   ```bash
   ✅ https://scam-report.vercel.app
   ❌ http://scam-report.vercel.app
   ```

3. **Include Both www and non-www** (if needed)
   ```bash
   ALLOWED_ORIGINS=https://scamreport.com,https://www.scamreport.com
   ```

4. **Test Regularly**
   - Test after deployment
   - Test with unauthorized origins
   - Test OPTIONS preflight

5. **Monitor Logs**
   - Check CloudWatch logs for suspicious origins
   - Alert on repeated unauthorized attempts

---

### ❌ DON'Ts

1. **Never Use Wildcard in Production**
   ```bash
   ❌ ALLOWED_ORIGINS=*
   ```

2. **Don't Add Trailing Slashes**
   ```bash
   ❌ https://scamreport.com/
   ✅ https://scamreport.com
   ```

3. **Don't Add Spaces**
   ```bash
   ❌ http://localhost:5173, https://scamreport.com
   ✅ http://localhost:5173,https://scamreport.com
   ```

4. **Don't Mix Protocols**
   ```bash
   ❌ Frontend: https://scamreport.com
      ALLOWED_ORIGINS: http://scamreport.com
   ```

5. **Don't Expose Sensitive Data**
   - Even with CORS, validate all requests
   - Use authentication (Cognito)
   - Rate limit API calls

---

## 🐛 Troubleshooting

### Problem 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptoms:**
```
Access to fetch at 'https://api...' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
is present on the requested resource.
```

**Solutions:**

1. **Check Environment Variable**
   ```bash
   # AWS Lambda → Configuration → Environment variables
   # Verify ALLOWED_ORIGINS exists and has correct value
   ```

2. **Check Lambda Function URL CORS Settings**
   - Go to Lambda → Function URL → CORS
   - Verify origins are listed
   - Click "Save"

3. **Check Origin Matches Exactly**
   ```bash
   # Request origin must match exactly:
   http://localhost:5173   ✅
   http://localhost:5173/  ❌ (trailing slash)
   ```

4. **Redeploy Lambda** (if needed)
   - After changing environment variables
   - Wait 5-10 seconds for changes to take effect

---

### Problem 2: "CORS policy: The value of the 'Access-Control-Allow-Origin' header must not be '*'"

**Symptoms:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Origin' header in the response must
not be the wildcard '*' when the request's credentials mode is 'include'.
```

**Cause:** Using `Access-Control-Allow-Credentials: true` with wildcard origin

**Solution:**
```bash
# Change from:
ALLOWED_ORIGINS=*

# To specific origins:
ALLOWED_ORIGINS=http://localhost:5173,https://scam-report.vercel.app
```

---

### Problem 3: OPTIONS Preflight Fails

**Symptoms:**
- Browser shows CORS error
- Network tab shows OPTIONS request with status 403 or 500

**Solutions:**

1. **Ensure Lambda Handles OPTIONS**
   ```javascript
   if (httpMethod === 'OPTIONS') {
     return response(200, { message: 'CORS preflight OK' }, origin);
   }
   ```

2. **Check Function URL CORS Settings**
   - Must enable OPTIONS in allowed methods
   - Must configure in both Lambda code AND Function URL settings

3. **Check Response Headers**
   ```bash
   curl -X OPTIONS "https://your-api-url/endpoint" \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -v
   ```

---

### Problem 4: Works Locally, Fails in Production

**Symptoms:**
- Works on `http://localhost:5173`
- Fails on `https://scam-report.vercel.app`

**Common Causes:**

1. **Protocol Mismatch**
   ```bash
   # Check:
   ALLOWED_ORIGINS=https://scam-report.vercel.app  # Not http://
   ```

2. **Deployment URL Different**
   ```bash
   # Vercel might deploy to:
   https://scam-report-abc123.vercel.app  # Different from your setting!

   # Solution: Add both URLs
   ALLOWED_ORIGINS=https://scam-report.vercel.app,https://scam-report-abc123.vercel.app
   ```

3. **CloudFront/CDN Cache**
   - Clear CloudFront cache
   - Wait for cache to expire
   - Force refresh with Ctrl+Shift+R

---

### Problem 5: Unauthorized Origins Getting Through

**Symptoms:**
- `https://evil-site.com` can access your API
- `access-control-allow-origin: *` in response

**Solutions:**

1. **Check Environment Variable**
   ```bash
   # Must NOT have:
   ALLOWED_ORIGINS=*

   # Must have specific origins:
   ALLOWED_ORIGINS=http://localhost:5173,https://scam-report.vercel.app
   ```

2. **Verify in CloudWatch Logs**
   ```
   CloudWatch → Log groups → /aws/lambda/your-function

   # Look for:
   "ALLOWED_ORIGINS": "*"  ❌
   "ALLOWED_ORIGINS": "http://localhost:5173,..."  ✅
   ```

3. **Force Lambda Refresh**
   ```bash
   # Update any environment variable to force Lambda to reload
   # Or invoke Lambda manually from Console
   ```

---

## 📊 CORS Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Frontend)                           │
│              http://localhost:5173                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ 1. Preflight Request (OPTIONS)
                        │    Origin: http://localhost:5173
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│               Lambda Function URL CORS                          │
│   Checks: Is origin in allowed list?                           │
│   ✅ http://localhost:5173 → ALLOWED                           │
│   ✅ https://scam-report.vercel.app → ALLOWED                  │
│   ❌ https://evil-hacker.com → NOT ALLOWED                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ 2. Response with CORS Headers
                        │    Access-Control-Allow-Origin: http://localhost:5173
                        │    Access-Control-Allow-Methods: GET,POST,PUT,DELETE
                        │    Access-Control-Allow-Headers: Content-Type,...
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Validation                           │
│   ✅ Origin matches? → Allow request                           │
│   ❌ Origin mismatch? → Block request                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ 3. Actual Request (GET/POST/etc)
                        │    if preflight passed
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Lambda Function Handler                        │
│   - Process request                                             │
│   - Return data with CORS headers                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- [AWS Lambda Function URLs - CORS](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html#urls-cors)
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Frontend Cache Implementation](./FRONTEND_CACHE_IMPLEMENTATION.md)
- [Lambda Setup Guide](./lambda/README.md)

---

## 🔄 Maintenance Checklist

### Monthly
- [ ] Verify CORS headers in production
- [ ] Test with unauthorized origins
- [ ] Review CloudWatch logs for suspicious activity
- [ ] Update allowed origins list if needed

### Before Deployment
- [ ] Test CORS locally
- [ ] Test CORS in staging
- [ ] Verify production URLs in ALLOWED_ORIGINS
- [ ] Test OPTIONS preflight requests
- [ ] Check for wildcard `*` (should not exist)

### After Deployment
- [ ] Test from production frontend
- [ ] Verify CORS headers in browser DevTools
- [ ] Test with different origins
- [ ] Monitor CloudWatch logs for errors

---

## 📞 Support

**Issues with CORS?**

1. Check CloudWatch Logs: `/aws/lambda/your-function-name`
2. Test with curl commands above
3. Verify environment variables in Lambda Console
4. Check this documentation for troubleshooting steps

---

**Last Updated:** 2025-11-13
**Version:** 1.0
**Status:** ✅ Production Ready
