# 🔧 AWS WebSocket Setup Guide

Step-by-step guide สำหรับ setup AWS WebSocket infrastructure

---

## 📋 Prerequisites

- AWS Account with admin access
- AWS CLI configured
- Node.js 18+ installed

---

## Step 1: Create DynamoDB Table

### Option A: AWS Console

1. Go to **DynamoDB** → **Tables** → **Create table**
2. Settings:
   - **Table name:** `websocket_connections`
   - **Partition key:** `connectionId` (String)
   - **Table settings:** Default settings
3. Click **Create table**
4. After creation, go to **Additional settings** → **Time to Live (TTL)**
   - Enable TTL
   - **TTL attribute:** `ttl`
   - Save

### Option B: AWS CLI

```bash
# Create table
aws dynamodb create-table \
  --table-name websocket_connections \
  --attribute-definitions \
    AttributeName=connectionId,AttributeType=S \
  --key-schema \
    AttributeName=connectionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name websocket_connections \
  --time-to-live-specification \
    "Enabled=true, AttributeName=ttl" \
  --region us-east-1
```

✅ **Verify:** Table created and TTL enabled

---

## Step 2: Create IAM Role for Lambda

### Create Role

```bash
# Create role with trust policy
aws iam create-role \
  --role-name ScamReport-WebSocket-Lambda-Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

### Attach Policies

```bash
# Basic Lambda execution
aws iam attach-role-policy \
  --role-name ScamReport-WebSocket-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for DynamoDB and WebSocket
aws iam put-role-policy \
  --role-name ScamReport-WebSocket-Lambda-Role \
  --policy-name WebSocketPermissions \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ],
        "Resource": "arn:aws:dynamodb:*:*:table/websocket_connections"
      },
      {
        "Effect": "Allow",
        "Action": [
          "execute-api:ManageConnections"
        ],
        "Resource": "arn:aws:execute-api:*:*:*/*/@connections/*"
      }
    ]
  }'
```

✅ **Verify:** Role created with policies attached

---

## Step 3: Create Lambda Functions

### 3.1 Create Connect Handler

```bash
# Package code
cd docs/websocket/lambda-handlers
zip connectHandler.zip connectHandler.js

# Create Lambda
aws lambda create-function \
  --function-name ScamReport-WS-Connect \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/ScamReport-WebSocket-Lambda-Role \
  --handler connectHandler.handler \
  --zip-file fileb://connectHandler.zip \
  --environment Variables="{CONNECTIONS_TABLE=websocket_connections}" \
  --region us-east-1
```

### 3.2 Create Disconnect Handler

```bash
zip disconnectHandler.zip disconnectHandler.js

aws lambda create-function \
  --function-name ScamReport-WS-Disconnect \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/ScamReport-WebSocket-Lambda-Role \
  --handler disconnectHandler.handler \
  --zip-file fileb://disconnectHandler.zip \
  --environment Variables="{CONNECTIONS_TABLE=websocket_connections}" \
  --region us-east-1
```

### 3.3 Create Message Handler

```bash
zip messageHandler.zip messageHandler.js

aws lambda create-function \
  --function-name ScamReport-WS-Message \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/ScamReport-WebSocket-Lambda-Role \
  --handler messageHandler.handler \
  --zip-file fileb://messageHandler.zip \
  --region us-east-1
```

### 3.4 Create Push Notifier

```bash
zip pushNotifier.zip pushNotifier.js

aws lambda create-function \
  --function-name ScamReport-WS-PushNotifier \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/ScamReport-WebSocket-Lambda-Role \
  --handler pushNotifier.handler \
  --zip-file fileb://pushNotifier.zip \
  --environment Variables="{CONNECTIONS_TABLE=websocket_connections,WEBSOCKET_ENDPOINT=PLACEHOLDER}" \
  --timeout 30 \
  --region us-east-1
```

✅ **Verify:** All 4 Lambda functions created

---

## Step 4: Create API Gateway WebSocket API

### AWS Console (Recommended)

1. Go to **API Gateway** → **Create API** → **WebSocket API**
2. **API details:**
   - **API name:** `ScamReport-WebSocket-API`
   - **Route selection expression:** `$request.body.action`
3. **Add routes:**
   - `$connect`
   - `$disconnect`
   - `$default`
4. **Configure integrations:**
   - `$connect` → `ScamReport-WS-Connect` Lambda
   - `$disconnect` → `ScamReport-WS-Disconnect` Lambda
   - `$default` → `ScamReport-WS-Message` Lambda
5. **Deploy API:**
   - Create new stage: `production`
   - Deploy

6. **Note WebSocket URLs:**
   - **Connection URL:** `wss://xxxxx.execute-api.us-east-1.amazonaws.com/production`
   - **Management URL:** `https://xxxxx.execute-api.us-east-1.amazonaws.com/production` (for pushNotifier)

✅ **Save both URLs!**

---

## Step 5: Update Push Notifier Environment

Update `pushNotifier` Lambda with the Management URL:

```bash
aws lambda update-function-configuration \
  --function-name ScamReport-WS-PushNotifier \
  --environment Variables="{CONNECTIONS_TABLE=websocket_connections,WEBSOCKET_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/production}" \
  --region us-east-1
```

✅ **Verify:** Environment variables updated

---

