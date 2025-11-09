import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { parseConfig, isDomainAllowed } from './config';
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

    // Get custom domain from request
    const url = new URL(c.req.url);
    const customDomain = url.hostname;

    // Check if domain is allowed
    if (!isDomainAllowed(customDomain, config.allowedDomains)) {
      return c.json(
        {
          error: 'Domain not allowed',
          domain: customDomain,
        },
        403
      );
    }

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
