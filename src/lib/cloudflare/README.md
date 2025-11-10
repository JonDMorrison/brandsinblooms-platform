# Cloudflare Integration Service

This module provides integration with Cloudflare for managing custom hostnames, SSL certificates, and worker routes.

## Features

- **Custom Hostname Management**: Add customer domains to Cloudflare zone
- **SSL Certificate Provisioning**: Automatic SSL certificate generation with DV validation
- **Worker Route Configuration**: Route custom domain traffic through edge workers
- **DNS Record Generation**: Generate CNAME and TXT records for customer configuration
- **Rate Limiting**: Built-in token bucket rate limiting (4 req/sec)
- **Retry Logic**: Exponential backoff for transient failures
- **Error Handling**: Comprehensive error handling with specific error types

## Usage

### Setup a Custom Domain

```typescript
import { CloudflareService } from '@/lib/cloudflare';

// Complete setup: hostname + worker route + DNS records
const result = await CloudflareService.setupCustomDomain(
  'myflowers.com',
  'site-uuid-here'
);

if (result.success && result.data) {
  console.log('Hostname ID:', result.data.hostname.hostnameId);
  console.log('SSL Status:', result.data.hostname.sslStatus);
  console.log('DNS Records:', result.data.dnsRecords);

  // Provide these DNS records to the customer:
  // CNAME: @ -> site-proxy.yourdomain.com
  // TXT: _acme-challenge -> validation-token-here
}
```

### Check SSL Certificate Status

```typescript
import { CloudflareService } from '@/lib/cloudflare';

const result = await CloudflareService.checkSslStatus('hostname-id-here');

if (result.success && result.data) {
  console.log('SSL Status:', result.data);
  // Possible values: 'active', 'pending_validation', etc.
}
```

### Remove a Custom Domain

```typescript
import { CloudflareService } from '@/lib/cloudflare';

const success = await CloudflareService.removeCustomDomain(
  'hostname-id-here',
  'route-id-here' // Optional
);

if (success) {
  console.log('Custom domain removed successfully');
}
```

### Get DNS Records for Customer

```typescript
import { CloudflareService } from '@/lib/cloudflare';

const result = await CloudflareService.getDnsRecordsForDomain(
  'myflowers.com',
  'hostname-id-here'
);

if (result.success && result.data) {
  console.log('CNAME Record:', result.data.cname);
  console.log('TXT Record:', result.data.txt);
}
```

## Environment Variables

Required environment variables:

```env
# Cloudflare API credentials
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_ACCOUNT_ID=your-account-id

# Platform configuration
# Note: Uses NEXT_PUBLIC_APP_DOMAIN (strips *. prefix if present)
NEXT_PUBLIC_APP_DOMAIN=yourdomain.com
PLATFORM_PROXY_SUBDOMAIN=site-proxy # Optional, defaults to 'site-proxy'
CLOUDFLARE_WORKER_NAME=custom-domain-proxy

# Optional configuration
CLOUDFLARE_API_URL=https://api.cloudflare.com/client/v4
CLOUDFLARE_MAX_RETRIES=3
CLOUDFLARE_RETRY_DELAY_MS=1000
CLOUDFLARE_RATE_LIMIT=4 # Requests per second
```

## Database Schema

The service automatically updates the `sites` table with Cloudflare-related fields:

- `cloudflare_hostname_id`: Unique ID for the custom hostname
- `cloudflare_route_id`: Worker route ID
- `cloudflare_ssl_status`: Current SSL certificate status
- `cloudflare_txt_name`: TXT record name for validation
- `cloudflare_txt_value`: TXT record value for validation
- `cloudflare_cname_target`: CNAME target (proxy subdomain)
- `cloudflare_created_at`: When the hostname was created
- `cloudflare_activated_at`: When SSL became active

## Error Handling

The service provides specific error types for different scenarios:

```typescript
import {
  isCloudflareError,
  isRateLimitError,
  isAlreadyExistsError,
  isNotFoundError
} from '@/lib/cloudflare';

try {
  await CloudflareService.addCustomHostname('domain.com', 'site-id');
} catch (error) {
  if (isRateLimitError(error)) {
    // Handle rate limiting
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (isAlreadyExistsError(error)) {
    // Hostname already exists
    console.log('Domain already configured');
  } else if (isCloudflareError(error)) {
    // General Cloudflare API error
    console.log('Cloudflare error:', error.message);
  }
}
```

## SSL Certificate Status Values

Common SSL status values and their meanings:

- `active`: Certificate is active and serving traffic
- `pending_validation`: Waiting for DNS validation
- `initializing`: Certificate generation started
- `pending_issuance`: Certificate is being issued
- `pending_deployment`: Certificate is being deployed
- `expired`: Certificate has expired
- `validation_timed_out`: DNS validation timed out

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Service   │────▶│    Client    │────▶│ Cloudflare   │
│    Layer    │     │  (HTTP/Rate  │     │     API      │
│             │◀────│   Limiting)  │◀────│              │
└─────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│   Database  │
│   (Sites)   │
└─────────────┘
```

## Testing

The service includes comprehensive error handling and can be tested with:

1. **Unit Tests**: Mock the CloudflareClient for testing service logic
2. **Integration Tests**: Use test zone/credentials for end-to-end testing
3. **Rate Limit Testing**: Verify token bucket implementation
4. **Error Scenarios**: Test retry logic and error handling

## Security Considerations

1. **API Token**: Use scoped API tokens with minimum required permissions
2. **Zone Access**: Limit token access to specific zones
3. **SSL Validation**: Only use TXT-based validation for security
4. **Rate Limiting**: Built-in protection against API abuse
5. **Error Messages**: Sanitized error messages to prevent information leakage

## Troubleshooting

### Common Issues

1. **"Zone not found"**: Verify CLOUDFLARE_ZONE_ID is correct
2. **"Authentication error"**: Check API token permissions
3. **"Hostname already exists"**: Domain is already configured
4. **"Rate limited"**: Too many requests, implement backoff
5. **"SSL pending validation"**: Customer needs to add DNS records

### Debug Logging

The service includes detailed logging for debugging:

```typescript
// All API calls are logged with:
console.log(`[Cloudflare] ${method} ${url} (attempt ${n}/${max})`);
console.log(`[CloudflareService] Operation details...`);
```

## Migration

Run the database migration to add Cloudflare fields:

```bash
pnpm supabase migration up --include-all
```

## Dependencies

- `@supabase/ssr`: For database operations
- Native `fetch`: For HTTP requests
- No external Cloudflare SDK required