## Step 6: Create SQS Queue (Trigger for Push Notifier)

```bash
# Create queue
aws sqs create-queue \
  --queue-name ScamReport-WebSocket-Push-Queue \
  --region us-east-1

# Get queue ARN and URL
QUEUE_URL=$(aws sqs get-queue-url --queue-name ScamReport-WebSocket-Push-Queue --query 'QueueUrl' --output text)
QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url $QUEUE_URL --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

echo "Queue URL: $QUEUE_URL"
echo "Queue ARN: $QUEUE_ARN"
```

### Add SQS Trigger to Push Notifier

```bash
aws lambda create-event-source-mapping \
  --function-name ScamReport-WS-PushNotifier \
  --event-source-arn $QUEUE_ARN \
  --batch-size 1 \
  --region us-east-1
```

✅ **Verify:** SQS queue created and linked to Lambda

---

## Step 7: Test WebSocket Connection

### Install wscat (WebSocket client)

```bash
npm install -g wscat
```

### Test Connection

```bash
# Connect
wscat -c "wss://xxxxx.execute-api.us-east-1.amazonaws.com/production?userId=test-user"

# Should see:
# Connected (press CTRL+C to quit)

# Send ping
{"action": "ping"}

# Should receive:
# {"type":"pong","timestamp":1699999999999}
```

### Check DynamoDB

```bash
# List connections
aws dynamodb scan \
  --table-name websocket_connections \
  --region us-east-1

# Should show your connection
```

✅ **Verify:** Connection successful and stored in DynamoDB

---

## Step 8: Test Push Notification

### Invoke Push Notifier Manually

```bash
aws lambda invoke \
  --function-name ScamReport-WS-PushNotifier \
  --payload '{
    "type": "NEW_MESSAGE",
    "data": {
      "id": "test-123",
      "message": "Test push notification"
    }
  }' \
  --region us-east-1 \
  response.json

cat response.json
```

### Check wscat

You should see the message in your wscat terminal:
```json
{
  "type": "NEW_MESSAGE",
  "data": {
    "id": "test-123",
    "message": "Test push notification"
  },
  "timestamp": 1699999999999
}
```

✅ **Verify:** Push notification received

---

## Step 9: Frontend Configuration

Update `.env` file:

```bash
echo "VITE_WEBSOCKET_URL=wss://xxxxx.execute-api.us-east-1.amazonaws.com/production" >> .env
```

Copy `useWebSocket.js` hook to your project:

```bash
cp docs/websocket/frontend-hooks/useWebSocket.js src/hooks/
```

✅ **Verify:** Environment variable added

---

## Step 10: Update API Lambda to Trigger Push

In your existing API Lambda (when creating new message):

```javascript
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

// After saving message to database
await db.query('INSERT INTO messages ...');

// Publish to SQS to trigger push notification
await sqs.sendMessage({
  QueueUrl: process.env.PUSH_QUEUE_URL,
  MessageBody: JSON.stringify({
    type: 'NEW_MESSAGE',
    data: {
      id: newMessage.id,
      // ... other message data
    }
  })
}).promise();
```

Add environment variable to API Lambda:

```bash
aws lambda update-function-configuration \
  --function-name YOUR_API_LAMBDA_NAME \
  --environment Variables="{...,PUSH_QUEUE_URL=YOUR_QUEUE_URL}" \
  --region us-east-1
```

✅ **Verify:** API Lambda configured to push to SQS

---

## 📊 Architecture Summary

```
User creates message
    ↓
API Lambda
    ↓
PostgreSQL (save)
    ↓
SQS Queue
    ↓
Push Notifier Lambda
    ↓
WebSocket API Gateway
    ↓
Connected Clients (instant update!)
```

---

## 🎯 Verification Checklist

- [ ] DynamoDB table created with TTL
- [ ] IAM role created with permissions
- [ ] 4 Lambda functions created
- [ ] API Gateway WebSocket API created
- [ ] Routes configured and deployed
- [ ] Push Notifier environment updated
- [ ] SQS queue created and linked
- [ ] WebSocket connection test successful
- [ ] Push notification test successful
- [ ] Frontend environment configured
- [ ] API Lambda updated to trigger push

---

## 🚨 Troubleshooting

### Issue: Connection fails

**Check:**
1. WebSocket URL is correct (wss:// not https://)
2. Lambda has correct IAM permissions
3. CloudWatch logs for error messages

```bash
aws logs tail /aws/lambda/ScamReport-WS-Connect --follow
```

### Issue: Push not received

**Check:**
1. WEBSOCKET_ENDPOINT uses `https://` (not `wss://`)
2. Connection exists in DynamoDB
3. Push Notifier CloudWatch logs

```bash
aws logs tail /aws/lambda/ScamReport-WS-PushNotifier --follow
```

### Issue: Connection closes immediately

**Check:**
1. Ping/pong keep-alive is working
2. API Gateway timeout settings (default: 10 min)
3. Check for errors in disconnect handler

---

## 📚 Next Steps

1. ✅ Setup complete
2. Test with multiple clients
3. Integrate with frontend
4. Monitor CloudWatch metrics
5. Setup alarms for errors

---

**Estimated Setup Time:** 30-60 minutes
**Difficulty:** Medium
**Status:** Ready to deploy

---

**Last Updated:** 2025-11-13
