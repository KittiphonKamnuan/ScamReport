# AWS Well-Architected Framework: Performance Efficiency Pillar
## แผนการปรับปรุงประสิทธิภาพระบบ ScamReport

**Version:** 1.0
**Date:** 2024-11-12
**Status:** Planning Phase

---

## 📊 สถาปัตยกรรมปัจจุบัน

### Frontend
- **Framework:** React 18 + Vite
- **Hosting:** ยังไม่ได้ deploy (development mode)
- **State Management:** React Context API
- **API Client:** Axios

### Backend
- **Compute:** AWS Lambda with Function URLs
- **Database:** PostgreSQL on RDS
- **Authentication:** AWS Cognito (ปิดใช้งาน - ใช้ NONE auth)
- **Region:** us-east-1

### ปัญหาปัจจุบัน
1. ❌ ไม่มี connection pooling สำหรับ RDS
2. ❌ Lambda cold start delays
3. ❌ ไม่มี caching layer
4. ❌ ไม่มี CDN สำหรับ static assets
5. ❌ ไม่มี monitoring และ alerting
6. ❌ Frontend ยังไม่ optimize (bundle size ใหญ่)

---

## 🎯 Phase 1: Selection - การเลือกทรัพยากรที่เหมาะสม

### 1.1 Compute Selection

#### Lambda Optimization
**Current Status:**
- Runtime: Node.js (ตรวจสอบเวอร์ชัน)
- Memory: Default (128 MB?)
- Timeout: Default
- ไม่มี provisioned concurrency

**Action Items:**
- [ ] ตรวจสอบ Lambda configuration ปัจจุบัน
- [ ] วิเคราะห์ memory usage จาก CloudWatch logs
- [ ] ปรับ memory allocation ตาม CPU-bound vs I/O-bound
- [ ] พิจารณา Provisioned Concurrency สำหรับ critical endpoints
- [ ] Enable Lambda Insights สำหรับ monitoring

**Recommendation:**
```javascript
// Lambda Configuration
{
  "Runtime": "nodejs20.x",
  "MemorySize": 512,  // เริ่มที่ 512 MB แล้วค่อย tune
  "Timeout": 30,       // 30 วินาที
  "Environment": {
    "NODE_OPTIONS": "--enable-source-maps",
    "DB_CONNECTION_LIMIT": "1"  // Lambda แต่ละ instance ใช้ 1 connection
  }
}
```

#### Frontend Hosting Selection
**Options:**

**Option A: AWS S3 + CloudFront (Recommended)**
- ✅ ราคาถูก
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ HTTPS ฟรี
- ❌ ต้องจัดการ routing สำหรับ SPA

**Option B: AWS Amplify Hosting**
- ✅ CI/CD built-in
- ✅ Preview branches
- ✅ ง่ายต่อการ setup
- ❌ แพงกว่า S3+CloudFront

**Option C: Vercel/Netlify**
- ✅ ฟรีสำหรับ hobby projects
- ✅ ง่ายมาก
- ❌ ไม่ได้อยู่ใน AWS ecosystem

**Decision:** S3 + CloudFront สำหรับ production

### 1.2 Database Selection

**Current:** PostgreSQL on RDS
- ✅ ACID compliance
- ✅ เหมาะกับ relational data
- ❌ ยังไม่มี read replicas
- ❌ Connection pooling ไม่เหมาะกับ Lambda

**Action Items:**
- [ ] เพิ่ม RDS Proxy สำหรับ connection pooling
- [ ] พิจารณา Read Replica สำหรับ read-heavy operations
- [ ] ตั้งค่า Parameter Group ให้เหมาะสม
- [ ] Enable Performance Insights

**Architecture:**
```
Lambda → RDS Proxy → RDS PostgreSQL
                   ↘ Read Replica (optional)
```

### 1.3 Network Selection

**Action Items:**
- [ ] ใช้ CloudFront เป็น CDN สำหรับ static assets
- [ ] เปิด compression (gzip/brotli)
- [ ] ใช้ HTTP/2 และ HTTP/3
- [ ] พิจารณา API Gateway + Lambda แทน Lambda Function URLs

