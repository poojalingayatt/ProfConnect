const { CORS_ORIGIN, NODE_ENV } = require('./env');

const localOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
];

const fallbackOrigins = NODE_ENV === 'production'
  ? ['https://profconnect-delta.vercel.app']
  : localOrigins;

const configuredOrigins = (CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const combinedOrigins = configuredOrigins.length > 0
  ? [...configuredOrigins, ...fallbackOrigins]
  : fallbackOrigins;

const allowedOrigins = [...new Set(combinedOrigins)];

const wildcardToRegex = (pattern) => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  return new RegExp(`^${escaped}$`);
};

const originMatchers = allowedOrigins.map((origin) => {
  if (origin.includes('*')) {
    const regex = wildcardToRegex(origin);
    return (requestOrigin) => regex.test(requestOrigin);
  }

  return (requestOrigin) => requestOrigin === origin;
});

const isAllowedOrigin = (requestOrigin) => {
  if (!requestOrigin) {
    return true;
  }

  // Allow dynamic Vercel preview and production deployments.
  try {
    const parsedOrigin = new URL(requestOrigin);
    if (parsedOrigin.hostname.endsWith('.vercel.app')) {
      return true;
    }
  } catch (error) {
    // Ignore malformed origins and fall back to configured matchers.
  }

  return originMatchers.some((matcher) => matcher(requestOrigin));
};

const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

module.exports = {
  allowedOrigins,
  corsOrigin,
};
