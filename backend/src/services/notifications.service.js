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

// In-memory cache for recent notifications
const notificationCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds


exports.getMyNotifications = async (userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  
  // Create a cache key based on userId, limit, and offset
  const cacheKey = `${userId}:${limit}:${offset}`;
  const now = Date.now();
  
  // Check if we have cached data that's still fresh
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
  
  // Cache the result
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
  
  // Clear cache since notifications have changed
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
  
  // Clear cache since notifications have changed
  invalidateUserCache(userId);
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
  
  // Clear cache since notifications have changed
  invalidateUserCache(userId);

  return notification;
};


// Export cache for clearing when needed
exports.clearUserNotificationCache = (userId) => {
  // Clear all cache entries for this user
  for (const key of notificationCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      notificationCache.delete(key);
    }
  }
};


// Helper to clear cache after updates
const invalidateUserCache = (userId) => {
  exports.clearUserNotificationCache(userId);
};