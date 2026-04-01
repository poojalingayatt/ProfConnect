const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { JWT_SECRET } = require('../config/env');

// Whitelist of valid mediaType values — mirrors the service-layer whitelist
const ALLOWED_MEDIA_TYPES = new Set(['image', 'video', 'audio', 'pdf', 'document']);

module.exports = (io) => {
  // ─── Auth middleware ────────────────────────────────────────────────────────
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
    if (socket.user?.id) {
      socket.join(`user_${socket.user.id}`);
    }

    // ─── Join / Leave conversation room ──────────────────────────────────────

    socket.on('join_conversation', async ({ conversationId } = {}, callback = () => {}) => {
      try {
        const id = Number(conversationId);
        if (!id) {
          // Standardised: always use callback for validation / auth errors
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

    // ─── Send text message via socket ────────────────────────────────────────
    // Payload: { conversationId, content }

    socket.on('send_message', async (payload = {}, callback = () => {}) => {
      try {
        const { conversationId, content } = payload;
        const convId = Number(conversationId);

        if (!convId || !content?.trim()) {
          // Always use callback for validation errors (consistent with auth errors below)
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

    // ─── Send media message via socket ───────────────────────────────────────
    // Payload: { conversationId, mediaUrl, mediaType, bytes? }

    socket.on('send_media', async (payload = {}, callback = () => {}) => {
      try {
        const { conversationId, mediaUrl, mediaType, bytes } = payload;
        const convId = Number(conversationId);

        if (!convId) return callback({ ok: false, message: 'conversationId is required' });
        if (!mediaUrl || typeof mediaUrl !== 'string') return callback({ ok: false, message: 'mediaUrl is required' });
       // Validate URL is from expected CDN domain
       try {
         const url = new URL(mediaUrl);
         if (!url.hostname.endsWith('cloudinary.com')) {
           return callback({ ok: false, message: 'Invalid media URL' });
         }
       } catch {
         return callback({ ok: false, message: 'Invalid media URL format' });
      }


        // Whitelist mediaType before it reaches the DB
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

        console.log('[socket.send_media] incoming media payload', {
          conversationId: convId,
          mediaUrl,
          mediaType: safeMediaType,
          bytes: typeof bytes === 'number' ? bytes : null,
        });

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

        console.log('[socket.send_media] message persisted', {
          messageId: message.id,
          mediaUrl: message.mediaUrl,
          mediaType: message.mediaType,
        });

        io.to(`conversation_${convId}`).emit('receive_message', message);
        callback({ ok: true, message });
      } catch (error) {
        console.error('[socket.send_media] error', error);
        callback({ ok: false, message: 'Failed to send media' });
      }
    });

    // ─── Typing indicators ────────────────────────────────────────────────────
    // Payload: { conversationId }

    socket.on('typing_start', async ({ conversationId } = {}) => {
      try {
        const convId = Number(conversationId);
        if (!convId) return;

         // Trust that user is authorized since they must have passed join_conversation auth
       const rooms = socket.rooms;
       if (!rooms.has(`conversation_${convId}`)) return;

        socket.to(`conversation_${convId}`).emit('user_typing', {
          conversationId: convId,
          userId: socket.user.id,
          // Guard against name being absent from the JWT payload
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

        const conversation = await prisma.conversation.findUnique({ where: { id: convId } });
        if (
          !conversation ||
          (conversation.studentId !== socket.user.id && conversation.facultyId !== socket.user.id)
        ) return;

        socket.to(`conversation_${convId}`).emit('user_stopped_typing', {
          conversationId: convId,
          userId: socket.user.id,
        });
      } catch {
        // Typing events are best-effort; silently ignore errors
      }
    });
  });
};
