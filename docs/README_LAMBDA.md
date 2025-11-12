# ScamReport Lambda API - Complete Guide

## 🎯 สรุปการทำงาน

Lambda function นี้เป็น Backend API สำหรับระบบ ScamReport ที่:
- ✅ ดึงข้อมูล complaints, messages, summaries
- ✅ รองรับ pagination และ filtering
- ✅ JOIN ข้อมูลระหว่างตาราง (messages + complaint title)
- ✅ มี security features ครบถ้วน
- ✅ รองรับ CORS สำหรับ frontend

---

## 📁 ไฟล์ที่สำคัญ

| ไฟล์ | คำอธิบาย |
|------|----------|
| `lambda-complete.js` | ⭐ **Lambda function หลัก** (ใช้ไฟล์นี้!) |
| `LAMBDA_DEPLOYMENT.md` | คู่มือ deployment แบบละเอียด |
| `test-all-endpoints.mjs` | Test script สำหรับทดสอบทุก endpoint |
| `db-verify-schema.mjs` | ตรวจสอบ database schema |
| `db-add-title-column.mjs` | เพิ่ม title column ให้ complaints |
| `db-test-join-query.mjs` | ทดสอบ JOIN queries |
| `db-create-sample-data.mjs` | สร้างข้อมูลทดสอบ |

---

## 🚀 Quick Start (3 ขั้นตอน)

### 1️⃣ Deploy Lambda

```bash
# 1. Copy code จาก lambda-complete.js
# 2. ไป AWS Lambda Console
# 3. Paste code และคลิก "Deploy"
```

**หรือใช้ AWS CLI:**
```bash
aws lambda update-function-code \
  --function-name scamreport-api \
  --zip-file fileb://function.zip
```

### 2️⃣ Set Environment Variables

ใน AWS Lambda Console → Configuration → Environment variables:

```
DB_HOST = scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
DB_PORT = 5432
DB_NAME = scamreport
DB_USER = postgres
DB_PASSWORD = Password123!
DB_SCHEMA = public
ALLOWED_ORIGINS = *
NODE_ENV = production
```

### 3️⃣ Test!

```bash
# ทดสอบด้วย test script
cd docs
node test-all-endpoints.mjs
```

---

## 📊 API Endpoints

### หลัก

| Endpoint | Description |
|----------|-------------|
| `GET /` | API info และ health check |
| `GET /connection` | Test database connection |
| `GET /table/complaints` | ดึงรายการ complaints (พร้อม pagination) |
| `GET /table/complaints/:id` | ดึง complaint ตาม ID |

### ⭐ สำคัญ (รองรับ Frontend)

| Endpoint | Description |
|----------|-------------|
| `GET /table/complaints/:id/messages` | **ดึง messages พร้อม complaint title** |
| `GET /table/complaints/:id/summary` | **ดึง summary พร้อมข้อมูลผู้ติดต่อ** |

### Generic

| Endpoint | Description |
|----------|-------------|
| `GET /table/:tableName` | ดึงข้อมูลจากตารางอื่นๆ |
| `GET /table/:tableName/:id` | ดึง record เดียวตาม ID |

---

## 🔧 Frontend Setup

### Vite Config (Development)

File: `vite.config.js`

```javascript
export default defineConfig({
  server: {
    proxy: {
      '^/(table|connection)': {
        target: 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### API Client

File: `src/services/complaintApi.js`

```javascript
const API_BASE_URL = import.meta.env.DEV
  ? '' // Development: ใช้ Vite proxy
  : 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws';
```

### Test Frontend

```bash
# 1. Restart dev server
npm run dev

# 2. เปิด browser
http://localhost:5173

# 3. เช็ค Console ว่ามี CORS error หรือไม่
```

---

## 🛠️ Database Setup

### ตรวจสอบ Schema

```bash
cd docs
node db-verify-schema.mjs
```

### เพิ่ม Title Column (ถ้าไม่มี)

```bash
node db-add-title-column.mjs
```

### สร้างข้อมูลทดสอบ

```bash
node db-create-sample-data.mjs
```

### ทดสอบ JOIN Queries

```bash
node db-test-join-query.mjs
```

---

## 🧪 Testing

### Test ทุก Endpoints

```bash
cd docs
node test-all-endpoints.mjs
```

**ผลลัพธ์ที่คาดหวัง:**
```
✓ Passed:  10+
✗ Failed:  0
⊘ Skipped: 0
Success Rate: 100%
```

### Test แต่ละ Endpoint

```bash
# Test health check
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/

# Test database
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/connection

