import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage: (data: WebSocketMessage) => void;
  userId: string;
  location?: { latitude: number; longitude: number } | null;
  radius: number;
}

export function useWebSocket({ onMessage, userId, location, radius }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Send user join message
        if (wsRef.current && location) {
          wsRef.current.send(JSON.stringify({
            type: 'user_join',
            userId,
            location,
            radius
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    if (location) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [location]);

  // Update location when it changes
  useEffect(() => {
    if (isConnected && location) {
      sendMessage({
        type: 'update_location',
        location
      });
    }
  }, [location, isConnected]);

  return {
    isConnected,
    sendMessage
  };
}
