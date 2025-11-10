/**
 * Cloudflare Error Handling Utilities
 */

import type { CloudflareApiError, CloudflareApiResponse } from './types';
import { CloudflareError, RateLimitError } from './types';

/**
 * Parse Cloudflare API errors from response
 */
export function parseCloudflareErrors<T>(
  response: CloudflareApiResponse<T>
): CloudflareApiError[] {
  if (!response.errors || response.errors.length === 0) {
    return [];
  }
  return response.errors;
}

/**
 * Format Cloudflare errors into a readable message
 */
export function formatCloudflareErrors(errors: CloudflareApiError[]): string {
  if (errors.length === 0) {
    return 'Unknown error';
  }

  return errors
    .map((error) => {
      let message = error.message;
      if (error.code) {
        message = `[${error.code}] ${message}`;
      }
      if (error.error_chain && error.error_chain.length > 0) {
        const chainMessages = error.error_chain
          .map((e) => `  - ${e.message}`)
          .join('\n');
        message += '\n' + chainMessages;
      }
      return message;
    })
    .join('; ');
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Check if error is a Cloudflare error
 */
export function isCloudflareError(error: unknown): error is CloudflareError {
  return error instanceof CloudflareError;
}

/**
 * Create CloudflareError from HTTP response
 */
export async function createCloudflareErrorFromResponse(
  response: Response
): Promise<CloudflareError> {
  let errorMessage = `Cloudflare API error: ${response.status} ${response.statusText}`;
  let errors: CloudflareApiError[] = [];

  try {
    const data = await response.json() as CloudflareApiResponse<unknown>;
    if (data.errors && data.errors.length > 0) {
      errors = data.errors;
      errorMessage = formatCloudflareErrors(errors);
    } else if (data.messages && data.messages.length > 0) {
      errorMessage = data.messages.join('; ');
    }
  } catch {
    // If we can't parse JSON, use the status text
  }

  // Check for rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new RateLimitError(
      'Cloudflare API rate limit exceeded',
      retryAfter ? parseInt(retryAfter, 10) : undefined
    );
  }

  return new CloudflareError(
    errorMessage,
    errors[0]?.code,
    errors,
    response.status
  );
}

/**
 * Common Cloudflare error codes and their meanings
 */
export const CloudflareErrorCodes = {
  AUTHENTICATION_ERROR: 10000,
  FORBIDDEN: 9109,
  NOT_FOUND: 7003,
  INVALID_REQUEST: 1002,
  RATE_LIMITED: 10009,
  ZONE_NOT_FOUND: 1001,
  CUSTOM_HOSTNAME_EXISTS: 1414,
  CUSTOM_HOSTNAME_NOT_FOUND: 1413,
  WORKER_NOT_FOUND: 10007,
  WORKER_ROUTE_EXISTS: 10020,
  WORKER_ROUTE_NOT_FOUND: 10021,
} as const;

/**
 * Check if error is a specific Cloudflare error code
 */
export function isCloudflareErrorCode(
  error: unknown,
  code: number
): boolean {
  if (!isCloudflareError(error)) {
    return false;
  }
  return error.code === code ||
    error.errors?.some(e => e.code === code) === true;
}

/**
 * Check if error indicates resource already exists
 */
export function isAlreadyExistsError(error: unknown): boolean {
  return isCloudflareErrorCode(error, CloudflareErrorCodes.CUSTOM_HOSTNAME_EXISTS) ||
    isCloudflareErrorCode(error, CloudflareErrorCodes.WORKER_ROUTE_EXISTS);
}

/**
 * Check if error indicates resource not found
 */
export function isNotFoundError(error: unknown): boolean {
  return isCloudflareErrorCode(error, CloudflareErrorCodes.NOT_FOUND) ||
    isCloudflareErrorCode(error, CloudflareErrorCodes.CUSTOM_HOSTNAME_NOT_FOUND) ||
    isCloudflareErrorCode(error, CloudflareErrorCodes.WORKER_ROUTE_NOT_FOUND) ||
    isCloudflareErrorCode(error, CloudflareErrorCodes.ZONE_NOT_FOUND) ||
    isCloudflareErrorCode(error, CloudflareErrorCodes.WORKER_NOT_FOUND);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isRateLimitError(error)) {
    return true;
  }

  if (isCloudflareError(error)) {
    // Don't retry client errors (4xx) except rate limiting
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }
    // Retry server errors (5xx)
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }
  }

  // Retry network errors
  if (error instanceof Error) {
    const networkErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'EHOSTUNREACH',
      'EPIPE',
      'EAI_AGAIN'
    ];
    return networkErrors.some(code => error.message.includes(code));
  }

  return false;
}