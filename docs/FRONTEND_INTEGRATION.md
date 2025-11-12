# Frontend Integration Guide

This guide explains how the Frontend integrates with the Lambda API to display complaint messages with titles.

---

## 📋 Overview

The Frontend uses the Lambda API to:
1. Fetch complaint lists
2. Fetch messages with complaint titles
3. Display conversation history
4. Show complaint summaries

---

## 🔌 API Configuration

### File: `src/services/complaintApi.js`

**API Base URL Configuration:**

```javascript
const API_BASE_URL = import.meta.env.DEV
  ? '' // Development: use Vite proxy
  : (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_ADMIN_API_URL);
```

**Development Mode:**
- Uses empty string (relative URLs)
- Vite proxy handles CORS
- Configured in `vite.config.js`

**Production Mode:**
- Uses Lambda URL from environment variable
- Direct API calls to Lambda

---

## 🛠️ Key API Functions

### 1. Get Messages with Complaint Title

**Function:** `complaintApi.getComplaintMessages(complaintId)`

```javascript
// API call
const messagesResponse = await complaintApi.getComplaintMessages(complaintId);

// Response structure
{
  "messages": [...],
  "complaint_title": "โดนโกง...",
  "complaint_status": "pending",
  "complaint_id": "uuid",
  "count": 10
}
```

**Usage in Frontend:**

```javascript
// Extract data from response
const messages = messagesResponse.messages || [];
const title = messagesResponse.complaint_title || 'ไม่มีหัวเรื่อง';
const status = messagesResponse.complaint_status;
```

### 2. Get Complaint Summary

**Function:** `complaintApi.getComplaintSummary(complaintId)`

```javascript
// Response structure
{
  "summary": {
    "summary": "...",
    "ai_summary": "...",
    "key_points": [...],
    "timeline": [...]
  },
  "complaint_title": "...",
  "contact_name": "...",
  "contact_phone": "...",
  "line_display_name": "...",
  "line_id": "...",
  "amount": 50000
}
```

---

## 📄 Frontend Components

### AdminHistory.jsx

**Location:** `src/pages/admin/AdminHistory.jsx`

**Key Features:**
- Displays complaint list
- Shows conversation history
- Extracts and displays complaint title from API

**Implementation:**

```javascript
// Line 87-97: Fetch messages with title
const messagesResponse = await complaintApi.getComplaintMessages(conversation.id);

// Extract messages and title
const messages = messagesResponse.messages || [];
const titleFromApi = messagesResponse.complaint_title;

// Update state
if (messagesResponse.complaint_title) {
  setComplaintTitle(messagesResponse.complaint_title);
}

// Line 101-108: Format messages for display
const formattedMessages = messages.map((msg) => ({
  id: msg.id,
  sender: msg.sender_name || 'ไม่ระบุชื่อ',
  message: msg.content || msg.message,
  timestamp: msg.sent_at || msg.timestamp,
  type: msg.sender_type || 'user',
  complaintTitle: msg.complaint_title || titleFromApi
}));
```

**Modal Display (Line 334-336):**

```javascript
<h2 className="text-xl font-bold">
  {complaintTitle || selectedConversation.title || 'รายละเอียดการสนทนา'}
</h2>
```

---

## 🔧 Vite Configuration

### File: `vite.config.js`

**Proxy Configuration for Development:**

