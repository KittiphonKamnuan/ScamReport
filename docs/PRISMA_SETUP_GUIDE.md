# Prisma Setup Guide for ScamReport

## Overview

This guide will help you set up Prisma ORM for the ScamReport database, enabling type-safe database access from your Node.js/TypeScript applications.

---

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (AWS RDS or local)
- Database credentials

---

## Installation

### 1. Install Prisma Dependencies

```bash
cd scamreport-frontend
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Configure Database Connection

Copy the example environment file:

```bash
cp .env.prisma.example .env
```

Edit `.env` and add your database URL:

```env
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"
```

For AWS RDS (with SSL):
```env
DATABASE_URL="postgresql://admin:password@your-db.xxxxx.us-east-1.rds.amazonaws.com:5432/scamreport?schema=public&sslmode=require"
```

---

## Using Prisma

### Initialize Prisma (First Time Only)

If you haven't created the schema file yet:

```bash
npx prisma init
```

Since we already have `schema.prisma`, you can skip this step.

---

### Generate Prisma Client

Generate the TypeScript client from schema:

```bash
npx prisma generate
```

This creates the Prisma Client in `node_modules/@prisma/client`.

---

### Create Database Schema

#### Option 1: Using Prisma Migrate (Recommended for New Databases)

Create initial migration:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database if it doesn't exist
- Generate SQL migration files
- Apply migrations to the database
- Generate Prisma Client

#### Option 2: Using Existing Database (Introspection)

If you already have a database with tables:

```bash
npx prisma db pull
```

This will:
- Introspect your database
- Update `schema.prisma` to match your database
- You may need to merge this with the existing schema

#### Option 3: Push Schema Without Migrations (Development Only)

```bash
npx prisma db push
```

**Warning:** This will directly modify your database schema without creating migration files. Use only in development!

---

### Run Migrations (Production)

Apply pending migrations:

```bash
npx prisma migrate deploy
```

---

## Prisma Commands Reference

### Common Commands

```bash
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (Database GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# View migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# Create a new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Pull schema from database
npx prisma db pull

# Push schema to database (no migrations)
npx prisma db push
```

---

## Using Prisma Client in Your Code

### Basic Setup

Create a Prisma client instance:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Example Queries

#### Get All Complaints

```typescript
import { prisma } from './lib/prisma'

const complaints = await prisma.complaint.findMany({
  include: {
    messages: true,
    summaries: true,
    assignedUser: true
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10
})
```

#### Get Complaint Messages with Title

```typescript
const messagesWithComplaint = await prisma.message.findMany({
  where: {
    complaintId: 'complaint-uuid-here'
  },
  include: {
    complaint: {
      select: {
        id: true,
        title: true,
        description: true,
        status: true
      }
    }
  },
  orderBy: {
    timestamp: 'asc'
  }
})

// Access complaint title
messagesWithComplaint.forEach(msg => {
  console.log('Complaint Title:', msg.complaint.title)
  console.log('Message:', msg.message)
})
```

#### Get Complaint Summary

```typescript
const complaintWithSummary = await prisma.complaint.findUnique({
  where: { id: 'complaint-uuid-here' },
  include: {
    summaries: {
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    },
    messages: {
      orderBy: {
        timestamp: 'asc'
      }
    }
  }
})

const latestSummary = complaintWithSummary?.summaries[0]
console.log('Title:', complaintWithSummary?.title)
console.log('Summary:', latestSummary?.summary)
```

#### Create a New Complaint

```typescript
const newComplaint = await prisma.complaint.create({
  data: {
    title: 'หลอกลงทุนคริปโต',
    description: 'ถูกหลอกลงทุนในคริปโต จำนวน 50,000 บาท',
    contactName: 'สมชาย ใจดี',
    contactPhone: '0812345678',
    totalLossAmount: 50000,
    category: 'การฉ้อโกงออนไลน์',
    status: 'pending'
  }
})
```

#### Create Message with Complaint

```typescript
const message = await prisma.message.create({
  data: {
    complaintId: 'complaint-uuid-here',
    senderName: 'ผู้ร้องเรียน',
    senderType: 'user',
    message: 'ถูกหลอกโอนเงิน 50,000 บาท'
  }
})
```

#### Update Complaint

```typescript
await prisma.complaint.update({
  where: { id: 'complaint-uuid-here' },
  data: {
    status: 'reviewing',
    assignedTo: 'user-uuid-here'
  }
})
```

#### Complex Query with Aggregations

```typescript
const stats = await prisma.complaint.aggregate({
  where: {
    status: 'published'
  },
  _count: {
    id: true
  },
  _sum: {
    totalLossAmount: true
  }
})

console.log('Total Published:', stats._count.id)
console.log('Total Loss:', stats._sum.totalLossAmount)
```

---

## Advanced Features

### Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create complaint
  const complaint = await tx.complaint.create({
    data: {
      title: 'หลอกลงทุน',
      // ... other fields
    }
  })

  // Create first message
  await tx.message.create({
    data: {
      complaintId: complaint.id,
      message: 'ข้อความแรก'
    }
  })

  // Create summary
  await tx.summary.create({
    data: {
      complaintId: complaint.id,
      summary: 'สรุปเบื้องต้น'
    }
  })

  return complaint
})
```

### Raw Queries

```typescript
// Raw SQL query
const result = await prisma.$queryRaw`
  SELECT c.title, COUNT(m.id) as message_count
  FROM complaints c
  LEFT JOIN messages m ON m.complaint_id = c.id
  GROUP BY c.id, c.title
  ORDER BY message_count DESC
  LIMIT 10
`

// Execute raw SQL
await prisma.$executeRaw`
  UPDATE complaints
  SET status = 'closed'
  WHERE created_at < NOW() - INTERVAL '1 year'
`
```

---

## Updating Schema

When you modify `schema.prisma`:

1. **Development:** Create a migration
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

2. **Generate client**
   ```bash
   npx prisma generate
   ```

3. **Production:** Deploy migration
   ```bash
   npx prisma migrate deploy
   ```

---

## Troubleshooting

### Connection Issues

**Error:** `Can't reach database server`

Solution:
- Check DATABASE_URL in .env
- Verify database is running
- Check firewall/security groups (AWS RDS)
- Ensure SSL mode is correct (`sslmode=require` for RDS)

### Migration Conflicts

**Error:** `Migration conflict detected`

Solution:
```bash
# Reset database (development only!)
npx prisma migrate reset

# Or manually resolve conflicts
npx prisma migrate resolve --applied "migration_name"
```

### Schema Out of Sync

**Error:** `Prisma schema is not in sync with database`

Solution:
```bash
# Pull latest schema from database
npx prisma db pull

# Or push your schema to database
npx prisma db push
```

---

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:push": "prisma db push",
    "prisma:pull": "prisma db pull",
    "prisma:format": "prisma format"
  }
}
```

Usage:
```bash
npm run prisma:generate
npm run prisma:studio
npm run prisma:migrate
```

---

## Best Practices

1. **Always use migrations** in production (not `db push`)
2. **Use transactions** for operations that must succeed or fail together
3. **Include relations** only when needed to avoid over-fetching
4. **Use select** to limit fields returned
5. **Handle errors** properly with try-catch
6. **Use connection pooling** in production
7. **Close connections** when done (especially in serverless)

---

## Next Steps

1. Run `npx prisma generate` to create Prisma Client
2. Test connection with `npx prisma studio`
3. Create your first migration or push schema
4. Start using Prisma Client in your Lambda functions
5. Replace raw SQL queries with Prisma queries

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma with AWS Lambda](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
