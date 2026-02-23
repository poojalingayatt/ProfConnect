import { io, Socket } from 'socket.io-client';
import { API_BASE } from '@/lib/api';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) return socket;

  // `API_BASE` is validated in `api.ts` earlier during app startup.
  socket = io(API_BASE, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};