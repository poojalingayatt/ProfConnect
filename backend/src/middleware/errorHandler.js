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

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return res.status(500).json({
      message: isProduction ? 'Database error occurred' : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // Handle other errors
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};