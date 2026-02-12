/**
 * USERS ROUTES
 * ----------------------------------------
 * This file defines all routes related to:
 * - Profile retrieval
 * - Profile update
 * - Password update
 * 
 * These routes are protected (JWT required)
 */

const express = require('express');
const router = express.Router();

// Import controller functions
const usersController = require('../controllers/users.controller');

// Import authentication middleware
const { authenticate } = require('../middleware/auth');

// Import validation middleware
const { validateRequest } = require('../middleware/validate');

// Import Joi validation schemas
const {
  updateProfileSchema,
  updatePasswordSchema,
} = require('../utils/validators');


/**
 * GET /api/users/profile
 * ----------------------------------------
 * Returns the currently logged-in user's profile.
 * Requires JWT authentication.
 */
router.get(
'/profile',
  authenticate, // Protect route
  usersController.getProfile
);


/**
 * PATCH /api/users/profile
 * ----------------------------------------
 * Allows user to update basic profile fields.
 */
router.patch(
  '/profile',
  authenticate,
  validateRequest(updateProfileSchema), // Validate request body
  usersController.updateProfile
);


/**
 * PATCH /api/users/password
 * ----------------------------------------
 * Allows user to securely update their password.
 */
router.patch(
  '/password',
  authenticate,
  validateRequest(updatePasswordSchema),
  usersController.updatePassword
);

module.exports = router;
