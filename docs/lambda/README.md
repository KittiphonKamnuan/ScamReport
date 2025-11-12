# Lambda Functions

This folder contains the production Lambda function code for the ScamReport API.

---

## 📦 Files

### `lambda-complete.js` ⭐ **PRODUCTION**

The current production Lambda function with all features:

- ✅ Complaint CRUD operations
- ✅ Messages API with complaint title (JOIN queries)
- ✅ Summary API with contact info
- ✅ Generic table access
- ✅ Security features (UUID validation, SQL injection prevention)
- ✅ CORS support
- ✅ Pagination
- ✅ Error handling

**Schema Compatibility:**
- Uses correct column names from actual database
- `content` (not `message`)
- `sent_at` (not `timestamp`)
- `is_from_user` (not `sender_type`)
- `financial_damage` (not `total_loss_amount`)
- `line_user_id` (not `line_id`)

---

## 🚀 Deployment

### Quick Deploy (AWS Console)

1. Open [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Select function: `scamreport-api`
3. Go to "Code" tab
4. Select All (Ctrl+A / Cmd+A)
5. Delete existing code
6. Copy **all code** from `lambda-complete.js`
7. Paste into editor
8. Click **"Deploy"**
9. Wait for "Successfully updated" message

### Environment Variables Required

Set in: **Lambda Console → Configuration → Environment variables**

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

---

## 🧪 Testing

After deployment, test with:

```bash
cd ../testing
node test-all-endpoints.mjs
```

**Expected:** ✅ 100% pass rate (14/14 tests)

---

## 📝 API Endpoints

### Core Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API info & health check |
| `GET /connection` | Database connection test |
| `GET /table/complaints` | List complaints (paginated) |
| `GET /table/complaints/:id` | Get complaint by ID |
| `GET /table/complaints/:id/messages` | ⭐ Messages with complaint title |
| `GET /table/complaints/:id/summary` | ⭐ Summary with contact info |
| `GET /table/:tableName` | Generic table access |

---

## 🔐 Security Features

- ✅ **UUID Validation** - Validates all IDs before queries
- ✅ **SQL Injection Prevention** - Uses parameterized queries
- ✅ **Table Whitelist** - Only allows specific tables
- ✅ **CORS Configuration** - Environment-based origins
- ✅ **Error Sanitization** - Doesn't expose stack traces
- ✅ **Query Limits** - Max 10,000 records per request

**Allowed Tables:**
- `complaints`, `messages`, `summaries`, `attachments`
- `users`, `patterns`, `pattern_matches`
- `notifications`, `ai_analysis`, `audit_logs`
- `journalist_followups`

---

## 📊 Database Schema

### Complaints Table

```sql
- id (UUID)
- complaint_number (VARCHAR)
- line_user_id (VARCHAR)
- line_display_name (VARCHAR)
- title (VARCHAR) ⭐ REQUIRED
- category (VARCHAR)
- status (VARCHAR)
- financial_damage (NUMERIC)
- contact_name (VARCHAR)
- contact_phone (VARCHAR)
- created_at (TIMESTAMP)
```

### Messages Table

```sql
- id (UUID)
- complaint_id (UUID) → complaints.id
- line_message_id (VARCHAR)
- message_type (VARCHAR)
- content (TEXT) ⭐ Main message text
- raw_content (JSONB)
- sequence_number (INTEGER)
- is_from_user (BOOLEAN)
- sent_at (TIMESTAMP)
- received_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### Summaries Table

```sql
- id (UUID)
- complaint_id (UUID) → complaints.id
- summary_text (TEXT)
- summary_type (VARCHAR)
- key_points (TEXT/JSONB)
- timeline (TEXT/JSONB)
- word_count (INTEGER)
- generated_by (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🔧 Code Structure

### Main Handler

```javascript
exports.handler = async (event) => {
  // 1. Extract request info
  // 2. Handle CORS preflight
  // 3. Route to appropriate handler
  // 4. Return formatted response
}
```

### Key Functions

```javascript
// Connection management
getDbConnection()          // Reuses connection pool

// Security helpers
isValidUUID(str)          // Validates UUID format
sanitizeTableName(name)   // Validates against whitelist
getCorsHeaders(origin)    // Returns CORS headers

// Complaint APIs
getComplaintMessages()    // Messages with title (JOIN)
getComplaintSummary()     // Summary with contact info

// Generic APIs
getTableRecords()         // List any allowed table
getTableRecordById()      // Get single record
```

---

## 📝 Response Formats

### Messages Response

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "message text",
      "sent_at": "2024-01-01T10:00:00Z",
      "is_from_user": true,
      "sender_type": "user",
      "sender_name": "User"
    }
  ],
  "complaint_title": "โดนโกง...",
  "complaint_status": "pending",
  "complaint_id": "uuid",
  "count": 10
}
```

### Summary Response

```json
{
  "summary": {
    "id": "uuid",
    "summary": "text",
    "key_points": [...],
    "timeline": [...]
  },
  "complaint_title": "โดนโกง...",
  "contact_name": "John Doe",
  "contact_phone": "0812345678",
  "line_display_name": "John",
  "line_id": "U1234567890",
  "amount": 50000
}
```

---

## 🐛 Troubleshooting

### Lambda returns 500 error

1. **Check CloudWatch logs:**
   - AWS Lambda → Monitor → View CloudWatch logs

2. **Common issues:**
   - Missing environment variables
   - Database connection timeout
   - Incorrect column names

### Database connection failed

**Error:** `Connection timeout`

**Solutions:**
1. Check RDS Security Group allows Lambda
2. Verify Lambda VPC configuration
3. Test database credentials

### Column does not exist

**Error:** `column "description" does not exist`

**Solution:**
- Use `lambda-complete.js` (latest version)
- Columns match actual database schema

---

## 📚 Related Documentation

- [Main Documentation](../README.md)
- [Lambda Deployment Guide](../LAMBDA_DEPLOYMENT.md)
- [Complete Lambda Guide](../README_LAMBDA.md)
- [Frontend Integration](../FRONTEND_INTEGRATION.md)
- [Testing Guide](../testing/README.md)

---

## 🔄 Version History

### v1.0.0 (2025-11-11) - Current

**✅ Fixed:**
- Schema mismatch issues
- Column names match actual database
- 100% test pass rate

**Features:**
- Messages with complaint title (JOIN)
- Summary with contact info
- Security features
- CORS support
- Pagination

**Database Compatibility:**
- ✅ `content`, `sent_at`, `is_from_user`
- ✅ `financial_damage`, `line_user_id`
- ✅ Dynamic column handling for summaries

---

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

**Status:** ✅ Production Ready

**Last Updated:** 2025-11-11