---

## ⚡ Phase 2: Compute Optimization

### 2.1 Lambda Performance Optimization

#### Connection Pooling with RDS Proxy

**Create RDS Proxy:**
```bash
# AWS CLI command
aws rds create-db-proxy \
  --db-proxy-name scamreport-rds-proxy \
  --engine-family POSTGRESQL \
  --auth '[{"AuthScheme":"SECRETS","SecretArn":"arn:aws:secretsmanager:..."}]' \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/RDSProxyRole \
  --vpc-subnet-ids subnet-xxx subnet-yyy \
  --require-tls
```

**Update Lambda Environment:**
```javascript
// เปลี่ยนจาก direct RDS connection
// OLD: const host = 'scamreport-db.xxx.us-east-1.rds.amazonaws.com'
// NEW: const host = 'scamreport-rds-proxy.proxy-xxx.us-east-1.rds.amazonaws.com'
```

**Benefits:**
- ✅ Reduce connection overhead (80% faster)
- ✅ Handle Lambda scaling (ไม่ exhausted connections)
- ✅ Built-in connection pooling

#### Lambda Code Optimization

**1. Minimize Cold Starts:**
```javascript
// lambda-complete.js optimization

// 1. Move imports outside handler (global scope)
const { Client } = require('pg');

// 2. Reuse connection across invocations
let cachedDbConnection = null;

async function getDbConnection() {
  if (cachedDbConnection && !cachedDbConnection.ended) {
    console.log('Reusing existing connection');
    return cachedDbConnection;
  }

  console.log('Creating new connection');
  const client = new Client({
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    // Connection timeout
    connectionTimeoutMillis: 5000,
  });

  await client.connect();
  cachedDbConnection = client;
  return client;
}

// 3. Lazy load dependencies
const loadHeavyDependency = async () => {
  return await import('heavy-module');
};
```

**2. Lambda Layers:**
```bash
# สร้าง Layer สำหรับ node_modules
mkdir -p layers/nodejs
npm install --prefix layers/nodejs pg
cd layers && zip -r layer.zip nodejs/
aws lambda publish-layer-version \
  --layer-name scamreport-dependencies \
  --zip-file fileb://layer.zip \
  --compatible-runtimes nodejs20.x
```

**3. Memory vs Duration Optimization:**
```bash
# ทดสอบ memory sizes ต่างๆ
# Lambda costs = (duration * memory) / 1000
# More memory = more CPU = faster execution

# Test configurations:
- 512 MB → measure duration
- 1024 MB → measure duration
- 1536 MB → measure duration

# เลือก configuration ที่ cost/performance ดีที่สุด
```

### 2.2 Frontend Build Optimization

