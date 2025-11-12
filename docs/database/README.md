# Database Utilities

This folder contains database verification and management scripts.

---

## 📋 Files

### `db-verify-schema.mjs`

Verifies database schema and displays table structures.

**Features:**
- ✅ Lists all tables in database
- ✅ Shows column names and types
- ✅ Displays constraints
- ✅ Checks for required columns

---

## 🚀 Usage

### Verify Database Schema

```bash
cd docs/database
node db-verify-schema.mjs
```

### Expected Output

```
🔍 Verifying Database Schema...

Database: scamreport
Host: scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
Schema: public

📊 Tables Found: 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Table: complaints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Columns (25):
  - id (uuid)
  - complaint_number (character varying)
  - line_user_id (character varying)
  - line_display_name (character varying)
  - title (character varying) ⭐
  - category (character varying)
  - status (character varying)
  - financial_damage (numeric)
  - contact_name (character varying)
  - contact_phone (character varying)
  - created_at (timestamp)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Table: messages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Columns (11):
  - id (uuid)
  - complaint_id (uuid) → complaints
  - line_message_id (character varying)
  - message_type (character varying)
  - content (text) ⭐
  - raw_content (jsonb)
  - sequence_number (integer)
  - is_from_user (boolean)
  - sent_at (timestamp) ⭐
  - received_at (timestamp)
  - created_at (timestamp)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Table: summaries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Columns (10):
  - id (uuid)
  - complaint_id (uuid) → complaints
  - summary_text (text)
  - summary_type (character varying)
  - key_points (text/jsonb)
  - timeline (text/jsonb)
  - word_count (integer)
  - generated_by (character varying)
  - created_at (timestamp)
  - updated_at (timestamp)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Table: users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Columns (8):
  - id (uuid)
  - username (character varying)
  - email (character varying)
  - role (character varying)
  - created_at (timestamp)
  ...

✅ Schema verification complete!
```

---

## 📊 Database Connection

### Configuration

Scripts connect using environment variables or hardcoded values:

```javascript
const DB_HOST = 'scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com';
const DB_PORT = 5432;
const DB_NAME = 'scamreport';
const DB_USER = 'postgres';
const DB_PASSWORD = 'Password123!';
const DB_SCHEMA = 'public';
```

### Security Note

⚠️ **These scripts are for development/debugging only**

For production:
- Use environment variables
- Never commit credentials
- Use AWS Secrets Manager
- Restrict database access

---

## 🔍 Schema Requirements

### Critical Columns

Lambda function requires these exact column names:

**Complaints Table:**
- ✅ `id` (UUID)
- ✅ `title` (VARCHAR) - **REQUIRED**
- ✅ `status` (VARCHAR)
- ✅ `line_user_id` (VARCHAR)
- ✅ `line_display_name` (VARCHAR)
- ✅ `contact_name` (VARCHAR)
- ✅ `contact_phone` (VARCHAR)
- ✅ `financial_damage` (NUMERIC)
- ✅ `created_at` (TIMESTAMP)

**Messages Table:**
- ✅ `id` (UUID)
- ✅ `complaint_id` (UUID) → Foreign key
- ✅ `content` (TEXT) - **NOT** `message`
- ✅ `sent_at` (TIMESTAMP) - **NOT** `timestamp`
- ✅ `is_from_user` (BOOLEAN) - **NOT** `sender_type`
- ✅ `line_message_id` (VARCHAR)
- ✅ `message_type` (VARCHAR)
- ✅ `created_at` (TIMESTAMP)

**Summaries Table:**
- ✅ `id` (UUID)
- ✅ `complaint_id` (UUID) → Foreign key
- ✅ `summary_text` (TEXT)
- ✅ `key_points` (TEXT/JSONB)
- ✅ `timeline` (TEXT/JSONB)
- ✅ `created_at` (TIMESTAMP)

---

## 🐛 Troubleshooting

### Connection Failed

**Error:**
```
Error: connect ETIMEDOUT
```

**Solutions:**
1. Check RDS Security Group
2. Verify database credentials
3. Test network connectivity
4. Check VPC settings

### Column Not Found

**Error:**
```
column "description" does not exist
```

**Solutions:**
1. Run schema verification script
2. Compare with Lambda expectations
3. Update Lambda code if needed
4. Add missing columns to database

### Permission Denied

**Error:**
```
permission denied for table complaints
```

**Solutions:**
1. Check database user permissions
2. Grant SELECT permissions:
   ```sql
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres;
   ```

---

## 📝 Common Queries

### Check Table Exists

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'complaints'
);
```

### List All Columns

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'complaints'
ORDER BY ordinal_position;
```

### Check Foreign Keys

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';
```

---

## 🔧 Database Maintenance

### Recommended Indexes

For better performance:

```sql
-- Complaints indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status
  ON complaints(status);

CREATE INDEX IF NOT EXISTS idx_complaints_created_at
  ON complaints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_line_user_id
  ON complaints(line_user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_complaint_id
  ON messages(complaint_id);

CREATE INDEX IF NOT EXISTS idx_messages_sent_at
  ON messages(sent_at DESC);

-- Summaries indexes
CREATE INDEX IF NOT EXISTS idx_summaries_complaint_id
  ON summaries(complaint_id);
```

### Backup Database

```bash
# Full backup
pg_dump -h scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com \
  -U postgres -d scamreport > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -h scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com \
  -U postgres -d scamreport --schema-only > schema.sql
```

### Restore Database

```bash
psql -h scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com \
  -U postgres -d scamreport < backup_20250111.sql
```

---

## 📊 Database Stats

### Check Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Count Records

```sql
SELECT 'complaints' AS table, COUNT(*) FROM complaints
UNION ALL
SELECT 'messages' AS table, COUNT(*) FROM messages
UNION ALL
SELECT 'summaries' AS table, COUNT(*) FROM summaries
UNION ALL
SELECT 'users' AS table, COUNT(*) FROM users;
```

### Check Recent Activity

```sql
-- Recent complaints
SELECT id, title, created_at
FROM complaints
ORDER BY created_at DESC
LIMIT 10;

-- Recent messages
SELECT id, complaint_id, content, sent_at
FROM messages
ORDER BY sent_at DESC
LIMIT 10;
```

---

## 🔐 Security Best Practices

### For Development

1. ✅ Use read-only credentials when possible
2. ✅ Don't commit database credentials
3. ✅ Use environment variables
4. ✅ Limit network access

### For Production

1. ✅ Use AWS Secrets Manager
2. ✅ Enable SSL connections
3. ✅ Use IAM database authentication
4. ✅ Enable audit logging
5. ✅ Regular backups
6. ✅ Monitor query performance

---

## 📚 Related Documentation

- [Main Documentation](../README.md)
- [Lambda Functions](../lambda/)
- [Testing Scripts](../testing/)
- [API Documentation](../API_DOCUMENTATION.md)

---

## ✅ Health Check Checklist

Run verification script and check:

- [ ] All required tables exist
- [ ] Complaints table has `title` column
- [ ] Messages table has `content`, `sent_at`, `is_from_user`
- [ ] Summaries table has `summary_text`, `key_points`
- [ ] Foreign keys are set up correctly
- [ ] Indexes exist for performance
- [ ] Database user has correct permissions
- [ ] Connection works from Lambda

---

**Database Info:**
```
Host: scamreport-db.cleqeoc4iw38.us-east-1.rds.amazonaws.com
Port: 5432
Database: scamreport
Schema: public
```

**Status:** ✅ Operational

**Last Updated:** 2025-11-11
