# 🔒 CORS Setup Guide for ScamReport Lambda

## Environment Variables Setup

### Development + Production

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-production-url.com
```

**แทน `your-production-url.com` ด้วย URL จริงของคุณ**

---

## AWS Lambda Configuration Steps

### 1. ไปที่ AWS Lambda Console
1. เปิด AWS Console → Lambda
2. เลือก Function: `scamreport-api` (หรือชื่อที่คุณตั้ง)

### 2. ตั้งค่า Environment Variables
1. คลิก **Configuration** tab
2. เลือก **Environment variables** (ด้านซ้าย)
3. คลิก **Edit**
4. คลิก **Add environment variable**
5. ใส่:
   - **Key:** `ALLOWED_ORIGINS`
   - **Value:** `http://localhost:5173,http://localhost:3000,https://your-production-url.com`
6. คลิก **Save**

### 3. Deploy Changes
- Lambda จะ auto-reload environment variables
- ไม่ต้อง deploy code ใหม่

---

## API Gateway CORS Configuration

### ถ้าใช้ API Gateway (REST API)

1. ไปที่ **API Gateway Console**
2. เลือก API ของคุณ
3. เลือก **CORS** (ด้านซ้าย)
4. ตั้งค่าดังนี้:

#### Access-Control-Allow-Origin
```
http://localhost:5173
http://localhost:3000
https://your-production-url.com
```

**หรือถ้าต้องการใช้ Wildcard สำหรับ localhost:**
```
http://localhost:*
https://your-production-url.com
```

#### Access-Control-Allow-Methods
```
GET,POST,PUT,DELETE,OPTIONS
```

#### Access-Control-Allow-Headers
```
Content-Type,Authorization,X-Requested-With
```

#### Access-Control-Allow-Credentials
```
true
```

#### Access-Control-Max-Age (seconds)
```
3600
```

5. คลิก **Save**
6. **Deploy API** → เลือก stage (prod/dev)

---

## ตัวอย่าง Production URLs

แทนที่ `your-production-url.com` ด้วย URL จริง เช่น:

### Vercel
```
https://scamreport.vercel.app
```

### Netlify
```
https://scamreport.netlify.app
```

### AWS S3 + CloudFront
```
https://d1234567890.cloudfront.net
```

### Custom Domain
```
https://scamreport.com
https://www.scamreport.com
```

**ถ้ามีทั้ง www และ non-www ต้องใส่ทั้ง 2 อัน!**

---

## ตัวอย่าง Environment Variable แบบครบ

```bash
# Development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Development + Production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://scamreport.vercel.app

# Production + www subdomain
ALLOWED_ORIGINS=https://scamreport.com,https://www.scamreport.com

# All (Development + Production + www)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://scamreport.com,https://www.scamreport.com
```

---

## Test CORS Configuration

### 1. Test ด้วย curl

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://your-api-gateway-url.com/table/complaints \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -v

# ควรได้ response:
# Access-Control-Allow-Origin: http://localhost:5173
```

### 2. Test ด้วย Browser Console

```javascript
// เปิด Developer Console แล้วรัน:
fetch('https://your-api-gateway-url.com/table/complaints', {
  headers: {
    'Origin': 'http://localhost:5173'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);

// ไม่ควรมี CORS error
```

### 3. Test ด้วย Frontend

```javascript
// ใน React app
useEffect(() => {
  fetch('https://your-api-gateway-url.com/table/complaints')
    .then(r => r.json())
    .then(data => console.log('✅ CORS OK:', data))
    .catch(err => console.error('❌ CORS Error:', err));
}, []);
```

---

## Troubleshooting

### ❌ ยังได้ CORS Error อยู่

**เช็คตามลำดับ:**

1. **ตรวจสอบ Environment Variable**
   ```bash
   # ใน Lambda Console → Configuration → Environment variables
   # ต้องมี ALLOWED_ORIGINS และไม่มี space หลัง comma
   ```

2. **ตรวจสอบ API Gateway CORS**
   - ต้อง Deploy API หลังตั้งค่า CORS
   - ตรวจสอบว่าตั้งค่าที่ stage ที่ใช้งาน (prod/dev)

3. **ตรวจสอบ URL ตรงกันทุก character**
   ```
   ❌ https://example.com/   (มี trailing slash)
   ✅ https://example.com    (ไม่มี trailing slash)

   ❌ http://example.com     (http)
   ✅ https://example.com    (https)
   ```

4. **ลอง Clear Cache**
   - Browser cache
   - CloudFront cache (ถ้ามี)
   - API Gateway cache

5. **ดู Lambda Logs**
   ```bash
   # CloudWatch Logs → Log groups → /aws/lambda/your-function
   # จะเห็น origin ที่ request เข้ามา
   ```

---

## Security Best Practices

### 🔒 Production

```bash
# ใช้เฉพาะ production URL
ALLOWED_ORIGINS=https://scamreport.com,https://www.scamreport.com
```

### 🛠️ Development

```bash
# เพิ่ม localhost
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://scamreport.com
```

### ⚠️ อย่าใช้ในระบบจริง

```bash
# ❌ อย่าใช้ wildcard ใน production!
ALLOWED_ORIGINS=*
```

---

## Next Steps

1. ✅ ตั้งค่า `ALLOWED_ORIGINS` ใน Lambda
2. ✅ ตั้งค่า CORS ใน API Gateway (ถ้ามี)
3. ✅ Deploy API
4. ✅ Test จาก localhost
5. ✅ Test จาก production URL
6. ✅ Remove wildcard `*` ถ้ามี

---

**Last Updated:** 2025-11-13
**Status:** Ready to deploy