# Test complaints
curl "https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints?limit=5"
```

---

## 🔐 Security Features

### ✅ Implemented

- [x] **Input Validation** - UUID และ table name validation
- [x] **SQL Injection Prevention** - Parameterized queries ทั้งหมด
- [x] **CORS** - Environment-based origins
- [x] **Error Sanitization** - ไม่เปิดเผย stack trace
- [x] **Query Limits** - Max 10,000 records
- [x] **Table Whitelist** - อนุญาตเฉพาะตารางที่กำหนด

### 🔜 Recommended (Future)

- [ ] Authentication/Authorization (JWT)
- [ ] Rate limiting (API Gateway)
- [ ] WAF protection
- [ ] Secrets Manager for DB credentials
- [ ] CloudWatch alarms

---

## 🐛 Troubleshooting

### CORS Error

**ปัญหา:** `Access to XMLHttpRequest has been blocked by CORS policy`

**แก้ไข:**
1. ตรวจสอบ `ALLOWED_ORIGINS` environment variable
2. ใช้ Vite proxy (development)
3. เช็ค Lambda response headers

### Database Connection Failed

**ปัญหา:** `Connection timeout`

**แก้ไข:**
1. ตรวจสอบ environment variables
2. ตรวจสอบ RDS Security Group
3. ตรวจสอบ Lambda VPC settings

### complaint_title is null

**ปัญหา:** `"complaint_title": null`

**แก้ไข:**
```bash
node db-add-title-column.mjs
```

หรือ manual:
```sql
ALTER TABLE complaints ADD COLUMN title VARCHAR(255);
UPDATE complaints SET title = COALESCE(description, 'No Title');
```

---

## 📈 Performance

### Tips

1. **ใช้ Pagination**
   ```javascript
   GET /table/complaints?page=1&limit=50
   ```

2. **Monitor CloudWatch**
   - Invocations
   - Duration
   - Errors
   - Throttles

3. **Add Database Indexes**
   ```sql
   CREATE INDEX idx_complaints_created_at ON complaints(created_at);
   CREATE INDEX idx_messages_complaint_id ON messages(complaint_id);
   ```

---

## 📝 Environment Variables Reference

### Required

| Variable | ค่า | คำอธิบาย |
|----------|-----|----------|
| `DB_HOST` | scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com | RDS endpoint |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | scamreport | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | Password123! | Database password |
| `DB_SCHEMA` | public | Schema name |

### Optional

| Variable | ค่า Default | คำอธิบาย |
|----------|-------------|----------|
| `ALLOWED_ORIGINS` | * | CORS allowed origins (comma-separated) |
| `NODE_ENV` | production | Environment mode |

**Production CORS Example:**
```
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## 📚 ทรัพยากรเพิ่มเติม

### Documentation Files

- `LAMBDA_DEPLOYMENT.md` - Deployment guide แบบละเอียด
- `PRISMA_SETUP_GUIDE.md` - Prisma ORM setup
- `IMPLEMENTATION_SUMMARY.md` - สรุปการ implement

### Scripts

- `test-all-endpoints.mjs` - Complete test suite
- `db-verify-schema.mjs` - Database verification
- `db-add-title-column.mjs` - Add title column
- `db-test-join-query.mjs` - Test JOIN queries
- `db-create-sample-data.mjs` - Create sample data

---

## ✅ Deployment Checklist

- [ ] Lambda code deployed
- [ ] Environment variables set
- [ ] Database has `title` column
- [ ] Test scripts pass
- [ ] Frontend Vite proxy configured
- [ ] CORS working
- [ ] No errors in CloudWatch logs
- [ ] Performance acceptable (< 1s response)

---

## 🎯 ขั้นตอนถัดไป

### สำหรับ Development

1. ✅ Deploy Lambda function
2. ✅ Configure Frontend
3. ✅ Test all endpoints
4. ⏭️ Monitor CloudWatch logs
5. ⏭️ Optimize queries if needed

### สำหรับ Production

1. ⏭️ เปลี่ยน `ALLOWED_ORIGINS` เป็น domain จริง
2. ⏭️ ตั้งค่า CloudWatch alarms
3. ⏭️ เพิ่ม Authentication
4. ⏭️ Setup CI/CD pipeline
5. ⏭️ Enable WAF protection

---

## 💡 Tips & Best Practices

### Development

- ใช้ Vite proxy แทนการเรียก Lambda โดยตรง
- เปิด browser DevTools เพื่อดู network requests
- ใช้ `console.log` ใน Lambda สำหรับ debug

### Production

- ใช้ `ALLOWED_ORIGINS` ที่เฉพาะเจาะจง
- Monitor CloudWatch metrics
- Setup alarms สำหรับ errors และ throttles
- Backup database ก่อน deploy

### Security

- อย่า commit environment variables
- ใช้ Secrets Manager สำหรับ production
- Review CloudWatch logs เป็นประจำ
- Update dependencies เป็นประจำ

---

## 🆘 ช่วยเหลือ

### หากพบปัญหา

1. เช็ค CloudWatch Logs
2. รัน test scripts
3. ตรวจสอบ database connection
4. ตรวจสอบ environment variables

### Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/scamreport-api --follow

# Test endpoint
curl -v https://your-lambda-url/connection

# Run all tests
node test-all-endpoints.mjs
```

---

## 🎉 เรียบร้อย!

Lambda API พร้อมใช้งาน!

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

**Frontend proxy ตั้งค่าแล้ว:**
- Development: ใช้ Vite proxy (no CORS issues)
- Production: เรียก Lambda URL โดยตรง

**Database:**
- Host: scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
- Schema: public
- Required tables: complaints, messages, summaries

Happy coding! 🚀
