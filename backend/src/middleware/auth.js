const { verifyToken } = require('../utils/jwt');

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (!type || type.toLowerCase() !== 'bearer' || !token) {
      return next(createHttpError(401, 'Missing or invalid Authorization header'));
    }

    const payload = verifyToken(token);
    req.user = {
      id: payload.id ?? payload.sub,
      role: payload.role,
      email: payload.email,
    };

    return next();
  } catch (err) {
    if (err && err.statusCode && err.statusCode >= 500) {
      return next(err);
    }

    return next(createHttpError(401, 'Invalid or expired token'));
  }
}

exports.authenticate = authenticate;
exports.auth = authenticate;

exports.requireRole = (role) => (req, _res, next) => {
  if (!req.user) {
    return next(createHttpError(401, 'Unauthorized'));
  }

  if (req.user.role !== role) {
    return next(createHttpError(403, 'Forbidden'));
  }

  return next();
};
