const reviewsService = require('../services/reviews.service');


exports.createReview = async (req, res, next) => {
  try {
    const review = await reviewsService.createReview(req.user, req.body);

    res.status(201).json({ review });

  } catch (error) {
    next(error);
  }
};


exports.getFacultyReviews = async (req, res, next) => {
  try {
    const reviews = await reviewsService.getFacultyReviews(
      parseInt(req.params.facultyId)
    );

    res.json({ reviews });

  } catch (error) {
    next(error);
  }
};