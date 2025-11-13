# 🚀 WebSocket Push Implementation Plan

**Project:** ScamReport - Real-time Messaging System
**Goal:** ลด bandwidth 99% และให้ real-time updates แบบ instant
**Status:** 📋 Planning Phase

---

## 📊 ภาพรวม Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AdminMessages Component                                 │   │
│  │  • WebSocket client (auto-reconnect)                     │   │
│  │  • Listen for: NEW_MESSAGE, UPDATE_MESSAGE, DELETE      │   │
│  │  • Auto-update React Query cache                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────────┘
                        │ WebSocket (wss://)
                        │ Persistent Connection
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│        AWS API Gateway WebSocket API                            │
│  Routes:                                                        │
│    • $connect    → connectHandler Lambda                       │
│    • $disconnect → disconnectHandler Lambda                    │
│    • $default    → messageHandler Lambda                       │
│    • ping        → pingHandler Lambda (keep-alive)            │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ↓                               ↓
┌──────────────────┐          ┌──────────────────────┐
│  Lambda Handlers │          │  Connection Manager  │
│                  │          │                      │
│  • Connect       │←────────→│  DynamoDB Table:     │
│  • Disconnect    │          │  connections         │
│  • Message       │          │  • connectionId (PK) │
│  • Ping          │          │  • userId            │
└──────────────────┘          │  • connectedAt       │
        ↑                     │  • TTL: 2 hours      │
        │                     └──────────────────────┘
        │
        │ Triggered by
        │
┌──────────────────┐
│  Event Triggers: │
│  • EventBridge   │  ← PostgreSQL → Lambda (polling)
│  • SQS Queue     │  ← API creates message → Queue → Lambda
│  • Lambda Poll   │  ← Direct DB polling (simple)
└──────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────────────┐
│              Push Notifier Lambda                               │
│  • Detect new message/complaint                                 │
│  • Get all active connections from DynamoDB                     │
│  • Push update to all connected clients                         │
│  • Handle stale connections (410 Gone)                          │
└─────────────────────────────────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PostgreSQL RDS                                 │
│  • complaints table                                             │
│  • messages table                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Implementation Phases

### **Phase 1: AWS Infrastructure Setup** (Day 1-2)

#### 1.1 Create DynamoDB Table

```bash
# Table: websocket_connections
aws dynamodb create-table \
  --table-name websocket_connections \
  --attribute-definitions \
    AttributeName=connectionId,AttributeType=S \
  --key-schema \
    AttributeName=connectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification \
    Enabled=true,AttributeName=ttl
```

**Schema:**
```json
{
  "connectionId": "L0SM9cOFvHcCIhw=",  // PK
  "userId": "user-123",
  "connectedAt": 1699999999999,
  "ttl": 1700007199999  // Auto-delete after 2 hours
}
```

#### 1.2 Create API Gateway WebSocket API

**AWS Console Steps:**
1. Go to **API Gateway** → **Create API** → **WebSocket**
2. Name: `ScamReport-WebSocket-API`
3. Route Selection Expression: `$request.body.action`
4. Create Routes:
   - `$connect`
   - `$disconnect`
   - `$default`
   - `ping` (custom route for keep-alive)

**Deploy:**
- Stage name: `production`
- Get WebSocket URL: `wss://xxxxx.execute-api.us-east-1.amazonaws.com/production`

---

### **Phase 2: Lambda WebSocket Handlers** (Day 2-3)

#### 2.1 Connect Handler

**File:** `lambda-websocket/connectHandler.js`

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'websocket_connections';

exports.handler = async (event) => {
  console.log('📥 Connect event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId || 'anonymous';

  try {
    // Store connection in DynamoDB
    await dynamodb.put({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        connectedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 7200  // 2 hours
      }
    }).promise();

    console.log(`✅ User ${userId} connected: ${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Connected successfully',
        connectionId
      })
    };
  } catch (error) {
    console.error('❌ Connect error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect' })
    };
  }
};
```

**Environment Variables:**
- `CONNECTIONS_TABLE`: `websocket_connections`

**IAM Permissions:**
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/websocket_connections"
}
```

---

#### 2.2 Disconnect Handler

**File:** `lambda-websocket/disconnectHandler.js`

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'websocket_connections';

exports.handler = async (event) => {
  console.log('📥 Disconnect event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;

  try {
    // Remove connection from DynamoDB
    await dynamodb.delete({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }).promise();

    console.log(`❌ Disconnected: ${connectionId}`);

    return {
      statusCode: 200,
      body: 'Disconnected'
    };
  } catch (error) {
    console.error('❌ Disconnect error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' })
    };
  }
};
```

**IAM Permissions:**
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:DeleteItem"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/websocket_connections"
}
```

---

#### 2.3 Message Handler (Default Route)

**File:** `lambda-websocket/messageHandler.js`

```javascript
const AWS = require('aws-sdk');

exports.handler = async (event) => {
  console.log('📥 Message event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');

  console.log(`📨 Received message from ${connectionId}:`, body);

  // Handle different message types
  switch (body.action) {
    case 'ping':
      return {
        statusCode: 200,
        body: JSON.stringify({ type: 'pong', timestamp: Date.now() })
      };

    default:
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Message received' })
      };
  }
};
```

---

#### 2.4 Push Notifier Lambda

**File:** `lambda-websocket/pushNotifier.js`

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'websocket_connections';
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

// Initialize API Gateway Management API
const apigw = new AWS.ApiGatewayManagementApi({
  endpoint: WEBSOCKET_ENDPOINT
});

/**
 * Push notification to all connected WebSocket clients
 * Triggered by:
 *  - EventBridge (scheduled polling)
 *  - SQS Queue (when new message created)
 *  - Direct invocation from API Lambda
 */
exports.handler = async (event) => {
  console.log('📥 Push event:', JSON.stringify(event, null, 2));

  // Parse event data
  let messageData;

  if (event.Records && event.Records[0].eventSource === 'aws:sqs') {
    // Triggered by SQS
    messageData = JSON.parse(event.Records[0].body);
  } else if (event.detail) {
    // Triggered by EventBridge
    messageData = event.detail;
  } else {
    // Direct invocation
    messageData = event;
  }

  console.log('📨 Message data:', messageData);

  try {
    // Get all active connections
    const connections = await dynamodb.scan({
      TableName: CONNECTIONS_TABLE,
      ProjectionExpression: 'connectionId, userId'
    }).promise();

    console.log(`📡 Found ${connections.Items.length} active connections`);

    if (connections.Items.length === 0) {
      console.log('⚠️ No active connections');
      return { statusCode: 200, body: 'No active connections' };
    }

    // Prepare message payload
    const payload = {
      type: messageData.type || 'NEW_MESSAGE',
      data: messageData.data,
      timestamp: Date.now()
    };

    // Push to all connected clients
    const pushPromises = connections.Items.map(async ({ connectionId, userId }) => {
      try {
        await apigw.postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(payload)
        }).promise();

        console.log(`✅ Pushed to ${userId} (${connectionId})`);
        return { connectionId, status: 'success' };

      } catch (error) {
        console.error(`❌ Failed to push to ${connectionId}:`, error.message);

        // Connection is stale (410 Gone), remove it
        if (error.statusCode === 410) {
          console.log(`🗑️ Removing stale connection: ${connectionId}`);
          await dynamodb.delete({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId }
          }).promise();
        }

        return { connectionId, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(pushPromises);

    const summary = {
      total: connections.Items.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    };

    console.log('📊 Push summary:', summary);

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('❌ Push error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

**Environment Variables:**
- `CONNECTIONS_TABLE`: `websocket_connections`
- `WEBSOCKET_ENDPOINT`: `https://xxxxx.execute-api.us-east-1.amazonaws.com/production` (note: https not wss)

**IAM Permissions:**
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:Scan",
    "dynamodb:DeleteItem",
    "execute-api:ManageConnections"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/websocket_connections",
    "arn:aws:execute-api:*:*:*/production/*/@connections/*"
  ]
}
```

---

### **Phase 3: Trigger System** (Day 3-4)

เลือก 1 ใน 3 วิธี:

#### **Option A: EventBridge Scheduled Polling** (ง่ายที่สุด)

```javascript
// Schedule pushNotifier every 10 seconds
EventBridge Rule:
  Schedule: rate(10 seconds)
  Target: pushNotifier Lambda

