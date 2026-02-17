/**
 * SOCKET.IO SETUP
 * ----------------------------------------
 * Handles:
 * - Socket authentication
 * - Joining personal room
 * - Real-time notification delivery
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

module.exports = (io) => {

  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const user = jwt.verify(token, JWT_SECRET);
      socket.user = user;
      return next();
    } catch (_err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }
  });

};