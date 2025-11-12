# Troubleshooting 502 Bad Gateway Error

This guide helps resolve the 502 Bad Gateway error when Frontend calls Lambda API.

---

## 🔍 Error Symptoms

### Browser Console Shows:
```
:5173/table/complaints?limit=20 - Failed to load resource: 502 (Bad Gateway)
Error fetching complaints: AxiosError
```

### What is 502 Bad Gateway?

**502 = Bad Gateway** means:
- The Lambda function received the request but couldn't process it
- Lambda timed out
- Lambda ran out of memory
- Lambda had an internal error
- Database connection failed

---

## ✅ Quick Fix Steps

### Step 1: Test Lambda Directly

```bash
# Test root endpoint
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/

# Test connection
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/connection

# Test complaints
curl "https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints?limit=5"
```

**Expected:**
- ✅ Returns JSON response
- ✅ Status 200 OK
- ✅ No timeout

**If you get 502 here too → Lambda problem**

### Step 2: Run Test Suite

```bash
cd docs/testing
node test-all-endpoints.mjs
```

**If tests pass:**
- ✅ Lambda is working
- ⚠️ Problem is with Vite proxy configuration

**If tests fail:**
- ❌ Lambda has issues
- Continue to Step 3

### Step 3: Check Lambda Deployment

**Open AWS Lambda Console:**
https://console.aws.amazon.com/lambda

**Select:** `scamreport-api`

**Check:**
1. ✅ Function exists
2. ✅ Last modified date (should be today)
3. ✅ Code is deployed
4. ✅ Environment variables are set

### Step 4: Check Lambda Configuration

**Configuration → General configuration:**

**Timeout:**
- Current: ??? seconds
- **Recommended: 30 seconds**

If timeout is too low (e.g., 3 seconds):
1. Click "Edit"
2. Set Timeout to 30 seconds
3. Click "Save"

**Memory:**
- Current: ??? MB
- **Recommended: 256 MB minimum**

If memory is too low (e.g., 128 MB):
1. Click "Edit"
2. Set Memory to 256 MB or 512 MB
3. Click "Save"

### Step 5: Check Environment Variables

**Configuration → Environment variables**

**Required variables:**
```
DB_HOST=scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=scamreport
DB_USER=postgres
DB_PASSWORD=Password123!
DB_SCHEMA=public
ALLOWED_ORIGINS=*
NODE_ENV=production
```

**If any are missing:**
1. Click "Edit"
2. Add missing variables
3. Click "Save"

### Step 6: Check CloudWatch Logs

**Monitor → View CloudWatch logs**

Look for errors:
```
❌ Error: Connection timeout
❌ Error: Task timed out after 3.00 seconds
❌ Error: column "xxx" does not exist
```

**Common errors and solutions:**

**1. Timeout Error:**
```
Task timed out after 3.00 seconds
```
**Solution:** Increase timeout to 30 seconds

**2. Out of Memory:**
```
Runtime.ExitError
```
**Solution:** Increase memory to 256 MB or 512 MB

**3. Database Connection:**
```
Error: Connection timeout
```
**Solution:**
- Check environment variables
- Check RDS Security Group
- Verify database is running

**4. Column Not Found:**
```
column "description" does not exist
```
**Solution:** Redeploy latest `lambda-complete.js`

---

## 🔧 Fix: Redeploy Lambda

If Lambda code is old or incorrect:

### 1. Copy Latest Code

```bash
# Open the file
open docs/lambda/lambda-complete.js

# Or view in terminal
cat docs/lambda/lambda-complete.js
```

### 2. Deploy to AWS

