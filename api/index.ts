// Must be FIRST — registers tsconfig @/ path aliases for require() at runtime
// @vercel/node compiles TS but doesn't resolve aliases in the output JS
import 'tsconfig-paths/register';

import type { IncomingMessage, ServerResponse } from 'http';
import type { Application } from 'express';

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
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
