/**
 * WebSocket Connect Handler
 * Triggered when client connects to WebSocket API
 * Stores connection info in DynamoDB
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'websocket_connections';

exports.handler = async (event) => {
  console.log('📥 Connect event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId || 'anonymous';
  const timestamp = Date.now();

  try {
    // Store connection in DynamoDB
    await dynamodb.put({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        connectedAt: timestamp,
        ttl: Math.floor(timestamp / 1000) + 7200  // 2 hours TTL
      }
    }).promise();

    console.log(`✅ User ${userId} connected: ${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Connected successfully',
        connectionId,
        timestamp
      })
    };

  } catch (error) {
    console.error('❌ Connect error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to connect',
        details: error.message
      })
    };
  }
};
