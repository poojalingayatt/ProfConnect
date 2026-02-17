const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGIN } = require('./config/env');
const setupSocket = require('./sockets/notifications.socket');

if (!DATABASE_URL) {
  process.stderr.write('FATAL: DATABASE_URL is not set.\n');
  process.exit(1);
}

if (!JWT_SECRET) {
  process.stderr.write('FATAL: JWT_SECRET is not set.\n');
  process.exit(1);
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// Make io globally accessible
global.io = io;

// Initialize socket logic
setupSocket(io);

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});