// pushNotifier polls database for new messages
const lastCheck = await getLastCheckTimestamp();
const newMessages = await queryDB(`
  SELECT * FROM messages
  WHERE created_at > $1
`, [lastCheck]);

if (newMessages.length > 0) {
  // Push to WebSocket clients
}
```

**Pros:** ง่าย, ไม่ต้องแก้ database
**Cons:** Polling overhead (แต่น้อยกว่า client polling มาก)

---

#### **Option B: SQS Queue** (แนะนำ)

```javascript
// In your main API Lambda (when creating new message):
const sqs = new AWS.SQS();

// After saving message to database
await db.query('INSERT INTO messages ...');

// Publish to SQS
await sqs.sendMessage({
  QueueUrl: process.env.PUSH_QUEUE_URL,
  MessageBody: JSON.stringify({
    type: 'NEW_MESSAGE',
    data: newMessageData
  })
}).promise();

// SQS triggers pushNotifier Lambda automatically
```

**Pros:** Event-driven, real-time
**Cons:** ต้องแก้ existing API Lambda

---

#### **Option C: PostgreSQL Triggers + Lambda Polling** (Advanced)

```sql
-- PostgreSQL notification trigger
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_message', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_notify
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION notify_new_message();
```

```javascript
// Lambda continuously listens to PostgreSQL NOTIFY
const { Client } = require('pg');
const client = new Client({ /* ... */ });

