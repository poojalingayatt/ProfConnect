/**
 * NOTIFICATIONS SERVICE
 * ----------------------------------------
 * Handles:
 * - Fetching notifications
 * - Creating notifications
 * - Marking as read
 * - Emitting real-time events
 */

const prisma = require('../config/database');


exports.getMyNotifications = async (userId) => {

  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};


exports.markAsRead = async (userId, notificationId) => {

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
};


exports.markAllAsRead = async (userId) => {

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });
};


/**
 * Create notification and emit via socket
 */
exports.createNotification = async ({
  userId,
  type,
  title,
  message,
}) => {

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });

  // Emit real-time event
  if (global.io) {
    global.io.to(`user:${userId}`).emit('notification', notification);
  }

  return notification;
};