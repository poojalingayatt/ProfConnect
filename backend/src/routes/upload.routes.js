const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const uploadController = require('../controllers/upload.controller');

const router = express.Router();

// Stricter limiter for signature generation — prevents mass-minting Cloudinary signatures.
// The global limiter is 200 req / 15 min; this tightens it to 20 req / 1 min on this endpoint.
const signatureRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many signature requests, please try again later.' },
});

// GET /api/upload/signature?mimetype=<mime>
// Returns Cloudinary signature for client-side signed upload.
// The optional `mimetype` query param lets the backend derive the correct mediaType label.
router.get('/signature', authenticate, signatureRateLimit, uploadController.getUploadSignature);
router.get('/signed-url', authenticate, uploadController.getSignedMediaUrl);

module.exports = router;
