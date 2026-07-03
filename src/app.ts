import express, { Application } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { applySecurityMiddleware } from '@/middleware/security.middleware';
import { globalRateLimiter } from '@/middleware/rateLimiter.middleware';
import { requestIdMiddleware } from '@/middleware/requestId.middleware';
import { notFoundHandler, errorHandler } from '@/middleware/errorHandler.middleware';
import { logger } from '@/config/logger';
import { env } from '@/config/env';
import apiRouter from '@/routes/index';

const app: Application = express();

app.set('trust proxy', 1);

app.set('json replacer', (_key: string, value: unknown) => {
  if (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).constructor?.name === 'Decimal'
  ) {
    return parseFloat(String(value));
  }
  return value;
});

applySecurityMiddleware(app);

app.use(requestIdMiddleware);

app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.path === '/api/v1/health',
  }),
);

app.use(globalRateLimiter);

app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

app.use(`/${env.UPLOAD_DIR}`, express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
