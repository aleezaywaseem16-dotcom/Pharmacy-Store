import '@/config/env';
import http from 'http';
import app from '@/app';
import { db } from '@/config/database';
import { logger } from '@/config/logger';
import { env } from '@/config/env';
import { startAllJobs } from '@/jobs/index';

const server = http.createServer(app);

async function start(): Promise<void> {
  try {
    await db.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.warn({
      event: 'db_connect_failed',
      message: 'Database unavailable — server starting without DB connection',
      error: (error as Error).message,
    });
  }

  if (env.NODE_ENV !== 'test') {
    startAllJobs();
  }

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
  });
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await db.$disconnect();
    logger.info('Server closed. Database disconnected.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    await db.$disconnect();
    logger.info('Server closed. Database disconnected.');
    process.exit(0);
  });
});

start().catch((error) => {
  logger.error({ event: 'startup_failed', error: (error as Error).message });
  process.exit(1);
});

export default server;
