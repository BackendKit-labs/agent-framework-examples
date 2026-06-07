import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

export function useWebSocket(handlers: Record<string, MessageHandler>) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    const ws = new WebSocket(`ws://localhost:3000/ws/notifications?token=${token}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handler = handlers[message.type];
      if (handler) handler(message.payload);
    };

    ws.onclose = () => {
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        // Reconnection logic
      }, 5000);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const send = useCallback((type: string, payload: any) => {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }, []);

  return { send };
}
