#!/usr/bin/env node

/**
 * Custom server wrapper for Next.js standalone deployment on Railway
 * Ensures proper port binding and handles Railway's PORT environment variable
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Get port from environment or default to 3000
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

// Create Next.js app instance
const app = next({ 
  dev,
  hostname,
  port,
  dir: __dirname
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true);
      
      // Log incoming request in development
      if (dev) {
        console.log(`> Request: ${req.method} ${req.url}`);
      }
      
      // Handle the request with Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
  .listen(port, hostname, (err) => {
    if (err) throw err;
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀 Server ready on http://${hostname}:${port}              ║
║                                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}      ║
║  Port: ${port} (from ${process.env.PORT ? 'ENV' : 'DEFAULT'}) ║
║  Hostname: ${hostname}                                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    // Log Railway-specific information if available
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      console.log(`  Railway Domain: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
    
    if (process.env.RAILWAY_STATIC_URL) {
      console.log(`  Railway Static URL: ${process.env.RAILWAY_STATIC_URL}`);
    }
  });
})
.catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});