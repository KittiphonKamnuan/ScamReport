/**
 * WebSocket Disconnect Handler
 * Triggered when client disconnects from WebSocket API
 * Removes connection from DynamoDB
 */

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
      body: 'Disconnected successfully'
    };

  } catch (error) {
    console.error('❌ Disconnect error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to disconnect',
        details: error.message
      })
    };
  }
};
