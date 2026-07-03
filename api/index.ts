import type { IncomingMessage, ServerResponse } from 'http';
import type { Application } from 'express';

// Catch any initialization error so the serverless function can report it
let app: Application | null = null;
let initError: string | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../src/config/env');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app = require('../src/app').default as Application;
} catch (e: unknown) {
  initError = (e as Error).message + '\n' + (e as Error).stack;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (initError || !app) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server init failed', detail: initError }));
    return;
  }
  // Pass request to Express app
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
