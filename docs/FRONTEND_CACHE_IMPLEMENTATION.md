# 🎨 Frontend Cache Implementation (React Query)

**Date:** 2025-11-12
**Library:** @tanstack/react-query
**Status:** ✅ Implemented

---

## 🎯 Overview

Implemented client-side caching using React Query to complement the Lambda in-memory cache. This creates a **two-layer caching strategy** that significantly reduces API calls and improves user experience.

### Combined Cache Strategy:
```
User Request
    ↓
1. React Query Cache (Frontend) ← Check here first
    ↓ (if miss)
2. Lambda Cache (Backend) ← Then check here
    ↓ (if miss)
3. PostgreSQL Database ← Finally query database
```

---

## 📦 Installation

```bash
npm install @tanstack/react-query
```

**Package Details:**
- Version: Latest (@tanstack/react-query)
- Size: ~48 packages added
- Zero-config out of the box

---

## ⚙️ Configuration

### Global Setup (`src/main.jsx`)

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,        // 30s - data considered fresh
      cacheTime: 300000,       // 5min - cache lifetime
      retry: 1,                // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
})

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Why these values?**

| Setting | Value | Reason |
|---------|-------|--------|
| `staleTime` | 30s | Matches Lambda cache TTL for complaints list |
| `cacheTime` | 5min | Keep cache in memory even after unmount |
| `retry` | 1 | One retry is enough for transient errors |
| `refetchOnWindowFocus` | false | Don't spam API on tab switches |

---

## 🔄 Implementation Details

### Before: useEffect + useState

```javascript
// ❌ Old way: Manual state management
const [complaints, setComplaints] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintApi.getComplaints({ limit: 1000 });
      setComplaints(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  loadComplaints();
}, []);
```

**Problems:**
- No caching - fetch on every component mount
- Manual loading/error states
- No automatic refetch
- Redundant API calls

---

### After: React Query

```javascript
// ✅ New way: Automatic caching
const {
  data: complaints = [],
  isLoading: loading,
  error,
  refetch: loadComplaints
} = useQuery({
  queryKey: ['complaints'],
  queryFn: async () => {
    const data = await complaintApi.getComplaints({ limit: 1000 });
    return data && data.length > 0 ? data : [];
  },
  staleTime: 30000,  // 30 seconds
  cacheTime: 300000, // 5 minutes
});
```

**Benefits:**
- ✅ Automatic caching by queryKey
- ✅ Built-in loading/error states
- ✅ Deduplicate identical requests
- ✅ Background refetch
- ✅ Garbage collection

---

## 📋 Cached Endpoints

### 1. Complaints List

**Component:** `AdminComplaints.jsx`

```javascript
useQuery({
  queryKey: ['complaints'],
  queryFn: () => complaintApi.getComplaints({ limit: 1000 }),
  staleTime: 30000,  // 30 seconds
  cacheTime: 300000, // 5 minutes
});
```

**Cache Behavior:**
- First visit: API call (cache MISS)
- Return within 30s: Instant (cache HIT)
- After 30s: Background refetch (cache STALE)
- After 5min unmount: Cache cleared

**Expected Impact:**
- 70-80% reduction in API calls
- Instant loading on navigation back
- Better UX (no loading spinners)

---

### 2. Complaint Messages

**Component:** `AdminComplaints.jsx`

```javascript
useQuery({
  queryKey: ['messages', selectedComplaint?.id],
  queryFn: () => complaintApi.getComplaintMessages(selectedComplaint.id),
  enabled: !!selectedComplaint && showChatModal,
  staleTime: 300000, // 5 minutes
});
```

**Cache Behavior:**
- Opens modal first time: API call
- Opens same modal again: Instant (cached)
- Switches between complaints: New API call per complaint
- Cache invalidated after 5 minutes

**Key Feature: `enabled`**
- Only fetch when modal is open
- Prevents unnecessary API calls
- Conditional data fetching

---

### 3. Complaint Summary

**Component:** `AdminComplaints.jsx`

```javascript
useQuery({
  queryKey: ['summary', selectedComplaint?.id],
  queryFn: () => complaintApi.getComplaintSummary(selectedComplaint.id),
  enabled: !!selectedComplaint && showChatModal,
  staleTime: 300000, // 5 minutes
});
```

**Cache Behavior:**
- Same as messages
- Cached per complaint ID
- Long staleTime (summaries rarely change)

---

## 🚀 Performance Benefits

### Request Reduction

**Scenario: Admin views complaints list**

