/**
 * Fixed S3 Upload utilities with comprehensive error handling
 * This file contains the corrected getPresignedUploadUrl function
 */

import { handleError } from '@/src/lib/types/error-handling';

/**
 * Presigned URL configuration
 */
export interface PresignedUrlConfig {
  key: string;
  fileName: string;
  siteId: string;
  productId?: string;
  contentType: string;
  contentLength: number;
  expires?: number;
  metadata?: Record<string, string>;
}

/**
 * Response type with proper validation
 */
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

/**
 * Validates the API response structure at runtime
 */
function validatePresignedUrlResponse(
  response: unknown
): response is PresignedUrlApiResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const res = response as Record<string, unknown>;

  // Must have success field
  if (typeof res.success !== 'boolean') {
    return false;
  }

  // If success is false, must have error
  if (!res.success) {
    return typeof res.error === 'string';
  }

  // If success is true, must have valid data
  if (!res.data || typeof res.data !== 'object') {
    return false;
  }

  const data = res.data as Record<string, unknown>;

  // Validate required data fields
  return (
    typeof data.uploadUrl === 'string' &&
    typeof data.publicUrl === 'string' &&
    typeof data.key === 'string' &&
    typeof data.expiresIn === 'number' &&
    typeof data.maxFileSize === 'number'
  );
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Enhanced getPresignedUploadUrl with comprehensive error handling
 */
export async function getPresignedUploadUrl(
  config: PresignedUrlConfig,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{
  success: boolean;
  data?: {
    uploadUrl: string;
    fields: Record<string, string>;
    url: string;
    cdnUrl?: string;
  };
  error?: string;
}> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const requestBody = {
        fileName: config.fileName,
        key: config.key,
        contentType: config.contentType,
        fileSize: config.contentLength,
        siteId: config.siteId,
        productId: config.productId,
        metadata: config.metadata,
      };

      console.log(`[S3 Upload] Requesting presigned URL (attempt ${attempt}/${retryConfig.maxAttempts}):`, {
        fileName: requestBody.fileName,
        key: requestBody.key,
        fileSize: requestBody.fileSize,
        contentType: requestBody.contentType,
        siteId: requestBody.siteId,
      });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check HTTP status
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          const error = new Error(
            `HTTP ${response.status}: ${response.statusText}. Body: ${errorText.substring(0, 200)}`
          );
          console.error(`[S3 Upload] Presigned URL API HTTP error (attempt ${attempt}):`, error.message);

          // Don't retry on 4xx errors (except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }

          lastError = error;

          // For 429 or 5xx, retry with backoff
          if (attempt < retryConfig.maxAttempts) {
            const delay = calculateBackoffDelay(attempt, retryConfig);
            console.log(`[S3 Upload] Retrying after ${delay}ms...`);
            await sleep(delay);
            continue;
          }

          throw error;
        }

        // Parse JSON response with proper error handling
        let result: unknown;
        const responseText = await response.text();

        try {
          result = JSON.parse(responseText);
        } catch (jsonError) {
          console.error(`[S3 Upload] Failed to parse JSON response (attempt ${attempt}):`, {
            status: response.status,
            contentType: response.headers.get('content-type'),
            bodyPreview: responseText.substring(0, 500),
            jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
          });

          const error = new Error(
            `Invalid JSON response from API. Status: ${response.status}, Body preview: ${responseText.substring(0, 100)}`
          );

          if (attempt < retryConfig.maxAttempts) {
            lastError = error;
            const delay = calculateBackoffDelay(attempt, retryConfig);
            console.log(`[S3 Upload] Retrying after ${delay}ms...`);
            await sleep(delay);
            continue;
          }

          throw error;
        }

        // Validate response structure
        if (!validatePresignedUrlResponse(result)) {
          console.error(`[S3 Upload] Invalid response structure (attempt ${attempt}):`, {
            response: result,
            responseType: typeof result,
            hasSuccess: result && typeof result === 'object' && 'success' in result,
            hasData: result && typeof result === 'object' && 'data' in result,
          });

          const error = new Error(
            'Invalid response structure from presigned URL API. Check server logs for details.'
          );

          if (attempt < retryConfig.maxAttempts) {
            lastError = error;
            const delay = calculateBackoffDelay(attempt, retryConfig);
            console.log(`[S3 Upload] Retrying after ${delay}ms...`);
            await sleep(delay);
            continue;
          }

          throw error;
        }

        // Handle API-level errors
        if (!result.success) {
          const errorMessage = result.error || 'Unknown error from presigned URL API';
          console.error(`[S3 Upload] API returned error (attempt ${attempt}):`, {
            error: errorMessage,
            code: result.code,
          });

          // Don't retry on certain error codes
          const nonRetryableCodes = ['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'];
          if (result.code && nonRetryableCodes.includes(result.code)) {
            throw new Error(errorMessage);
          }

          const error = new Error(errorMessage);

          if (attempt < retryConfig.maxAttempts) {
            lastError = error;
            const delay = calculateBackoffDelay(attempt, retryConfig);
            console.log(`[S3 Upload] Retrying after ${delay}ms...`);
            await sleep(delay);
            continue;
          }

          throw error;
        }

        // Success! Transform and return the data
        console.log(`[S3 Upload] Successfully obtained presigned URL (attempt ${attempt})`);

        return {
          success: true,
          data: {
            uploadUrl: result.data!.uploadUrl,
            fields: {}, // Empty for PUT-based presigned URLs
            url: result.data!.publicUrl, // Map publicUrl to url for backward compatibility
            cdnUrl: undefined, // CDN URL is handled separately if needed
          },
        };

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            const error = new Error('Request timeout after 30 seconds');
            console.error(`[S3 Upload] Request timeout (attempt ${attempt})`);

            if (attempt < retryConfig.maxAttempts) {
              lastError = error;
              const delay = calculateBackoffDelay(attempt, retryConfig);
              console.log(`[S3 Upload] Retrying after ${delay}ms...`);
              await sleep(delay);
              continue;
            }

            throw error;
          }
        }

        throw fetchError;
      }

    } catch (error) {
      // If this was the last attempt, return the error
      if (attempt === retryConfig.maxAttempts) {
        const handled = handleError(error);
        console.error(`[S3 Upload] All retry attempts exhausted:`, {
          message: handled.message,
          details: handled.details,
          attempts: retryConfig.maxAttempts,
        });

        return {
          success: false,
          error: `Failed to get presigned upload URL after ${retryConfig.maxAttempts} attempts: ${handled.message}`,
        };
      }

      // Otherwise, the retry will continue
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // Should never reach here, but for completeness
  const finalError = lastError || new Error('Unknown error in presigned URL generation');
  return {
    success: false,
    error: finalError.message,
  };
}

