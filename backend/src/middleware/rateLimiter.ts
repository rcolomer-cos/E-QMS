import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

// Env-driven toggle: by default enabled in production, disabled in development
const enabled = (process.env.RATE_LIMIT_ENABLED ?? (isProd ? 'true' : 'false')).toLowerCase() === 'true';

// Parse helpers with sensible defaults
const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};

// Windows
const API_WINDOW_MS = toInt(process.env.RATE_LIMIT_API_WINDOW_MS, 15 * 60 * 1000);
const AUTH_WINDOW_MS = toInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000);
const CREATE_WINDOW_MS = toInt(process.env.RATE_LIMIT_CREATE_WINDOW_MS, 60 * 1000);

// Thresholds (higher defaults in development)
const API_MAX = toInt(process.env.RATE_LIMIT_API_MAX, isProd ? 100 : 1000);
const AUTH_MAX = toInt(process.env.RATE_LIMIT_AUTH_MAX, isProd ? 5 : 100);
const CREATE_MAX = toInt(process.env.RATE_LIMIT_CREATE_MAX, isProd ? 10 : 200);

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: API_WINDOW_MS,
  max: API_MAX, // per-IP requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !enabled,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX, // per-IP login attempts per window
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: () => !enabled,
});

// Rate limiter for creating resources
export const createLimiter = rateLimit({
  windowMs: CREATE_WINDOW_MS,
  max: CREATE_MAX, // per-IP create requests per minute
  message: 'Too many create requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !enabled,
});
