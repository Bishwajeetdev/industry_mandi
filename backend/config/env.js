import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check possible .env locations: root .env, backend/.env, or cwd .env
const candidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of candidates) {
  dotenv.config({ path: envPath });
}

// Sanitize CLOUDINARY_URL immediately before the Cloudinary SDK is imported anywhere.
if (process.env.CLOUDINARY_URL) {
  let cleaned = String(process.env.CLOUDINARY_URL).trim();
  cleaned = cleaned.replace(/^CLOUDINARY_URL\s*=\s*/i, '');
  cleaned = cleaned.replace(/^['"]|['"]$/g, '').trim();

  if (cleaned.startsWith('cloudinary:/') && !cleaned.startsWith('cloudinary://')) {
    cleaned = cleaned.replace(/^cloudinary:\/+/i, 'cloudinary://');
  } else if (!cleaned.startsWith('cloudinary://') && cleaned.includes('@') && cleaned.includes(':')) {
    cleaned = `cloudinary://${cleaned}`;
  }

  if (cleaned.startsWith('cloudinary://')) {
    process.env.CLOUDINARY_URL = cleaned;
  } else {
    console.warn(
      `[CONFIG WARNING] CLOUDINARY_URL value "${process.env.CLOUDINARY_URL}" is invalid. URL must start with 'cloudinary://'. Removing from process.env to prevent server crash.`
    );
    delete process.env.CLOUDINARY_URL;
  }
}
