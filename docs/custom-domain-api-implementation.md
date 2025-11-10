# Custom Domain Configuration API Implementation

## Overview
Implementation of backend API endpoints for custom domain configuration wizard with DNS verification, provider detection, and rate limiting.

## Database Schema

### Migration File
- **Location**: `/supabase/migrations/20241109_add_custom_domain_fields.sql`
- **Fields Added**:
  - `custom_domain_status`: Domain configuration status (not_started, pending_verification, verified, failed, disconnected)
  - `dns_provider`: Detected DNS provider
  - `dns_verification_token`: Unique token for verification
  - `dns_records`: JSON object with required DNS records
  - `last_dns_check_at`: Timestamp for rate limiting
  - `custom_domain_verified_at`: When domain was verified
  - `custom_domain_error`: Last error message

## API Endpoints

### 1. Initialize Domain Configuration
**POST** `/api/sites/[siteId]/domain/initialize`

**Purpose**: Validate domain, detect DNS provider, generate verification token

**Request Body**:
```json
{
  "domain": "example.com"
}
```

**Response**:
```json
{
  "success": true,
  "domain": "example.com",
  "status": "pending_verification",
  "provider": "cloudflare",
  "verificationToken": "verify-abc123...",
  "dnsRecords": {
    "cname": {
      "type": "CNAME",
      "name": "@",
      "value": "proxy.blooms.cc",
      "ttl": 300
    },
    "txt": {
      "type": "TXT",
      "name": "_blooms-verify",
      "value": "verify-abc123...",
      "ttl": 300
    }
  }
}
```

### 2. Verify Domain Configuration
**POST** `/api/sites/[siteId]/domain/verify`

**Purpose**: Check DNS records configuration with rate limiting (60 seconds)

**Response**:
```json
{
  "verified": true,
  "cnameValid": true,
  "txtValid": true,
  "errors": [],
  "details": {
    "expectedCname": "proxy.blooms.cc",
    "actualCname": "proxy.blooms.cc",
    "expectedTxt": "verify-abc123...",
    "actualTxt": "verify-abc123..."
  }
}
```

**Rate Limited Response (429)**:
```json
{
  "error": "Rate limited. Please wait before checking again.",
  "secondsRemaining": 45
}
```

### 3. Get Domain Status
**GET** `/api/sites/[siteId]/domain/status`

**Purpose**: Return current domain configuration status

**Response**:
```json
{
  "domain": "example.com",
  "status": "pending_verification",
  "provider": "cloudflare",
  "lastCheckAt": "2024-11-09T10:00:00Z",
  "verifiedAt": null,
  "nextCheckAvailable": "2024-11-09T10:01:00Z",
  "dnsRecords": { ... },
  "error": null
}
```

### 4. Disconnect Domain
**DELETE** `/api/sites/[siteId]/domain`

**Purpose**: Remove custom domain configuration

**Response**:
```json
{
  "success": true,
  "message": "Custom domain disconnected successfully",
  "data": {
    "subdomain": "my-store"
  }
}
```

### 5. Detect DNS Provider
**POST** `/api/dns/detect-provider`

**Purpose**: Detect DNS provider from domain NS records

**Request Body**:
```json
{
  "domain": "example.com"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "domain": "example.com",
    "provider": {
      "id": "cloudflare",
      "name": "Cloudflare",
      "documentationUrl": "https://developers.cloudflare.com/dns/manage-dns-records/"
    },
    "detected": true
  }
}
```

## Utility Functions

### DNS Utilities (`/src/lib/dns/utils.ts`)
- `generateVerificationToken()`: Create unique verification token
- `generateDnsRecords()`: Generate required DNS records
- `detectDnsProvider()`: Query NS records and match providers
- `verifyDnsRecords()`: Check CNAME and TXT records
- `canCheckDns()`: Rate limiting check
- `registerWithCloudflare()`: Placeholder for Cloudflare integration
- `removeFromCloudflare()`: Placeholder for Cloudflare removal

### DNS Types (`/src/lib/dns/types.ts`)
- Domain status enums
- DNS record interfaces
- Provider definitions
- Result types

## Supported DNS Providers
- Cloudflare
- GoDaddy
- Namecheap
- Google Domains
- Amazon Route 53
- DigitalOcean
- Squarespace
- Wix
- Bluehost
- HostGator

## Security Features
- **Authentication Required**: All endpoints require authenticated user
- **Authorization**: Only site owners can configure domains
- **Rate Limiting**: 60-second cooldown between DNS checks
- **Domain Validation**: Strict format validation and availability checking
- **Unique Tokens**: Cryptographically secure verification tokens

## Error Handling
- 400: Invalid domain format or missing parameters
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not site owner)
- 404: Site or domain not found
- 409: Domain already in use or conflict
- 429: Rate limited
- 500: Server error with details

## Cloudflare Integration (Placeholder)
Two placeholder functions ready for implementation:
- `registerWithCloudflare()`: Add domain to Cloudflare, configure SSL, set up proxy
- `removeFromCloudflare()`: Clean up domain from Cloudflare

Both functions currently return mock success and log to console with `[MOCK]` prefix.

## Type Safety Notes
Database migration needs to be run and types regenerated using `pnpm generate-types`.
Until then, type assertions are used in API endpoints to handle the new fields.

## Testing Recommendations
1. Run migration: `pnpm supabase:migration:up`
2. Regenerate types: `pnpm generate-types`
3. Test domain validation with various formats
4. Verify rate limiting works correctly
5. Test DNS verification with real domains
6. Ensure proper error messages for all failure cases

## Next Steps
1. Implement actual Cloudflare API integration
2. Add webhook endpoints for async verification
3. Consider adding email notifications for verification status
4. Add support for wildcard SSL certificates
5. Implement domain transfer validation