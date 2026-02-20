/**
 * NOTIFICATIONS CONTROLLER
 */

const notificationsService = require('../services/notifications.service');


exports.getMyNotifications = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit), 50); // max 50 per page
    const parsedOffset = parseInt(offset) || 0;
    
    console.log('Getting notifications for user:', req.user?.id, 'Limit:', parsedLimit, 'Offset:', parsedOffset);
    const startTime = Date.now();
    
    const data = await notificationsService.getMyNotifications(req.user.id, {
      limit: parsedLimit,
      offset: parsedOffset
    });
    
    const duration = Date.now() - startTime;
    console.log(`Notifications query took ${duration}ms for user ${req.user?.id}`);
    
    res.json({ notifications: data });
  } catch (error) {
    console.error('Error getting notifications:', error.message);
    next(error);
  }
};


exports.markAsRead = async (req, res, next) => {
  try {
    const updated = await notificationsService.markAsRead(
      req.user.id,
      parseInt(req.params.id)
    );

    res.json({ notification: updated });
  } catch (error) {
    next(error);
  }
};


exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationsService.markAllAsRead(req.user.id);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};