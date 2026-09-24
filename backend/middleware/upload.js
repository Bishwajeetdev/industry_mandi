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

export const productImages = multer({
  // Files remain in memory only and are streamed to Cloudinary.
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter,
}).array("images", 8);
