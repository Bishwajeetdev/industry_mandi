import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import routes from './routes/index.js';

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  .flatMap((origin) => {
    if (!/^https?:\/\//i.test(origin)) {
      return [`https://${origin}`, `http://${origin}`];
    }
    return [origin];
  });

const localDevPatterns = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/192\.168\.\d+\.\d+:\d+$/];
const allowedOrigins = new Set([...configuredOrigins]);

const isProd = process.env.NODE_ENV === 'production';

const app = express();

// Security headers via Helmet with explicit CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        connectSrc: ["'self'", ...configuredOrigins],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// CORS — only allow configured origins; local dev patterns for convenience
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (!isProd && localDevPatterns.some((pattern) => pattern.test(origin))) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }),
);

// Global rate limit — moderate ceiling; stricter limits added per-route
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Logging — combined format in production (structured), dev format locally
app.use(morgan(isProd ? 'combined' : 'dev'));

// Static file serving for uploads — apply CORP header per-request so files are
// accessible cross-origin by the SPA without weakening the global CORP policy
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.resolve('uploads'), { fallthrough: false, maxAge: '1d' }),
);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'TechLens API is healthy' }));

// API routes
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'API route not found' }));

// Global error handler — never expose stack traces in production
app.use((err, req, res, next) => {
  if (isProd) {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
  } else {
    console.error(err);
  }
  const status =
    err.name === 'ValidationError' ? 422
    : err.name === 'CastError' || err.name === 'MulterError' ? 400
    : 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Unexpected server error' : err.message,
    // Never expose error details or stack in production
    ...(isProd ? {} : { error: err.errors }),
  });
});

export default app;
