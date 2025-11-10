# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Test the New Endpoints

```bash
# Navigate to docs folder
cd docs

# Run the test suite
node test-endpoints.mjs
```

Expected output: ✅ All tests should pass with complaint_title visible in responses

---

### 2. Deploy Lambda Function

**Copy the updated Lambda code:**
- File: `docs/lambda-updated.js`
- Deploy to: AWS Lambda Console or via CLI

**Quick Deploy (AWS Console):**
1. Open AWS Lambda
2. Find your function
3. Copy/paste code from `lambda-updated.js`
4. Click "Deploy"
5. Done! ✅

---

### 3. Verify Database Schema

**Check if `complaints` table has `title` column:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'complaints'
  AND column_name = 'title';
```

**If not found, add it:**

```sql
ALTER TABLE complaints ADD COLUMN title VARCHAR(255);

-- Optional: Set default values
UPDATE complaints
SET title = COALESCE(description, 'No Title')
WHERE title IS NULL;
```

---

### 4. Test Frontend Changes

The frontend has already been updated! Just verify:

```bash
# Start dev server
npm run dev

# Go to Admin History page
# Click on any complaint
# Check:
# ✅ Modal header shows complaint title
# ✅ Messages load properly
# ✅ Search works with titles
```

---

### 5. (Optional) Setup Prisma

```bash
# Install Prisma
npm install prisma @prisma/client

# Configure database
cp .env.prisma.example .env
# Edit .env with your database URL

# Generate Prisma Client
npx prisma generate

# View database in GUI
npx prisma studio
```

---

## 📝 What Changed?

### Backend (Lambda)
- ✅ Added `/table/complaints/:id/messages` - Returns messages WITH complaint title
- ✅ Added `/table/complaints/:id/summary` - Returns summary with complaint info
- ✅ Uses JOIN queries to fetch related data in single request

### Frontend (AdminHistory.jsx)
- ✅ Displays complaint title in modal header
- ✅ Stores and uses `complaint_title` from API
- ✅ Searchable by title
- ✅ Better user experience

### Database
- ⚠️ Requires `complaints.title` column (add if missing)

---

## 🧪 Test Endpoints Manually

### Get Messages with Title

```bash
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints/YOUR-UUID/messages
```

Look for `complaint_title` in the response!

### Get Summary

```bash
curl https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints/YOUR-UUID/summary
```

---

## 📚 Full Documentation

- **Lambda Update Guide:** `docs/LAMBDA_UPDATE_GUIDE.md`
- **Prisma Setup Guide:** `docs/PRISMA_SETUP_GUIDE.md`
- **Implementation Summary:** `docs/IMPLEMENTATION_SUMMARY.md`
- **API Documentation:** `docs/API_DOCUMENTATION.md`

---

## ✅ Success Checklist

- [ ] Lambda function deployed
- [ ] Database has `complaints.title` column
- [ ] Test suite passes (`node test-endpoints.mjs`)
- [ ] Frontend shows complaint titles
- [ ] No errors in browser console
- [ ] No errors in Lambda CloudWatch logs

---

## 🆘 Need Help?

**Common Issues:**

1. **complaint_title is null**
   - Add the `title` column to database (see step 3)

2. **404 Not Found**
   - Verify Lambda deployment
   - Check URL paths match the new routes

3. **CORS Error**
   - Already fixed in Lambda response headers
   - Clear browser cache and retry

4. **Frontend doesn't show title**
   - Check browser console for errors
   - Verify API response includes `complaint_title`

---

## 🎉 That's It!

You're done! The system now includes complaint titles in message responses.

**Next Steps:**
- Deploy to production
- Monitor CloudWatch logs
- Setup Prisma for type-safe queries
- Add more features!
