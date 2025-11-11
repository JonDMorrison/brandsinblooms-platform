# Website Scraping Deployment Guide

This guide covers deploying the website-based site generation feature to production environments.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Production Configuration](#production-configuration)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring & Alerting](#monitoring--alerting)
- [Cost Tracking](#cost-tracking)
- [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

Before deploying to production, verify the following:

### Code & Testing

- [ ] All code changes are committed and pushed to the repository
- [ ] All tests pass (`pnpm test:all`)
- [ ] TypeScript compilation succeeds (`pnpm typecheck`)
- [ ] Linting passes with no errors (`pnpm lint`)
- [ ] Type coverage meets threshold (`pnpm type-coverage`)
- [ ] Feature has been tested in development environment
- [ ] Edge cases are handled (timeouts, invalid URLs, scraping failures)

### Security

- [ ] SSRF protection is enabled and tested
- [ ] Content moderation is configured
- [ ] Rate limiting is properly configured
- [ ] Input validation is working correctly
- [ ] Salt value is stored securely (not in code)
- [ ] Scraping service authentication is tested

### Infrastructure

- [ ] Scraping service (Puppeteer API) is running and accessible
- [ ] Network connectivity between production app and scraping service verified
- [ ] Firewall rules allow outbound HTTPS requests
- [ ] DNS resolution works for scraping service URL

### Documentation

- [ ] API documentation updated with `basedOnWebsite` parameter
- [ ] User-facing documentation describes the feature
- [ ] Team members are aware of new feature
- [ ] Support team has troubleshooting guide

## Environment Setup

### Required Environment Variables

Configure these in your production environment (Railway):

```bash
# Scraping Service
SCRAPING_SERVICE_URL=https://puppeteer-api-production-7bea.up.railway.app
SCRAPING_SERVICE_SALT=<get-from-secrets-vault>
SCRAPING_SERVICE_TIMEOUT=30000
SCRAPING_SERVICE_MAX_RETRIES=2
```

### Railway Deployment

1. Navigate to your Railway project dashboard
2. Select your service (e.g., "brands-in-blooms-production")
3. Go to "Variables" tab
4. Add the following variables:

```
SCRAPING_SERVICE_URL = https://puppeteer-api-production-7bea.up.railway.app
SCRAPING_SERVICE_SALT = <secret-salt-value>
SCRAPING_SERVICE_TIMEOUT = 30000
SCRAPING_SERVICE_MAX_RETRIES = 2
```

5. Click "Deploy" to apply changes

### Other Platforms

For other deployment platforms:

1. Locate environment variables configuration
2. Add the four scraping service variables
3. Ensure variables are available at runtime (not just build time)
4. Redeploy the application

## Production Configuration

### Getting the Salt Value

The `SCRAPING_SERVICE_SALT` is a shared secret between your application and the scraping service.

1. Check your organization's secrets management system:
   - 1Password
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

2. If not found, contact:
   - Infrastructure team
   - DevOps lead
   - Platform administrator

3. NEVER:
   - Commit the salt to version control
   - Share it in public channels
   - Include it in logs or error messages

### Rate Limiting Configuration

Review and adjust rate limits in `/src/lib/security/site-generation-rate-limit.ts`:

```typescript
// Development (generous limits)
const DEV_LIMITS = {
  maxRequestsPerHour: 20,
  maxRequestsPerDay: 100,
  scrapingMaxPerHour: 10,
};

// Production (conservative limits)
const PROD_LIMITS = {
  maxRequestsPerHour: 5,
  maxRequestsPerDay: 20,
  scrapingMaxPerHour: 3,
};
```

Adjust based on:
- Expected user load
- Scraping service capacity
- Cost considerations
- Business requirements

### Timeout Configuration

Adjust timeouts based on your needs:

```bash
# Conservative (faster failures, less resource usage)
SCRAPING_SERVICE_TIMEOUT=15000

# Balanced (recommended)
SCRAPING_SERVICE_TIMEOUT=30000

# Aggressive (for slow sites, higher resource usage)
SCRAPING_SERVICE_TIMEOUT=60000
```

## Deployment Steps

### Step 1: Deploy Code Changes

```bash
# For Railway
git push origin main

# For manual deployment
pnpm build
pnpm deploy:production
```

### Step 2: Configure Environment Variables

Follow the platform-specific instructions above to add environment variables.

### Step 3: Verify Deployment

```bash
# Check deployment status
pnpm deployment:status

# Or manually verify
curl https://your-production-domain.com/api/health
```

### Step 4: Test Scraping Functionality

Create a test site generation request:

```bash
curl -X POST https://your-production-domain.com/api/sites/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN" \
  -d '{
    "businessInfo": {
      "prompt": "Test production scraping",
      "name": "Test Business",
      "basedOnWebsite": "https://example.com"
    }
  }'
```

Expected response:
- 200 OK status
- Job created successfully
- No errors in logs

### Step 5: Monitor Initial Usage

Monitor the first few production uses:

1. Check application logs for errors
2. Verify scraping service connectivity
3. Confirm rate limiting is working
4. Ensure fallback mechanism activates on failures

## Post-Deployment Verification

### Functional Testing

- [ ] Test with valid website URL (should scrape successfully)
- [ ] Test with invalid URL (should return error)
- [ ] Test with slow website (should timeout gracefully)
- [ ] Test with non-existent domain (should handle DNS errors)
- [ ] Test rate limiting (multiple rapid requests should be throttled)
- [ ] Test without `basedOnWebsite` (should work as before)
- [ ] Test with SSRF attempt (should block malicious URLs)

### Performance Testing

- [ ] Measure average scraping time
- [ ] Check memory usage during scraping
- [ ] Verify no memory leaks
- [ ] Test concurrent scraping requests
- [ ] Monitor API response times

### Security Testing

- [ ] Attempt SSRF with private IPs (should block)
- [ ] Try invalid hash values (should reject)
- [ ] Test XSS in scraped content (should sanitize)
- [ ] Verify rate limits prevent abuse
- [ ] Check error messages don't leak sensitive data

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Scraping Success Rate**
   - Target: >90%
   - Alert if below 80%

2. **Average Scraping Duration**
   - Target: <30 seconds
   - Alert if >60 seconds

3. **Rate Limit Violations**
   - Monitor for abuse patterns
   - Alert on repeated violations

4. **Error Rates**
   - Scraping service errors
   - Timeout errors
   - SSRF blocking (expected, but monitor volume)

5. **Resource Usage**
   - Memory consumption during scraping
   - API request queue length
   - Database connections

### Recommended Alerting Setup

#### Critical Alerts (Immediate Response)

```yaml
# Scraping service down
- metric: scraping_service_availability
  threshold: < 95%
  duration: 5m
  severity: critical

# High error rate
- metric: scraping_error_rate
  threshold: > 50%
  duration: 10m
  severity: critical
```

#### Warning Alerts (Monitor Closely)

```yaml
# Slow scraping performance
- metric: scraping_duration_p95
  threshold: > 45s
  duration: 15m
  severity: warning

# Elevated rate limiting
- metric: rate_limit_violations
  threshold: > 10/hour
  duration: 1h
  severity: warning
```

### Logging Configuration

Ensure the following events are logged:

```typescript
// Successful scraping
logger.info('Scraping completed', {
  url: scrapedUrl,
  pagesScraped: pageCount,
  duration: durationMs,
  userId: userId,
});

// Scraping failures
logger.error('Scraping failed', {
  url: attemptedUrl,
  error: error.message,
  retryCount: retryNumber,
  userId: userId,
});

// Rate limiting
logger.warn('Rate limit exceeded', {
  userId: userId,
  limitType: 'scraping',
  requestCount: currentCount,
});

// SSRF attempts
logger.warn('SSRF attempt blocked', {
  url: blockedUrl,
  userId: userId,
  reason: blockReason,
});
```

### Monitoring Tools

Recommended tools for monitoring:

1. **Application Monitoring**: Datadog, New Relic, or built-in Railway metrics
2. **Log Aggregation**: Logtail, Papertrail, or CloudWatch Logs
3. **Uptime Monitoring**: UptimeRobot, Pingdom, or StatusCake
4. **Error Tracking**: Sentry, Rollbar, or Bugsnag

## Cost Tracking

### Scraping Service Costs

If the Puppeteer API service has usage-based pricing:

1. **Track Usage Metrics**
   ```sql
   -- Query to count scraping requests per day
   SELECT
     DATE(created_at) as date,
     COUNT(*) as scraping_requests
   FROM site_generation_jobs
   WHERE business_info->>'basedOnWebsite' IS NOT NULL
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Set Budget Alerts**
   - Configure alerts for daily/monthly usage thresholds
   - Monitor cost per scraping request
   - Track scraping success vs. cost

3. **Optimize Costs**
   - Adjust rate limits based on usage patterns
   - Reduce timeout values if appropriate
   - Consider caching scraped data (if allowed)

### Infrastructure Costs

Monitor impact on your infrastructure:

- Increased API server resource usage
- Database storage for scraped content (if stored)
- Network bandwidth for scraping requests
- Log storage increases

## Rollback Procedures

If issues arise after deployment:

### Quick Rollback (Emergency)

```bash
# Railway
railway rollback

# Manual
git revert <commit-hash>
git push origin main
```

### Graceful Degradation

If scraping service is unavailable:

1. The system automatically falls back to prompt-only generation
2. Users can still generate sites without `basedOnWebsite`
3. Monitor error logs to track fallback frequency

### Feature Flag (Future Enhancement)

Consider adding a feature flag to disable scraping without redeployment:

```bash
# Environment variable to disable feature
FEATURE_WEBSITE_SCRAPING_ENABLED=false
```

## Troubleshooting Production Issues

### Issue: High Failure Rate

**Symptoms**: Many scraping requests failing

**Diagnosis**:
```bash
# Check scraping service health
curl https://puppeteer-api-production-7bea.up.railway.app/health

# Review error logs
railway logs --tail 100 | grep "scraping"

# Check rate limiting
railway logs | grep "rate limit"
```

**Solutions**:
- Verify scraping service is running
- Check network connectivity
- Verify environment variables are set correctly
- Ensure salt value is correct

### Issue: Slow Performance

**Symptoms**: Scraping takes >60 seconds

**Diagnosis**:
- Check scraping service performance metrics
- Review websites being scraped (some may be slow)
- Check for timeouts in logs

**Solutions**:
- Reduce timeout value to fail faster
- Optimize scraping service (if you control it)
- Consider caching for frequently scraped sites

### Issue: Rate Limit Violations

**Symptoms**: Users reporting "too many requests" errors

**Diagnosis**:
```bash
# Check rate limit logs
railway logs | grep "rate_limit"

# Identify users hitting limits
railway logs | grep "rate_limit" | grep userId
```

**Solutions**:
- Review if limits are too strict for production usage
- Communicate limits to users
- Consider tiered limits based on user plan

## Security Incident Response

If a security issue is detected:

1. **Immediate Actions**:
   - Disable the feature via feature flag or rollback
   - Review logs for exploit attempts
   - Identify affected users/data

2. **Investigation**:
   - Determine scope of issue
   - Identify vulnerability
   - Assess data exposure

3. **Remediation**:
   - Patch vulnerability
   - Deploy fix
   - Verify fix in staging
   - Redeploy to production

4. **Communication**:
   - Notify affected users if needed
   - Document incident
   - Update security procedures

## Next Steps

After successful deployment:

- [ ] Monitor metrics for first 24 hours
- [ ] Review user feedback
- [ ] Optimize based on real-world usage
- [ ] Document any production-specific findings
- [ ] Share learnings with team

## Support & Resources

- **Setup Guide**: [SCRAPING_SETUP.md](./SCRAPING_SETUP.md)
- **Implementation Details**: [SCRAPING_IMPLEMENTATION.md](./SCRAPING_IMPLEMENTATION.md)
- **Platform Overview**: [platform-overview.md](./platform-overview.md)
- **Main README**: [../README.md](../README.md)

For deployment issues:
1. Check this guide's troubleshooting section
2. Review application logs
3. Contact DevOps team
4. Escalate to platform administrator if needed
