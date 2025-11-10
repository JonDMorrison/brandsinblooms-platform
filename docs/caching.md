# Site Domain Caching Guide

This guide explains how site domain caching works in the Brands in Blooms platform and how to configure it for optimal performance.

## Overview

The platform caches site lookups by domain (both subdomains and custom domains) to reduce database queries and improve response times. When a request comes in, the middleware checks the cache before querying the database.

## Cache Architecture

```
Request → Middleware → Check Cache → Cache Hit? → Serve Site
                            ↓
                        Cache Miss
                            ↓
                    Query Database
                            ↓
                     Store in Cache
                            ↓
                       Serve Site
```

## Cache Types

### 1. Memory Cache (Current Default)
- **Type**: In-memory storage (per-instance)
- **Persistence**: Lost on restart/deployment
- **Scaling**: Each instance has its own cache
- **Use case**: Development and single-instance production

### 2. Redis Cache (Planned)
- **Type**: Distributed cache
- **Persistence**: Survives restarts
- **Scaling**: Shared across all instances
- **Use case**: Multi-instance production
- **Status**: ⚠️ Currently disabled due to webpack bundling issues

## Configuration

### Environment Variables

Configure cache TTL (Time-To-Live) for different environments and domain types:

```bash
# Subdomain Cache TTL (seconds)
# Subdomains change less frequently, cache longer
SITE_CACHE_TTL_SUBDOMAIN=3600            # Default: 3600 seconds (1 hour)

# Custom Domain Cache TTL (seconds)
# Custom domains may change more frequently
SITE_CACHE_TTL_CUSTOM_DOMAIN=1800        # Default: 1800 seconds (30 minutes)

# Cache Settings
SITE_CACHE_TYPE=memory                   # memory or redis (redis not yet available)
SITE_CACHE_MAX_SIZE=1000                 # Maximum number of cached entries
```

### Recommended TTL Values

| Environment | Subdomain TTL | Custom Domain TTL | Reasoning |
|-------------|---------------|-------------------|-----------|
| **Development** | 10s | 10s | Fast iteration, see changes quickly |
| **Staging** | 300s (5 min) | 300s (5 min) | Balance between testing and performance |
| **Production** | 3600s (1 hour) | 1800s (30 min) | Optimal performance, rare changes |
| **High-traffic** | 7200s (2 hours) | 3600s (1 hour) | Maximum performance |

### Custom TTL Examples

**Aggressive Caching** (for stable sites with rare changes):
```bash
SITE_CACHE_TTL_SUBDOMAIN=7200     # 2 hours
SITE_CACHE_TTL_CUSTOM_DOMAIN=3600 # 1 hour
```

**Frequent Updates** (for sites that change often):
```bash
SITE_CACHE_TTL_SUBDOMAIN=600      # 10 minutes
SITE_CACHE_TTL_CUSTOM_DOMAIN=300  # 5 minutes
```

**No Caching** (for debugging):
```bash
SITE_CACHE_TTL_SUBDOMAIN=0        # No cache
SITE_CACHE_TTL_CUSTOM_DOMAIN=0    # No cache
```

## Cache Keys

Sites are cached using the following key format:

- Subdomain: `site:subdomain:example`
- Custom Domain: `site:custom_domain:example.com`

## Cache Lifecycle

### 1. Cache Population
- **On first request**: Database query → Store in cache
- **TTL starts**: Expiration timer begins
- **Subsequent requests**: Served from cache (fast!)

### 2. Cache Expiration
- **After TTL expires**: Entry is removed from cache
- **Next request**: Triggers new database query
- **Re-cached**: Fresh data stored with new TTL

### 3. Cache Invalidation
Manual cache invalidation is supported:

```typescript
import { invalidateSiteCache } from '@/lib/cache/site-cache'

// Invalidate when site is updated
await invalidateSiteCache(site)
```

This invalidates both subdomain and custom domain cache entries for the site.

## Performance Headers

The middleware adds cache performance headers to every response:

```http
X-Cache-Status: hit              # or "miss"
X-Cache-Provider: memory         # or "redis" (when available)
X-Response-Time: 15ms            # Total request latency
```

Use these headers to monitor cache effectiveness.

## Monitoring Cache Performance

### Check Cache Statistics

```typescript
import { getSiteCacheStats } from '@/lib/cache/site-cache'

const stats = getSiteCacheStats()
console.log(stats)
// {
//   size: 342,           // Current cache entries
//   maxSize: 1000,       // Maximum capacity
//   entries: [...]       // List of cached entries
// }
```

### Cache Warmup

Pre-populate cache with frequently accessed sites:

```typescript
import { warmupSiteCache } from '@/lib/cache/site-cache'

// Fetch popular sites from database
const popularSites = await getPopularSites()

// Warm up the cache
await warmupSiteCache(popularSites)
```

## Best Practices

### 1. Choose Appropriate TTL
- **High-traffic sites**: Longer TTL (1-2 hours)
- **Frequently updated sites**: Shorter TTL (5-30 minutes)
- **Development**: Very short TTL (30-60 seconds)

### 2. Monitor Cache Hit Rate
- Check `X-Cache-Status` header in production
- Aim for >80% cache hit rate
- Low hit rate? Consider longer TTL

### 3. Invalidate on Updates
Always invalidate cache when site data changes:

```typescript
// Update site in database
await updateSite(siteId, changes)

// Invalidate cache
await invalidateSiteCache(site)
```

### 4. Handle Cache Misses Gracefully
The code automatically handles cache misses:
- Queries database on miss
- Stores result in cache
- Returns site data

### 5. Plan for Scale
- **Single instance**: Memory cache works fine
- **Multiple instances**: Plan to enable Redis cache
- **Global deployment**: Consider edge caching (Cloudflare)

## Troubleshooting

### Problem: Cache Not Working
**Check:**
1. Environment variables are set correctly
2. Cache is not disabled (TTL > 0)
3. Check debug logs: `DEBUG_CACHE=true`

### Problem: Stale Data
**Solutions:**
1. Reduce TTL
2. Invalidate cache on updates
3. Clear cache manually: `clearSiteCache()`

### Problem: Memory Issues
**Solutions:**
1. Reduce `SITE_CACHE_MAX_SIZE`
2. Reduce TTL values
3. Enable Redis cache (when available)

### Problem: Cache Misses After Deployment
**Expected Behavior:**
- Memory cache is cleared on restart/deployment
- First request after deployment is always a cache miss
- Cache rebuilds naturally over time
- Use cache warmup to speed this up

## Future Enhancements

### Redis Cache (Planned)
When Redis cache is enabled:
- **Persistent**: Survives restarts
- **Shared**: All instances use same cache
- **Faster**: Redis is optimized for caching
- **Distributed**: Perfect for multi-region deployments

### Edge Caching (Cloudflare)
For even better performance:
- Cache at Cloudflare edge
- Sub-millisecond response times
- Reduced origin server load
- Global CDN distribution

## Related Documentation

- [Multi-Domain Architecture](./domain-based-site-routing-implementation-plan.md)
- [Custom Domain Proxy](../apps/custom-domain-proxy/README.md)
- [Middleware Implementation](../middleware.ts)
- [Cache Implementation](../src/lib/cache/site-cache.ts)

## Support

For questions or issues with caching:
1. Check debug logs: `DEBUG_CACHE=true`
2. Review cache statistics
3. Monitor performance headers
4. Contact the development team
