# Image Upload Bug Fix

## Bug Summary
The image upload flow fails silently when the API returns `success=true` but `data` is null/undefined, causing a TypeError when trying to access `result.data.uploadUrl`.

## Root Cause
In `src/lib/storage/s3-upload.ts`, the `getPresignedUploadUrl` function attempts to access `result.data` properties without first validating that `data` exists, even when `result.success` is true.

## Critical Fix Required

### File: `src/lib/storage/s3-upload.ts`

Replace lines 242-287 with proper validation:

```typescript
// After parsing JSON response (line 241)
console.log('[S3 Upload] Parsed API response:', {
  success: result?.success,
  hasData: !!result?.data,
  dataKeys: result?.data ? Object.keys(result.data) : [],
});

// Check for API error first
if (!result || typeof result !== 'object') {
  console.error('[S3 Upload] Invalid response object:', typeof result);
  throw new Error('Invalid response from presigned URL API: not an object');
}

if (!result.success) {
  console.error('[S3 Upload] API returned success=false:', {
    error: result.error,
    code: result.code,
  });
  throw new Error(result.error || 'Presigned URL API returned an error');
}

// Validate that we have data object when success=true
if (!result.data || typeof result.data !== 'object') {
  console.error('[S3 Upload] API returned success=true but no data:', {
    fullResponse: JSON.stringify(result),
  });
  throw new Error('Invalid response: success=true but missing data object');
}

// Validate required fields in the data object
const requiredFields = ['uploadUrl', 'publicUrl'];
const missingFields = requiredFields.filter(field => !result.data[field]);

if (missingFields.length > 0) {
  console.error('[S3 Upload] Missing required fields in data:', {
    missingFields,
    receivedFields: Object.keys(result.data),
    data: result.data,
  });
  throw new Error(`Invalid response: missing required fields: ${missingFields.join(', ')}`);
}

// Successfully validated response - return formatted data
console.log('[S3 Upload] Response validation successful');
return {
  success: true,
  data: {
    uploadUrl: result.data.uploadUrl,
    fields: result.data.fields || {},
    url: result.data.publicUrl,  // Map publicUrl to url for compatibility
    cdnUrl: result.data.cdnUrl,
  },
};
```

## Additional Improvements

### 1. Add Response Type Validation

Create a type guard for runtime validation:

```typescript
interface PresignedUrlApiResponse {
  success: boolean;
  data?: {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
    maxFileSize: number;
  };
  error?: string;
  code?: string;
}

function isValidPresignedUrlResponse(response: unknown): response is PresignedUrlApiResponse {
  if (!response || typeof response !== 'object') return false;
  const res = response as any;

  if (typeof res.success !== 'boolean') return false;

  if (res.success && res.data) {
    return typeof res.data.uploadUrl === 'string' &&
           typeof res.data.publicUrl === 'string';
  }

  return !res.success && typeof res.error === 'string';
}
```

### 2. Add Retry Logic

For transient failures, add exponential backoff:

```typescript
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    // ... existing request logic ...

    if (response.ok && isValidPresignedUrlResponse(result)) {
      return formatResponse(result);
    }

    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    throw new Error('Invalid response after all retries');
  } catch (error) {
    if (attempt === MAX_RETRIES) throw error;
  }
}
```

### 3. Enhanced Error Logging

Add structured logging for better debugging:

```typescript
function logUploadError(context: string, error: unknown, metadata: Record<string, unknown>) {
  console.error(`[S3 Upload] ${context}`, {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : String(error),
    metadata,
  });
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
describe('getPresignedUploadUrl', () => {
  it('should handle success response with valid data', async () => {
    // Mock successful response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          uploadUrl: 'https://s3.example.com/upload',
          publicUrl: '/api/images/test.jpg',
          key: 'site/images/test.jpg',
          expiresIn: 300,
          maxFileSize: 5242880,
        },
      }),
    });

    const result = await getPresignedUploadUrl(config);
    expect(result.success).toBe(true);
    expect(result.data?.uploadUrl).toBeDefined();
  });

  it('should handle success=true with missing data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        // data is missing
      }),
    });

    const result = await getPresignedUploadUrl(config);
    expect(result.success).toBe(false);
    expect(result.error).toContain('missing data');
  });

  it('should handle success=false properly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Storage not configured',
        code: 'STORAGE_ERROR',
      }),
    });

    const result = await getPresignedUploadUrl(config);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Storage not configured');
  });
});
```

### 2. Integration Tests

```typescript
describe('Image Upload Flow Integration', () => {
  it('should upload logo successfully', async () => {
    const logoUrl = 'https://example.com/logo.png';
    const result = await downloadAndUploadLogo(logoUrl, 'test-site', 'test-user');

    expect(result).not.toBeNull();
    expect(result).toMatch(/^\/api\/images\//);
  });

  it('should handle upload failures gracefully', async () => {
    // Mock network failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await downloadAndUploadLogo('https://example.com/logo.png', 'test-site', 'test-user');

    expect(result).toBeNull(); // Should return null on failure
  });
});
```

### 3. E2E Testing Checklist

- [ ] Test successful logo upload through UI
- [ ] Test successful hero image upload through UI
- [ ] Test network failure handling (disconnect network)
- [ ] Test API rate limiting (rapid requests)
- [ ] Test large file uploads (>5MB)
- [ ] Test invalid file types
- [ ] Test missing authentication
- [ ] Monitor error logs during tests

## Monitoring & Alerting

Add monitoring for upload failures:

```typescript
// Track upload metrics
interface UploadMetrics {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  errorTypes: Record<string, number>;
}

// Log to monitoring service
function trackUploadMetric(event: 'success' | 'failure', metadata: Record<string, unknown>) {
  // Send to DataDog, Sentry, or similar
  console.log('[Metrics]', { event, ...metadata });
}
```

## Rollback Plan

If issues persist after deployment:

1. **Immediate**: Revert to previous version of `s3-upload.ts`
2. **Temporary**: Disable image uploads in UI with feature flag
3. **Fallback**: Use direct Supabase storage instead of S3

## Implementation Checklist

- [ ] Apply the critical fix to `s3-upload.ts`
- [ ] Add response validation type guard
- [ ] Implement retry logic with exponential backoff
- [ ] Add comprehensive error logging
- [ ] Write unit tests for edge cases
- [ ] Test in staging environment
- [ ] Monitor error rates after deployment
- [ ] Document the fix in team knowledge base

## Prevention Measures

1. **Type Safety**: Always validate API responses at runtime
2. **Contract Testing**: Add contract tests between frontend and API
3. **Error Boundaries**: Implement error boundaries in React components
4. **Monitoring**: Set up alerts for upload failure rates > 1%
5. **Code Review**: Require explicit null checks in PR reviews