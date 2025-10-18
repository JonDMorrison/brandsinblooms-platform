# Dev-Only Scraper Preview API

## Overview

The scraper preview endpoint provides a synchronous preview of the website scraping and analysis pipeline for development and testing purposes. This endpoint returns comprehensive metrics and debugging information that helps developers understand how the scraping system processes websites.

## Endpoint

```
POST /api/dev/scraper-preview
```

## Security

- **Environment**: Only available in development and staging environments (returns 404 in production)
- **Authentication**: Requires authenticated user session
- **Rate Limiting**: 5 requests per hour per user
- **URL Validation**: Prevents SSRF attacks by blocking localhost and private IPs

## Request

### Headers

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>" // Or session cookies
}
```

### Body

```typescript
{
  "websiteUrl": string;        // Required: URL of the website to scrape
  "maxPages"?: number;         // Optional: Max pages to scrape (default: from config)
  "verbose"?: boolean;         // Optional: Enable verbose output
}
```

### Example Request

```bash
curl -X POST http://localhost:3001/api/dev/scraper-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "websiteUrl": "https://example-business.com",
    "verbose": true
  }'
```

## Response

### Success Response (200 OK)

```typescript
{
  "success": true,
  "data": {
    // Scraping phase results
    "scraping": {
      "discovery": {
        "baseUrl": string,
        "pages": DiscoveredPage[],
        "errors": Array<{ url: string; error: string }>,
        "totalPagesFound": number,
        "totalPagesScraped": number
      },
      "duration": number,  // milliseconds
      "metrics": {
        "totalPagesFound": number,
        "totalPagesScraped": number,
        "failedPages": number,
        "averagePageSize": number,  // bytes
        "totalDataSize": number,     // bytes
        "failedUrls"?: Array<{ url: string; error: string }>
      }
    },

    // Analysis phase results
    "analysis": {
      "result": {
        "baseUrl": string,
        "businessInfo": ExtractedBusinessInfo,
        "pageContents": Record<string, string>,
        "recommendedPages": string[],
        "contentSummary": string
      },
      "duration": number,  // milliseconds
      "extracted": {
        "hasLogo": boolean,
        "logoUrl"?: string,
        "brandColorsCount": number,
        "brandColors"?: string[],
        "emailsCount": number,
        "emails"?: string[],
        "phonesCount": number,
        "phones"?: string[],
        "socialLinksCount": number,
        "socialPlatforms"?: string[],
        "hasHeroSection": boolean,
        "heroHeadline"?: string,
        "hasBusinessHours": boolean,
        "hasServices": boolean,
        "servicesCount"?: number,
        "hasTestimonials": boolean,
        "testimonialsCount"?: number,
        "keyFeaturesCount": number
      }
    },

    // LLM context generation
    "llmContext": {
      "context": ScrapedWebsiteContext,
      "estimatedTokens": number,
      "contextSize": number  // characters
    },

    // Execution metadata
    "execution": {
      "totalDuration": number,  // milliseconds
      "timestamp": string,       // ISO 8601
      "environment": "development" | "staging"
    },

    // Warnings (if any)
    "warnings"?: string[]
  }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED",
  "success": false
}
```

#### 429 Rate Limit Exceeded

```json
{
  "error": "Scraping rate limit exceeded. Maximum 5 requests per hour.",
  "code": "RATE_LIMIT_EXCEEDED",
  "success": false
}
```

#### 400 Bad Request

```json
{
  "error": "Invalid URL format",
  "code": "INVALID_URL",
  "success": false
}
```

#### 500 Internal Server Error

```json
{
  "error": "Failed to scrape website: <details>",
  "code": "SCRAPING_FAILED",
  "success": false
}
```

## Testing

### Using the Test Script

```bash
# Make sure dev server is running
pnpm dev

# Run the test script
node scripts/test-scraper-preview.mjs https://example-business.com
```

### Manual Testing with cURL

```bash
# First, get an auth token (you need to be logged in)
# Then use it in the request:

curl -X POST http://localhost:3001/api/dev/scraper-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "websiteUrl": "https://example.com",
    "verbose": true
  }' | jq
```

### Testing with Thunder Client / Postman

1. Set method to `POST`
2. URL: `http://localhost:3001/api/dev/scraper-preview`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
4. Body (JSON):
```json
{
  "websiteUrl": "https://example.com",
  "verbose": true
}
```

## Use Cases

1. **Testing Scraper Performance**: Measure how long it takes to scrape and analyze different websites
2. **Debugging Content Extraction**: See exactly what data is extracted from a website
3. **LLM Context Preview**: Understand what context will be sent to the LLM for site generation
4. **Quality Assurance**: Verify that important business information is correctly extracted
5. **Performance Optimization**: Identify slow websites or extraction bottlenecks

## Implementation Details

### Rate Limiting

- Uses the existing `checkScrapingRateLimit` function
- 5 requests per hour per user
- Separate from site generation rate limits

### Security Measures

1. **Environment Check**: Returns 404 in production
2. **Authentication**: Requires valid user session
3. **URL Validation**:
   - Blocks localhost and private IPs (RFC 1918)
   - Only allows HTTP/HTTPS protocols
   - Requires valid domain with TLD
4. **Input Sanitization**: Sanitizes URL to prevent injection

### Performance Considerations

- Synchronous operation (waits for scraping to complete)
- Typical response time: 5-30 seconds depending on website
- Memory usage: Proportional to website size (capped at 1MB per page)
- Token estimation: Uses ~4 characters per token approximation

## Limitations

1. **Development Only**: Not available in production environment
2. **Rate Limited**: Maximum 5 requests per hour per user
3. **Page Limit**: Scrapes maximum 5 pages per website (configurable)
4. **Timeout**: 30 seconds per page
5. **Size Limit**: 1MB maximum per page

## Related Files

- **API Route**: `/app/api/dev/scraper-preview/route.ts`
- **Type Definitions**: `/src/lib/types/dev-api-types.ts`
- **Test Script**: `/scripts/test-scraper-preview.mjs`
- **Scraping Logic**: `/src/lib/scraping/page-discovery.ts`
- **Content Analysis**: `/src/lib/scraping/content-analyzer.ts`