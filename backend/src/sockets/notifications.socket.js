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

  io.on('connection', (socket) => {

    const token = socket.handshake.auth.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const user = jwt.verify(token, JWT_SECRET);

      // Join personal room
      socket.join(`user:${user.id}`);

    } catch (error) {
      socket.disconnect();
    }

  });

};