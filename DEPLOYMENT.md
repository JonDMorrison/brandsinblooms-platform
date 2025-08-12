# Railway Deployment Guide - Brands in Blooms Platform

## 🎯 Overview

This platform has been optimized for Railway deployment with:
- **Multi-stage Docker build** for fast deployments (~2-3 minutes)
- **Lightweight production image** (~150MB)
- **Multi-domain support** with domain-based routing
- **Automated health checks** and rollback support
- **Redis caching** with memory fallback
- **Production security** headers and optimizations

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Install and setup Railway
pnpm railway:setup

# Configure environment variables
pnpm railway:env setup
```

### 2. Deploy to Staging
```bash
pnpm railway:deploy:staging
```

### 3. Deploy to Production
```bash
pnpm railway:deploy:production
```

## 📋 Prerequisites

### Required Services
1. **Supabase Project** (database, auth, storage)
2. **Railway Account** with CLI installed
3. **Domain** for production (e.g., `blooms.cc`)

### Required Environment Variables
```bash
# Core Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Domain Configuration
NEXT_PUBLIC_APP_DOMAIN=blooms.cc
NEXT_PUBLIC_SUBDOMAIN_SUFFIX=.blooms.cc

# Production Settings
NODE_ENV=production
REDIS_URL=redis://default:password@redis-hostname:6379
```

## 🏗️ Architecture

### Docker Configuration
- **Base Image**: `node:20-alpine` (production-ready)
- **Multi-stage Build**: Separate dependency, build, and runtime stages
- **Standalone Output**: Next.js standalone mode for minimal footprint
- **Non-root User**: Security-hardened container execution

### Performance Optimizations
- **Build Cache**: Docker layer caching for faster builds
- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: WebP format with multiple sizes
- **Redis Caching**: Site resolution and content caching

### Security Features
- **Security Headers**: HSTS, CSP, XSS protection
- **CORS Configuration**: Multi-domain support
- **Rate Limiting**: API protection (configurable)
- **CSRF Protection**: Token-based protection

## 🔧 Configuration Files

### Core Files
- `Dockerfile.standalone` - Production Docker image
- `railway.json` - Railway deployment configuration
- `next.config.js` - Next.js optimizations
- `.env.example` - Environment template for all environments

### Scripts
- `scripts/railway-setup.sh` - Initial Railway setup
- `scripts/railway-deploy.sh` - Deployment with health checks
- `scripts/railway-env.js` - Environment management

## 🌍 Multi-Domain Setup

### Domain Configuration
1. **Wildcard DNS**: Configure `*.blooms.cc` → Railway deployment
2. **SSL Certificate**: Railway auto-generates wildcard SSL
3. **Custom Domains**: Add customer domains in Railway dashboard

### Site Resolution
- **Subdomain Routing**: `site-name.blooms.cc`
- **Custom Domain**: Direct domain mapping
- **Fallback**: Default domain for unmatched requests

## 📊 Monitoring & Health Checks

### Health Endpoint
- **URL**: `/api/health`
- **Response**: Service status, environment, uptime
- **Timeout**: 100s with 3 retries

### Monitoring
```bash
# View logs
pnpm railway:logs

# Check status
pnpm railway:status

# Monitor deployment
railway logs --tail
```

## 🚢 Deployment Workflow

### Staging Deployment
1. **Environment**: Automatically switches to staging
2. **Health Check**: Validates deployment success
3. **Rollback**: Automatic rollback on failure
4. **URL**: `*.staging.blooms.cc`

### Production Deployment
1. **Pre-checks**: Validates environment and build
2. **Zero-downtime**: Gradual traffic switching
3. **Health Monitoring**: Continuous health validation
4. **Backup**: Automatic backup before deployment

## 🔍 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build locally
pnpm build

# View detailed errors
pnpm typecheck
pnpm lint
```

#### Deployment Failures
```bash
# Check Railway logs
railway logs

# Validate environment
pnpm railway:env validate

# Rollback if needed
railway deployments rollback
```

#### Domain Issues
1. Verify DNS configuration
2. Check Railway domain settings
3. Validate SSL certificate status

### Performance Issues
1. **Slow Builds**: Check Docker cache layers
2. **High Memory**: Monitor Railway metrics
3. **Slow Response**: Check Redis connection

## 🎨 Customization

### Build Optimization
- Adjust Docker stages for your needs
- Modify webpack configuration
- Update bundle analyzer settings

### Scaling
- **Horizontal**: Multiple Railway replicas
- **Vertical**: Increase memory/CPU allocation
- **Redis**: Dedicated Redis instance for high traffic

### Custom Domains
1. Add domain in Railway dashboard
2. Configure DNS records
3. Validate domain verification

## 🔐 Security Best Practices

### Environment Variables
- Use Railway's secret management
- Never commit sensitive values
- Rotate keys regularly

### Domain Security
- Enable HSTS headers
- Configure CSP policies
- Validate domain ownership

### Database Security
- Use Supabase RLS policies
- Limit service role usage
- Monitor database access

## 📈 Performance Metrics

### Target Performance
- **Build Time**: 2-3 minutes
- **Cold Start**: <5 seconds
- **Response Time**: <100ms p50
- **Image Size**: ~150MB

### Optimization Tips
1. **Code Splitting**: Automatic with Next.js
2. **Image Optimization**: WebP with next/image
3. **Caching**: Redis for hot data, memory fallback
4. **CDN**: Consider adding for static assets

## 🆘 Support

### Resources
- **Railway Docs**: https://docs.railway.app
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

### Commands Reference
```bash
# Setup
pnpm railway:setup                 # Initial Railway setup
pnpm railway:env setup            # Configure environment

# Development
pnpm dev                          # Local development
pnpm build                        # Test build locally

# Deployment
pnpm railway:deploy:staging       # Deploy to staging
pnpm railway:deploy:production    # Deploy to production

# Monitoring
pnpm railway:logs                 # View logs
pnpm railway:status               # Check status

# Management
railway environments list         # List environments
railway variables                 # View variables
railway deployments list          # View deployments
```

## ✅ Post-Deployment Checklist

### Staging
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] Domain routing working
- [ ] Database connectivity verified
- [ ] Redis caching functional

### Production
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Performance metrics within targets
- [ ] Monitoring alerts configured
- [ ] Backup strategy verified

---

**🎉 Your Railway deployment is now optimized and ready for production!**

For additional support, refer to the Railway documentation or contact your development team.