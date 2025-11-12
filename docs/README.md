# ScamReport Documentation

Welcome to the ScamReport project documentation. This folder contains all technical documentation, Lambda functions, and testing utilities.

## 📁 Folder Structure

```
docs/
├── lambda/                  # Lambda function code
│   └── lambda-complete.js   # ⭐ Production Lambda function
├── testing/                 # Test scripts and utilities
│   └── test-all-endpoints.mjs
├── database/                # Database utilities and scripts
│   └── db-verify-schema.mjs
├── archive/                 # Archived/old versions
│   └── lambda-updated.js
└── [Documentation files]    # Project guides and references
```

---

## 🚀 Quick Links

### For Deployment
- **[README_LAMBDA.md](./README_LAMBDA.md)** - Complete Lambda deployment guide
- **[LAMBDA_DEPLOYMENT.md](./LAMBDA_DEPLOYMENT.md)** - Detailed deployment instructions
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide

### For Development
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API endpoints reference
- **[PRISMA_SETUP_GUIDE.md](./PRISMA_SETUP_GUIDE.md)** - Prisma ORM setup
- **[AUTHENTICATION_FIXES.md](./AUTHENTICATION_FIXES.md)** - Authentication guide

### For Reference
- **[ScamReport_Project_Documentation.md](./ScamReport_Project_Documentation.md)** - Overall project documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation summary

---

## ⚡ Quick Start

### 1. Deploy Lambda Function

```bash
# The production Lambda function is in:
docs/lambda/lambda-complete.js

# Deploy via AWS Console:
# 1. Open AWS Lambda Console
# 2. Select 'scamreport-api' function
# 3. Copy all code from lambda-complete.js
# 4. Paste and click "Deploy"
```

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

### 2. Test Deployment

```bash
cd docs/testing
node test-all-endpoints.mjs
```

**Expected result:** ✅ 100% pass rate

### 3. Start Frontend

```bash
cd ..
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 📊 Database Schema

The Lambda function connects to:
- **Host:** `scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com`
- **Database:** `scamreport`
- **Schema:** `public`

### Main Tables
- `complaints` - Complaint records with title, status, contact info
- `messages` - Conversation messages (LINE integration)
- `summaries` - AI-generated summaries
- `users` - System users (admin, journalist)

Verify schema:
```bash
cd docs/database
node db-verify-schema.mjs
```

---

## 🔧 Environment Variables

Lambda requires these environment variables:

```bash
DB_HOST=scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=scamreport
DB_USER=postgres
DB_PASSWORD=Password123!
DB_SCHEMA=public
ALLOWED_ORIGINS=*
NODE_ENV=production
```

Set via: **AWS Lambda Console → Configuration → Environment variables**

---

## 🧪 Testing

### Test All Endpoints

```bash
cd docs/testing
node test-all-endpoints.mjs
```

This will test:
- Health checks (root, connection)
- CORS support
- Complaints API (pagination, filtering)
- Messages API with complaint title
- Summary API
- Error handling
- Performance

### Expected Output

```
✓ Passed:  14
✗ Failed:  0
Success Rate: 100%
```

---

## 📝 API Endpoints

### Primary Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info & health check |
| GET | `/connection` | Test database connection |
| GET | `/table/complaints` | List complaints (with pagination) |
| GET | `/table/complaints/:id` | Get complaint by ID |
| GET | `/table/complaints/:id/messages` | ⭐ Get messages with complaint title |
| GET | `/table/complaints/:id/summary` | ⭐ Get summary with contact info |
| GET | `/table/:tableName` | Generic table access |

### Example Requests

**Get messages with title:**
```bash
curl "https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints/{COMPLAINT_ID}/messages"
```

**Response:**
```json
{
  "messages": [...],
  "complaint_title": "โดนโกง...",
  "complaint_status": "pending",
  "count": 10
}
```

---

## 🔐 Security Features

- ✅ UUID validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ Table name sanitization (whitelist)
- ✅ CORS configuration
- ✅ Error message sanitization
- ✅ Query limits (max 10,000 records)

---

## 🐛 Troubleshooting

### Lambda returns 500 error

**Check CloudWatch logs:**
```bash
# Via AWS Console:
AWS Lambda → scamreport-api → Monitor → View CloudWatch logs
```

**Common issues:**
1. Missing environment variables
2. Database connection timeout
3. Incorrect column names in queries

### CORS errors in Frontend

**Solution 1: Use Vite proxy (development)**
```javascript
// vite.config.js
server: {
  proxy: {
    '^/(table|connection)': {
      target: 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws',
      changeOrigin: true
    }
  }
}
```

**Solution 2: Update ALLOWED_ORIGINS (production)**
```bash
ALLOWED_ORIGINS=https://yourdomain.com
```

### Tests failing

**Run database verification:**
```bash
cd docs/database
node db-verify-schema.mjs
```

**Check if tables exist:**
- complaints ✓
- messages ✓
- summaries ✓
- users ✓

---

## 📦 Dependencies

### Lambda Function
- `pg` (PostgreSQL driver) - Already included in Lambda layer

### Testing Scripts
- Node.js 18+ (for fetch API)
- No additional dependencies

---

## 🎯 Development Workflow

### 1. Make Changes to Lambda

Edit: `docs/lambda/lambda-complete.js`

### 2. Test Locally (optional)

```bash
# Run test script against deployed Lambda
cd docs/testing
node test-all-endpoints.mjs
```

### 3. Deploy to AWS

Copy code from `lambda-complete.js` → AWS Lambda Console → Deploy

### 4. Verify Deployment

```bash
cd docs/testing
node test-all-endpoints.mjs
```

### 5. Test Frontend Integration

```bash
cd ../..
npm run dev
# Open http://localhost:5173
```

---

## 📚 Additional Resources

### AWS Resources
- [Lambda Console](https://console.aws.amazon.com/lambda)
- [RDS Console](https://console.aws.amazon.com/rds)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch)

### Documentation
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [node-postgres (pg) Docs](https://node-postgres.com)

---

## 🤝 Contributing

When making changes:

1. ✅ Update Lambda code in `docs/lambda/lambda-complete.js`
2. ✅ Test with `test-all-endpoints.mjs`
3. ✅ Deploy to AWS Lambda
4. ✅ Verify 100% test pass rate
5. ✅ Test Frontend integration
6. ✅ Update relevant documentation

---

## 📞 Support

### Issues?

1. Check CloudWatch logs for errors
2. Run database verification script
3. Run test suite to identify failing endpoints
4. Review relevant documentation in this folder

### Need Help?

- Review [LAMBDA_DEPLOYMENT.md](./LAMBDA_DEPLOYMENT.md) for detailed deployment guide
- Check [README_LAMBDA.md](./README_LAMBDA.md) for Lambda-specific issues
- Run `node test-all-endpoints.mjs` for diagnostic information

---

## ✨ Recent Updates

- **2025-11-11**: Fixed schema mismatch issues
  - Updated to use correct column names (`content`, `sent_at`, `is_from_user`)
  - Fixed `financial_damage` and `line_user_id` field names
  - Achieved 100% test pass rate
  - Messages endpoint now returns complaint titles correctly

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
**Status:** ✅ Production Ready
