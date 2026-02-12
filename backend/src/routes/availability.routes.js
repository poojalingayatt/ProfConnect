/**
 * AVAILABILITY ROUTES
 * ----------------------------------------
 * Handles:
 * - Getting faculty availability (public)
 * - Updating availability (faculty only)
 * - Updating online status
 */

const express = require('express');
const router = express.Router();

const availabilityController = require('../controllers/availability.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { updateAvailabilitySchema, updateStatusSchema } = require('../utils/validators');


/**
 * GET /api/availability/faculty/:id
 * ----------------------------------------
 * Public route to fetch availability of a faculty.
 */
router.get(
  '/faculty/:id',
  availabilityController.getFacultyAvailability
);


/**
 * PUT /api/availability
 * ----------------------------------------
 * Faculty updates full weekly availability.
 * We REPLACE all existing availability.
 */
router.put(
  '/',
  authenticate,
  requireRole('FACULTY'),
  validateRequest(updateAvailabilitySchema),
  availabilityController.updateAvailability
);


/**
 * PATCH /api/availability/status
 * ----------------------------------------
 * Faculty updates online/offline status.
 */
router.patch(
  '/status',
  authenticate,
  requireRole('FACULTY'),
  validateRequest(updateStatusSchema),
  availabilityController.updateStatus
);

module.exports = router;
