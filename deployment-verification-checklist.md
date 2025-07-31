# Multi-Domain Production Deployment Verification Checklist

## Pre-Deployment Setup

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `NEXT_PUBLIC_APP_DOMAIN` - Primary app domain (e.g., blooms.cc)
- [ ] `NEXT_PUBLIC_SUBDOMAIN_SUFFIX` - Subdomain suffix (e.g., .blooms.cc)

### Optional Production Environment Variables
- [ ] `REDIS_URL` - Redis connection string for production caching
- [ ] `REDIS_MAX_RETRIES` - Redis retry attempts (default: 3)
- [ ] `REDIS_RETRY_DELAY` - Redis retry delay in ms (default: 1000)
- [ ] `REDIS_KEY_PREFIX` - Redis key prefix (default: site:)
- [ ] `REDIS_FALLBACK_MEMORY` - Enable memory fallback when Redis fails (default: true)

### Security Configuration
- [ ] `CSRF_PROTECTION` - Enable CSRF protection (default: true in production)
- [ ] `CSRF_SECRET_KEY` - Secret key for CSRF token generation
- [ ] `CORS_ENABLED` - Enable CORS handling (default: true)
- [ ] `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- [ ] `CORS_ALLOW_CREDENTIALS` - Allow credentials in CORS (default: false)
- [ ] `RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)
- [ ] `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
- [ ] `RATE_LIMIT_WINDOW_MS` - Rate limit window in ms (default: 60000)

### Analytics and Monitoring
- [ ] `ANALYTICS_ENABLED` - Enable analytics tracking (default: true)
- [ ] `ANALYTICS_STORAGE_TYPE` - Storage type: memory|database (default: memory)
- [ ] `ANALYTICS_MAX_EVENTS` - Max events to store in memory (default: 10000)

### System Configuration
- [ ] `CRON_SECRET` - Secret for cron job authentication
- [ ] `RAILWAY_REGION` - Railway deployment region (us-west1, us-east4, europe-west4)

## DNS Configuration

### Primary Domain Setup
- [ ] Primary domain (blooms.cc) points to deployment platform
- [ ] WWW subdomain redirects to primary domain
- [ ] SSL certificate is properly configured for primary domain

### Wildcard Subdomain Support
- [ ] Wildcard DNS record (*.blooms.cc) points to deployment platform
- [ ] SSL certificate covers wildcard subdomains
- [ ] Test subdomain resolution (test.blooms.cc)

### Custom Domain Support
- [ ] Deployment platform supports custom domains
- [ ] SSL certificate provisioning is configured
- [ ] Domain verification system is in place

## Database Verification

### Schema and Migrations
- [ ] All database migrations have been applied
- [ ] Sites table has proper indexes on subdomain and custom_domain columns
- [ ] Row Level Security (RLS) policies are enabled and tested
- [ ] Site memberships table has proper foreign key constraints

### Performance Indexes
- [ ] Index on sites.subdomain for fast subdomain resolution
- [ ] Index on sites.custom_domain for fast custom domain resolution
- [ ] Index on sites.is_active for filtering active sites
- [ ] Index on site_memberships(user_id, site_id) for permission checks

### Data Integrity
- [ ] Unique constraints on sites.subdomain and sites.custom_domain
- [ ] Proper cascading deletes configured
- [ ] Audit fields (created_at, updated_at) have defaults

## Application Deployment

### Build and Deployment
- [ ] Next.js build completes without errors
- [ ] All TypeScript types are generated and valid
- [ ] Static assets are properly optimized
- [ ] Bundle size is within acceptable limits
- [ ] Standalone output is configured for containerization

### Health Checks
- [ ] `/api/system/health` endpoint returns 200 OK
- [ ] Database connectivity check passes
- [ ] Cache system is operational
- [ ] Analytics system is operational

## Domain Resolution Testing

### Subdomain Testing
- [ ] Valid subdomain resolves to correct site (test.blooms.cc)
- [ ] Invalid subdomain shows appropriate error page
- [ ] Subdomain with special characters works correctly
- [ ] Long subdomain names are handled properly

### Custom Domain Testing
- [ ] Valid custom domain resolves to correct site
- [ ] Invalid custom domain shows setup instructions
- [ ] Custom domain with www prefix works
- [ ] Custom domain SSL certificates are properly provisioned

### Edge Cases
- [ ] Very long domain names are handled gracefully
- [ ] International domain names (IDN) work correctly
- [ ] Domains with unusual TLDs work properly
- [ ] IP addresses are rejected appropriately

## Performance Verification

### Response Times
- [ ] Site resolution latency < 100ms (cache hit)
- [ ] Site resolution latency < 500ms (cache miss)
- [ ] Database query performance is acceptable
- [ ] Static asset loading is optimized

### Caching Performance
- [ ] Cache hit rate > 80% for frequently accessed sites
- [ ] Cache TTL is appropriate for different domain types
- [ ] Cache invalidation works correctly
- [ ] Memory cache fallback works when Redis is unavailable

### Load Testing
- [ ] Application handles concurrent domain resolutions
- [ ] Rate limiting works under load
- [ ] Database connections are properly pooled
- [ ] Memory usage remains stable under load

## Security Verification

### HTTPS and SSL
- [ ] All domains force HTTPS redirects
- [ ] SSL certificates are valid and properly configured
- [ ] HSTS headers are set correctly
- [ ] Mixed content warnings are resolved

### Security Headers
- [ ] Content Security Policy (CSP) is properly configured
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing
- [ ] Referrer-Policy is set appropriately

### Authentication and Authorization
- [ ] Unauthenticated users cannot access private sites
- [ ] Site owners can only access their own sites
- [ ] Admin users can access system-wide analytics
- [ ] CSRF protection works for state-changing operations

### Rate Limiting and DDoS Protection
- [ ] Rate limiting works per domain/site
- [ ] Rate limit headers are properly set
- [ ] Blocked requests return appropriate status codes
- [ ] Rate limit bypass for legitimate traffic

## Monitoring and Analytics

### System Monitoring
- [ ] Health check endpoint is monitored
- [ ] Performance metrics are collected
- [ ] Error tracking is configured
- [ ] Uptime monitoring is set up

### Analytics Tracking
- [ ] Page views are tracked per site
- [ ] Domain resolution metrics are collected
- [ ] Performance metrics are recorded
- [ ] Error events are tracked and alerted

### Alerting
- [ ] Database connectivity alerts
- [ ] High error rate alerts
- [ ] Performance degradation alerts
- [ ] Security violation alerts

## Operational Procedures

### Backup and Recovery
- [ ] Database backups are configured
- [ ] Site data recovery procedures are documented
- [ ] Configuration backup procedures are in place
- [ ] Disaster recovery plan is documented

### Maintenance
- [ ] Cache cleanup procedures are automated
- [ ] Log rotation is configured
- [ ] Database maintenance tasks are scheduled
- [ ] Performance monitoring reviews are scheduled

### Scaling
- [ ] Horizontal scaling procedures are documented
- [ ] Database scaling plans are in place
- [ ] CDN configuration supports multiple domains
- [ ] Load balancer configuration is optimized

## Testing Scenarios

### End-to-End Tests
- [ ] User can create a site with subdomain
- [ ] User can configure custom domain
- [ ] Site loads correctly on both subdomain and custom domain
- [ ] Site content is isolated between different sites

### Error Scenarios
- [ ] Graceful handling of database outages
- [ ] Proper error messages for invalid domains
- [ ] Fallback behavior when cache is unavailable
- [ ] Recovery from temporary network issues

### Security Tests
- [ ] Cross-site contamination is prevented
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are prevented
- [ ] CSRF attacks are mitigated

## Post-Deployment Verification

### Immediate Checks (First 30 minutes)
- [ ] All health checks are green
- [ ] No error spikes in monitoring
- [ ] Performance metrics are within expected ranges
- [ ] User authentication is working

### Short-term Monitoring (First 24 hours)
- [ ] Cache hit rates are as expected
- [ ] No memory leaks detected
- [ ] Error rates are below thresholds
- [ ] User feedback is positive

### Long-term Monitoring (First week)  
- [ ] Performance trends are stable
- [ ] Scaling thresholds are appropriate
- [ ] Cost metrics are within budget
- [ ] Feature adoption metrics are tracked

## Rollback Plan

### Rollback Triggers
- [ ] Error rate > 5%
- [ ] Response time > 2 seconds
- [ ] Any security vulnerability discovered
- [ ] Critical functionality broken

### Rollback Procedures
- [ ] Database rollback scripts are ready
- [ ] Application rollback procedure documented
- [ ] DNS rollback plan prepared
- [ ] Communication plan for users

## Sign-off

### Technical Team
- [ ] Development team approval
- [ ] DevOps/Infrastructure team approval
- [ ] Security team approval
- [ ] QA team approval

### Business Team
- [ ] Product owner approval
- [ ] Support team readiness
- [ ] Documentation updated
- [ ] User communication prepared

---

## Production Environment Configuration Examples

### Railway Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_APP_DOMAIN=blooms.cc
NEXT_PUBLIC_SUBDOMAIN_SUFFIX=.blooms.cc

# Production Optimizations
REDIS_URL=redis://your-redis-instance
ANALYTICS_ENABLED=true
SECURITY_ENABLED=true
CSRF_PROTECTION=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=200

# Monitoring
CRON_SECRET=your-secure-cron-secret
```

### Database Performance Indexes
```sql
-- Essential indexes for production performance
CREATE INDEX CONCURRENTLY idx_sites_subdomain ON sites(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_sites_custom_domain ON sites(custom_domain) WHERE deleted_at IS NULL AND custom_domain IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_sites_active ON sites(is_active, is_published) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_site_memberships_lookup ON site_memberships(user_id, site_id) WHERE is_active = true;
```

### DNS Configuration Examples
```bash
# Primary domain
blooms.cc A 192.0.2.1
www.blooms.cc CNAME blooms.cc

# Wildcard for subdomains
*.blooms.cc CNAME blooms.cc

# Custom domain validation
_acme-challenge.blooms.cc TXT "validation-token"
```

This checklist ensures comprehensive verification of the multi-domain site routing system before production deployment.