1. Open [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Select `scamreport-api`
3. Go to "Code" tab
4. **Select All** (Ctrl+A / Cmd+A)
5. **Delete** all code
6. **Copy** entire content from `lambda-complete.js`
7. **Paste** into editor
8. Click **"Deploy"**
9. Wait for "Changes deployed successfully"

### 3. Verify Deployment

```bash
# Test immediately after deploy
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/

# Should return:
{
  "name": "ScamReport API",
  "version": "1.0.0",
  "status": "healthy"
}
```

### 4. Run Full Tests

```bash
cd docs/testing
node test-all-endpoints.mjs
```

**Expected:** ✅ 14/14 tests passing

---

## 🔍 Advanced Troubleshooting

### Check Lambda Function URL

**Configuration → Function URL:**

Verify:
- ✅ Auth type: **NONE** (not AWS_IAM)
- ✅ CORS: Configured
- ✅ URL matches: `https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws`

If auth type is AWS_IAM:
1. Click "Edit"
2. Change to "NONE"
3. Save

### Check Database Connection

**Test from command line:**

```bash
# If you have psql installed
psql -h scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com \
     -U postgres -d scamreport -c "SELECT COUNT(*) FROM complaints;"
```

**Or use verification script:**
```bash
cd docs/database
node db-verify-schema.mjs
```

### Check RDS Security Group

**If database connection fails:**

1. Open [RDS Console](https://console.aws.amazon.com/rds)
2. Find `scamreport-db`
3. Check Security Groups
4. Ensure it allows connections from:
   - Lambda security group
   - Your IP (for testing)

### Check VPC Configuration

**If Lambda can't connect to database:**

**Lambda → Configuration → VPC:**
- ✅ Lambda should be in same VPC as RDS
- ✅ Or RDS should be publicly accessible

**If not configured:**
1. Lambda needs to be in VPC
2. Lambda needs Security Group that can access RDS
3. RDS Security Group needs to allow Lambda

---

## 🔄 Common Scenarios

### Scenario 1: Test Script Passes, Frontend Fails

**Symptoms:**
- ✅ `node test-all-endpoints.mjs` passes
- ❌ Frontend gets 502

**Cause:** Vite proxy issue

**Solution:**

1. **Check vite.config.js:**
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

2. **Restart dev server:**
```bash
# Stop: Ctrl+C
npm run dev
```

3. **Clear browser cache**

### Scenario 2: Both Test Script and Frontend Fail

**Symptoms:**
- ❌ `node test-all-endpoints.mjs` fails
- ❌ Frontend gets 502

**Cause:** Lambda problem

**Solution:**
1. Check Lambda deployment (Step 3)
2. Check Lambda configuration (Step 4)
3. Check CloudWatch logs (Step 6)
4. Redeploy Lambda

### Scenario 3: Timeout Only on Large Queries

**Symptoms:**
- ✅ Small limits work: `?limit=5`
- ❌ Large limits timeout: `?limit=1000`

**Cause:** Lambda timeout too short

**Solution:**
1. Increase Lambda timeout to 30 seconds
2. Add database indexes:
```sql
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
```

### Scenario 4: Works Sometimes, Fails Sometimes

**Symptoms:**
- Works on first load
- Fails on subsequent loads
- Or vice versa

**Cause:** Cold start or connection pool issue

**Solution:**
1. Increase Lambda memory to 512 MB
2. Add provisioned concurrency (costs money)
3. Keep Lambda "warm" with scheduled pings

---

## 📊 Verification Checklist

After fixing, verify these:

### Lambda Side
- [ ] Test script passes (100%)
- [ ] Direct curl works
- [ ] No errors in CloudWatch
- [ ] Timeout is 30+ seconds
- [ ] Memory is 256+ MB
- [ ] Environment variables set
- [ ] Auth type is NONE

### Frontend Side
- [ ] Vite proxy configured
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Complaints list loads
- [ ] Messages load
- [ ] No 502 errors

---

## 🆘 Still Not Working?

### Last Resort Steps:

1. **Delete and recreate Lambda function:**
   - Delete `scamreport-api`
   - Create new function
   - Upload code
   - Configure everything

2. **Check AWS Service Health:**
   - https://status.aws.amazon.com
   - Check if Lambda/RDS have issues

3. **Contact AWS Support:**
   - If service is degraded
   - If persistent issues

---

## 📝 Quick Commands Reference

```bash
# Test Lambda
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/

# Run tests
cd docs/testing && node test-all-endpoints.mjs

# Verify database
cd docs/database && node db-verify-schema.mjs

# Restart frontend
npm run dev

# View logs (if AWS CLI installed)
aws logs tail /aws/lambda/scamreport-api --follow
```

---

## ✅ Success Indicators

When fixed, you should see:

**Test Script:**
```
✓ Passed:  14
Success Rate: 100%
```

**Frontend Console:**
```
API_BASE_URL:  Mode: development
Loading conversations from API...
✓ Loaded 10 conversations
```

**No more errors:**
- ❌ No 502 Bad Gateway
- ❌ No timeout errors
- ❌ No connection errors

---

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

**Last Updated:** 2025-11-11
