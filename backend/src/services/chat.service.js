const prisma = require('../config/database');
const AppError = require('../utils/AppError');

// Whitelist of allowed mediaType values — anything else is rejected before DB write
const ALLOWED_MEDIA_TYPES = new Set(['image', 'video', 'audio', 'pdf', 'document']);

function conversationInclude() {
  return {
    student: {
      select: { id: true, name: true, avatar: true },
    },
    faculty: {
      select: {
        id: true,
        name: true,
        avatar: true,
        facultyProfile: { select: { isOnline: true } },
      },
    },
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
  };
}

/**
 * Batch-load unread counts for multiple conversations in a single query.
 * Returns a Map<conversationId, count>.
 *
 * The query groups messages by conversationId and only counts those that
 * arrived AFTER the user's last read pointer and were not sent by the user.
 */
async function batchUnreadCounts(conversations, userId) {
  if (!conversations.length) return new Map();

  // Build per-conversation read-at thresholds
  const thresholds = conversations.map((conv) => {
    const isStudent = conv.studentId === userId;
    return {
      conversationId: conv.id,
      since: (isStudent ? conv.studentReadAt : conv.facultyReadAt) ?? new Date(0),
    };
  });

  // One raw query that returns per-conversation counts
  // We use a VALUES(...) subquery so we can join each conversation to its own threshold.
 // Validate all IDs are integers to prevent injection
  const safeUserId = Number(userId);
  if (!Number.isInteger(safeUserId)) {
    throw new Error('Invalid userId');
  }
  for (const t of thresholds) {
    if (!Number.isInteger(t.conversationId)) {
      throw new Error('Invalid conversationId');
    }
  }

  const valueRows = thresholds
    .map(({ conversationId, since }) => `(${conversationId}, '${since.toISOString()}'::timestamptz)`)
    .join(', ');

  const rows = await prisma.$queryRawUnsafe(`
    SELECT m."conversationId", COUNT(*)::int AS count
    FROM "Message" m
    JOIN (VALUES ${valueRows}) AS t("conversationId", "since")
      ON m."conversationId" = t."conversationId"
    WHERE m."senderId" != ${safeUserId}
      AND m."createdAt" > t."since"
    GROUP BY m."conversationId"
  `);




  const countMap = new Map(conversations.map((c) => [c.id, 0]));
  for (const row of rows) {
    countMap.set(Number(row.conversationId), Number(row.count));
  }
  return countMap;
}

async function formatConversations(convs, userId, role) {
  if (!convs.length) return [];

  // Single batched query instead of N separate COUNT queries
  const unreadMap = await batchUnreadCounts(convs, userId);

  return convs.map((conv) => {
    const otherUser = role === 'STUDENT' ? conv.faculty : conv.student;
    const lastMsg = conv.messages?.length ? conv.messages[0] : null;

    let lastMessagePreview;
    if (lastMsg) {
      if (lastMsg.content?.trim()) {
        lastMessagePreview = lastMsg.content;
      } else if (lastMsg.mediaType) {
        const labels = { image: '📷 Photo', video: '🎥 Video', audio: '🎵 Audio', pdf: '📄 PDF', document: '📎 Document' };
        lastMessagePreview = labels[lastMsg.mediaType] ?? '📎 Attachment';
      }
    }

    return {
      id: conv.id,
      isApproved: conv.isApproved,
      user: {
        id: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar ?? undefined,
        isOnline:
          role === 'STUDENT'
            ? Boolean(otherUser.facultyProfile?.isOnline)
            : false,
      },
      lastMessage: lastMessagePreview,
      lastMessageTime: lastMsg ? lastMsg.createdAt : conv.createdAt,
      unreadCount: unreadMap.get(conv.id) ?? 0,
    };
  });
}

// ─── Start Direct Chat ────────────────────────────────────────────────────────

