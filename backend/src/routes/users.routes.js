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

const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const upload = require('../config/upload');

const {
  updateProfileSchema,
  updatePasswordSchema,
} = require('../utils/validators');


router.get(
'/profile',
  authenticate,
  usersController.getProfile
);


router.patch(
  '/profile',
  authenticate,
  validateRequest(updateProfileSchema),
  usersController.updateProfile
);


router.patch(
  '/password',
  authenticate,
  validateRequest(updatePasswordSchema),
  usersController.updatePassword
);

router.patch(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  usersController.updateAvatar
);

module.exports = router;
