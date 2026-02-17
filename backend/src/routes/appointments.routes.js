/**
 * APPOINTMENT ROUTES
 * ----------------------------------------
 * Handles booking, updating, and viewing appointments.
 */

const express = require('express');
const router = express.Router();

const appointmentsController = require('../controllers/appointments.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { createAppointmentSchema, rescheduleSchema } = require('../utils/validators');


/**
 * STUDENT books appointment
 */
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  validateRequest(createAppointmentSchema),
  appointmentsController.createAppointment
);


/**
 * Get my appointments
 * Works for both student and faculty
 */
router.get(
  '/',
  authenticate,
  appointmentsController.getMyAppointments
);


/**
 * Faculty accepts
 */
router.patch(
  '/:id/accept',
  authenticate,
  requireRole('FACULTY'),
  appointmentsController.acceptAppointment
);


/**
 * Faculty rejects
 */
router.patch(
  '/:id/reject',
  authenticate,
  requireRole('FACULTY'),
  appointmentsController.rejectAppointment
);


/**
 * Cancel appointment
 */
router.patch(
  '/:id/cancel',
  authenticate,
  appointmentsController.cancelAppointment
);


/**
 * STUDENT requests reschedule
 */
router.patch(
  '/:id/request-reschedule',
  authenticate,
  requireRole('STUDENT'),
  validateRequest(rescheduleSchema),
  appointmentsController.requestReschedule
);

/**
 * FACULTY approves reschedule
 */
router.patch(
  '/:id/approve-reschedule',
  authenticate,
  requireRole('FACULTY'),
  appointmentsController.approveReschedule
);

/**
 * FACULTY rejects reschedule
 */
router.patch(
  '/:id/reject-reschedule',
  authenticate,
  requireRole('FACULTY'),
  appointmentsController.rejectReschedule
);

module.exports = router;