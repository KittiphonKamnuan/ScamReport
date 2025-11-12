# ScamReport Frontend

A React-based web application for managing and tracking scam complaints, integrated with LINE messaging platform.

## 📋 Project Overview

ScamReport is a comprehensive system for:
- 📝 Collecting scam reports via LINE bot
- 👥 Managing complaints (Admin & Journalist dashboards)
- 💬 Viewing conversation history with complaint titles
- 📊 Analyzing and categorizing scam patterns
- 🔐 Role-based access control (Admin, Journalist, Public)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Lambda (deployed)
- PostgreSQL database

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd scamreport-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
http://localhost:5173
```

---

## 📁 Project Structure

```
scamreport-frontend/
├── docs/                    # 📚 Complete documentation
│   ├── lambda/              # Lambda function code
│   │   └── lambda-complete.js    ⭐ Production Lambda
│   ├── testing/             # Test scripts
│   │   └── test-all-endpoints.mjs
│   ├── database/            # Database utilities
│   │   └── db-verify-schema.mjs
│   ├── archive/             # Old versions
│   ├── README.md            # Main documentation
│   ├── FRONTEND_INTEGRATION.md
│   └── README_LAMBDA.md
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin dashboard
│   │   │   ├── AdminHistory.jsx  # Conversation history ⭐
│   │   │   └── AdminDashboard.jsx
│   │   ├── journalist/      # Journalist dashboard
│   │   └── public/          # Public pages
│   ├── services/            # API clients
│   │   └── complaintApi.js  # Lambda API client ⭐
│   ├── context/             # React context
│   ├── App.jsx              # Main app
│   └── main.jsx             # Entry point
├── vite.config.js           # Vite configuration ⭐
├── package.json
└── README.md                # This file
```

---

## 🔑 Key Features

### 1. Complaint Management
- View all complaints with pagination
- Filter by status, category, urgency
- Assign to journalists
- Track progress

### 2. Conversation History ⭐
- View LINE chat history
- **Display complaint titles in modal**
- Message timeline
- User/Admin identification

### 3. Role-Based Access
- **Admin**: Full access, user management
- **Journalist**: Assigned complaints, follow-ups
- **Public**: Submit complaints (via LINE)

### 4. Real-time Updates
- Live complaint status
- Instant message updates
- Dashboard statistics

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws

# Development (optional - uses Vite proxy)
# VITE_API_BASE_URL=
```

### Vite Proxy (Development)

File: `vite.config.js`

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

**Benefits:**
- ✅ No CORS issues in development
- ✅ Simplified API calls
- ✅ Same code for dev and prod

---

## 📊 API Integration

### Lambda API

**URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

### Key Endpoints

| Endpoint | Description | Response |
|----------|-------------|----------|
| `GET /table/complaints` | List complaints | `{ data: [...], pagination: {...} }` |
| `GET /table/complaints/:id` | Get complaint | `{ data: {...} }` |
| `GET /table/complaints/:id/messages` | **Get messages with title** | `{ messages: [...], complaint_title: "..." }` |
| `GET /table/complaints/:id/summary` | Get summary | `{ summary: {...}, complaint_title: "..." }` |

---

## 📚 Documentation

### Quick Links

- **[Complete Documentation](./docs/README.md)** - Start here!
- **[Lambda Deployment](./docs/README_LAMBDA.md)** - Deploy Lambda
- **[Frontend Integration](./docs/FRONTEND_INTEGRATION.md)** - API usage
- **[Testing Guide](./docs/testing/README.md)** - Test scripts

### For Developers

1. **Setting Up:**
   - Read [Quick Start](#-quick-start)
   - Configure environment variables
   - Set up Vite proxy

2. **Development:**
   - Use API Client in `src/services/complaintApi.js`
   - Follow component structure
   - Test with scripts in `docs/testing/`

3. **Deployment:**
   - Build: `npm run build`
   - Test: `npm run preview`
   - Deploy `dist/` folder

---

## 🧪 Testing

### Test Lambda API

```bash
cd docs/testing
node test-all-endpoints.mjs
```

**Expected:** ✅ 100% pass rate (14/14 tests)

### Test Frontend

```bash
npm run dev
```

1. Navigate to Admin History
2. Click a complaint
3. Verify:
   - ✅ Modal opens
   - ✅ Complaint title displays correctly
   - ✅ Messages load
   - ✅ No console errors

---

## 🐛 Troubleshooting

### CORS Errors

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
1. Check Vite proxy in `vite.config.js`
2. Restart dev server: `npm run dev`
3. Clear browser cache

### Complaint Title Not Showing

**Symptoms:**
- Modal shows "รายละเอียดการสนทนา" instead of actual title

**Solution:**
1. Test Lambda: `cd docs/testing && node test-all-endpoints.mjs`
2. Verify `complaint_title` in response
3. Redeploy latest Lambda from `docs/lambda/lambda-complete.js`

---

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
# Output: dist/
```

### Preview Production Build

```bash
npm run preview
# Open: http://localhost:4173
```

---

## 📊 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

### Backend
- **AWS Lambda** - Serverless API
- **PostgreSQL** - Database (RDS)
- **node-postgres (pg)** - Database driver

### Infrastructure
- **AWS RDS** - Database hosting
- **AWS Lambda** - API hosting
- **AWS Cognito** - Authentication

---

## 📈 Status

### Current Version: 1.0.0

**✅ Working:**
- Complaint management
- Message history with titles
- Role-based dashboards
- Lambda API integration
- Database connectivity

---

**Lambda URL:**
```
https://ijjwak4ivyywk7fy6xmsc2ctry0lgmma.lambda-url.us-east-1.on.aws
```

**Frontend (Dev):**
```
http://localhost:5173
```

**Status:** ✅ Production Ready

**Last Updated:** 2025-11-11
