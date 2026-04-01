import { io, Socket } from 'socket.io-client';
import { API_BASE } from '@/lib/api';
import { token } from '@/lib/token';

let socket: Socket | null = null;

export const initSocket = (authToken: string) => {
  if (socket?.connected) return socket;

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_BASE, {
    auth: { token: authToken },
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('[socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
   if (import.meta.env.DEV) console.error('[socket] Connection error:', error.message); 
  });

  socket.on('disconnect', (reason) => {
    if (import.meta.env.DEV) console.log('[socket] Disconnected:', reason);
  });

  return socket;
};

/**
 * Returns the existing singleton socket, or creates one using the stored JWT
 * if none exists yet. Safe to call from any component without passing a token.
 */
export const getOrCreateSocket = (): Socket | null => {
  if (socket?.connected) return socket;
  const authToken = token.get();
  if (!authToken) return null;
  return initSocket(authToken);
};

/** Returns the existing socket instance without creating one. */
export const getSocket = () => socket;

/**
 * Tears down the socket on logout so a fresh authenticated connection is made
 * the next time the user logs in.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};