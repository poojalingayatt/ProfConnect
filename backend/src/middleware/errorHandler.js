/**
 * GLOBAL ERROR HANDLER
 * ----------------------------------------
 * Prevents stack traces from leaking in production.
 */

const AppError = require('../utils/AppError');

exports.errorHandler = (err, req, res, next) => {

  const logger = require('../config/logger');
  logger.error(err);

  const isProduction = process.env.NODE_ENV === 'production';

  // Handle AppError with proper status code
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // Handle other errors
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};