exports.startDirectChat = async (user, facultyId) => {
  if (user.role !== 'STUDENT') throw new AppError('Only students can start a direct chat', 403);

  const faculty = await prisma.user.findFirst({
    where: { id: facultyId, role: 'FACULTY' },
    select: { id: true, name: true, avatar: true },
  });
  if (!faculty) throw new AppError('Faculty not found', 404);

  let conv = await prisma.conversation.findUnique({
    where: { studentId_facultyId: { studentId: user.id, facultyId } },
    include: conversationInclude(),
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      // studentReadAt / facultyReadAt intentionally omitted → default null
      data: { studentId: user.id, facultyId, isApproved: false },
      include: conversationInclude(),
    });
  }

  const [formatted] = await formatConversations([conv], user.id, user.role);
  return formatted;
};

// ─── Approve Chat ─────────────────────────────────────────────────────────────

exports.approveChat = async (user, conversationId) => {
  if (user.role !== 'FACULTY') throw new AppError('Only faculty can approve chats', 403);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude(),
  });
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (conversation.facultyId !== user.id) throw new AppError('Unauthorized', 403);
  if (conversation.isApproved) throw new AppError('Conversation is already approved', 400);

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { isApproved: true },
    include: conversationInclude(),
  });

  const [formatted] = await formatConversations([updated], user.id, user.role);
  return formatted;
};

// ─── Reject Chat ──────────────────────────────────────────────────────────────

exports.rejectChat = async (user, conversationId) => {
  if (user.role !== 'FACULTY') throw new AppError('Only faculty can reject chats', 403);

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (conversation.facultyId !== user.id) throw new AppError('Unauthorized', 403);

  await prisma.conversation.delete({ where: { id: conversationId } });
  return true;
};

// ─── Get Conversations ────────────────────────────────────────────────────────

exports.getConversations = async (user) => {
  const where = user.role === 'STUDENT' ? { studentId: user.id } : { facultyId: user.id };

  const conversations = await prisma.conversation.findMany({
    where,
    include: conversationInclude(),
  });

  const formatted = await formatConversations(conversations, user.id, user.role);
  return formatted.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
};

// ─── Get Messages ─────────────────────────────────────────────────────────────

exports.getMessages = async (user, conversationId, { cursor, limit } = {}) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (conversation.studentId !== user.id && conversation.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }

  const parsedLimit = limit ? Number(limit) : null;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;

  const query = {
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  };

  if (safeLimit) {
    query.take = safeLimit;
    if (cursor) {
      query.cursor = { id: Number(cursor) };
      query.skip = 1;
    }
  }

  return prisma.message.findMany(query);
};

// ─── Mark Conversation Read ───────────────────────────────────────────────────

exports.markConversationRead = async (user, conversationId) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (conversation.studentId !== user.id && conversation.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }

  const isStudent = user.role === 'STUDENT';
  await prisma.conversation.update({
    where: { id: conversationId },
    data: isStudent
      ? { studentReadAt: new Date() }
      : { facultyReadAt: new Date() },
  });

  return true;
};

// ─── Send Message (text OR media) ─────────────────────────────────────────────

exports.sendMessage = async (user, conversationId, { content, mediaUrl, mediaType, bytes } = {}) => {
  const hasText = content && content.trim();
  const hasMedia = mediaUrl && typeof mediaUrl === 'string';

  if (!hasText && !hasMedia) {
    throw new AppError('Message must have content or a media attachment', 400);
  }

  // Whitelist mediaType before it touches the database
  let safeMediaType = null;
  if (hasMedia) {
    if (mediaType && ALLOWED_MEDIA_TYPES.has(mediaType)) {
      safeMediaType = mediaType;
    } else if (mediaType) {
      throw new AppError(`Invalid media type: ${mediaType}`, 400);
    }
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (conversation.studentId !== user.id && conversation.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }
  if (!conversation.isApproved) throw new AppError('Chat not approved yet', 403);

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: hasText ? content.trim() : null,
      mediaUrl: hasMedia ? mediaUrl : null,
      mediaType: safeMediaType,
      bytes: typeof bytes === 'number' ? bytes : null,
    },
  });

  // Broadcast to all sockets in the conversation room in real-time
  if (global.io) {
    global.io.to(`conversation_${conversationId}`).emit('receive_message', message);
  }

  return message;
};
