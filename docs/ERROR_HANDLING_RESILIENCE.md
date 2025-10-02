# Error Handling & Resilience - Website-Based Site Generation

This document describes the comprehensive error handling and resilience patterns implemented in the website-based site generation system.

## Overview

The site generation system implements multiple layers of error handling to ensure graceful degradation and reliable operation even when external dependencies (scraping service, LLM APIs) experience failures.

## Error Handling Layers

### 1. Scraping Client Layer (`src/lib/scraping/scraping-client.ts`)

#### Retry Logic with Exponential Backoff

**Location**: Lines 75-126

**Implementation**:
- Maximum retries: Configurable via `SCRAPING_SERVICE_MAX_RETRIES` (default: 2)
- Exponential backoff: `1000ms * (attempt + 1)`
  - First retry: 1 second delay
  - Second retry: 2 second delay
  - Third retry: 3 second delay

**Error Categories**:
- **Validation errors**: No retry (immediate failure)
  - Invalid URLs
  - Internal/localhost IPs
  - Non-HTTP/HTTPS protocols
- **Network/timeout errors**: Retry with backoff
  - Connection failures
  - Timeout errors
  - 5xx server errors

#### Timeout Protection

**Location**: Lines 80-95

**Implementation**:
- Request timeout: Configurable via `SCRAPING_SERVICE_TIMEOUT` (default: 30000ms)
- AbortController with 5-second buffer: `timeout + 5000ms`
- Prevents hanging requests from blocking the system

#### URL Validation

**Location**: Lines 34-59

**Security measures**:
- Blocks localhost and internal IPs (127.0.0.1, 192.168.x.x, 10.x.x.x, 172.x.x.x)
- Only allows HTTP/HTTPS protocols
- Validates hostname structure
- Prevents SSRF attacks

#### Parallel Processing with Error Isolation

**Location**: Lines 131-160

**Implementation**:
- Uses `Promise.allSettled()` for batch processing
- Concurrency limit: 3 parallel requests
- Individual failures don't stop batch processing
- Failed URLs recorded with error messages
- Successful URLs continue processing

**Result handling**:
```typescript
// Successful scrape
results.set(url, { success: true, html: "...", metadata: {...} })

// Failed scrape (isolated error)
results.set(url, { success: false, url, error: "Network timeout" })
```

### 2. Page Discovery Layer (`src/lib/scraping/page-discovery.ts`)

#### Homepage Failure = Abort

**Location**: Lines 34-61

**Rationale**: Homepage is essential for:
- Extracting business information
- Discovering navigation links
- Determining site structure

**Behavior**:
- Homepage scraping failure aborts the entire discovery process
- Returns empty pages array with error details
- Allows API layer to fall back to prompt-only generation

#### Secondary Page Failures = Continue

**Location**: Lines 70-88

**Behavior**:
- Uses `scrapeMultipleUrls()` which isolates failures
- Each secondary page failure is recorded in `errors` array
- Generation continues with successfully scraped pages
- Partial results are better than no results

**Error tracking**:
```typescript
{
  baseUrl: "https://example.com",
  pages: [...],  // Successfully scraped pages
  errors: [      // Failed pages with details
    { url: "https://example.com/about", error: "Timeout" },
    { url: "https://example.com/contact", error: "404 Not Found" }
  ],
  totalPagesFound: 5,
  totalPagesScraped: 3
}
```

### 3. API Route Layer (`app/api/sites/generate/route.ts`)

#### Graceful Degradation: Scraping Failure → Prompt-Only Mode

**Location**: Lines 230-302

**Implementation**:
- Scraping is wrapped in try-catch
- On scraping failure:
  - Error is logged with `logSecurityEvent()`
  - Job status is reset to 'pending'
  - Generation continues WITHOUT scraped context
  - User receives site based on prompt only

**Error logging**:
```typescript
logSecurityEvent('website_scraping_failed', {
  userId: user.id,
  requestId,
  jobId: job.id,
  websiteUrl: businessInfo.basedOnWebsite,
  error: errorInfo.message,
});
```

**Fallback behavior**:
- `scrapedContext` remains `undefined`
- Background processor receives `undefined` context
- LLM generates site based solely on business prompt

#### User Feedback via Job Metadata

**Location**: Lines 235-239, 276-280

**Implementation**:
- Job status updated to 'processing' during scraping (progress: 5%)
- Job status reset to 'pending' before background processing (progress: 0%)
- Users can monitor progress via `/api/sites/generate/[jobId]`

**Status progression**:
1. `pending` (0%) - Job created
2. `processing` (5%) - Scraping website
3. `pending` (0%) - Scraping complete/failed, queued for LLM
4. `processing` (10-90%) - LLM generation and site creation
5. `completed` (100%) - Success
6. `failed` - Error with details

### 4. Background Processor Layer (`src/lib/jobs/background-processor.ts`)

#### LLM Generation Failure Handling

**Location**: Lines 107-137

