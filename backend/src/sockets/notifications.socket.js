const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { JWT_SECRET } = require('../config/env');

// Whitelist of valid mediaType values - mirrors the service-layer whitelist
const ALLOWED_MEDIA_TYPES = new Set(['image', 'video', 'audio', 'pdf', 'document']);

// userId -> Set<socketId>
const userSockets = new Map();
// userId(string) -> Set<socketId>
const userSocketMap = new Map();
// socketId -> userId(string) reverse map for O(1) disconnect handling
const socketToUser = new Map();
// userId -> peerUserId (active/ringing call pairing)
const activeCallPeerByUser = new Map();

const toUserId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toUserIdKey = (value) => {
  const parsed = toUserId(value);
  return parsed ? String(parsed) : null;
};

const getUserSocketSet = (userIdKey) => {
  if (!userSocketMap.has(userIdKey)) {
    userSocketMap.set(userIdKey, new Set());
  }
  return userSocketMap.get(userIdKey);
};

const mapToDebugObject = () =>
  Object.fromEntries([...userSocketMap.entries()].map(([k, v]) => [k, [...v]]));

const addSocketForUser = (userId, socketId) => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);
};

const removeSocketForUser = (userId, socketId) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);
  if (!sockets.size) {
    userSockets.delete(userId);
  }
};

const getSocketIdsForUser = (userId) => {
  return [...(userSockets.get(userId) ?? [])];
};

const isUserOnline = (userId) => {
  return getSocketIdsForUser(userId).length > 0;
};

const emitToUser = (io, userId, event, payload) => {
  const socketIds = getSocketIdsForUser(userId);
  if (!socketIds.length) return false;

  socketIds.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
  return true;
};

const setActiveCallPair = (userAId, userBId) => {
  activeCallPeerByUser.set(userAId, userBId);
  activeCallPeerByUser.set(userBId, userAId);
};

const clearActiveCallPair = (userAId, userBId) => {
  if (activeCallPeerByUser.get(userAId) === userBId) {
    activeCallPeerByUser.delete(userAId);
  }
  if (activeCallPeerByUser.get(userBId) === userAId) {
    activeCallPeerByUser.delete(userBId);
  }
};

const clearUserActiveCall = (userId) => {
  const peerId = activeCallPeerByUser.get(userId);
  if (!peerId) return null;

  clearActiveCallPair(userId, peerId);
  return peerId;
};

