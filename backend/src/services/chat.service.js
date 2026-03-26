const prisma = require('../config/database');
const AppError = require('../utils/AppError');

function conversationInclude() {
  return {
    student: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
    faculty: {
      select: {
        id: true,
        name: true,
        avatar: true,
        facultyProfile: {
          select: {
            isOnline: true,
          },
        },
      },
    },
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
  };
}

function formatConversation(conv, otherUser, currentUserRole) {
  const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
  return {
    id: conv.id,
    isApproved: conv.isApproved,
    user: {
      id: otherUser.id,
      name: otherUser.name,
      avatar: otherUser.avatar ?? undefined,
      isOnline:
        currentUserRole === 'STUDENT'
          ? Boolean(otherUser.facultyProfile?.isOnline)
          : false,
    },
    lastMessage: lastMsg ? lastMsg.content : undefined,
    lastMessageTime: lastMsg ? lastMsg.createdAt : conv.createdAt,
    unreadCount: 0, // placeholder for future socket / read-marker support
  };
}

// ─── Start Direct Chat ────────────────────────────────────────────────────────

exports.startDirectChat = async (user, facultyId) => {
  if (user.role !== 'STUDENT') {
    throw new AppError('Only students can start a direct chat', 403);
  }

  // Validate faculty
  const faculty = await prisma.user.findFirst({
    where: { id: facultyId, role: 'FACULTY' },
    select: { id: true, name: true, avatar: true },
  });

  if (!faculty) {
    throw new AppError('Faculty not found', 404);
  }

  let conv = await prisma.conversation.findUnique({
    where: {
      studentId_facultyId: {
        studentId: user.id,
        facultyId,
      },
    },
    include: conversationInclude(),
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        studentId: user.id,
        facultyId,
        isApproved: false,
      },
      include: conversationInclude(),
    });
  }

  return formatConversation(conv, conv.faculty, user.role);
};

// ─── Approve Chat ─────────────────────────────────────────────────────────────

exports.approveChat = async (user, conversationId) => {
  if (user.role !== 'FACULTY') {
    throw new AppError('Only faculty can approve chats', 403);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude(),
  });

  if (!conversation) throw new AppError('Conversation not found', 404);

  if (conversation.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }

  if (conversation.isApproved) {
    throw new AppError('Conversation is already approved', 400);
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { isApproved: true },
    include: conversationInclude(),
  });

  return formatConversation(updated, updated.student, user.role);
};

// ─── Reject Chat ──────────────────────────────────────────────────────────────

exports.rejectChat = async (user, conversationId) => {
  if (user.role !== 'FACULTY') {
    throw new AppError('Only faculty can reject chats', 403);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new AppError('Conversation not found', 404);

  if (conversation.facultyId !== user.id) {
    throw new AppError('Unauthorized', 403);
  }

  // Delete the conversation and all its messages (cascade)
  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return true;
};

// ─── Get Conversations ────────────────────────────────────────────────────────

exports.getConversations = async (user) => {
  const where =
    user.role === 'STUDENT' ? { studentId: user.id } : { facultyId: user.id };

  const conversations = await prisma.conversation.findMany({
    where,
    include: conversationInclude(),
  });

  const formatted = conversations.map((conv) => {
    const otherUser =
      user.role === 'STUDENT' ? conv.faculty : conv.student;
    return formatConversation(conv, otherUser, user.role);
  });

  // Sort by most recent message (or creation time) descending
  formatted.sort(
    (a, b) =>
      new Date(b.lastMessageTime).getTime() -
      new Date(a.lastMessageTime).getTime()
  );

  return formatted;
};

// ─── Get Messages ─────────────────────────────────────────────────────────────

exports.getMessages = async (user, conversationId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new AppError('Conversation not found', 404);

  if (
    conversation.studentId !== user.id &&
    conversation.facultyId !== user.id
  ) {
    throw new AppError('Unauthorized', 403);
  }

  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
};

// ─── Send Message ─────────────────────────────────────────────────────────────

exports.sendMessage = async (user, conversationId, content) => {
  if (!content || !content.trim()) {
    throw new AppError('Message content cannot be empty', 400);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new AppError('Conversation not found', 404);

  if (
    conversation.studentId !== user.id &&
    conversation.facultyId !== user.id
  ) {
    throw new AppError('Unauthorized', 403);
  }

  if (!conversation.isApproved) {
    throw new AppError('Chat not approved yet', 403);
  }

  return await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      content: content.trim(),
    },
  });
};
