const express = require('express');
const { authenticate } = require('../middleware/auth');
const uploadController = require('../controllers/upload.controller');

const router = express.Router();

// GET /api/upload/signature?mimetype=<mime>
// Returns Cloudinary signature for client-side signed upload.
// The optional `mimetype` query param lets the backend derive the correct mediaType label.
router.get('/signature', authenticate, uploadController.getUploadSignature);
router.get('/signed-url', authenticate, uploadController.getSignedMediaUrl);

module.exports = router;