**Vite Build Configuration:**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }) // Analyze bundle size
  ],

  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'aws-vendor': ['amazon-cognito-identity-js'],
          'chart-vendor': ['recharts']  // ถ้ามี charts
        }
      }
    },

    // Compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.logs
        drop_debugger: true
      }
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500
  },

  // Tree shaking
  optimizeDeps: {
    include: ['axios', 'amazon-cognito-identity-js']
  }
});
```

**React Code Splitting:**
```javascript
// src/App.jsx - Lazy load routes
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ComplaintsPage = lazy(() => import('./pages/journalist/ComplaintsPage'));
const ComplaintDetail = lazy(() => import('./pages/admin/ComplaintDetail'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/journalist/complaints" element={<ComplaintsPage />} />
          <Route path="/admin/complaints/:id" element={<ComplaintDetail />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Image Optimization:**
```javascript
// ใช้ WebP format
// Lazy load images
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage
  src={imageUrl}
  alt="description"
  effect="blur"
  threshold={100}
/>
```

---

## 🗄️ Phase 3: Database Performance

### 3.1 Query Optimization

**Current Issues:**
```javascript
// ❌ N+1 Query Problem in getComplaintsWithTitles
for (const complaint of complaints) {
  const message = await conn.query(
    'SELECT content FROM messages WHERE complaint_id = $1',
    [complaint.id]
  );
}
```

**Optimized Query:**
```javascript
// ✅ Single query with JOIN
const query = `
  SELECT
    c.*,
    m.content as title
  FROM complaints c
  LEFT JOIN (
    SELECT DISTINCT ON (complaint_id)
      complaint_id, content
    FROM messages
    WHERE role = 'user'
    ORDER BY complaint_id, created_at ASC
  ) m ON c.id = m.complaint_id
  WHERE c.status = $1
  ORDER BY c.created_at DESC
  LIMIT $2 OFFSET $3
`;
```

### 3.2 Indexing Strategy

**Analyze Current Indexes:**
```sql
-- Check existing indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Recommended Indexes:**
```sql
-- complaints table
CREATE INDEX CONCURRENTLY idx_complaints_status_created
  ON complaints(status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_complaints_user_id
  ON complaints(user_id);

-- messages table
CREATE INDEX CONCURRENTLY idx_messages_complaint_role_created
  ON messages(complaint_id, role, created_at);

-- service_history table (already has indexes)
-- Verify they're being used

-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  idx_scan,
  seq_scan / NULLIF(idx_scan, 0) as seq_idx_ratio
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_scan DESC;
```

### 3.3 Connection Pooling

**Install RDS Proxy (see Phase 2.1)**

**Alternative: PgBouncer on EC2 (if not using RDS Proxy)**
```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# /etc/pgbouncer/pgbouncer.ini
[databases]
scamreport = host=scamreport-db.xxx.rds.amazonaws.com port=5432 dbname=scamreport

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### 3.4 Query Performance Analysis

**Enable Query Logging:**
```sql
-- On RDS Parameter Group
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1s
ALTER SYSTEM SET log_statement = 'all';  -- สำหรับ dev only
ALTER SYSTEM SET log_duration = on;
```

**Use EXPLAIN ANALYZE:**
```sql
-- Test slow queries
EXPLAIN ANALYZE
SELECT
  c.*,
  COUNT(m.id) as message_count
FROM complaints c
LEFT JOIN messages m ON c.id = m.complaint_id
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT 100;
```

---

## 🌐 Phase 4: Network & Caching

### 4.1 CloudFront Setup

**Create CloudFront Distribution:**
```yaml
# CloudFormation template
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ScamReportCDN:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Origins:
          # S3 Origin for static assets
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OAI}'

          # Lambda API Origin
          - Id: APIOrigin
            DomainName: hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws
            CustomOriginConfig:
              OriginProtocolPolicy: https-only

        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          Compress: true
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized

        # API behavior
        CacheBehaviors:
          - PathPattern: /table/*
            TargetOriginId: APIOrigin
            ViewerProtocolPolicy: https-only
            CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled
            OriginRequestPolicyId: b689b0a8-53d0-40ab-baf2-68738e2966ac  # AllViewerExceptHostHeader

        # Cache static assets
        CacheBehaviors:
          - PathPattern: /assets/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            Compress: true
            CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
            ResponseHeadersPolicyId: 60669652-455b-4ae9-85a7-c6e8f8b8e8d5  # CORS-With-Preflight
```

**Cache Headers in Lambda:**
```javascript
// lambda-complete.js
function response(statusCode, body, origin) {
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Add cache headers for GET requests
  if (statusCode === 200 && body.data) {
    // Cacheable endpoints
    if (path.includes('/stats') || path.includes('/table/service-history')) {
      headers['Cache-Control'] = 'public, max-age=300';  // 5 minutes
    }
    // Non-cacheable
    else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}
```

### 4.2 Application-Level Caching

**Redis ElastiCache (Optional):**
```javascript
// Add Redis for caching
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_ENDPOINT,
  port: 6379
});

async function getCachedData(key) {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (err) reject(err);
      resolve(data ? JSON.parse(data) : null);
    });
  });
}

// In Lambda handler
if (path === '/table/service-history/stats') {
  const cacheKey = `stats:${year || 'all'}`;
  const cached = await getCachedData(cacheKey);

  if (cached) {
    return response(200, cached, origin);
  }

  // Fetch from DB
  const stats = await getServiceHistoryStats(conn, queryParams);

  // Cache for 5 minutes
  client.setex(cacheKey, 300, JSON.stringify(stats));

  return response(200, stats, origin);
}
```

**In-Memory Caching (Simple):**
```javascript
// For Lambda warm containers
const cache = new Map();

function getCached(key, maxAge = 60000) {  // 1 minute default
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > maxAge) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

### 4.3 Frontend Caching Strategy

**Service Worker for PWA:**
```javascript
// public/service-worker.js
const CACHE_NAME = 'scamreport-v1';
const urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

**React Query for API Caching:**
```javascript
// Install: npm install @tanstack/react-query

// src/main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000,  // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});

// src/pages/admin/AdminComplaints.jsx
import { useQuery } from '@tanstack/react-query';

const { data: complaints, isLoading } = useQuery({
  queryKey: ['complaints', { limit: 1000 }],
  queryFn: () => complaintApi.getComplaints({ limit: 1000 }),
  staleTime: 2 * 60 * 1000  // 2 minutes
});
```

---

## 📊 Phase 5: Monitoring & Observability

### 5.1 CloudWatch Dashboards

**Create Custom Dashboard:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Duration", { "stat": "Average" }],
          [".", "Invocations", { "stat": "Sum" }],
          [".", "Errors", { "stat": "Sum" }],
          [".", "Throttles", { "stat": "Sum" }],
          [".", "ConcurrentExecutions", { "stat": "Maximum" }]
        ],
        "title": "Lambda Performance",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", { "stat": "Average" }],
          [".", "CPUUtilization", { "stat": "Average" }],
          [".", "ReadLatency", { "stat": "Average" }],
          [".", "WriteLatency", { "stat": "Average" }]
        ],
        "title": "RDS Performance"
      }
    }
  ]
}
```

**Lambda Insights:**
```bash
# Enable Lambda Insights
aws lambda update-function-configuration \
  --function-name scamreport-api \
  --layers arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:14
