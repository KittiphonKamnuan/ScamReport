# Testing Scripts

This folder contains test scripts and utilities for validating the Lambda API.

---

## 📋 Files

### `test-all-endpoints.mjs` ⭐

Complete test suite for Lambda API endpoints.

**Tests 14 scenarios:**

1. ✅ Root API info
2. ✅ Database connection
3. ✅ CORS preflight (OPTIONS)
4. ✅ Get all complaints (pagination)
5. ✅ Get complaints (page 2)
6. ✅ Get complaint by ID
7. ✅ **Get messages with complaint title** ⭐
8. ✅ **Get complaint summary** ⭐
9. ✅ Get messages table (generic)
10. ✅ Get summaries table (generic)
11. ✅ Invalid UUID rejection (400)
12. ✅ Forbidden table rejection (403)
13. ✅ Non-existent route (404)
14. ✅ Large limit performance test

---

## 🚀 Usage

### Run All Tests

```bash
cd docs/testing
node test-all-endpoints.mjs
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════╗
║         ScamReport Lambda API - Complete Test Suite      ║
╚═══════════════════════════════════════════════════════════╝

═══════════ Section 1: Health Checks ═══════════
✓ Root API Info (200)
✓ Database Connection (200)

═══════════ Section 2: CORS Support ═══════════
✓ CORS Preflight (200)

═══════════ Section 3: Complaints API ═══════════
✓ Get All Complaints (200)
📌 Using Complaint ID: <uuid>
✓ Get Complaints page 2 (200)
✓ Get Complaint by ID (200)

═══════════ Section 4: Messages API ═══════════
✓ Get Messages with Complaint Title (200)
  ✓ messages array: YES
  ✓ complaint_title: YES
  ✓ count: YES

═══════════ Section 5: Summary API ═══════════
✓ Get Complaint Summary (200)
  ✓ summary object: YES
  ✓ complaint_title: YES
  ✓ contact info: YES

╔═══════════════════════════════════════════════════════════╗
║                    Test Results Summary                   ║
╚═══════════════════════════════════════════════════════════╝

✓ Passed:  14
✗ Failed:  0
⊘ Skipped: 0
Total:     14

Success Rate: 100%

🎉 All tests passed! Lambda API is working perfectly!
```

---

## 📊 Test Details

### Section 1: Health Checks

**Root API Info**
```bash
GET /
```
Validates:
- API name and version
- Endpoint documentation
- Status: healthy

**Database Connection**
```bash
GET /connection
```
Validates:
- Database connectivity
- Current user and database name
- Server version

### Section 2: CORS Support

**Preflight Request**
```bash
OPTIONS /table/complaints
```
Validates:
- CORS headers present
- Allow-Origin: *
- Allow-Methods includes GET, POST, etc.

### Section 3: Complaints API

**Get All Complaints**
```bash
GET /table/complaints?limit=5
```
Validates:
- Returns data array
- Has pagination info
- Extracts complaint ID for next tests

**Pagination**
```bash
GET /table/complaints?page=2&limit=3
```
Validates:
- Page parameter works
- Limit parameter works
- Different records returned

**Get by ID**
```bash
GET /table/complaints/{id}
```
Validates:
- Returns single complaint
- Has all expected fields

### Section 4: Messages API ⭐

**Get Messages with Title**
```bash
GET /table/complaints/{id}/messages
```
Validates:
- ✅ Returns messages array
- ✅ Returns complaint_title
- ✅ Returns count
- ✅ Messages have correct structure

**Expected Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "message text",
      "sent_at": "2024-01-01T10:00:00Z",
      "is_from_user": true
    }
  ],
  "complaint_title": "โดนโกง...",
  "complaint_status": "pending",
  "count": 10
}
```

### Section 5: Summary API ⭐

**Get Summary**
```bash
GET /table/complaints/{id}/summary
```
Validates:
- ✅ Returns summary object (or null)
- ✅ Returns complaint_title
- ✅ Returns contact info

**Expected Response:**
```json
{
  "summary": {
    "summary": "...",
    "key_points": [...],
    "timeline": [...]
  },
  "complaint_title": "...",
  "contact_name": "...",
  "contact_phone": "...",
  "amount": 50000
}
```

### Section 6: Generic Table Access

Tests generic table endpoints for:
- Messages table
- Summaries table

### Section 7: Error Handling

**Invalid UUID**
```bash
GET /table/complaints/invalid-uuid
```
Expected: 400 Bad Request

**Forbidden Table**
```bash
GET /table/forbidden_table
```
Expected: 403 Forbidden

**Non-existent Route**
```bash
GET /nonexistent
```
Expected: 404 Not Found

### Section 8: Performance

**Large Limit Test**
```bash
GET /table/complaints?limit=1000
```
Validates:
- Returns up to 1000 records
- Response time < 3 seconds
- Pagination info correct

---

## 🔍 Interpreting Results

### 100% Pass Rate

```
✓ Passed:  14
Success Rate: 100%
```

**Meaning:**
- ✅ Lambda deployed correctly
- ✅ Database connected
- ✅ All endpoints working
- ✅ Schema matches correctly
- ✅ Ready for production

### Partial Failures

```
✓ Passed:  10
✗ Failed:  4
Success Rate: 71%
```

**Common issues:**
- Messages/Summary endpoints failing → Schema mismatch
- Connection test failing → Database credentials
- All tests failing → Lambda not deployed

### Interpreting Errors

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An error occurred processing your request"
}
```

