# Deploy ScamReport Frontend to Vercel

## 🚀 ทำไมต้อง Vercel?

### ข้อดี
- ✅ **ง่ายมาก** - เชื่อม GitHub แล้ว auto deploy
- ✅ **CDN Global** - ครอบคลุมทั่วโลก ฟรี
- ✅ **HTTPS ฟรี** - SSL certificate อัตโนมัติ
- ✅ **SPA Support** - ไม่ต้องตั้งค่า routing เพิ่ม
- ✅ **Preview Deployments** - ทุก PR ได้ URL ทดสอบแยก
- ✅ **Analytics ฟรี** - Web Vitals, page views
- ✅ **Zero Config** - Vite ทำงานได้เลย
- ✅ **Fast Builds** - Build เสร็จภายใน 1-2 นาที

### ข้อเสีย
- ❌ ไม่ได้อยู่ใน AWS ecosystem
- ❌ Hobby plan จำกัด 100GB bandwidth/month (แต่เพียงพอสำหรับเริ่มต้น)

### เปรียบเทียบกับ S3 + CloudFront

| Feature | Vercel | S3 + CloudFront |
|---------|--------|-----------------|
| Setup Time | 5 นาที | 30-60 นาที |
| Auto Deploy | ✅ | ❌ (ต้องตั้ง CI/CD) |
| Preview URLs | ✅ | ❌ |
| SPA Routing | ✅ Auto | ⚠️ ต้องตั้งค่า |
| Custom Domain | ✅ ฟรี | ✅ ฟรี |
| Analytics | ✅ Built-in | ❌ ต้องตั้งเอง |
| ราคา (เริ่มต้น) | ฟรี | ~$1-5/เดือน |

---

## 📋 ขั้นตอนการ Deploy

### Step 1: เตรียม Repository

```bash
# 1. Commit ทุกอย่าง
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main

# 2. ตรวจสอบว่า build ได้
npm run build

# 3. ทดสอบ production build locally
npm run preview
```

---

### Step 2: สร้าง Vercel Configuration

สร้างไฟล์ `vercel.json` ที่ root ของ project:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",

  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],

  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**อธิบาย Configuration:**
- `rewrites` - จัดการ SPA routing (ทุก path ชี้ไป index.html)
- `headers` - เพิ่ม security headers และ cache control
- `buildCommand` - คำสั่งที่ใช้ build
- `outputDirectory` - โฟลเดอร์ที่เก็บ build output (Vite ใช้ `dist`)

---

### Step 3: Deploy ไป Vercel

#### วิธีที่ 1: ผ่าน Vercel Dashboard (แนะนำ)

1. **สร้างบัญชี Vercel**
   - ไปที่ https://vercel.com
   - คลิก "Sign Up"
   - เลือก "Continue with GitHub"
   - Authorize Vercel

2. **Import Project**
   - คลิก "Add New..." → "Project"
   - เลือก repository: `ScamReport/scamreport-frontend`
   - คลิก "Import"

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables**

   คลิก "Environment Variables" แล้วเพิ่ม:
   ```
   VITE_API_URL = https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws
   VITE_AWS_REGION = us-east-1
   VITE_COGNITO_USER_POOL_ID = (ถ้ามี)
   VITE_COGNITO_CLIENT_ID = (ถ้ามี)
   ```

5. **Deploy**
   - คลิก "Deploy"
   - รอ 1-2 นาที
   - เสร็จแล้ว! 🎉

#### วิธีที่ 2: ผ่าน Vercel CLI

```bash
# 1. ติดตั้ง Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. ตอบคำถาม:
# ? Set up and deploy "~/scamreport-frontend"? [Y/n] y
# ? Which scope do you want to deploy to? Your Name
# ? Link to existing project? [y/N] n
# ? What's your project's name? scamreport-frontend
# ? In which directory is your code located? ./

# 5. Deploy to production
vercel --prod
```

---

### Step 4: ตั้งค่า Environment Variables

**ใน Vercel Dashboard:**

1. ไปที่ Project Settings → Environment Variables
2. เพิ่มตัวแปรเหล่านี้:

```env
# Production
VITE_API_URL=https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws
VITE_AWS_REGION=us-east-1

# Development & Preview (optional)
VITE_API_URL=http://localhost:5173
```

**เลือก Environment:**
- ✅ Production - สำหรับ main branch
- ✅ Preview - สำหรับ PR branches
- ✅ Development - สำหรับ local