/**
 * Upload to S3 with retry logic
 */
export async function uploadToS3WithRetry(
  file: File | Buffer,
  uploadUrl: string,
  contentType: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ success: boolean; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      console.log(`[S3 Upload] Uploading to S3 (attempt ${attempt}/${retryConfig.maxAttempts})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for uploads

      try {
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(
            `S3 upload failed: ${response.status} ${response.statusText}`
          );

          // Don't retry on 4xx errors
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }

          if (attempt < retryConfig.maxAttempts) {
            lastError = error;
            const delay = calculateBackoffDelay(attempt, retryConfig);
            console.log(`[S3 Upload] Retrying S3 upload after ${delay}ms...`);
            await sleep(delay);
            continue;
          }

          throw error;
        }

        console.log(`[S3 Upload] Successfully uploaded to S3 (attempt ${attempt})`);
        return { success: true };

      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const error = new Error('S3 upload timeout after 60 seconds');

          if (attempt < retryConfig.maxAttempts) {
            lastError = error;
            const delay = calculateBackoffDelay(attempt, retryConfig);
            console.log(`[S3 Upload] Retrying S3 upload after timeout, delay: ${delay}ms...`);
            await sleep(delay);
            continue;
          }

          throw error;
        }

        throw fetchError;
      }

    } catch (error) {
      if (attempt === retryConfig.maxAttempts) {
        const handled = handleError(error);
        return {
          success: false,
          error: `S3 upload failed after ${retryConfig.maxAttempts} attempts: ${handled.message}`,
        };
      }

      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  const finalError = lastError || new Error('Unknown error in S3 upload');
  return {
    success: false,
    error: finalError.message,
  };
}