import 'dotenv/config';
import express, { type Express } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { createChatRouter } from './api/chat';
import type { GeminiOptions } from './services/gemini';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createApp(options: GeminiOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use('/api', express.json({ limit: '100kb' }));
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  });
  app.use('/api', createChatRouter(options));
  return app;
}

async function start() {
  const app = createApp();
  const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';
  const clientDist = path.join(projectRoot, 'dist');
  const clientIndex = path.join(projectRoot, 'client', 'index.html');

  if (isProduction) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
    app.get(/.*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  } else {
    const vite = await createViteServer({
      configFile: path.join(projectRoot, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      try {
        const fs = await import('node:fs/promises');
        const source = await fs.readFile(clientIndex, 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl, source);
        res.status(200).type('html').send(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Askwise listening on 0.0.0.0:${port}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().catch((error) => {
    console.error('Askwise could not start:', error);
    process.exitCode = 1;
  });
}
