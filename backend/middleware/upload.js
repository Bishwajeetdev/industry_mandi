import path from "path";
import multer from "multer";

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const mimeToExt = {
  "image/jpeg": new Set([".jpg", ".jpeg"]),
  "image/png": new Set([".png"]),
  "image/webp": new Set([".webp"]),
};

const fileFilter = (req, file, done) => {
  if (!allowedMimes.has(file.mimetype)) {
    return done(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only JPG, JPEG, PNG, and WebP images are allowed"));
  }
  const originalExt = path.extname(file.originalname).toLowerCase();
  if (!mimeToExt[file.mimetype]?.has(originalExt)) {
    return done(new multer.MulterError("LIMIT_UNEXPECTED_FILE", `File extension "${originalExt}" does not match the declared image type`));
  }
  file.originalname = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
  done(null, true);
};

const _rawProductImages = multer({
  // Files remain in memory only and are streamed to Cloudinary.
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter,
}).array("images", 8);

const vendorAssetFilter = (req, file, done) => {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  if (!allowed.has(file.mimetype)) {
    return done(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Use JPG, PNG, WebP, or PDF files."));
  }
  file.originalname = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
  done(null, true);
};

const _rawVendorAsset = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: vendorAssetFilter,
}).single("asset");

export const vendorAsset = (req, res, next) => {
  _rawVendorAsset(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message = err.code === "LIMIT_FILE_SIZE"
        ? "Vendor files must be 10 MB or smaller."
        : err.message || "Vendor file upload error.";
      return res.status(400).json({ success: false, message });
    }
    next(err);
  });
};

/**
 * Multer middleware wrapper that catches both MulterErrors and Busboy stream
 * errors (e.g. "Unexpected end of form") and converts them all to a proper
 * 400 response instead of leaking a 500 "Unexpected server error".
 */
export const productImages = (req, res, next) => {
  _rawProductImages(req, res, (err) => {
    if (!err) return next();

    // MulterError — file size, file count, wrong field, etc.
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: "Each image must be 5 MB or smaller.",
        LIMIT_FILE_COUNT: "You can upload a maximum of 8 images per product.",
        LIMIT_UNEXPECTED_FILE: err.message || "Unexpected file field.",
      };
      const message = messages[err.code] || err.message || "File upload error.";
      return res.status(400).json({ success: false, message });
    }

    // Busboy stream errors — "Unexpected end of form", connection drops, etc.
    // These are plain Errors thrown by the underlying multipart parser and are
    // client-side problems (malformed request), not server bugs.
    if (
      err.message === "Unexpected end of form" ||
      Array.isArray(err.storageErrors) ||
      err.message?.toLowerCase().includes("multipart") ||
      err.message?.toLowerCase().includes("form")
    ) {
      return res.status(400).json({
        success: false,
        message: "The image upload was incomplete or the request was malformed. Please try again.",
      });
    }

    // Unknown error — let the global error handler deal with it.
    next(err);
  });
};
