/**
 * WebSocket Push Notifier
 * Pushes updates to all connected WebSocket clients
 *
 * Triggered by:
 *  - SQS Queue (recommended)
 *  - EventBridge (scheduled polling)
 *  - Direct invocation
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'websocket_connections';
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

// Initialize API Gateway Management API
const apigw = new AWS.ApiGatewayManagementApi({
  endpoint: WEBSOCKET_ENDPOINT  // https://xxxxx.execute-api.region.amazonaws.com/stage
});

/**
 * Push notification to all connected clients
 */
exports.handler = async (event) => {
  console.log('📥 Push event:', JSON.stringify(event, null, 2));

  // Parse event data from different sources
  let messageData;

  if (event.Records && event.Records[0].eventSource === 'aws:sqs') {
    // Triggered by SQS
    messageData = JSON.parse(event.Records[0].body);
    console.log('📨 Message from SQS:', messageData);

  } else if (event.detail) {
    // Triggered by EventBridge
    messageData = event.detail;
    console.log('📨 Message from EventBridge:', messageData);

  } else {
    // Direct invocation
    messageData = event;
    console.log('📨 Direct invocation:', messageData);
  }

  try {
    // Get all active connections from DynamoDB
    const connections = await dynamodb.scan({
      TableName: CONNECTIONS_TABLE,
      ProjectionExpression: 'connectionId, userId'
    }).promise();

    console.log(`📡 Found ${connections.Items.length} active connections`);

    if (connections.Items.length === 0) {
      console.log('⚠️ No active connections to push to');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No active connections' })
      };
    }

    // Prepare message payload
    const payload = {
      type: messageData.type || 'UPDATE',
      data: messageData.data,
      timestamp: Date.now()
    };

    console.log('📤 Pushing payload:', payload);

    // Push to all connected clients
    const pushPromises = connections.Items.map(async ({ connectionId, userId }) => {
      try {
        await apigw.postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(payload)
        }).promise();

        console.log(`✅ Successfully pushed to ${userId} (${connectionId})`);

        return {
          connectionId,
          userId,
          status: 'success'
        };

      } catch (error) {
        console.error(`❌ Failed to push to ${connectionId}:`, error.message);

        // Connection is stale (410 Gone), remove it from DynamoDB
        if (error.statusCode === 410) {
          console.log(`🗑️ Removing stale connection: ${connectionId}`);

          await dynamodb.delete({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId }
          }).promise();
        }

        return {
          connectionId,
          userId,
          status: 'failed',
          error: error.message
        };
      }
    });

    // Wait for all pushes to complete
    const results = await Promise.all(pushPromises);

    // Calculate summary
    const summary = {
      total: connections.Items.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results: results
    };

    console.log('📊 Push summary:', {
      total: summary.total,
      success: summary.success,
      failed: summary.failed
    });

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('❌ Push error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
