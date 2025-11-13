/**
 * WebSocket Message Handler (Default Route)
 * Handles messages sent from clients
 * Supports ping/pong for keep-alive
 */

exports.handler = async (event) => {
  console.log('📥 Message event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');

  console.log(`📨 Received message from ${connectionId}:`, body);

  // Handle different message actions
  switch (body.action) {
    case 'ping':
      console.log('🏓 Ping received, sending pong');
      return {
        statusCode: 200,
        body: JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        })
      };

    case 'subscribe':
      console.log(`📡 Client subscribed to: ${body.channel}`);
      // TODO: Store subscription preferences in DynamoDB
      return {
        statusCode: 200,
        body: JSON.stringify({
          type: 'subscribed',
          channel: body.channel
        })
      };

    default:
      console.log('❓ Unknown action:', body.action);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Message received',
          action: body.action
        })
      };
  }
};
