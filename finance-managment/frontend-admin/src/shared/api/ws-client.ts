import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

export function useWebSocket(handlers: Record<string, MessageHandler>) {
  const socketRef = useRef<Socket | null>(null);
  // Keep handlers fresh without triggering reconnect on every render
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');

    const socket = io('/ws/notifications', {
      auth: { token: token ?? '' },
      // Prefer WebSocket, fall back to polling (required for Socket.IO handshake)
      transports: ['websocket', 'polling'],
    });

    // Route each named Socket.IO event to the matching handler
    socket.onAny((event: string, data: unknown) => {
      handlersRef.current[event]?.(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { send };
}
