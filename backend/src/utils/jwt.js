const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/env');

function requireJwtSecret() {
  if (!JWT_SECRET) {
    const err = new Error('JWT_SECRET is not configured');
    err.statusCode = 500;
    throw err;
  }

  return JWT_SECRET;
}

exports.generateToken = (payload) => {
  return jwt.sign(payload, requireJwtSecret(), {
    expiresIn: JWT_EXPIRATION,
  });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, requireJwtSecret());
};