```javascript
export default defineConfig({
  server: {
    proxy: {
      // Proxy API calls to Lambda
      '^/(table|connection)': {
        target: 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

**How it works:**
1. Frontend makes request to `/table/complaints/123/messages`
2. Vite intercepts and forwards to Lambda URL
3. Response comes back without CORS issues
4. Frontend receives the data

---

## 🧪 Testing Frontend Integration

### 1. Start Development Server

```bash
npm run dev
```

Server will start at: http://localhost:5173

### 2. Navigate to Admin History

```
http://localhost:5173/admin/history
```

### 3. Check Console Logs

Look for:
```
API_BASE_URL: Mode: development
Loading conversation details for ID: <uuid>
Loaded messages response: { messages: [...], complaint_title: "..." }
```

### 4. Verify Display

**Check that:**
- ✅ Complaint list loads
- ✅ Clicking a complaint opens modal
- ✅ Modal shows correct complaint title
- ✅ Messages display with sender and content
- ✅ No CORS errors in console

---

## 🐛 Troubleshooting

### Issue 1: CORS Errors

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**

1. **Development:** Check Vite proxy configuration
   ```javascript
   // vite.config.js
   proxy: {
     '^/(table|connection)': {
       target: 'https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws',
       changeOrigin: true
     }
   }
   ```

2. **Production:** Set environment variable
   ```bash
   VITE_API_BASE_URL=https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
   ```

### Issue 2: complaint_title is null

**Symptoms:**
- Modal shows "รายละเอียดการสนทนา" instead of actual title

**Causes:**
1. Lambda not returning `complaint_title`
2. Database missing title data

**Solution:**

1. **Test Lambda directly:**
   ```bash
   curl "https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws/table/complaints/{ID}/messages"
   ```

2. **Check response:**
   ```json
   {
     "complaint_title": "..." // Should be present
   }
   ```

3. **If missing:** Redeploy Lambda with latest code from `docs/lambda/lambda-complete.js`

### Issue 3: Messages not loading

**Symptoms:**
- Modal opens but shows "ไม่มีข้อความ"

**Debug Steps:**

1. **Check console for errors:**
   ```javascript
   Error fetching messages for complaint <id>: ...
   ```

2. **Test API endpoint:**
   ```bash
   cd docs/testing
   node test-all-endpoints.mjs
   ```

3. **Check database:**
   ```bash
   cd docs/database
   node db-verify-schema.mjs
   ```

### Issue 4: Wrong message format

**Symptoms:**
- Messages display as `[object Object]`
- Sender shows "ไม่ระบุชื่อ" for all messages

**Solution:**

Check message mapping in `AdminHistory.jsx`:

```javascript
const formattedMessages = messages.map((msg) => ({
  message: msg.content || msg.message,        // ✅ Check this
  sender: msg.sender_name || 'ไม่ระบุชื่อ',   // ✅ Check this
  timestamp: msg.sent_at || msg.timestamp      // ✅ Check this
}));
```

Lambda returns:
- `content` (not `message`)
- `sent_at` (not `timestamp`)
- `is_from_user` (not `sender_name`)

---

## 📊 Data Flow

### Complete Request Flow

```
1. User clicks complaint in list
   ↓
2. Frontend calls complaintApi.getComplaintMessages(id)
   ↓
3. Axios makes request to /table/complaints/:id/messages
   ↓
4. Vite proxy forwards to Lambda (dev) or direct call (prod)
   ↓
5. Lambda queries database with JOIN
   ↓
6. Lambda returns: { messages: [...], complaint_title: "..." }
   ↓
7. Frontend receives response
   ↓
8. AdminHistory.jsx extracts messages and title
   ↓
9. Updates state: setComplaintTitle(title)
   ↓
10. Modal displays with correct title
```

---

## 🎨 UI Components

### Message Display

**Component:** AdminHistory.jsx (Lines 340-380)

```jsx
<div className="message-list">
  {chatMessages.map((msg) => (
    <div key={msg.id} className="message-item">
      <div className="sender">{msg.sender}</div>
      <div className="content">{msg.message}</div>
      <div className="timestamp">
        {new Date(msg.timestamp).toLocaleString('th-TH')}
      </div>
    </div>
  ))}
</div>
```

### Title Display

**Component:** Modal Header

```jsx
<h2 className="text-xl font-bold">
  {complaintTitle || selectedConversation.title || 'รายละเอียดการสนทนา'}
</h2>
```

**Priority:**
1. `complaintTitle` from API
2. `selectedConversation.title` from list
3. Default: "รายละเอียดการสนทนา"

---

## 🚀 Deployment

### Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:5173
```

### Production Build

```bash
# 1. Set environment variable
export VITE_API_BASE_URL=https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws

# 2. Build
npm run build

# 3. Preview
npm run preview

# 4. Deploy dist/ folder to hosting
# (e.g., AWS S3, Netlify, Vercel)
```

---

## ✅ Checklist

### Before Starting Development

- [ ] Lambda deployed with latest code
- [ ] Environment variables set in Lambda
- [ ] Vite proxy configured correctly
- [ ] Database has complaint records with titles

### After Making Changes

- [ ] Test with `npm run dev`
- [ ] Check console for errors
- [ ] Verify messages load correctly
- [ ] Verify complaint titles display
- [ ] Test with multiple complaints
- [ ] Build for production

---

## 📚 Related Files

### API Layer
- `src/services/complaintApi.js` - API client
- `vite.config.js` - Proxy configuration

### Components
- `src/pages/admin/AdminHistory.jsx` - Main history page
- `src/pages/admin/AdminDashboard.jsx` - Dashboard
- `src/pages/admin/AdminComplaints.jsx` - Complaints list

### Documentation
- `docs/README.md` - Main documentation
- `docs/README_LAMBDA.md` - Lambda guide
- `docs/API_DOCUMENTATION.md` - API reference

---

## 🔗 API Endpoints Reference

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/table/complaints` | GET | List complaints | `{ data: [...], pagination: {...} }` |
| `/table/complaints/:id` | GET | Get complaint by ID | `{ data: {...} }` |
| `/table/complaints/:id/messages` | GET | Get messages with title | `{ messages: [...], complaint_title: "..." }` |
| `/table/complaints/:id/summary` | GET | Get summary | `{ summary: {...}, complaint_title: "..." }` |

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
**Status:** ✅ Working