module.exports = (io) => {
  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      socket.user = jwt.verify(token, JWT_SECRET);
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const socketUserId = toUserId(socket.user?.id);
    const socketUserIdKey = toUserIdKey(socket.user?.id);

    if (socketUserId) {
      socket.join(`user_${socketUserId}`);
      addSocketForUser(socketUserId, socket.id);
    }

    if (socketUserIdKey) {
      const sockets = getUserSocketSet(socketUserIdKey);
      sockets.add(socket.id);
      socketToUser.set(socket.id, socketUserIdKey);
      console.log('🟢 Registered:', socketUserIdKey, '->', [...sockets]);
      console.log('📡 Full Map:', mapToDebugObject());
    }

    socket.on('register', (userId) => {
      console.log('🟢 Register event received:', userId, socket.id);
      const id = toUserIdKey(userId);
      const authId = toUserIdKey(socket.user?.id);

      if (!id || !authId || id !== authId) {
        console.warn('❌ Invalid register payload:', {
          attemptedUserId: userId,
          authUserId: authId,
          socketId: socket.id,
        });
        return;
      }

      addSocketForUser(Number(id), socket.id);
      const sockets = getUserSocketSet(id);
      sockets.add(socket.id);
      console.log('🟢 Registered:', id, '->', [...sockets]);
      console.log('📡 Full Map:', mapToDebugObject());
    });

    // Join / Leave conversation room
    socket.on('join_conversation', async ({ conversationId } = {}, callback = () => {}) => {
      try {
        const id = Number(conversationId);
        if (!id) {
          return callback({ ok: false, message: 'Invalid conversation id' });
        }

        const conversation = await prisma.conversation.findUnique({ where: { id } });
        if (
          !conversation ||
          (conversation.studentId !== socket.user.id && conversation.facultyId !== socket.user.id)
        ) {
          return callback({ ok: false, message: 'Unauthorized conversation access' });
        }

        socket.join(`conversation_${id}`);
        callback({ ok: true });
      } catch {
        callback({ ok: false, message: 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', ({ conversationId } = {}) => {
      const id = Number(conversationId);
      if (id) socket.leave(`conversation_${id}`);
    });

    // Send text message via socket
    socket.on('send_message', async (payload = {}, callback = () => {}) => {
      try {
        const { conversationId, content } = payload;
        const convId = Number(conversationId);

        if (!convId || !content?.trim()) {
          return callback({ ok: false, message: 'conversationId and content are required' });
        }

        const conversation = await prisma.conversation.findUnique({ where: { id: convId } });

        if (!conversation) return callback({ ok: false, message: 'Conversation not found' });
        if (conversation.studentId !== socket.user.id && conversation.facultyId !== socket.user.id) {
          return callback({ ok: false, message: 'Unauthorized' });
        }
        if (!conversation.isApproved) return callback({ ok: false, message: 'Chat not approved yet' });

        const message = await prisma.message.create({
          data: {
            conversationId: convId,
            senderId: socket.user.id,
            content: content.trim(),
            mediaUrl: null,
            mediaType: null,
            bytes: null,
          },
        });

        io.to(`conversation_${convId}`).emit('receive_message', message);
        callback({ ok: true, message });
      } catch (error) {
        console.error('[socket.send_message] error', error);
        callback({ ok: false, message: 'Failed to send message' });
      }
    });

    // Send media message via socket
    socket.on('send_media', async (payload = {}, callback = () => {}) => {
      try {
        const { conversationId, mediaUrl, mediaType, bytes } = payload;
        const convId = Number(conversationId);

        if (!convId) return callback({ ok: false, message: 'conversationId is required' });
        if (!mediaUrl || typeof mediaUrl !== 'string') return callback({ ok: false, message: 'mediaUrl is required' });

        try {
          const url = new URL(mediaUrl);
          if (url.hostname !== 'cloudinary.com' && !url.hostname.endsWith('.cloudinary.com')) {
            return callback({ ok: false, message: 'Invalid media URL' });
          }
        } catch {
          return callback({ ok: false, message: 'Invalid media URL format' });
        }

        if (mediaType && !ALLOWED_MEDIA_TYPES.has(mediaType)) {
          return callback({ ok: false, message: `Invalid mediaType. Allowed: ${[...ALLOWED_MEDIA_TYPES].join(', ')}` });
        }
        const safeMediaType = mediaType || null;

        const conversation = await prisma.conversation.findUnique({ where: { id: convId } });
        if (!conversation) return callback({ ok: false, message: 'Conversation not found' });
        if (conversation.studentId !== socket.user.id && conversation.facultyId !== socket.user.id) {
          return callback({ ok: false, message: 'Unauthorized' });
        }
        if (!conversation.isApproved) return callback({ ok: false, message: 'Chat not approved yet' });

        const message = await prisma.message.create({
          data: {
            conversationId: convId,
            senderId: socket.user.id,
            content: null,
            mediaUrl,
            mediaType: safeMediaType,
            bytes: typeof bytes === 'number' ? bytes : null,
          },
        });

        io.to(`conversation_${convId}`).emit('receive_message', message);
        callback({ ok: true, message });
      } catch (error) {
        console.error('[socket.send_media] error', error);
        callback({ ok: false, message: 'Failed to send media' });
      }
    });

    // Typing indicators
    socket.on('typing_start', async ({ conversationId } = {}) => {
      try {
        const convId = Number(conversationId);
        if (!convId) return;

        const rooms = socket.rooms;
        if (!rooms.has(`conversation_${convId}`)) return;

        socket.to(`conversation_${convId}`).emit('user_typing', {
          conversationId: convId,
          userId: socket.user.id,
          name: socket.user.name ?? socket.user.email ?? 'Someone',
        });
      } catch {
        // Typing events are best-effort; silently ignore errors
      }
    });

    socket.on('typing_stop', async ({ conversationId } = {}) => {
      try {
        const convId = Number(conversationId);
        if (!convId) return;

        const rooms = socket.rooms;
        if (!rooms.has(`conversation_${convId}`)) return;

        socket.to(`conversation_${convId}`).emit('user_stopped_typing', {
          conversationId: convId,
          userId: socket.user.id,
        });
      } catch {
        // Typing events are best-effort; silently ignore errors
      }
    });

    // Call signaling
    socket.on('call-user', ({ to, offer, type = 'audio' } = {}, callback = () => {}) => {
      try {
        const from = toUserId(socket.user?.id);
        const receiverId = toUserId(to);
        const receiverIdKey = toUserIdKey(to);
        const receiverSockets = receiverIdKey ? userSocketMap.get(receiverIdKey) : null;

        if (!from || !receiverId || !offer) {
          return callback({ ok: false, message: 'Invalid call payload' });
        }
        if (from === receiverId) {
          return callback({ ok: false, message: 'Cannot call yourself' });
        }
        if (activeCallPeerByUser.get(from)) {
          return callback({ ok: false, message: 'You are already in another call' });
        }
        if (activeCallPeerByUser.get(receiverId)) {
          socket.emit('call-error', { to: receiverId, reason: 'User is busy' });
          return callback({ ok: false, message: 'User is busy' });
        }
        console.log('📞 Call attempt to:', receiverIdKey);
        console.log('Available sockets:', receiverSockets ? [...receiverSockets] : receiverSockets);
        console.log('📡 Full Map:', mapToDebugObject());

        if (!receiverSockets || receiverSockets.size === 0) {
          console.log('❌ User offline:', receiverIdKey);
          socket.emit('user-offline', { to: receiverId });
          socket.emit('call-error', { to: receiverId, reason: 'User is offline' });
          return callback({ ok: false, message: 'User is offline' });
        }

        setActiveCallPair(from, receiverId);
        receiverSockets.forEach((sockId) => {
          io.to(sockId).emit('incoming-call', { offer, from, type });
        });
        callback({ ok: true });
      } catch {
        callback({ ok: false, message: 'Failed to place call' });
      }
    });

    socket.on('call-accepted', ({ to, answer } = {}, callback = () => {}) => {
      try {
        const from = toUserId(socket.user?.id);
        const callerId = toUserId(to);

        if (!from || !callerId || !answer) {
          return callback({ ok: false, message: 'Invalid call accept payload' });
        }
        if (activeCallPeerByUser.get(from) !== callerId) {
          return callback({ ok: false, message: 'Call is no longer active' });
        }

        emitToUser(io, callerId, 'call-accepted', { answer, from });
        callback({ ok: true });
      } catch {
        callback({ ok: false, message: 'Failed to accept call' });
      }
    });

    socket.on('reject-call', ({ to } = {}, callback = () => {}) => {
      try {
        const from = toUserId(socket.user?.id);
        const callerId = toUserId(to);

        if (!from || !callerId) {
          return callback({ ok: false, message: 'Invalid call reject payload' });
        }

        clearActiveCallPair(from, callerId);
        emitToUser(io, callerId, 'call-rejected', { from });
        callback({ ok: true });
      } catch {
        callback({ ok: false, message: 'Failed to reject call' });
      }
    });

    socket.on('ice-candidate', ({ to, candidate } = {}, callback = () => {}) => {
      try {
        const from = toUserId(socket.user?.id);
        const receiverId = toUserId(to);

        if (!from || !receiverId || !candidate) {
          return callback({ ok: false, message: 'Invalid ICE payload' });
        }

        emitToUser(io, receiverId, 'ice-candidate', { from, candidate });
        callback({ ok: true });
      } catch {
        callback({ ok: false, message: 'Failed to send ICE candidate' });
      }
    });

    socket.on('end-call', ({ to } = {}, callback = () => {}) => {
      try {
        const from = toUserId(socket.user?.id);
        const receiverId = toUserId(to);

        if (!from || !receiverId) {
          return callback({ ok: false, message: 'Invalid end call payload' });
        }

        if (activeCallPeerByUser.get(from) !== receiverId) {
          return callback({ ok: false, message: 'No active call with this user' });
        }

        clearActiveCallPair(from, receiverId);
        emitToUser(io, receiverId, 'call-ended', { from });
        callback({ ok: true });
      } catch {
        callback({ ok: false, message: 'Failed to end call' });
      }
    });

    socket.on('disconnect', () => {
      const userId = toUserId(socket.user?.id);
      console.log('🔴 Disconnect:', socket.id);

      const mappedUserId = socketToUser.get(socket.id);
      if (mappedUserId) {
        const sockSet = userSocketMap.get(mappedUserId);
        if (sockSet) {
          sockSet.delete(socket.id);
          if (sockSet.size === 0) {
            userSocketMap.delete(mappedUserId);
          }
        }
        socketToUser.delete(socket.id);
        console.log('❌ Updated map:', mappedUserId, [...(userSocketMap.get(mappedUserId) || [])]);
      }
      console.log('📡 Full Map:', mapToDebugObject());

      if (!userId) return;

      removeSocketForUser(userId, socket.id);

      // If user still has another active socket, keep call mapping intact.
      if (isUserOnline(userId)) return;

      const peerId = clearUserActiveCall(userId);
      if (!peerId) return;

      emitToUser(io, peerId, 'call-ended', { from: userId, reason: 'disconnected' });
    });
  });
};
