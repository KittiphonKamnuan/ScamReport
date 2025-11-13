/**
 * useWebSocket Hook
 *
 * Manages WebSocket connection with:
 * - Auto-connect on mount
 * - Auto-reconnect on disconnect
 * - Ping/pong keep-alive
 * - React Query cache invalidation on updates
 *
 * Usage:
 * ```javascript
 * import { useWebSocket } from './hooks/useWebSocket';
 *
 * function MyComponent() {
 *   const { isConnected, lastMessage, reconnect } = useWebSocket();
 *
 *   return (
 *     <div>
 *       Status: {isConnected ? 'Live' : 'Connecting...'}
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
const RECONNECT_DELAY = 3000;  // 3 seconds
const PING_INTERVAL = 30000;   // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Connect to WebSocket server
   */
  const connect = () => {
    // Don't connect if already connected or no user
    if (!user?.id || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Max reconnect attempts reached
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnect attempts reached');
      setError('Connection failed. Please refresh the page.');
      return;
    }

    console.log(`🔌 Connecting to WebSocket... (attempt ${reconnectAttemptsRef.current + 1})`);

    try {
      const ws = new WebSocket(`${WEBSOCKET_URL}?userId=${user.id}`);

      // Connection opened
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start ping/pong keep-alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log('🏓 Sending ping');
            ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, PING_INTERVAL);
      };

      // Message received
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('📥 WebSocket message:', message);

        setLastMessage(message);

        // Handle different message types
        switch (message.type) {
          case 'NEW_MESSAGE':
            console.log('🆕 New message detected, invalidating cache');
            queryClient.invalidateQueries({ queryKey: ['complaints'] });

            // Optional: Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Message', {
                body: 'You have a new message from a complainant',
                icon: '/logo.png'
              });
            }
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

      // Error occurred
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection error');
      };

      // Connection closed
      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Auto-reconnect after delay (if not manually closed)
        if (event.code !== 1000) {  // 1000 = normal closure
          reconnectAttemptsRef.current++;

          const delay = RECONNECT_DELAY * reconnectAttemptsRef.current; // Exponential backoff
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      wsRef.current = ws;

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setError('Failed to connect');
    }
  };

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = () => {
    console.log('🔌 Disconnecting WebSocket...');

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  };

  /**
   * Manual reconnect
   */
  const reconnect = () => {
    console.log('🔄 Manual reconnect requested');
    reconnectAttemptsRef.current = 0;
    disconnect();
    setTimeout(connect, 500);
  };

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (user?.id && WEBSOCKET_URL) {
      connect();
    } else {
      console.warn('⚠️ Cannot connect: missing user or WEBSOCKET_URL');
    }

    return () => {
      disconnect();
    };
  }, [user?.id]);

  return {
    isConnected,
    lastMessage,
    error,
    reconnect
  };
};
