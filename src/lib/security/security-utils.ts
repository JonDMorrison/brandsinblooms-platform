/**
 * Security Utilities Module
 *
 * Provides general security utilities for the LLM site generator:
 * - Secure ID generation
 * - Job ownership validation
 * - Security event logging
 * - Common security checks
 *
 * These utilities complement the other security modules and provide
 * foundational security operations.
 */

import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';
import { randomBytes, randomUUID } from 'crypto';

/**
 * Security event types for logging
 */
export type SecurityEventType =
  | 'rate_limit_exceeded'
  | 'budget_exceeded'
  | 'invalid_input'
  | 'content_moderation_failed'
  | 'unauthorized_access'
  | 'prompt_injection_attempt'
  | 'xss_attempt'
  | 'suspicious_activity'
  | 'job_ownership_violation'
  | 'generation_unauthorized_attempt'
  | 'generation_rate_limited'
  | 'generation_budget_exceeded'
  | 'platform_budget_exceeded'
  | 'generation_job_created'
  | 'generation_failed'
  | 'site_generated'
  | 'site_creation_failed'
  | 'generation_error';

/**
 * Security event details
 */
export interface SecurityEvent {
  /** Type of security event */
  type: SecurityEventType;
  /** User ID (if applicable) */
  userId?: string;
  /** Job ID (if applicable) */
  jobId?: string;
  /** Request IP address */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Additional event details */
  details: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Generates a cryptographically secure random job ID
 *
 * Uses crypto.randomUUID() which provides 122 bits of entropy.
 * This prevents predictable job IDs that could be exploited.
 *
 * @returns Secure UUID v4 string
 *
 * @example
 * ```ts
 * const jobId = generateSecureJobId();
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateSecureJobId(): string {
  return randomUUID();
}

/**
 * Generates a cryptographically secure random token
 *
 * Useful for API keys, verification tokens, etc.
 *
 * @param length - Length in bytes (default 32)
 * @returns Hex-encoded random token
 *
 * @example
 * ```ts
 * const apiKey = generateSecureToken(32);
 * // Returns 64-character hex string
 * ```
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Validates that a user owns a specific job
 *
 * Critical security check to prevent unauthorized access to job data.
 * Always call this before allowing operations on a job.
 *
 * @param jobId - Job ID to check
 * @param userId - User ID claiming ownership
 * @returns True if user owns the job, false otherwise
 *
 * @example
 * ```ts
 * if (!await validateJobOwnership(jobId, userId)) {
 *   return apiError('Unauthorized', 'UNAUTHORIZED', 403);
 * }
 *
 * // Safe to proceed with job operations
 * const job = await getJob(jobId);
 * ```
 */
export async function validateJobOwnership(jobId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_generation_jobs')
      .select('user_id')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Job not found
        return false;
      }
      console.error('Error validating job ownership:', handleError(error));
      return false;
    }

    // Check if the job belongs to the user
    return data.user_id === userId;
  } catch (error) {
    console.error('Error in validateJobOwnership:', handleError(error));
    return false;
  }
}

/**
 * Validates that a user is authenticated
 *
 * @param userId - User ID to validate
 * @returns True if user exists and is authenticated, false otherwise
 *
 * @example
 * ```ts
 * if (!await validateUserAuthentication(userId)) {
 *   return apiError('Authentication required', 'UNAUTHENTICATED', 401);
 * }
 * ```
 */
export async function validateUserAuthentication(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return user.id === userId;
  } catch (error) {
    console.error('Error validating authentication:', handleError(error));
    return false;
  }
}

/**
 * Logs a security event for monitoring and auditing
 *
 * Security events are logged to console with structured data.
 * In production, these should also be sent to a security monitoring service.
 *
 * @param event - Type of security event
 * @param details - Additional event details
 *
 * @example
 * ```ts
 * logSecurityEvent('rate_limit_exceeded', {
 *   userId,
 *   endpoint: '/api/site-generator',
 *   limit: 3,
 *   attempts: 5
 * });
 * ```
 */
export function logSecurityEvent(event: SecurityEventType, details: Record<string, unknown>): void {
  const securityEvent: SecurityEvent = {
    type: event,
    userId: details.userId as string | undefined,
    jobId: details.jobId as string | undefined,
    ipAddress: details.ipAddress as string | undefined,
    userAgent: details.userAgent as string | undefined,
    details,
    timestamp: new Date(),
  };

  // Log to console with structured format
  console.warn('[SECURITY EVENT]', JSON.stringify(securityEvent, null, 2));

  // TODO: In production, also send to security monitoring service
  // Examples: Sentry, DataDog, CloudWatch, etc.
  // await sendToMonitoringService(securityEvent);
}

/**
 * Logs multiple security events in batch
 *
 * @param events - Array of event type and details pairs
 *
 * @example
 * ```ts
 * logSecurityEvents([
 *   ['rate_limit_exceeded', { userId, endpoint: '/api/generate' }],
 *   ['invalid_input', { userId, field: 'prompt' }]
 * ]);
 * ```
 */
export function logSecurityEvents(
  events: Array<[SecurityEventType, Record<string, unknown>]>
): void {
  for (const [type, details] of events) {
    logSecurityEvent(type, details);
  }
}

/**
 * Extracts IP address from request headers
 *
 * Handles various proxy configurations (X-Forwarded-For, X-Real-IP, etc.)
 *
 * @param headers - Request headers
 * @returns IP address or 'unknown'
 *
 * @example
 * ```ts
 * const ip = getClientIp(request.headers);
 * logSecurityEvent('rate_limit_exceeded', { ipAddress: ip });
 * ```
 */
export function getClientIp(headers: Headers): string {
  // Try X-Forwarded-For (proxy/load balancer)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP if multiple
    return forwardedFor.split(',')[0].trim();
  }

  // Try X-Real-IP
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Try CF-Connecting-IP (Cloudflare)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }

  return 'unknown';
}

/**
 * Sanitizes user agent string
 *
 * Removes potentially malicious content from user agent.
 *
 * @param userAgent - Raw user agent string
 * @returns Sanitized user agent
 *
 * @example
 * ```ts
 * const ua = sanitizeUserAgent(request.headers.get('user-agent'));
 * ```
 */
export function sanitizeUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return 'unknown';
  }

  // Remove control characters and limit length
  const sanitized = userAgent
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 500);

  return sanitized || 'unknown';
}

/**
 * Checks if IP address is from a suspicious source
 *
 * Basic check - in production, integrate with threat intelligence services.
 *
 * @param ipAddress - IP address to check
 * @returns True if suspicious, false otherwise
 *
 * @example
 * ```ts
 * if (isSuspiciousIp(ip)) {
 *   logSecurityEvent('suspicious_activity', { ipAddress: ip });
 *   return apiError('Access denied', 'FORBIDDEN', 403);
 * }
 * ```
 */
export function isSuspiciousIp(ipAddress: string): boolean {
  if (ipAddress === 'unknown') {
    return true;
  }

  // Check for private/local IPs trying to access public endpoints
  const privatePatterns = [
    /^127\./,           // localhost
    /^10\./,            // private class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // private class B
    /^192\.168\./,      // private class C
    /^::1$/,            // IPv6 localhost
    /^fe80:/,           // IPv6 link-local
  ];

  for (const pattern of privatePatterns) {
    if (pattern.test(ipAddress)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates request origin against allowed origins
 *
 * @param origin - Request origin header
 * @param allowedOrigins - List of allowed origins
 * @returns True if origin is allowed, false otherwise
 *
 * @example
 * ```ts
 * const origin = request.headers.get('origin');
 * if (!validateOrigin(origin, ['https://app.example.com'])) {
 *   return apiError('Invalid origin', 'FORBIDDEN', 403);
 * }
 * ```
 */
export function validateOrigin(
  origin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!origin) {
    // No origin header - might be same-origin or direct API call
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Generates a content security fingerprint
 *
 * Creates a hash of content for duplicate detection and tracking.
 *
 * @param content - Content to fingerprint
 * @returns Base64-encoded fingerprint
 *
 * @example
 * ```ts
 * const fingerprint = generateContentFingerprint(userPrompt);
 * // Use to detect duplicate requests
 * ```
 */
export function generateContentFingerprint(content: string): string {
  // Simple hash using built-in tools
  // In production, consider using a proper hashing library
  const hash = Buffer.from(content).toString('base64').substring(0, 32);
  return hash;
}

/**
 * Rate limits a specific key with simple in-memory tracking
 *
 * Lightweight rate limiting for non-critical operations.
 *
 * @param key - Unique key to rate limit
 * @param maxAttempts - Maximum attempts
 * @param windowMs - Time window in milliseconds
 * @returns True if within limit, false if exceeded
 *
 * @example
 * ```ts
 * if (!checkSimpleRateLimit(`user:${userId}:verify`, 5, 60000)) {
 *   return apiError('Too many attempts', 'RATE_LIMITED', 429);
 * }
 * ```
 */
const simpleRateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkSimpleRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = simpleRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired
    simpleRateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Clears rate limit for a specific key (testing/admin use)
 *
 * @param key - Key to clear
 *
 * @example
 * ```ts
 * clearSimpleRateLimit(`user:${userId}:verify`);
 * ```
 */
export function clearSimpleRateLimit(key: string): void {
  simpleRateLimitStore.delete(key);
}

/**
 * Validates that a timestamp is recent (prevents replay attacks)
 *
 * @param timestamp - Timestamp to validate (ISO string or Date)
 * @param maxAgeMs - Maximum age in milliseconds (default 5 minutes)
 * @returns True if timestamp is recent, false otherwise
 *
 * @example
 * ```ts
 * if (!validateTimestamp(request.timestamp, 5 * 60 * 1000)) {
 *   logSecurityEvent('suspicious_activity', {
 *     reason: 'Stale timestamp',
 *     timestamp: request.timestamp
 *   });
 *   return apiError('Invalid request', 'BAD_REQUEST', 400);
 * }
 * ```
 */
export function validateTimestamp(
  timestamp: string | Date,
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  try {
    const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const age = now.getTime() - ts.getTime();

    // Check if timestamp is too old or in the future
    return age >= 0 && age <= maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Redacts sensitive information from objects for logging
 *
 * @param obj - Object to redact
 * @param sensitiveKeys - Keys to redact (default: common sensitive fields)
 * @returns Redacted object
 *
 * @example
 * ```ts
 * const safeLog = redactSensitiveData(errorDetails);
 * console.log(safeLog); // Sensitive fields replaced with '[REDACTED]'
 * ```
 */
export function redactSensitiveData(
  obj: Record<string, unknown>,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization']
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()));

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>, sensitiveKeys);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Validates UUID format
 *
 * @param uuid - String to validate as UUID
 * @returns True if valid UUID v4, false otherwise
 *
 * @example
 * ```ts
 * if (!isValidUUID(jobId)) {
 *   return apiError('Invalid job ID format', 'BAD_REQUEST', 400);
 * }
 * ```
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}