/**
 * ADMIN ROUTES
 * ----------------------------------------
 * Admin-only management endpoints:
 * - System stats
 * - Users management
 * - Appointments overview
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', adminController.getStats);

router.get('/users', adminController.getUsers);

router.delete('/users/:id', adminController.deleteUser);

router.get('/appointments', adminController.getAppointments);

module.exports = router;

