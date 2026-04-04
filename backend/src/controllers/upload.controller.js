const cloudinary = require('../config/cloudinary');
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, NODE_ENV } = require('../config/env');

const CHAT_MEDIA_FOLDER = 'profconnect/chat_media';
const SIGNED_MEDIA_URL_TTL_SECONDS = 60 * 30; // 30 minutes

/**
 * Derive a normalised mediaType label from the file's MIME type.
 * This avoids relying on Cloudinary's resource_type (which returns "raw"
 * for PDFs and documents and is therefore useless for the frontend).
 */
function deriveMediaType(mimetype = '') {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype === 'application/pdf') return 'pdf';
  // Word, Excel, and other office docs
  if (
    mimetype === 'application/msword' ||
    mimetype.includes('wordprocessingml') ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype.includes('spreadsheetml')
  ) return 'document';
  return 'document';
}

/**
 * Derive Cloudinary upload resource_type.
 * PDFs and office docs should be uploaded as "raw" so delivery URLs use /raw/upload/.
 */
function deriveUploadResourceType(mimetype = '') {
  if (mimetype === 'application/pdf') return 'raw';
  if (
    mimetype === 'application/msword' ||
    mimetype.includes('wordprocessingml') ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype.includes('spreadsheetml')
  ) return 'raw';
  return 'auto';
}

function parseCloudinaryMediaUrl(mediaUrl) {
  const url = new URL(mediaUrl);
  if (!url.hostname.endsWith('cloudinary.com')) {
    throw new Error('Invalid Cloudinary URL');
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 4) {
    throw new Error('Invalid Cloudinary media URL path');
  }

  const [cloudName, resourceType, type, ...tail] = parts;
  if (cloudName !== CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud mismatch');
  }

  // Typical delivery path: /<cloud>/<resource_type>/<type>/v<version>/<public_id>
  // If version is absent, public_id begins immediately.
  const publicIdWithFormat = /^v\d+$/.test(tail[0]) ? tail.slice(1).join('/') : tail.join('/');
  if (!publicIdWithFormat) {
    throw new Error('Missing public_id in media URL');
  }

  return { resourceType, type, publicIdWithFormat };
}

// POST /api/upload/signature
// Returns signature for Cloudinary signed upload
exports.getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    // Parameters to sign - MUST include access_mode for public access
    const paramsToSign = {
      timestamp,
      folder: CHAT_MEDIA_FOLDER,
      access_mode: 'public', // Make files publicly accessible
    };
    
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret
    );

    // Also return the derived mediaType so the frontend can pass it straight
    // to send_media without having to guess from resource_type.
    const mimetype = req.query.mimetype || '';
    const mediaType = deriveMediaType(mimetype);
    const uploadResourceType = deriveUploadResourceType(mimetype);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[upload.getUploadSignature] Signature generated', {
        mimetype,
        mediaType,
        uploadResourceType,
      });
    }

    return res.status(200).json({
      signature,
      timestamp,
      folder: CHAT_MEDIA_FOLDER,
      access_mode: 'public', // Send to frontend so it includes in upload
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      mediaType,
      uploadResourceType,
    });
  } catch (error) {
    // Log the full error server-side but never expose internal details to clients
    console.error('[upload.getUploadSignature] error', error);
    const message =
      NODE_ENV === 'production'
        ? 'Failed to generate upload signature'
        : (error.message || 'Failed to generate signature');
    return res.status(500).json({ message });
  }
};

// GET /api/upload/signed-url?mediaUrl=<cloudinary_url>
// Returns a short-lived signed Cloudinary download URL.
exports.getSignedMediaUrl = async (req, res) => {
  try {
    const mediaUrl = req.query.mediaUrl;
    if (!mediaUrl || typeof mediaUrl !== 'string') {
      return res.status(400).json({ message: 'mediaUrl is required' });
    }

    const { resourceType, type, publicIdWithFormat } = parseCloudinaryMediaUrl(mediaUrl);
    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_MEDIA_URL_TTL_SECONDS;

    // Omit `format` (second arg) so Cloudinary derives it from the public_id extension.
    // Passing `null` explicitly causes incorrect delivery URLs for some resource types (e.g. pdf).
    const signedUrl = cloudinary.utils.private_download_url(publicIdWithFormat, undefined, {
      resource_type: resourceType,
      type,
      expires_at: expiresAt,
      attachment: false,
    });

    return res.status(200).json({
      signedUrl,
      expiresAt,
    });
  } catch (error) {
    console.error('[upload.getSignedMediaUrl] error', error);
    const message =
      NODE_ENV === 'production'
        ? 'Failed to generate signed media URL'
        : (error.message || 'Failed to generate signed media URL');
    return res.status(400).json({ message });
  }
};

// Expose the helper so chat.service / socket handlers can reuse it
exports.deriveMediaType = deriveMediaType;