**Implementation**:
- Try-catch around LLM API calls
- On failure:
  - Update job status to 'failed'
  - Record error code: `LLM_API_FAILURE`
  - Log security event
  - Return processing result with error details

**Cost tracking**:
- LLM costs tracked even on failure
- Helps monitor budget even when generation fails

#### Content Moderation Failure Handling

**Location**: Lines 147-173

**Implementation**:
- Generated content checked for safety violations
- On moderation failure:
  - Update job status to 'failed'
  - Record error code: `CONTENT_MODERATION_FAILED`
  - Record violations list
  - Track LLM costs (still charged for generation)
  - Log security event

**Safety checks**:
- Profanity detection
- Malicious content detection
- Code injection attempts
- XSS patterns

#### Site Creation Failure Handling

**Location**: Lines 186-223

**Implementation**:
- Try-catch around database operations
- On failure:
  - Update job status to 'failed'
  - Record error code: `SITE_CREATION_FAILED`
  - Track LLM costs (already incurred)
  - Log security event

**Note**: LLM content was successfully generated and moderated, but database insertion failed.

#### Top-Level Error Handler

**Location**: Lines 266-287

**Implementation**:
- Catches unexpected errors not handled by specific handlers
- Attempts to update job with error status
- Even handles errors during error reporting
- Returns processing result with 'INTERNAL_ERROR' code

## Error Scenarios Handled

### 1. Network Errors

| Scenario | Handler | Behavior |
|----------|---------|----------|
| Scraping service unreachable | Scraping Client | Retry with backoff (up to 2 retries) |
| Request timeout | Scraping Client | AbortController terminates request, retry |
| DNS resolution failure | Scraping Client | Retry with backoff |

### 2. Invalid Input Errors

| Scenario | Handler | Behavior |
|----------|---------|----------|
| Invalid URL format | Scraping Client | Immediate failure, no retry |
| Localhost/internal IP | Scraping Client | Immediate failure, security event logged |
| Non-HTTP/HTTPS protocol | Scraping Client | Immediate failure |

### 3. Service Errors

| Scenario | Handler | Behavior |
|----------|---------|----------|
| Scraping service 5xx error | Scraping Client | Retry with backoff |
| Scraping service 4xx error | Scraping Client | Record error, continue with other pages |
| LLM API failure | Background Processor | Fail job, log error, track costs |
| Database connection error | Background Processor | Fail job, log error |

### 4. Partial Failures

| Scenario | Handler | Behavior |
|----------|---------|----------|
| Homepage scrapes, secondary pages fail | Page Discovery | Continue with homepage only |
| Some secondary pages fail | Page Discovery | Continue with successful pages |
| All scraping fails | API Route | Fall back to prompt-only generation |
| Scraping succeeds, LLM fails | Background Processor | Fail job, log error |

### 5. Content Safety Errors

| Scenario | Handler | Behavior |
|----------|---------|----------|
| Generated content violates policy | Background Processor | Fail job, log violations, track costs |
| Scraped content contains malicious code | Content Analyzer | Strip dangerous content, continue |

## Configuration

### Environment Variables

```env
# Scraping Configuration
SCRAPING_SERVICE_URL=https://scraper.example.com
SCRAPING_SERVICE_SALT=random-secure-salt
SCRAPING_SERVICE_TIMEOUT=30000
SCRAPING_SERVICE_MAX_RETRIES=2
```

### Hardcoded Limits

```typescript
// src/lib/config/scraping.ts
maxPagesPerSite: 5          // Maximum pages to scrape per website
concurrency: 3               // Parallel scraping requests

// Timeout buffers
AbortController timeout: timeout + 5000ms  // 5-second buffer
```

## Resilience Patterns

### 1. Circuit Breaker Pattern (Partial)