client.on('notification', async (msg) => {
  const data = JSON.parse(msg.payload);
  await pushToWebSocket(data);
});

await client.query('LISTEN new_message');
```

**Pros:** True real-time, efficient
**Cons:** ซับซ้อน, Lambda ต้อง run continuously

---

**📌 แนะนำ: Option B (SQS Queue)** - Balance between real-time และ complexity

---

### **Phase 4: Frontend WebSocket Client** (Day 4-5)

#### 4.1 WebSocket Hook

**File:** `src/hooks/useWebSocket.js`

```javascript
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
const RECONNECT_DELAY = 3000; // 3 seconds
const PING_INTERVAL = 30000;  // 30 seconds

export const useWebSocket = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const connect = () => {
    if (!user?.id || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔌 Connecting to WebSocket...');

    const ws = new WebSocket(`${WEBSOCKET_URL}?userId=${user.id}`);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);

      // Start ping/pong keep-alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'ping' }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📥 WebSocket message:', message);

      setLastMessage(message);

      // Handle different message types
      switch (message.type) {
        case 'NEW_MESSAGE':
          console.log('🆕 New message detected, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['complaints'] });
          break;

        case 'UPDATE_MESSAGE':
          console.log('✏️ Message updated, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['complaints'] });
          break;

        case 'DELETE_MESSAGE':
          console.log('🗑️ Message deleted, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['complaints'] });
          break;

        case 'pong':
          console.log('🏓 Pong received');
          break;

        default:
          console.log('❓ Unknown message type:', message.type);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);

      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Auto-reconnect after delay
      console.log(`🔄 Reconnecting in ${RECONNECT_DELAY}ms...`);
      reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id]);

  return {
    isConnected,
    lastMessage,
    reconnect: connect
  };
};
```

---

#### 4.2 Update AdminMessages Component

**File:** `src/pages/admin/AdminMessages.jsx`

```javascript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { complaintApi } from '../../services/complaintApi';
import { useWebSocket } from '../../hooks/useWebSocket';

const AdminMessages = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket();

  // ✅ Cache: Complaints List
  const {
    data: complaintsData = [],
    isLoading: loading,
    error: apiError,
    refetch: loadMessages
  } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      console.log('Loading messages from API...');
      const data = await complaintApi.getComplaints({ limit: 1000 });
      return data && data.length > 0 ? data : [];
    },
    staleTime: 300000,  // 5 minutes (longer because WebSocket handles updates)
    cacheTime: 600000,  // 10 minutes
  });

  // Transform data...
  const conversations = complaintsData.map((item, idx) => ({
    // ... same as before
  }));

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ข้อความทั้งหมด
              {/* WebSocket Status Indicator */}
              <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <span className={`w-2 h-2 mr-1.5 rounded-full ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></span>
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              จัดการและตอบกลับข้อความจากผู้ร้องเรียน
              {lastMessage && (
                <span className="ml-2 text-orange-600">
                  • Last update: {new Date(lastMessage.timestamp).toLocaleTimeString('th-TH')}
                </span>
              )}
            </p>
          </div>
          {/* Buttons... */}
        </div>
        {/* Rest of component... */}
      </div>
    </div>
  );
};

export default AdminMessages;
```

---

### **Phase 5: Environment Variables** (Day 5)

#### Frontend `.env`

```bash
VITE_WEBSOCKET_URL=wss://xxxxx.execute-api.us-east-1.amazonaws.com/production
```

#### Lambda Environment Variables

**All WebSocket Lambdas:**
```bash
CONNECTIONS_TABLE=websocket_connections
```

**pushNotifier Lambda:**
```bash
CONNECTIONS_TABLE=websocket_connections
WEBSOCKET_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/production
```

---

### **Phase 6: Testing** (Day 6-7)

#### 6.1 Unit Tests

```bash
# Test WebSocket connection
wscat -c "wss://xxxxx.execute-api.us-east-1.amazonaws.com/production?userId=test-user"

# Should receive:
# Connected successfully

# Send ping:
{"action": "ping"}

# Should receive:
# {"type": "pong", "timestamp": 1699999999999}
```

#### 6.2 Integration Tests

```javascript
// Test push notification
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

// Invoke pushNotifier manually
await lambda.invoke({
  FunctionName: 'pushNotifier',
  Payload: JSON.stringify({
    type: 'NEW_MESSAGE',
    data: {
      id: '123',
      content: 'Test message'
    }
  })
}).promise();

// Check DynamoDB
const connections = await dynamodb.scan({
  TableName: 'websocket_connections'
}).promise();

console.log('Active connections:', connections.Items);
```

#### 6.3 Frontend Tests

1. Open AdminMessages page
2. Check browser console: `✅ WebSocket connected`
3. Check "Live" indicator appears
4. Create new message via API
5. Verify page auto-updates without manual refresh

---

## 📊 Performance Metrics

### Bandwidth Comparison

| Scenario | Polling (10s) | WebSocket Push | Savings |
|----------|---------------|----------------|---------|
| **1 hour, no updates** | 36 MB | 0.5 KB | **99.998%** |
| **1 hour, 10 updates** | 36 MB | 50 KB | **99.86%** |
| **1 day, 100 updates** | 864 MB | 500 KB | **99.94%** |

### Latency Comparison

| Method | Update Latency | User Experience |
|--------|----------------|-----------------|
| No Cache | N/A | Manual refresh only |
| Polling (30s) | 0-30s | Delayed updates |
| Polling (10s) | 0-10s | Better, but bandwidth heavy |
| **WebSocket Push** | **< 100ms** | **Instant, like chat app** ✅ |

---

## 📋 Implementation Checklist

### Phase 1: AWS Infrastructure ☐
- [ ] Create DynamoDB table `websocket_connections`
- [ ] Create API Gateway WebSocket API
- [ ] Create routes: $connect, $disconnect, $default
- [ ] Deploy to production stage
- [ ] Note WebSocket URL

### Phase 2: Lambda Handlers ☐
- [ ] Create `connectHandler.js`
- [ ] Create `disconnectHandler.js`
- [ ] Create `messageHandler.js`
- [ ] Create `pushNotifier.js`
- [ ] Configure IAM permissions
- [ ] Set environment variables
- [ ] Deploy all Lambdas

### Phase 3: Trigger System ☐
- [ ] Choose trigger method (SQS recommended)
- [ ] Create SQS queue (if using SQS)
- [ ] Update API Lambda to publish to SQS
- [ ] Configure SQS → pushNotifier trigger
- [ ] Test end-to-end flow

### Phase 4: Frontend ☐
- [ ] Create `useWebSocket.js` hook
- [ ] Update `AdminMessages.jsx`
- [ ] Add WebSocket status indicator
- [ ] Add environment variable `VITE_WEBSOCKET_URL`
- [ ] Test connection and auto-reconnect

### Phase 5: Testing ☐
- [ ] Test WebSocket connection
- [ ] Test ping/pong keep-alive
- [ ] Test push notifications
- [ ] Test auto-reconnect on disconnect
- [ ] Test with multiple clients
- [ ] Test stale connection cleanup

### Phase 6: Monitoring ☐
- [ ] Setup CloudWatch metrics
- [ ] Monitor active connections
- [ ] Monitor push success rate
- [ ] Setup alarms for errors
- [ ] Create CloudWatch dashboard

---

## 🚨 Important Considerations

### 1. **Connection Limits**

API Gateway WebSocket limits:
- **Default:** 500 concurrent connections per account per region
- **Can request increase** to 100,000+

**Solution:** Request limit increase via AWS Support

### 2. **Cost Estimation**

**WebSocket API Gateway:**
- Connection minutes: $0.25 per million
- Messages: $1.00 per million

**Example (100 concurrent users, 8 hours/day):**
- Connection minutes: 100 users × 480 min/day × 30 days = 1.44M minutes/month
- Cost: $0.36/month

**vs Polling (10s interval):**
- API calls: 100 users × 360 calls/hour × 8 hours/day × 30 days = 8.64M calls
- Lambda cost: ~$2.00/month
- **WebSocket saves $1.64/month** (and 99% bandwidth!)

### 3. **Security**

```javascript
// In connectHandler.js
const userId = event.queryStringParameters?.userId;

// ⚠️ TODO: Validate userId with Cognito token
const token = event.headers?.Authorization;
const user = await validateCognitoToken(token);

if (!user) {
  return { statusCode: 401, body: 'Unauthorized' };
}
```

### 4. **Scaling**

For > 10,000 concurrent connections:
- Use **AWS AppSync** instead (GraphQL subscriptions)
- Or setup **Redis** for connection state (instead of DynamoDB)

---

## 📚 Resources

- [AWS API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [WebSocket Connection Management](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-mapping-template-reference.html)
- [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)

---

## 🎯 Next Steps

1. **Review this plan** และขอความเห็นจากทีม
2. **Setup AWS infrastructure** (Phase 1)
3. **Implement Lambda handlers** (Phase 2)
4. **Choose trigger system** (Phase 3)
5. **Implement frontend** (Phase 4)
6. **Test thoroughly** (Phase 5-6)
7. **Monitor and optimize** (ongoing)

---

**Status:** 📋 Ready for implementation
**Estimated Time:** 6-7 days (1 person) or 3-4 days (2 people)
**Complexity:** Medium
**Impact:** 🚀 Very High (99% bandwidth reduction + real-time UX)

---

**Last Updated:** 2025-11-13
**Author:** Claude Code
**Version:** 1.0
