import { Router, type Request, type Response } from 'express';
import { createChatHandler, type ChatRouterOptions } from '../services/handler';

export type { ChatRouterOptions } from '../services/handler';

export function createChatRouter(options: ChatRouterOptions = {}) {
  const router = Router();
  const handleChat = createChatHandler(options);

  router.post('/chat', async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    try {
      const result = await handleChat(req.body, ip);
      if (result.status === 429) res.setHeader('Retry-After', String(result.retryAfterSeconds ?? 60));
      res.status(result.status).json(result.body);
    } catch {
      // Never leak internals; the visitor-facing client shows its own friendly retry message.
      res.status(500).json({ error: 'The assistant could not process that request.' });
    }
  });

  return router;
}
