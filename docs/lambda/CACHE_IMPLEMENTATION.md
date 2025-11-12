# 💾 Lambda In-Memory Cache Implementation

**Date:** 2025-11-12
**Status:** Implemented ✅
**Location:** `lambda-complete.js`

---

## 🎯 Overview

Added in-memory caching to Lambda function to improve performance and reduce database load.

### Key Benefits:
- ⚡ **60-75% faster response times** (expected)
- 📉 **80-90% reduction in database queries** (expected)
- 💰 **Lower RDS costs** (fewer connections)
- 🚀 **Better user experience** (instant responses from cache)

---

## 🏗️ Architecture

### Cache Structure

```javascript
const cache = {
    data: Map,           // Stores cached data with keys
    get(key),            // Retrieve cached data if valid
    set(key, value, ttl), // Store data with TTL
    clear(pattern),      // Clear cache by pattern
    stats()              // Get cache statistics
}
```

### Cache TTL Configuration

| Endpoint | TTL | Reason |
|----------|-----|--------|
| **Complaints List** | 60s | High traffic, frequent access |
| **Complaint Detail** | 5 min | Less frequent updates |
| **Statistics** | 10 min | Rarely changes |
| **Messages** | 5 min | Moderately updated |
| **Summaries** | 5 min | Moderately updated |

---

## 📦 Cached Endpoints

### 1. GET /table/:tableName
**Caches:** Complaints, messages, summaries lists
**Cache Key Pattern:** `table_{tableName}_p{page}_l{limit}`
**TTL:** 60s (complaints) / 300s (others)

```javascript
// Example cache keys:
table_complaints_p1_l10     // Page 1, 10 items
table_complaints_p2_l10     // Page 2, 10 items
table_messages_p1_l3        // Messages, page 1
```

**Cache Hit Example:**
```
❌ Cache MISS: table_complaints_p1_l10
   → Query database
   💾 Cached: table_complaints_p1_l10 (TTL: 60000ms)

✅ Cache HIT: table_complaints_p1_l10
   → Return from cache (no database query)
```

---

### 2. GET /table/:tableName/:id
**Caches:** Individual complaint/record details
**Cache Key Pattern:** `detail_{tableName}_{recordId}`
**TTL:** 300s (5 minutes)

```javascript
// Example cache keys:
detail_complaints_84615346-cebb-4ed4-844f-20eaeec3f7f8
detail_service_history_a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### 3. GET /table/service-history/stats
**Caches:** Service history statistics (overall, by province, by issue type)
**Cache Key Pattern:** `stats_service_history[_y{year}|_all]`
**TTL:** 600s (10 minutes)

```javascript
// Example cache keys:
stats_service_history_all      // All years
stats_service_history_y2024    // Year 2024 only
stats_service_history_y2025    // Year 2025 only
```

---

## 🗑️ Cache Invalidation

Cache is automatically cleared when data changes:

### POST /table/service-history
**Clears:** `stats_service_history*`
**Reason:** New record affects statistics

### PUT /table/service-history/:id
**Clears:**
- `stats_service_history*` (statistics changed)
- `detail_service_history_{id}` (detail changed)

### DELETE /table/service-history/:id
**Clears:**
- `stats_service_history*` (statistics changed)
- `detail_service_history_{id}` (detail changed)

---

## 📊 Performance Impact

### Before Cache (Baseline)

| Metric | Value |
|--------|-------|
| Total Duration | 8,237ms (~8.2s) |
| Success Rate | 79% (11/14) |
| Avg per Test | 588ms |
| Database Hits | 14 queries |

### After Cache (Expected)

| Metric | Target | Improvement |
|--------|--------|-------------|
| Total Duration | **2,000-3,000ms** | **60-75% faster** |
| Success Rate | **85-95%** | +6-16% |
| Avg per Test | **150-200ms** | **65-75% faster** |
| Database Hits | **2-3 queries** | **80-85% reduction** |
| Cache Hit Rate | **70-80%** | N/A |

---

## 🔍 Cache Logs

When running Lambda, you'll see cache activity in logs:

```
❌ Cache MISS: table_complaints_p1_l10
💾 Cached: table_complaints_p1_l10 (TTL: 60000ms)

✅ Cache HIT: table_complaints_p1_l10

