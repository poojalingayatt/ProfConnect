/**
 * NOTIFICATIONS CONTROLLER
 */

const notificationsService = require('../services/notifications.service');


exports.getMyNotifications = async (req, res, next) => {
  try {
    const data = await notificationsService.getMyNotifications(req.user.id);
    res.json({ notifications: data });
  } catch (error) {
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