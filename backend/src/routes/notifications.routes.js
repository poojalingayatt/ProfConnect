/**
 * NOTIFICATION ROUTES
 * ----------------------------------------
 * - Get my notifications
 * - Mark single as read
 * - Mark all as read
 */

const express = require('express');
const router = express.Router();

const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');


router.get(
  '/',
  authenticate,
  notificationsController.getMyNotifications
);


router.patch(
  '/:id/read',
  authenticate,
  notificationsController.markAsRead
);


router.patch(
  '/read-all',
  authenticate,
  notificationsController.markAllAsRead
);

module.exports = router;