3. คลิก "Save"
4. Redeploy เพื่อใช้ env variables ใหม่

---

### Step 5: ตั้งค่า Custom Domain (Optional)

**ถ้ามี Domain เป็นของตัวเอง:**

1. ไปที่ Project Settings → Domains
2. คลิก "Add"
3. ใส่ domain name (เช่น `scamreport.com`)
4. Vercel จะให้ DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. เพิ่ม records เหล่านี้ใน DNS provider ของคุณ (Namecheap, GoDaddy, etc.)
6. รอ DNS propagate (5-30 นาที)
7. Vercel จะออก SSL certificate อัตโนมัติ

---

## 🔧 Configuration Files

### 1. vercel.json

สร้างไฟล์นี้ที่ root ของ project:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",

  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],

  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. .vercelignore (Optional)

```
node_modules
.env
.env.local
.env.*.local
dist
docs/archive
*.log
.DS_Store
```

### 3. อัปเดต vite.config.js

ลบ proxy configuration สำหรับ production:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Proxy ใช้เฉพาะ development mode
  server: {
    proxy: process.env.NODE_ENV === 'development' ? {
      '^/(table|users|user|connection)': {
        target: process.env.VITE_API_URL || 'https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws',
        changeOrigin: true,
        secure: false
      }
    } : undefined
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'aws-vendor': ['amazon-cognito-identity-js']
        }
      }
    }
  }
});
```

### 4. อัปเดต API Client

แก้ไข `src/services/complaintApi.js`:

```javascript
// ใช้ environment variable แทน hardcode URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 🔄 Auto Deployment Workflow

### Git Workflow with Vercel

```
main branch (production)
  ↓ push
  ↓
  ✅ Vercel Auto Deploy → https://scamreport-frontend.vercel.app

feature/new-feature (preview)
  ↓ push + create PR
  ↓
  ✅ Vercel Preview Deploy → https://scamreport-frontend-git-feature-xxx.vercel.app
```

**ตัวอย่าง Workflow:**

```bash
# 1. สร้าง feature branch
git checkout -b feature/add-dashboard

# 2. แก้ไขโค้ด
# ... edit files ...

# 3. Commit และ push
git add .
git commit -m "Add new dashboard feature"
git push origin feature/add-dashboard

# 4. สร้าง Pull Request ใน GitHub
# → Vercel จะสร้าง preview URL อัตโนมัติ

# 5. ทดสอบใน preview URL
# https://scamreport-frontend-git-feature-add-dashboard.vercel.app

# 6. Merge PR
# → Vercel deploy to production อัตโนมัติ
```

---

## 📊 Monitoring & Analytics

### 1. Vercel Analytics (ฟรี)

เปิดใช้งาน Analytics:

1. Project Settings → Analytics
2. คลิก "Enable"
3. ดู metrics:
   - Page views
   - Unique visitors
   - Top pages
   - Web Vitals (LCP, FID, CLS)

### 2. Web Vitals Monitoring

Vercel รองรับ Web Vitals โดยอัตโนมัติ แต่สามารถเพิ่ม custom tracking:

```javascript
// src/reportWebVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToVercelAnalytics(metric) {
  const body = JSON.stringify({
    dsn: window.ENV?.VERCEL_ANALYTICS_ID,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: 'auto'
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/_vercel/insights/vitals', body);
  }
}

getCLS(sendToVercelAnalytics);
getFID(sendToVercelAnalytics);
getFCP(sendToVercelAnalytics);
getLCP(sendToVercelAnalytics);
getTTFB(sendToVercelAnalytics);
```

### 3. Deployment Logs

ดู logs ใน Vercel Dashboard:
- Build logs - ดู errors ตอน build
- Function logs - ดู serverless function logs (ถ้ามี)
- Edge logs - ดู CDN access logs

---

## 🚨 Troubleshooting

### ปัญหา 1: Build Failed - "Module not found"

**Error:**
```
Error: Cannot find module 'some-package'
```

**แก้ไข:**
```bash
# ตรวจสอบว่าติดตั้ง dependencies ครบ
npm install

# ถ้าเป็น devDependencies ต้องย้ายไป dependencies
npm install --save some-package
npm uninstall --save-dev some-package
```

### ปัญหา 2: Environment Variables ไม่ทำงาน

