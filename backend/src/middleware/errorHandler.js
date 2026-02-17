/**
 * GLOBAL ERROR HANDLER
 * ----------------------------------------
 * Prevents stack traces from leaking in production.
 */

exports.errorHandler = (err, req, res, next) => {

  const logger = require('../config/logger');
  logger.error(err);

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',

    // Only show stack in development
    ...(isProduction ? {} : { stack: err.stack }),
  });
};