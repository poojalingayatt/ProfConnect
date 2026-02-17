/**
 * REVIEWS ROUTES
 * ----------------------------------------
 * Only students can create reviews.
 * Anyone can fetch faculty reviews.
 */

const express = require('express');
const router = express.Router();

const reviewsController = require('../controllers/reviews.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { reviewSchema } = require('../utils/validators');


// Create review (Student only)
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  validateRequest(reviewSchema),
  reviewsController.createReview
);


// Get all reviews for a faculty 
router.get(
  '/faculty/:facultyId',
  reviewsController.getFacultyReviews
);

module.exports = router;