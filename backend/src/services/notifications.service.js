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

const notificationCache = new Map();
const CACHE_DURATION = 30000;

const emitNotification = (notification) => {
  if (!global.io || !notification || !notification.userId) {
    return;
  }
  global.io.to(`user_${notification.userId}`).emit('new_notification', notification);
};

exports.getMyNotifications = async (userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  
  const cacheKey = `${userId}:${limit}:${offset}`;
  const now = Date.now();
  
  const cached = notificationCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached notifications for user ${userId}`);
    return cached.data;
  }
  
  const data = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });
  
  notificationCache.set(cacheKey, {
    data,
    timestamp: now
  });
  
  return data;
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

  const result = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  
  invalidateUserCache(userId);
  
  return result;
};


exports.markAllAsRead = async (userId) => {

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });
  
  invalidateUserCache(userId);
};


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

  emitNotification(notification);
  invalidateUserCache(userId);

  return notification;
};

exports.createNotificationWithTx = async (tx, data) => {
  const notification = await tx.notification.create({
    data,
  });
  emitNotification(notification);
  invalidateUserCache(data.userId);
  return notification;
};


exports.clearUserNotificationCache = (userId) => {
  for (const key of notificationCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      notificationCache.delete(key);
    }
  }
};


const invalidateUserCache = (userId) => {
  exports.clearUserNotificationCache(userId);
};
