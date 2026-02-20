import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_BASE || 'http://localhost:3000', {
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