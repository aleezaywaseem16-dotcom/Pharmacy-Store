import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';

const buildLimiter = (max: number, windowMs?: number) =>
  rateLimit({
    windowMs: windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
    keyGenerator: (req) =>
      req.ip ?? req.headers['x-forwarded-for']?.toString() ?? 'unknown',
  });

export const globalRateLimiter = buildLimiter(env.RATE_LIMIT_MAX);

export const authRateLimiter = buildLimiter(env.AUTH_RATE_LIMIT_MAX);

export const uploadRateLimiter = buildLimiter(
  env.UPLOAD_RATE_LIMIT_MAX,
  60 * 60 * 1000,
);
