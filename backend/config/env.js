import dotenv from 'dotenv';

// Workspace scripts execute from backend/, while shared secrets live at project root.
dotenv.config({ path: new URL('../../.env', import.meta.url) });