```

### 5.2 AWS X-Ray Tracing

**Enable X-Ray:**
```javascript
// lambda-complete.js
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

// Capture PostgreSQL queries
const { Client } = AWSXRay.capturePostgres(require('pg'));

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('handler');

  try {
    // Your code
  } finally {
    subsegment.close();
  }
};
```

**X-Ray Configuration:**
```bash
# Update Lambda to enable X-Ray
aws lambda update-function-configuration \
  --function-name scamreport-api \
  --tracing-config Mode=Active
```

### 5.3 Custom Metrics

**CloudWatch Custom Metrics:**
```javascript
// lambda-complete.js
const cloudwatch = new AWS.CloudWatch();

async function publishMetric(metricName, value, unit = 'Count') {
  await cloudwatch.putMetricData({
    Namespace: 'ScamReport/API',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
}

// Track business metrics
await publishMetric('ComplaintsCreated', 1);
await publishMetric('DatabaseQueryTime', duration, 'Milliseconds');
```

### 5.4 Alerting

**CloudWatch Alarms:**
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name scamreport-high-error-rate \
  --alarm-description "Alert when Lambda error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=scamreport-api

# High duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name scamreport-slow-response \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 3000 \
  --comparison-operator GreaterThanThreshold
```

### 5.5 Frontend Performance Monitoring

**Web Vitals:**
```javascript
// src/reportWebVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to CloudWatch or Analytics
  console.log(metric);

  // Optional: Send to CloudWatch via API
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify(metric)
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Error Tracking:**
```javascript
// src/main.jsx
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to logging service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

---

## 🧪 Phase 6: Load Testing

### 6.1 Artillery Load Testing

**Install Artillery:**
```bash
npm install -g artillery
```

**Create Load Test:**
```yaml
# load-test.yml
config:
  target: "https://hmvc66corvnthoileo5lj233dy0hnaho.lambda-url.us-east-1.on.aws"
  phases:
    # Warm up
    - duration: 60
      arrivalRate: 5
      name: "Warm up"

    # Ramp up
    - duration: 300
      arrivalRate: 5
      rampTo: 50
      name: "Ramp up load"

    # Sustained load
    - duration: 600
      arrivalRate: 50
      name: "Sustained load"

    # Spike test
    - duration: 60
      arrivalRate: 200
      name: "Spike test"

scenarios:
  # Test GET complaints
  - name: "Get Complaints"
    weight: 40
    flow:
      - get:
          url: "/table/complaints?limit=100"
          expect:
            - statusCode: 200

  # Test GET service history
  - name: "Get Service History"
    weight: 30
    flow:
      - get:
          url: "/table/service-history?limit=50"

  # Test statistics
  - name: "Get Stats"
    weight: 20
    flow:
      - get:
          url: "/table/service-history/stats"

  # Test POST (create)
  - name: "Create Service History"
    weight: 10
    flow:
      - post:
          url: "/table/service-history"
          json:
            date: "2024-01-15"
            description: "Load test record"
            year: 2567
```

**Run Load Test:**
```bash
# Run test
artillery run load-test.yml --output report.json

# Generate HTML report
artillery report report.json
```

**Expected Metrics:**
- **P95 Latency:** < 500ms
- **P99 Latency:** < 1000ms
- **Error Rate:** < 1%
- **Throughput:** > 100 req/sec

### 6.2 Database Load Testing

**pgbench:**
```bash
# Initialize test database
pgbench -i -s 50 scamreport

# Run benchmark (10 clients, 100 transactions each)
pgbench -c 10 -t 100 scamreport

# Custom SQL test
cat > test.sql <<EOF
SELECT * FROM complaints ORDER BY created_at DESC LIMIT 100;
SELECT * FROM service_history WHERE province = 'กรุงเทพมหานคร' LIMIT 50;
EOF

pgbench -c 20 -T 60 -f test.sql scamreport
```

### 6.3 Frontend Load Testing

**Lighthouse CI:**
```bash
# Install
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:5173

# Expected scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

**WebPageTest:**
```bash
# Use WebPageTest API
curl "https://www.webpagetest.org/runtest.php?url=https://your-domain.com&k=YOUR_API_KEY"
```

### 6.4 Analyze Results

**Create Performance Report:**
```markdown
# Load Test Results - [Date]

## Summary
- Total Requests: 50,000
- Success Rate: 99.2%
- Average Latency: 245ms
- P95 Latency: 480ms
- P99 Latency: 850ms

## Bottlenecks Identified
1. Database connection time: 150ms avg
2. Lambda cold starts: 3.2s (2% of requests)
3. Large payload size: 500KB avg

## Action Items
1. Implement RDS Proxy (reduce connection time by 80%)
2. Enable provisioned concurrency (eliminate cold starts)
3. Add pagination and field filtering (reduce payload size)
```

---

## 🔄 Phase 7: Review & Continuous Improvement

### 7.1 Performance Baselines

**Set Performance SLAs:**
```yaml
SLA_Targets:
  API_Response_Time:
    P50: < 200ms
    P95: < 500ms
    P99: < 1000ms

  Page_Load_Time:
    FCP: < 1.8s
    LCP: < 2.5s
    TTI: < 3.8s

  Database_Query_Time:
    Simple: < 50ms
    Complex: < 200ms

  Availability: 99.9%

  Error_Rate: < 0.1%
```

### 7.2 Monthly Performance Review

**Checklist:**
- [ ] Review CloudWatch metrics and identify trends
- [ ] Analyze slow query logs from RDS
- [ ] Check Lambda duration and memory usage
- [ ] Review error rates and types
- [ ] Update indexes based on query patterns
- [ ] Test new features under load
- [ ] Review and optimize bundle sizes
- [ ] Update dependencies and security patches

### 7.3 Cost Optimization

**AWS Cost Explorer Analysis:**
```bash
# Check monthly costs
aws ce get-cost-and-usage \
  --time-period Start=2024-11-01,End=2024-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Cost Optimization Opportunities:**
- [ ] Right-size RDS instance (use Performance Insights)
- [ ] Review Lambda memory allocation (cost vs speed)
- [ ] Enable S3 Intelligent-Tiering for old attachments
- [ ] Use Reserved Instances for predictable workloads
- [ ] Set up CloudWatch log retention policies

### 7.4 Evolutionary Architecture

**Future Enhancements:**

**Q1 2025:**
- [ ] Implement GraphQL API for flexible queries
- [ ] Add ElastiCache Redis for caching
- [ ] Enable RDS Multi-AZ for high availability

**Q2 2025:**
- [ ] Migrate to containerized architecture (ECS/Fargate)
- [ ] Implement event-driven architecture (SQS/SNS)
- [ ] Add AI-powered complaint classification

**Q3 2025:**
- [ ] Add real-time features (WebSockets via API Gateway)
- [ ] Implement data lake for analytics (S3 + Athena)
- [ ] Multi-region deployment

---

## 📋 Implementation Timeline

### Week 1-2: Quick Wins
- ✅ Enable Lambda Insights and X-Ray
- ✅ Add database indexes
- ✅ Optimize Lambda memory settings
- ✅ Enable CloudWatch alarms
- ✅ Frontend bundle optimization

### Week 3-4: Infrastructure
- ⏳ Deploy RDS Proxy
- ⏳ Set up CloudFront distribution
- ⏳ Deploy frontend to S3
- ⏳ Configure caching headers

### Week 5-6: Testing & Monitoring
- ⏳ Run load tests
- ⏳ Create CloudWatch dashboards
- ⏳ Implement custom metrics
- ⏳ Set up alerting

### Week 7-8: Optimization & Documentation
- ⏳ Analyze results and optimize
- ⏳ Document findings
- ⏳ Train team on monitoring
- ⏳ Create runbooks

---

## 🎯 Success Metrics

### Before Optimization (Baseline)
```
┌─────────────────────┬──────────┐
│ Metric              │ Current  │
├─────────────────────┼──────────┤
│ API P95 Latency     │ ???      │
│ Page Load (LCP)     │ ???      │
│ Error Rate          │ ???      │
│ Lambda Cold Start   │ ~3s      │
│ DB Connection Time  │ ~150ms   │
│ Monthly Cost        │ ???      │
└─────────────────────┴──────────┘
```

### After Optimization (Target)
```
┌─────────────────────┬──────────┬───────────┐
│ Metric              │ Target   │ Improve   │
├─────────────────────┼──────────┼───────────┤
│ API P95 Latency     │ < 500ms  │ -         │
│ Page Load (LCP)     │ < 2.5s   │ -         │
│ Error Rate          │ < 0.1%   │ -         │
│ Lambda Cold Start   │ < 500ms  │ -83%      │
│ DB Connection Time  │ < 30ms   │ -80%      │
│ Monthly Cost        │ Optimize │ -20%      │
└─────────────────────┴──────────┴───────────┘
```

---

## 📚 Resources

### AWS Documentation
- [Well-Architected Framework - Performance Efficiency](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [RDS Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)

### Tools
- [Artillery](https://www.artillery.io/) - Load testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Frontend auditing
- [AWS X-Ray](https://aws.amazon.com/xray/) - Distributed tracing
- [pgbench](https://www.postgresql.org/docs/current/pgbench.html) - PostgreSQL benchmarking

### Monitoring Services
- AWS CloudWatch
- AWS X-Ray
- Datadog (optional)
- New Relic (optional)

---

## ✅ Next Steps

1. **Review this plan** with the team
2. **Establish baselines** - Run current performance tests
3. **Prioritize improvements** - Focus on high-impact, low-effort items first
4. **Start with Phase 1** - Selection and quick wins
5. **Measure everything** - Set up monitoring before optimizing
6. **Iterate** - Measure, optimize, repeat

---

**Document Owner:** DevOps Team
**Last Updated:** 2024-11-12
**Next Review:** 2024-12-12