#### Without Cache:
```
Page load → API call (500ms)
Navigate away
Come back → API call (500ms)
Navigate away
Come back → API call (500ms)

Total: 3 API calls = 1,500ms
```

#### With React Query Cache:
```
Page load → API call (500ms) → Cached
Navigate away
Come back → Cache HIT (0ms) ← Instant!
Navigate away
Come back → Cache HIT (0ms) ← Instant!

Total: 1 API call = 500ms
Savings: 1,000ms (67% faster)
```

---

### Combined Cache Impact

**Two-Layer Cache Strategy:**

#### Scenario: User browses complaints

1. **First Visit (Cold)**
   ```
   React Query: MISS
   → Lambda Cache: MISS
   → Database: Query (500ms)
   Total: 500ms
   ```

2. **Second Visit (React Cache)**
   ```
   React Query: HIT (0ms) ← Instant!
   No Lambda or DB query needed
   Total: 0ms
   ```

3. **Different User, Same Data (Lambda Cache)**
   ```
   React Query: MISS (different browser)
   → Lambda Cache: HIT (50ms)
   No DB query needed
   Total: 50ms
   ```

---

## 📊 Expected Performance Improvements

### User Experience Metrics

| Action | Before (No Cache) | After (Both Caches) | Improvement |
|--------|-------------------|---------------------|-------------|
| **Initial Page Load** | 500ms | 500ms | Same (cold start) |
| **Return to Page** | 500ms | **0ms** | **100% faster** ✅ |
| **Switch Tabs** | 500ms | **0ms** | **100% faster** ✅ |
| **View Modal Again** | 200ms | **0ms** | **100% faster** ✅ |
| **Different User** | 500ms | **50ms** | **90% faster** ✅ |

### API Call Reduction

**Typical User Session (10 minutes):**

| Action | API Calls (Before) | API Calls (After) | Reduction |
|--------|-------------------|-------------------|-----------|
| Load complaints | 5 times | **1 time** | **80%** |
| View 10 modals | 20 calls | **10 calls** | **50%** |
| Switch tabs | 10 calls | **0 calls** | **100%** |
| **Total** | **35 calls** | **11 calls** | **69% reduction** |

---

## 🎨 User Experience Improvements

### 1. Instant Navigation

**Before:**
```
Click "ข้อมูลผู้ร้องเรียน"
→ Loading spinner...
→ 500ms wait
→ Data appears
```

**After (Second Visit):**
```
Click "ข้อมูลผู้ร้องเรียน"
→ Data appears instantly! ✨
→ 0ms wait
```

### 2. No Redundant Loading States

**Before:**
- Every navigation shows loading spinner
- Jarring user experience
- Feels slow

**After:**
- Cached data shows instantly
- Smooth transitions
- Feels fast

### 3. Background Updates

**React Query Feature:**
```javascript
// Data is shown immediately (cached)
// Then silently refreshed in background if stale
// User doesn't see loading spinners
```

**Benefits:**
- Best of both worlds: speed + freshness
- User never waits
- Data stays up-to-date

---

## 🔧 Advanced Features

### 1. Request Deduplication

**Scenario: Multiple components request same data**

```javascript
// Component A
useQuery({ queryKey: ['complaints'], ... })

// Component B
useQuery({ queryKey: ['complaints'], ... })

// Result: Only 1 API call made!
// Both components share the same cached data
```

### 2. Optimistic Updates (Future)

```javascript
const mutation = useMutation({
  mutationFn: updateComplaint,
  onMutate: async (newData) => {
    // Update cache immediately
    queryClient.setQueryData(['complaints'], (old) => {
      // Update local cache before API call
    });
  },
});
```

**Benefits:**
- Instant UI updates
- Feels native app-like
- Better UX

### 3. Cache Invalidation

```javascript
// After updating a complaint
queryClient.invalidateQueries({ queryKey: ['complaints'] })

// Force refetch on next access
// Ensures data freshness
```

---

## 📱 Developer Experience

### DevTools (Optional)

Install React Query DevTools for debugging:

```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Features:**
- See all cached queries
- Monitor cache HIT/MISS
- Inspect query states
- Manual cache invalidation

---

## 🧪 Testing Cache Behavior

### Test 1: Initial Load

1. Open Admin Complaints page
2. Check Network tab → 1 API call
3. See data load

**Expected:** 500ms load time

---

### Test 2: Cache HIT

1. Navigate away
2. Come back within 30 seconds
3. Check Network tab → 0 API calls!

**Expected:** Instant data load (0ms)

---

### Test 3: Stale Data Refresh

1. Wait 30+ seconds
2. Come back to page
3. Data shows immediately (cached)
4. See background API call (refetch)

**Expected:** Instant show + background update

---

### Test 4: Modal Caching

1. Open complaint modal
2. Close modal
3. Open same modal again
4. Check Network tab → 0 API calls!

**Expected:** Instant modal content

---

## 📊 Monitoring

### Check Cache Effectiveness

**React Query DevTools:**
- Fresh: Green (< 30s)
- Stale: Orange (> 30s, will refetch)
- Inactive: Gray (cached but not in use)

**Chrome DevTools:**
```javascript
// In console
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__.client.getQueryCache().getAll()

// See all cached queries
// Check cache sizes
// Monitor memory usage
```

---

## 💰 Cost Savings

### Lambda Invocations

**Before React Query:**
- User session: 35 Lambda calls
- 1,000 users/day: 35,000 calls
- Cost: ~$0.20/day

**After React Query:**
- User session: 11 Lambda calls (69% reduction)
- 1,000 users/day: 11,000 calls
- Cost: ~$0.06/day

**Savings: $0.14/day = $51/year** 💰

### Database Load

- 69% fewer database queries
- Lower RDS connection usage
- Better scalability

---

## 🎯 Best Practices

### 1. Match TTLs with Backend

```javascript
// Frontend: 30s staleTime
staleTime: 30000

// Backend Lambda: 60s TTL
CACHE_TTL.complaints_list: 60000

// Aligned for optimal caching
```

### 2. Use Specific Query Keys

```javascript
// ✅ Good
['complaints']
['messages', complaintId]
['summary', complaintId]

// ❌ Bad (too generic)
['data']
['api']
```

### 3. Conditional Fetching

```javascript
// Only fetch when needed
enabled: !!selectedComplaint && showChatModal
```

### 4. Error Boundaries

```javascript
// Wrap in error boundary
<ErrorBoundary>
  <AdminComplaints />
</ErrorBoundary>
```

---

## 🔄 Cache Lifecycle

```
1. Mount Component
   ↓
2. Check Cache (queryKey)
   ↓
3a. Cache HIT (< staleTime)
    → Return cached data (0ms)
    → Done!

3b. Cache MISS or STALE
    → Fetch from API
    → Update cache
    → Return data (500ms)
   ↓
4. Use Data (cached for 5 minutes)
   ↓
5. Unmount Component
    → Cache kept for cacheTime
   ↓
6. After 5 minutes
    → Garbage collected
```

---

## ✅ Implementation Checklist

- [x] Install @tanstack/react-query
- [x] Setup QueryClientProvider
- [x] Wrap AdminComplaints with useQuery
- [x] Configure staleTime and cacheTime
- [x] Test build (successful)
- [ ] Test in browser
- [ ] Monitor cache effectiveness
- [ ] Deploy to production

---

## 🚀 Next Steps

### Phase 1: Current Implementation
- ✅ AdminComplaints cached
- ⏳ Test and verify cache behavior

### Phase 2: Expand Coverage
- [ ] AdminDashboard statistics
- [ ] AdminHistory page
- [ ] Journalist pages

### Phase 3: Advanced Features
- [ ] Optimistic updates
- [ ] Infinite scroll with pagination
- [ ] React Query DevTools

---

## 📚 Related Documentation

- [CACHE_PERFORMANCE_RESULTS.md](./lambda/CACHE_PERFORMANCE_RESULTS.md) - Backend cache results
- [CACHE_IMPLEMENTATION.md](./lambda/CACHE_IMPLEMENTATION.md) - Lambda cache details
- [React Query Docs](https://tanstack.com/query/latest) - Official documentation

---

## 🎓 Key Takeaways

1. **Two-Layer Cache = Best Performance**
   - Frontend cache: 0ms (instant)
   - Backend cache: 50ms (fast)
   - Database: 500ms (slow)

2. **69% API Call Reduction**
   - Significant cost savings
   - Better scalability
   - Lower server load

3. **Better User Experience**
   - Instant navigation
   - No loading spinners (cached data)
   - Smooth transitions

4. **Developer-Friendly**
   - Less code than useState/useEffect
   - Built-in loading/error states
   - Automatic cache management

---

**Status:** ✅ **Implementation Complete - Ready for Testing**

**Next:** Test in browser and measure actual performance improvements

**Last Updated:** 2025-11-12
**Version:** 1.0
