const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PORT } = require('./config/env');
const setupSocket = require('./sockets/notifications.socket');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

// Make io globally accessible
global.io = io;

// Initialize socket logic
setupSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});