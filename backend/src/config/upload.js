const multer = require('multer');
const path = require('path');

// memoryStorage: file goes into RAM buffer, then straight to Cloudinary — never touches disk
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Second layer: allowlist of file extensions (lowercase)
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.mov', '.avi', '.webm',
  '.mp3', '.ogg', '.wav',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
]);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.has(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type "${file.mimetype}" / extension "${ext}". Allowed: images, video, audio, PDF, Word, Excel.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

module.exports = upload;