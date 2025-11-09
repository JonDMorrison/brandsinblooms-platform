import { Hono } from 'hono';
import type { Env } from './types';
import { parseConfig } from './config';
import { proxyRequest } from './proxy';

const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get('/_health', (c) => {
  return c.json({
    status: 'healthy',
    worker: 'custom-domain-proxy',
    timestamp: new Date().toISOString(),
  });
});

// Main proxy handler - catch all routes
app.all('*', async (c) => {
  try {
    // Parse configuration
    const config = parseConfig(c.env);

    // Proxy the request
    const response = await proxyRequest(c.req.raw, config);

    return response;
  } catch (error) {
    console.error('Worker error:', error);

    return c.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      500
    );
  }
});

export default app;