**Error:**
```javascript
console.log(import.meta.env.VITE_API_URL) // undefined
```

**แก้ไข:**
1. ตรวจสอบว่าขึ้นต้นด้วย `VITE_`
2. Redeploy project (Deployments → ... → Redeploy)
3. ตรวจสอบใน Settings → Environment Variables

### ปัญหา 3: 404 on Refresh

**Error:** หน้า refresh แล้วเจอ 404

**แก้ไข:** เพิ่ม `vercel.json` ที่มี rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### ปัญหา 4: CORS Error

**Error:**
```
Access to XMLHttpRequest at 'https://api.example.com' from origin 'https://yourapp.vercel.app'
has been blocked by CORS policy
```

**แก้ไข:**
- ตรวจสอบ Lambda Function URL configuration
- Ensure CORS headers อนุญาต origin ของ Vercel
- Update Lambda `Access-Control-Allow-Origin`

### ปัญหา 5: Large Bundle Size

**Warning:**
```
(!) Some chunks are larger than 500 KiB after minification
```

**แก้ไข:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'aws-vendor': ['amazon-cognito-identity-js']
        }
      }
    }
  }
});
```

---

## 🎯 Performance Optimization สำหรับ Vercel

### 1. Image Optimization

Vercel มี built-in image optimization:

```javascript
// ใช้ Vercel Image component (ถ้าใช้ Next.js)
// สำหรับ Vite + React ใช้ lazy loading
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage
  src={imageUrl}
  alt="description"
  effect="blur"
/>
```

### 2. Code Splitting

```javascript
// src/App.jsx
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ComplaintsPage = lazy(() => import('./pages/journalist/ComplaintsPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/journalist/complaints" element={<ComplaintsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### 3. Cache Strategy

Vercel จัดการ caching อัตโนมัติ:
- Static assets: 1 year cache
- HTML: No cache (always fresh)
- API routes: Configurable

ถ้าต้องการ custom cache headers:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

---

## 💰 Pricing

### Vercel Hobby (ฟรี)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Analytics
- ✅ Preview deployments
- ✅ SSL certificates
- ❌ No team collaboration
- ❌ No password protection

### Vercel Pro ($20/month)
- ✅ 1TB bandwidth/month
- ✅ Team collaboration
- ✅ Password protection
- ✅ Advanced analytics
- ✅ Priority support

**Recommendation:** เริ่มด้วย Hobby plan ก่อน อัปเกรดเมื่อ:
- Bandwidth > 100GB/month
- ต้องการ team collaboration
- ต้องการ password protect preview deployments

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] ทดสอบ `npm run build` locally
- [ ] ตรวจสอบ environment variables
- [ ] ลบ console.logs และ debug code
- [ ] Update README.md
- [ ] Commit ทุกอย่างไป Git

### Deployment
- [ ] สร้าง Vercel account
- [ ] Import project จาก GitHub
- [ ] ตั้งค่า environment variables
- [ ] Deploy แล้วทดสอบ

### Post-Deployment
- [ ] ทดสอบทุก routes
- [ ] ทดสอบ API integration
- [ ] ตรวจสอบ Web Vitals
- [ ] ตั้งค่า custom domain (ถ้ามี)
- [ ] เปิด Analytics

### Monitoring
- [ ] ตรวจสอบ deployment logs
- [ ] ดู error reports
- [ ] Monitor Web Vitals
- [ ] Track user analytics

---

## 🔗 Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Vite Deployment Guide:** https://vitejs.dev/guide/static-deploy.html#vercel
- **Vercel CLI:** https://vercel.com/docs/cli
- **Vercel Support:** https://vercel.com/support

---

## 🎉 เสร็จแล้ว!

หลังจาก deploy เสร็จ คุณจะได้:
- ✅ URL สำหรับ production: `https://scamreport-frontend.vercel.app`
- ✅ Preview URLs สำหรับทุก PR
- ✅ Auto deployment เมื่อ push to main
- ✅ HTTPS + CDN ฟรี
- ✅ Analytics และ monitoring

**Next Steps:**
1. [Setup CI/CD Testing](./CI_CD_SETUP.md)
2. [Performance Monitoring](./PERFORMANCE_OPTIMIZATION_PLAN.md)
3. [Security Best Practices](./SECURITY.md)

---

**Created:** 2024-11-12
**Last Updated:** 2024-11-12
**Version:** 1.0
