import dotenv from 'dotenv';

// Workspace scripts execute from backend/, while shared secrets live at project root.
dotenv.config({ path: new URL('../../.env', import.meta.url) });

// Sanitize CLOUDINARY_URL immediately before the Cloudinary SDK is imported anywhere.
// Cloudinary's internal lib/config.js validates process.env.CLOUDINARY_URL immediately upon
// import and throws "Invalid CLOUDINARY_URL protocol. URL should begin with 'cloudinary://'"
// if the URL is wrapped in quotes, has the 'CLOUDINARY_URL=' prefix, or is invalid.
if (process.env.CLOUDINARY_URL) {
  let cleaned = String(process.env.CLOUDINARY_URL).trim();
  cleaned = cleaned.replace(/^CLOUDINARY_URL\s*=\s*/i, '');
  cleaned = cleaned.replace(/^['"]|['"]$/g, '').trim();

  if (cleaned.startsWith('cloudinary://')) {
    process.env.CLOUDINARY_URL = cleaned;
  } else {
    console.warn(
      `[CONFIG WARNING] CLOUDINARY_URL value "${process.env.CLOUDINARY_URL}" is invalid. URL must start with 'cloudinary://'. Removing from process.env to prevent server crash.`
    );
    delete process.env.CLOUDINARY_URL;
  }
}
