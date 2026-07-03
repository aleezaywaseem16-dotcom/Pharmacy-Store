import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((v) => parseInt(v, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z
    .string()
    .default('7')
    .transform((v) => parseInt(v, 10)),
  BCRYPT_ROUNDS: z
    .string()
    .default('12')
    .transform((v) => parseInt(v, 10)),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_PRODUCT_MB: z
    .string()
    .default('5')
    .transform((v) => parseInt(v, 10)),
  MAX_FILE_SIZE_PRESCRIPTION_MB: z
    .string()
    .default('10')
    .transform((v) => parseInt(v, 10)),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Pharmacy <noreply@pharmacy.com>'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((v) => parseInt(v, 10)),
  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((v) => parseInt(v, 10)),
  AUTH_RATE_LIMIT_MAX: z
    .string()
    .default('5')
    .transform((v) => parseInt(v, 10)),
  UPLOAD_RATE_LIMIT_MAX: z
    .string()
    .default('10')
    .transform((v) => parseInt(v, 10)),
  WEBHOOK_SECRET: z.string().default('dev-webhook-secret'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detail = JSON.stringify(parsed.error.format(), null, 2);
  console.error('❌ Environment validation failed:\n' + detail);
  // throw instead of process.exit so Vercel serverless can capture a proper error
  throw new Error('Environment validation failed: ' + detail);
}

export const env = parsed.data;
