# Lambda Function Deployment Guide - Complete Version

## 📦 ไฟล์: `lambda-complete.js`

Lambda function ที่ครบถ้วน พร้อม deploy สำหรับ ScamReport System

---

## ✨ Features

### 1. **Complaint APIs**
- ✅ GET `/table/complaints` - รายการ complaints ทั้งหมด (พร้อม pagination)
- ✅ GET `/table/complaints/:id` - ข้อมูล complaint ตาม ID
- ✅ GET `/table/complaints/:id/messages` - ข้อความพร้อม complaint title
- ✅ GET `/table/complaints/:id/summary` - สรุปพร้อมข้อมูลผู้ติดต่อ

### 2. **Generic Table Access**
- ✅ GET `/table/:tableName` - เข้าถึงตารางอื่นๆ (messages, summaries, etc.)
- ✅ GET `/table/:tableName/:id` - ดึง record เดียวตาม ID

### 3. **Security Features**
- ✅ UUID validation
- ✅ Table name sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Error message sanitization
- ✅ Query limits (max 10,000 records)

### 4. **CORS Support**
- ✅ Environment-based origins
- ✅ Preflight handling (OPTIONS)
- ✅ Proper headers

---

## 🚀 การ Deploy

### ขั้นตอนที่ 1: Set Environment Variables

ไปที่ AWS Lambda Console → Configuration → Environment variables

```bash
# Required Variables
DB_HOST=scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=scamreport
DB_USER=postgres
DB_PASSWORD=Password123!
DB_SCHEMA=public

# Optional Variables
ALLOWED_ORIGINS=*
NODE_ENV=production
```

**สำหรับ Production:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

### ขั้นตอนที่ 2: Deploy Code

#### Option A: AWS Console (ง่ายที่สุด)

