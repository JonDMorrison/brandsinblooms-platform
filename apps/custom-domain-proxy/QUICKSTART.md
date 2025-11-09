# Quick Start Guide

Get the custom domain proxy up and running in 5 minutes.

## 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

## 2. Local Development

Start the worker locally:

```bash
pnpm dev:proxy
```

The worker runs on `http://localhost:8787`

Test the health check:

```bash
curl http://localhost:8787/_health
```

## 3. Configure Secrets

Before deploying, set the required environment variables:

```bash
cd apps/custom-domain-proxy

# Login to Cloudflare
wrangler login

# Set origin endpoint (your Railway app URL)
wrangler secret put ORIGIN_ENDPOINT --env production
# Enter: https://your-app.railway.app
```

## 4. Deploy to Cloudflare

Deploy to production:

```bash
# From repository root
pnpm proxy:deploy:production

# Or from worker directory
cd apps/custom-domain-proxy
pnpm deploy:production
```

## 5. Configure Routes

After deployment:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Select **custom-domain-proxy-production**
4. Go to **Triggers** → **Routes**
5. Add custom domains (e.g., `custom-domain.com/*`)

## 6. Verify It Works

Test your custom domain:

```bash
curl https://custom-domain.com/_health
```

You should see:

```json
{
  "status": "healthy",
  "worker": "custom-domain-proxy",
  "timestamp": "2025-11-09T12:00:00.000Z"
}
```

## Next Steps

- [Read the full README](./README.md) for detailed documentation
- Set up monitoring with `wrangler tail --env production`
- Add custom domains in Cloudflare Dashboard
- Configure rate limiting rules in Cloudflare for security

## Troubleshooting

**Worker returns 500 error:**
- Check `ORIGIN_ENDPOINT` is set: `wrangler secret list --env production`
- Verify origin URL is HTTPS

**Domain not routing:**
- Check routes are configured in Cloudflare Dashboard
- Verify DNS points to Cloudflare (orange cloud enabled)

**Need help?**
- View logs: `wrangler tail --env production`
- Check [README.md](./README.md) troubleshooting section