**Action:**
1. Check CloudWatch logs
2. Look for SQL errors
3. Verify column names

**400 Bad Request:**
```json
{
  "error": "Invalid complaint ID format"
}
```

**Action:**
- This is expected for invalid UUID test
- If unexpected, check ID format

---

## 🐛 Troubleshooting

### All tests fail

**Symptoms:**
```
✗ Failed: 14
```

**Causes:**
1. Lambda not deployed
2. Wrong Lambda URL
3. Network issues

**Solution:**
1. Verify Lambda URL in script (line 4)
2. Test manually: `curl https://lambda-url/`
3. Check internet connection

### Messages/Summary fail (500)

**Symptoms:**
```
✓ Passed:  10
✗ Messages endpoint: 500
✗ Summary endpoint: 500
```

**Causes:**
- Schema mismatch (wrong column names)
- Database table structure changed

**Solution:**
1. Redeploy latest `lambda-complete.js`
2. Run database verification:
   ```bash
   cd ../database
   node db-verify-schema.mjs
   ```

### Tests skipped

**Symptoms:**
```
⊘ Skipped: 3
```

**Causes:**
- No complaints in database
- Can't extract complaint ID

**Solution:**
1. Add test data to database
2. Or run generic table tests instead

### Slow response times

**Symptoms:**
- Tests pass but take > 5 seconds each

**Causes:**
- Database query performance
- Cold start (first request)
- Too much data returned

**Solution:**
1. Add database indexes
2. Reduce limit parameter
3. Optimize Lambda memory

---

## 📝 Test Script Configuration

### Lambda URL

Edit line 4:
```javascript
const LAMBDA_URL = 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws';
```

### Test Limits

Edit test parameters:
```javascript
// Line 85: Limit for complaint list
?limit=5

// Line 97: Pagination test
?page=2&limit=3

// Line 203: Performance test
?limit=1000
```

---

## 🧪 Manual Testing

### Test Individual Endpoint

```bash
# Health check
curl https://lambda-url/

# Database connection
curl https://lambda-url/connection

# Get complaints
curl "https://lambda-url/table/complaints?limit=5"

# Get messages (replace {ID})
curl "https://lambda-url/table/complaints/{ID}/messages"

# Get summary (replace {ID})
curl "https://lambda-url/table/complaints/{ID}/summary"
```

### Pretty Print JSON

```bash
curl -s "https://lambda-url/table/complaints?limit=5" | python3 -m json.tool
```

### Test with Headers

```bash
curl -v \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  "https://lambda-url/table/complaints"
```

---

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Lambda API

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Run tests
        run: |
          cd docs/testing
          node test-all-endpoints.mjs
      - name: Check test results
        run: |
          if [ $? -eq 0 ]; then
            echo "✅ All tests passed"
          else
            echo "❌ Tests failed"
            exit 1
          fi
```

---

## 📚 Related Documentation

- [Main Documentation](../README.md)
- [Lambda Function Code](../lambda/)
- [Database Scripts](../database/)
- [Frontend Integration](../FRONTEND_INTEGRATION.md)

---

## ✅ Test Checklist

Before deploying to production:

- [ ] Run test suite
- [ ] All tests pass (100%)
- [ ] Response times < 1 second
- [ ] No errors in CloudWatch logs
- [ ] CORS working for frontend
- [ ] Messages return complaint_title
- [ ] Summary returns contact info
- [ ] Error handling works correctly

---

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

**Expected Result:** ✅ 14/14 tests passing

**Last Updated:** 2025-11-11