🗑️  Cleared cache: stats_service_history*
```

**Log Symbols:**
- `❌` Cache MISS - Data fetched from database
- `✅` Cache HIT - Data returned from cache
- `💾` Cached - Data saved to cache
- `🗑️` Cleared - Cache invalidated

---

## 💡 How It Works

### Request Flow (Cache HIT)

```
1. Request arrives → GET /table/complaints?page=1&limit=10
2. Generate cache key → table_complaints_p1_l10
3. Check cache → ✅ HIT (data exists, not expired)
4. Return cached data → Response 200 (50-100ms)
```

**Database queries:** 0
**Response time:** ~50-100ms

---

### Request Flow (Cache MISS)

```
1. Request arrives → GET /table/complaints?page=1&limit=10
2. Generate cache key → table_complaints_p1_l10
3. Check cache → ❌ MISS (data not found or expired)
4. Query database → 3 SQL queries
5. Save to cache → TTL: 60 seconds
6. Return response → Response 200 (500-700ms)
```

**Database queries:** 3
**Response time:** ~500-700ms
**Next request:** ✅ Cache HIT (~50-100ms)

---

## 🧪 Testing Cache

### Test Cache Behavior

1. **First Request (Cache MISS):**
```bash
curl https://your-lambda-url/table/complaints?limit=5
# Check CloudWatch logs for: ❌ Cache MISS
```

2. **Second Request (Cache HIT):**
```bash
curl https://your-lambda-url/table/complaints?limit=5
# Check CloudWatch logs for: ✅ Cache HIT
```

3. **Wait for TTL expiry (60 seconds):**
```bash
# Wait 61 seconds
curl https://your-lambda-url/table/complaints?limit=5
# Check logs for: ❌ Cache MISS (cache expired)
```

4. **Test Cache Invalidation:**
```bash
# Create new record
curl -X POST https://your-lambda-url/table/service-history \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-01","description":"Test","year":2025}'

# Check logs for: 🗑️ Cleared cache

# Request stats again (should be MISS)
curl https://your-lambda-url/table/service-history/stats
# Check logs for: ❌ Cache MISS
```

---

## ⚙️ Cache Configuration

Located in `lambda-complete.js` (lines 67-73):

```javascript
const CACHE_TTL = {
    complaints_list: 60000,      // 60 seconds - high traffic
    complaint_detail: 300000,    // 5 minutes - less frequent updates
    statistics: 600000,          // 10 minutes - rarely changes
    messages: 300000,            // 5 minutes
    summaries: 300000            // 5 minutes
};
```

### Tuning TTL Values

**Increase TTL if:**
- Data doesn't change often
- Want to reduce database load further
- Response time is more important than real-time data

**Decrease TTL if:**
- Data changes frequently
- Need more real-time updates
- Seeing stale data issues

---

## 🚨 Important Notes

### Cache Limitations

1. **Per-Instance Cache**
   - Each Lambda instance has its own cache
   - Cache is NOT shared between instances
   - Cold start = empty cache

2. **Memory Usage**
   - Cache stored in Lambda memory (512MB limit)
   - Large datasets may consume significant memory
   - Monitor Lambda memory usage

3. **Cache Expiry**
   - Cache cleared when Lambda instance terminates (~15 minutes idle)
   - Cache cleared when Lambda cold starts
   - TTL expiry is per-item

### Best Practices

✅ **DO:**
- Monitor cache hit rates in CloudWatch logs
- Adjust TTL based on usage patterns
- Clear cache on data modifications (already implemented)

❌ **DON'T:**
- Cache user-specific data (security risk)
- Set TTL too high for frequently changing data
- Cache error responses

---

## 📈 Monitoring Cache Performance

### CloudWatch Metrics to Watch

1. **Lambda Duration**
   - Should decrease with cache hits
   - Target: 50-100ms for cache hits, 500-700ms for misses

2. **Database Connections (RDS)**
   - Should decrease significantly
   - Target: 80-90% reduction

3. **Cache Hit Rate**
   - Count "Cache HIT" vs "Cache MISS" in logs
   - Target: 70-80% hit rate

### Calculate Cache Hit Rate

```bash
# In CloudWatch Logs Insights:
fields @message
| filter @message like /Cache (HIT|MISS)/
| stats count(*) as total,
        count(*) filter(@message like /Cache HIT/) as hits
| fields 100 * hits / total as hit_rate_percent
```

---

## 🔄 Next Steps

### Phase 1: Deploy & Test ✅
- [x] Implement in-memory cache
- [ ] Deploy to Lambda
- [ ] Run performance tests
- [ ] Compare with baseline

### Phase 2: Frontend Cache (Optional)
- [ ] Install React Query
- [ ] Wrap API calls with cache
- [ ] Configure staleTime and cacheTime

### Phase 3: Optimize (Ongoing)
- [ ] Monitor cache hit rates
- [ ] Tune TTL values
- [ ] Add more endpoints if needed

---

## 📁 Related Files

- `lambda-complete.js` - Implementation
- `PERFORMANCE_TEST_RESULTS.md` - Baseline performance
- `baseline-results.txt` - Pre-cache benchmark

---

**Ready to deploy and test!** 🚀

Run performance tests after deployment to measure improvement.
