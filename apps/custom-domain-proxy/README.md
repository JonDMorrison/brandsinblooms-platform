# Custom Domain Proxy

Cloudflare Worker that acts as a transparent proxy for custom domains, routing requests to the configured origin server.

## Overview

This worker receives requests on custom domains and proxies them to the origin server (Next.js app) with the following behavior:

- **Host Header**: Set to the origin server's hostname
- **x-blooms-custom-domain Header**: Added with the original request domain
- **Transparent Proxying**: Preserves request method, body, and most headers

## Architecture

```
Custom Domain Request → Cloudflare Worker → Origin Server (Railway)
                       ↓
                   Header Manipulation:
                   - Host: origin.railway.app
                   - x-blooms-custom-domain: custom-domain.com
                   - x-forwarded-host: custom-domain.com
                   - x-forwarded-proto: https
```

## Setup

### Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Wrangler CLI**: Installed via pnpm (included in package.json)
3. **Origin Server**: Railway deployment URL

### Installation

From the repository root:

```bash
# Install all dependencies (includes worker deps)
pnpm install

# Or install worker deps specifically
cd apps/custom-domain-proxy
pnpm install
```

### Configuration

#### 1. Set Environment Variables

The worker requires one secret environment variable:

```bash
# Navigate to worker directory
cd apps/custom-domain-proxy

# Set origin endpoint (required)
wrangler secret put ORIGIN_ENDPOINT --env production
# Enter: https://your-app.railway.app
```

#### 2. Configure Routes

After deploying, configure routes in Cloudflare dashboard:

1. Go to Workers & Pages
2. Select your worker
3. Go to Triggers → Routes
4. Add custom domains/routes

## Development

### Local Development

```bash
# From repository root
pnpm dev:proxy

# Or from worker directory
pnpm dev
```

The worker will run on `http://localhost:8787`

### Testing Locally

```bash
# Test health check
curl http://localhost:8787/_health

# Test proxy (replace with your test domain)
curl -H "Host: custom-domain.com" http://localhost:8787/
```

### Type Checking

```bash
# From repository root
pnpm typecheck:proxy

# Or from worker directory
pnpm type-check
```

## Deployment

### Method 1: Via Repository Root (Recommended)

```bash
# Deploy to production
pnpm proxy:deploy:production

# Deploy to staging
pnpm proxy:deploy:staging
```

### Method 2: Direct Deployment

```bash
cd apps/custom-domain-proxy

# Deploy to production
pnpm deploy:production

# Deploy to staging
pnpm deploy:staging
```

### First-Time Deployment

1. **Login to Wrangler**:
   ```bash
   wrangler login
   ```

2. **Set Secrets**:
   ```bash
   wrangler secret put ORIGIN_ENDPOINT --env production
   ```

3. **Deploy**:
   ```bash
   pnpm deploy:production
   ```

4. **Configure Routes**:
   - Go to Cloudflare Dashboard
   - Navigate to Workers & Pages
   - Select `custom-domain-proxy-production`
   - Add routes for your custom domains

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ORIGIN_ENDPOINT` | Yes | Origin server URL | `https://app.railway.app` |
| `ENVIRONMENT` | No | Environment name (auto-set) | `production` |

## API Endpoints

### Health Check

```
GET /_health
```

Returns worker health status:

```json
{
  "status": "healthy",
  "worker": "custom-domain-proxy",
  "timestamp": "2025-11-09T12:00:00.000Z"
}
```

### Proxy (All Other Routes)

All other requests are transparently proxied to the origin server.

## Headers

### Added Headers

The worker adds the following headers to proxied requests:

- `Host`: Origin server hostname
- `x-blooms-custom-domain`: Original request domain
- `x-forwarded-host`: Original request domain
- `x-forwarded-proto`: Original request protocol (usually `https`)

### Debug Headers (Non-Production)

In non-production environments, additional headers are added:

- `x-original-url`: Original request URL
- `x-proxy-worker`: Worker name
- `x-proxy-version`: Worker version

## Security

### HTTPS Only

The worker validates that `ORIGIN_ENDPOINT` is HTTPS to ensure secure communication.

### Rate Limiting

Consider implementing Cloudflare's rate limiting rules in the dashboard to prevent abuse.

## Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail --env production

# Formatted logs
wrangler tail --env production --format=pretty
```

### Cloudflare Analytics

View request metrics in the Cloudflare Dashboard:
- Workers & Pages → Your Worker → Analytics

## Troubleshooting

### Worker Not Routing Traffic

1. Check routes are configured in Cloudflare Dashboard
2. Verify DNS points to Cloudflare (orange cloud)
3. Check `ORIGIN_ENDPOINT` is set correctly

### 502 Proxy Error

Origin server is unreachable:
1. Verify origin server is running
2. Check `ORIGIN_ENDPOINT` URL is correct
3. Check origin server accepts requests

### Type Errors

Regenerate Cloudflare types:
```bash
wrangler types
```

## Architecture Decisions

### Why Hono?

- Ultra-lightweight (< 10KB)
- Native Cloudflare Workers support
- Excellent TypeScript integration
- Minimal overhead for proxying

### Why Separate Headers?

- `Host`: Required for origin routing
- `x-blooms-custom-domain`: Allows origin to identify the custom domain
- `x-forwarded-*`: Standard forwarding headers for traceability

## Future Enhancements

- [ ] Cache frequently accessed content
- [ ] Implement rate limiting per domain
- [ ] Add request/response transformation options
- [ ] Support custom header mappings
- [ ] Add metrics collection

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Framework](https://hono.dev/)