1. เปิด [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. เลือก function ของคุณ
3. ไปที่แท็บ "Code"
4. คัดลอกโค้ดทั้งหมดจาก `lambda-complete.js`
5. Paste ลงใน code editor
6. คลิก "Deploy"
7. รอ deploy เสร็จ (~10 วินาที)

#### Option B: AWS CLI

```bash
# 1. สร้าง deployment package
cd /path/to/lambda-code
zip -r function.zip index.js node_modules/

# 2. Upload to Lambda
aws lambda update-function-code \
  --function-name scamreport-api \
  --zip-file fileb://function.zip \
  --region us-east-1

# 3. Update environment variables
aws lambda update-function-configuration \
  --function-name scamreport-api \
  --environment "Variables={DB_HOST=scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com,DB_PORT=5432,DB_NAME=scamreport,DB_USER=postgres,DB_PASSWORD=Password123!,DB_SCHEMA=public,ALLOWED_ORIGINS=*,NODE_ENV=production}"
```

---

### ขั้นตอนที่ 3: Test Endpoints

#### Test 1: Health Check
```bash
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/
```

**Expected Response:**
```json
{
  "name": "ScamReport API",
  "version": "1.0.0",
  "status": "healthy",
  "endpoints": { ... }
}
```

#### Test 2: Database Connection
```bash
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/connection
```

**Expected Response:**
```json
{
  "status": "connected",
  "database": "scamreport",
  "user": "postgres",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

#### Test 3: Get Complaints
```bash
curl "https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints?limit=10"
```

**Expected Response:**
```json
{
  "columns": ["id", "title", "description", ...],
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasMore": true
  }
}
```

#### Test 4: Get Messages with Title
```bash
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints/{COMPLAINT_ID}/messages
```

**Expected Response:**
```json
{
  "messages": [...],
  "complaint_title": "หัวข้อเรื่องร้องเรียน",
  "complaint_description": "รายละเอียด",
  "complaint_status": "pending",
  "complaint_id": "uuid",
  "count": 5
}
```

---

## 📊 API Reference

### Endpoints

| Method | Path | Description | Query Params |
|--------|------|-------------|--------------|
| GET | `/` | API info | - |
| GET | `/connection` | Test DB connection | - |
| GET | `/table/complaints` | Get all complaints | `page`, `limit` |
| GET | `/table/complaints/:id` | Get complaint by ID | - |
| GET | `/table/complaints/:id/messages` | Get messages with title | - |
| GET | `/table/complaints/:id/summary` | Get summary | - |
| GET | `/table/:tableName` | Get table records | `page`, `limit` |
| GET | `/table/:tableName/:id` | Get record by ID | - |

### Allowed Tables

- `complaints`
- `messages`
- `summaries`
- `attachments`
- `users`
- `patterns`
- `pattern_matches`
- `notifications`
- `ai_analysis`
- `audit_logs`
- `journalist_followups`

### Query Parameters

**Pagination:**
- `page` (default: 1) - หน้าที่ต้องการ
- `limit` (default: 10, max: 10000) - จำนวน records ต่อหน้า

**Example:**
```bash
/table/complaints?page=2&limit=20
```

---

## 🔧 Frontend Configuration

### Update Vite Config (Development)

File: `vite.config.js`

```javascript
export default defineConfig({
  // ... other config
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

### Update API Client

File: `src/services/complaintApi.js`

```javascript
const API_BASE_URL = import.meta.env.DEV
  ? '' // Development: use proxy
  : 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws';
```

---

## 🔐 Security Checklist

### ✅ Implemented
- [x] Input validation (UUID, table names)
- [x] Parameterized SQL queries
- [x] CORS configuration
- [x] Error message sanitization
- [x] Query limits
- [x] Table whitelist

### 🔜 Recommended (Next Steps)
- [ ] Authentication/Authorization (JWT tokens)
- [ ] Rate limiting (API Gateway)
- [ ] WAF protection
- [ ] Secrets Manager for DB credentials
- [ ] Read-only database user
- [ ] CloudWatch alarms

---

## 📈 Monitoring

### CloudWatch Metrics to Monitor

1. **Invocations** - จำนวนครั้งที่ถูกเรียก
2. **Errors** - จำนวน errors
3. **Duration** - เวลาที่ใช้
4. **Throttles** - การถูก throttle
5. **ConcurrentExecutions** - จำนวน concurrent

### CloudWatch Logs

ดู logs ที่:
```
/aws/lambda/your-function-name
```

**สำคัญ:** Monitor logs สำหรับ:
- `❌ Error:` - errors
- `Invalid UUID` - ความพยายามใช้ invalid IDs
- `Table not allowed` - ความพยายามเข้าถึงตารางที่ไม่อนุญาต

---

## 🐛 Troubleshooting

### ปัญหา 1: CORS Error

**อาการ:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**แก้ไข:**
1. ตรวจสอบ `ALLOWED_ORIGINS` environment variable
2. ตรวจสอบว่า Lambda ส่ง CORS headers
3. ใช้ Vite proxy ใน development

### ปัญหา 2: Database Connection Failed

**อาการ:**
```
Error: Connection timeout
```

**แก้ไข:**
1. ตรวจสอบ DB_HOST, DB_USER, DB_PASSWORD
2. ตรวจสอบ Security Group ของ RDS
3. ตรวจสอบว่า Lambda อยู่ใน VPC เดียวกัน (ถ้าใช้ private RDS)

### ปัญหา 3: complaint_title is null

**อาการ:**
```json
{
  "complaint_title": null
}
```

**แก้ไข:**
```sql
-- Add title column if not exists
ALTER TABLE complaints ADD COLUMN title VARCHAR(255);

-- Populate titles
UPDATE complaints
SET title = COALESCE(description, 'No Title')
WHERE title IS NULL;
```

### ปัญหา 4: Slow Response Time

**อาการ:** Response time > 3 วินาที

**แก้ไข:**
1. เพิ่ม index บน columns ที่ใช้บ่อย:
```sql
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_messages_complaint_id ON messages(complaint_id);
```

2. ลด `limit` ในการ query
3. ใช้ pagination

---

## 📝 Database Schema Requirements

### Required Columns

**complaints table:**
```sql
- id (UUID, PRIMARY KEY)
- title (VARCHAR) ⭐ REQUIRED
- description (TEXT)
- status (VARCHAR)
- contact_name (VARCHAR)
- contact_phone (VARCHAR)
- line_display_name (VARCHAR)
- line_id (VARCHAR)
- total_loss_amount (NUMERIC)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**messages table:**
```sql
- id (UUID, PRIMARY KEY)
- complaint_id (UUID, FOREIGN KEY) ⭐ REQUIRED
- sender_id (UUID)
- sender_type (VARCHAR)
- sender_name (VARCHAR)
- message (TEXT)
- timestamp (TIMESTAMP)
- created_at (TIMESTAMP)
```

**summaries table:**
```sql
- id (UUID, PRIMARY KEY)
- complaint_id (UUID, FOREIGN KEY) ⭐ REQUIRED
- summary_text (TEXT)
- category (VARCHAR)
- keywords (TEXT[] or JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🔄 Migration from Old Lambda

### Changes
| Old | New | Notes |
|-----|-----|-------|
| No pagination limits | Max 10,000 records | Prevents memory issues |
| Generic CORS | Environment-based | Better security |
| Basic error messages | Sanitized errors | No stack trace in production |
| No table validation | Whitelist validation | Prevents unauthorized access |
| Manual field mapping | Auto column detection | More flexible |

### Breaking Changes
**None** - Fully backward compatible!

---

## 🎯 Performance Tips

### 1. Enable Connection Pooling
Lambda function reuses connection (`_conn_pool`) between invocations.

### 2. Use Pagination
Always use `page` and `limit` parameters:
```javascript
GET /table/complaints?page=1&limit=50
```

### 3. Limit Fields (Future Enhancement)
```javascript
// TODO: Add field selection
GET /table/complaints?fields=id,title,status
```

### 4. Add Caching (Future Enhancement)
Use CloudFront or API Gateway caching for read-heavy endpoints.

---

## 📞 Support

### Resources
- AWS Lambda Logs: CloudWatch
- Database: RDS Console
- API Gateway: (if using)

### Common Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/scamreport-api --follow

# Test endpoint
curl -v https://your-lambda-url/connection

# Update code
aws lambda update-function-code \
  --function-name scamreport-api \
  --zip-file fileb://function.zip
```

---

## ✅ Deployment Checklist

- [ ] Environment variables ตั้งค่าครบ
- [ ] Database มี `title` column
- [ ] Test `/connection` endpoint สำเร็จ
- [ ] Test `/table/complaints` endpoint สำเร็จ
- [ ] Test `/table/complaints/:id/messages` endpoint สำเร็จ
- [ ] CORS headers ถูกต้อง
- [ ] Frontend ใช้ URL ที่ถูกต้อง
- [ ] Vite proxy config (development)
- [ ] CloudWatch alarms ตั้งค่า (recommended)
- [ ] Backup database ก่อน deploy (recommended)

---

## 🎉 Success!

Lambda function พร้อมใช้งาน!

**Next Steps:**
1. ทดสอบ Frontend กับ Lambda
2. Monitor CloudWatch logs
3. เพิ่ม Authentication (ถ้าต้องการ)
4. เพิ่ม Rate limiting (ถ้าต้องการ)
5. Setup CI/CD pipeline

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```
