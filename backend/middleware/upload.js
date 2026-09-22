import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

const uploadDir = path.resolve('uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

// Allowed MIME types
const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Allowed extensions — must match MIME type (prevents double-extension attacks)
const mimeToExt = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
};

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, done) => {
    // Always generate a random UUID filename — never use originalname on disk
    const ext = mimeToExt[file.mimetype]
      ? [...mimeToExt[file.mimetype]][0]   // use canonical extension for the MIME type
      : '.bin';
    done(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, done) => {
  // 1. Check MIME type
  if (!allowedMimes.has(file.mimetype)) {
    return done(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, JPEG, PNG, and WebP images are allowed'),
    );
  }

  // 2. Validate extension matches declared MIME type (prevents double-extension attacks e.g. evil.php.jpg)
  //    Extract only the LAST extension from the original filename
  const originalExt = path.extname(file.originalname).toLowerCase();
  const allowedExtsForMime = mimeToExt[file.mimetype];
  if (!allowedExtsForMime || !allowedExtsForMime.has(originalExt)) {
    return done(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `File extension "${originalExt}" does not match the declared type "${file.mimetype}"`,
      ),
    );
  }

  // 3. Sanitize originalname — strip any path traversal characters
  file.originalname = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');

  done(null, true);
};

export const productImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter,
}).array('images', 8);