While not a full circuit breaker, the system implements:
- Maximum retry limits to prevent infinite loops
- Timeout protection to prevent hanging requests
- Isolation of failures (one page failure doesn't stop others)

### 2. Graceful Degradation

**Primary Mode**: Scraping + LLM
- Scrape website for context
- Extract business info
- Generate site with rich context

**Fallback Mode**: Prompt-only LLM
- Use business description only
- Generate generic site structure
- Still produce usable output

### 3. Error Isolation

**Batch Processing**:
- `Promise.allSettled()` ensures one failure doesn't crash batch
- Each URL processed independently
- Results aggregated with success/failure status

**Multi-stage Pipeline**:
- Scraping failure doesn't prevent LLM generation
- LLM failure doesn't affect already-scraped data
- Each stage has independent error handling

### 4. Fail-Fast for Critical Errors

**Immediate failures**:
- Invalid URLs (security risk)
- Authentication failures
- Authorization violations
- Rate limit exceeded

**Retried failures**:
- Network timeouts
- Temporary service unavailability
- Transient connection issues

## Monitoring & Logging

### Security Events Logged

```typescript
// Scraping failures
logSecurityEvent('website_scraping_failed', {
  userId, requestId, jobId, websiteUrl, error
});

// Generation failures
logSecurityEvent('generation_failed', {
  userId, jobId, error, errorCode
});

// Content moderation failures
logSecurityEvent('content_moderation_failed', {
  userId, jobId, violations
});
```

### Console Logging Pattern

All logs include request/job ID for traceability:
```typescript
console.log(`[${requestId}] Scraping website: ${url}`);
console.error(`[Job ${jobId}] LLM generation failed: ${error}`);
```

## Best Practices

### 1. Always Use Try-Catch

All external API calls wrapped in try-catch:
- Scraping service calls
- LLM API calls
- Database operations

### 2. Provide Detailed Error Messages

Error messages include:
- What operation failed
- Why it failed (error message)
- Context (URL, job ID, user ID)

### 3. Track Costs Even on Failure

LLM costs tracked even when:
- Content moderation fails
- Site creation fails
- Unexpected errors occur

### 4. Never Fail Silently

All errors:
- Logged to console
- Logged as security events
- Recorded in job metadata
- Returned to user

### 5. Fail Fast for Security Issues

No retry or graceful degradation for:
- SSRF attempts (localhost URLs)
- Invalid authentication
- Budget violations
- Rate limit violations

## Testing Error Scenarios

### Manual Testing

```bash
# Test invalid URL
curl -X POST /api/sites/generate \
  -d '{"prompt": "...", "basedOnWebsite": "http://localhost:3000"}'
# Expected: 400 Bad Request (immediate failure)

# Test unreachable URL
curl -X POST /api/sites/generate \
  -d '{"prompt": "...", "basedOnWebsite": "https://nonexistent.invalid"}'
# Expected: 202 Accepted, job fails during scraping, falls back to prompt-only

# Test timeout (mock slow server)
curl -X POST /api/sites/generate \
  -d '{"prompt": "...", "basedOnWebsite": "https://httpbin.org/delay/60"}'
# Expected: Timeout after 30s + buffer, retry 2x, then fallback
```

### Unit Testing

```typescript
// Test retry logic
test('scrapeUrl retries on network failure', async () => {
  // Mock: fail 2x, succeed 3rd time
  // Assert: 3 requests made, final success
});

// Test graceful degradation
test('generation continues without scraped context on scraping failure', async () => {
  // Mock: scraping fails
  // Assert: LLM called with undefined context
  // Assert: site still generated
});

// Test error isolation
test('secondary page failures do not stop homepage scraping', async () => {
  // Mock: homepage succeeds, 2/3 secondary pages fail
  // Assert: homepage + 1 secondary page returned
  // Assert: 2 errors recorded
});
```

## Gap Analysis

### Current Gaps

1. **No Circuit Breaker**: System doesn't track failure rates over time
   - Could add: Stop scraping after N consecutive failures
   - Could add: Temporarily disable scraping service if degraded

2. **No Retry Queue**: Failed jobs can't be retried manually
   - Could add: Retry endpoint for failed jobs
   - Could add: Automatic retry after delay for transient failures

3. **Limited Timeout Customization**: Timeout hardcoded per environment
   - Could add: Per-request timeout based on expected complexity
   - Could add: Adaptive timeouts based on historical data

4. **No Partial Success Notification**: User not informed when some pages fail
   - Could add: Warning in job metadata: "3/5 pages scraped successfully"
   - Could add: Detailed scraping report in job results

### Recommended Improvements

1. **Add Health Check Endpoint**
   ```typescript
   GET /api/scraping/health
   // Returns: scraping service status, recent failure rate
   ```

2. **Implement Job Retry**
   ```typescript
   POST /api/sites/generate/{jobId}/retry
   // Retries failed job with same parameters
   ```

3. **Add Scraping Report to Job Metadata**
   ```typescript
   {
     jobId: "...",
     scrapingReport: {
       attempted: 5,
       successful: 3,
       failed: 2,
       errors: [...]
     }
   }
   ```

4. **Implement Circuit Breaker**
   ```typescript
   // Track failure rate over sliding window
   // If >50% failures in last 10 minutes, open circuit
   // Temporarily disable scraping, use prompt-only mode
   ```

## Conclusion

The website-based site generation system implements comprehensive error handling across all layers:

1. **Scraping Client**: Retry logic, timeout protection, error isolation
2. **Page Discovery**: Graceful degradation for secondary page failures
3. **API Route**: Fallback to prompt-only mode on scraping failures
4. **Background Processor**: Detailed error handling for each pipeline stage

The system prioritizes **graceful degradation** over complete failure, ensuring users receive a generated site even when external dependencies fail. All errors are logged, tracked, and reported to users for transparency.

**Key Resilience Features**:
- Exponential backoff retries
- Timeout protection
- Error isolation in batch processing
- Graceful degradation to prompt-only mode
- Comprehensive logging and monitoring
- Cost tracking even on failures

**Security Features**:
- SSRF protection (blocks localhost/internal IPs)
- Content moderation on generated output
- Input validation and sanitization
- Security event logging
