/**
 * FOLLOW ROUTES
 * ----------------------------------------
 * Students can:
 * - Follow faculty
 * - Unfollow faculty
 * - See their followed faculty
 * 
 * Faculty can:
 * - See followers
 */

const express = require('express');
const router = express.Router();

const followsController = require('../controllers/follows.controller');
const { authenticate, requireRole } = require('../middleware/auth');


/**
 * Follow faculty (STUDENT only)
 */
router.post('/:facultyId',
  authenticate,
  requireRole('STUDENT'),
  followsController.followFaculty
);


/**
 * Unfollow faculty (STUDENT only)
 */
router.delete(
  '/:facultyId',
  authenticate,
  requireRole('STUDENT'),
  followsController.unfollowFaculty
);


/**
 * Get my followed faculty (student)
 */
router.get(
  '/my-followed',
  authenticate,
  requireRole('STUDENT'),
  followsController.getMyFollowed
);


/**
 * Get my followers (faculty)
 */
router.get(
  '/my-followers',
  authenticate,
  requireRole('FACULTY'),
  followsController.getMyFollowers
);

module.exports = router;
