/**
 * Rate limiting utilities for API routes
 * Provides in-memory rate limiting with sliding window algorithm
 */

import { NextRequest } from 'next/server';
import { handleError } from '@/src/lib/types/error-handling';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  requests: number[];
  windowStart: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * In-memory store for rate limiting
 * In production, you might want to use Redis or another distributed store
 */
class MemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.store.forEach((entry, key) => {
      // Remove entries that are older than 1 hour
      if (now - entry.windowStart > 60 * 60 * 1000) {
        expiredKeys.push(key);
      }
    });

    for (const key of expiredKeys) {
      this.store.delete(key);
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Global store instance
const globalStore = new MemoryRateLimitStore();

/**
 * Default key generator using IP address and user ID
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get IP from various headers (for reverse proxy scenarios)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Try to get user ID from authorization header or other means
  const auth = request.headers.get('authorization');
  let userId = 'anonymous';
  
  if (auth) {
    try {
      // This is a simplified extraction - in reality you'd decode the JWT
      const base64 = auth.replace('Bearer ', '').split('.')[1];
      if (base64) {
        const decoded = JSON.parse(atob(base64));
        userId = decoded.sub || decoded.userId || 'authenticated';
      }
    } catch {
      // Ignore JWT decode errors
      userId = 'authenticated';
    }
  }
  
  return `${ip}:${userId}`;
}

/**
 * Apply rate limiting to a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  store: MemoryRateLimitStore = globalStore
): RateLimitResult {
  try {
    const key = config.keyGenerator ? config.keyGenerator(request) : defaultKeyGenerator(request);
    const now = Date.now();
    const windowMs = config.windowMs;
    const maxRequests = config.maxRequests;

    // Get or create entry for this key
    let entry = store.get(key);
    
    if (!entry) {
      entry = {
        requests: [],
        windowStart: now,
      };
    }

    // Clean up old requests outside the current window
    const windowStart = now - windowMs;
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

    // Check if limit is exceeded
    const currentRequests = entry.requests.length;
    const allowed = currentRequests < maxRequests;

    // Add current request if allowed
    if (allowed) {
      entry.requests.push(now);
    }

    // Update entry in store
    store.set(key, entry);

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, maxRequests - entry.requests.length);
    const oldestRequest = entry.requests[0];
    const resetTime = oldestRequest ? oldestRequest + windowMs : now + windowMs;

    const result: RateLimitResult = {
      allowed,
      limit: maxRequests,
      remaining,
      resetTime,
    };

    // Add retry-after header if limit exceeded
    if (!allowed) {
      result.retryAfter = Math.ceil((resetTime - now) / 1000);
    }

    return result;
  } catch (error) {
    const handled = handleError(error);
    console.error('Rate limiting error:', handled.message);
    
    // If rate limiting fails, allow the request but log the error
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

/**
 * Create a rate limiter middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (request: NextRequest) => checkRateLimit(request, config);
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // File uploads: 100 uploads per hour
  fileUpload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  }),

  // API calls: 1000 requests per hour
  api: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  }),

  // Strict: 10 requests per minute
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // Auth attempts: 5 attempts per 15 minutes
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // Presigned URL generation: 50 per hour per user
  presignedUrl: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  }),
};

/**
 * Utility to add rate limit headers to response
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
}

/**
 * Check if request is from authenticated user
 */
export function isAuthenticatedRequest(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  
  return !!(auth?.startsWith('Bearer ') || cookie?.includes('auth'));
}

/**
 * Generate user-specific rate limit key
 */
export function generateUserKey(request: NextRequest, prefix: string = ''): string {
  const auth = request.headers.get('authorization');
  let userId = 'anonymous';
  
  if (auth) {
    try {
      const base64 = auth.replace('Bearer ', '').split('.')[1];
      if (base64) {
        const decoded = JSON.parse(atob(base64));
        userId = decoded.sub || decoded.userId || 'authenticated';
      }
    } catch {
      userId = 'authenticated';
    }
  }
  
  return prefix ? `${prefix}:${userId}` : userId;
}

/**
 * Export store for testing and advanced use cases
 */
export { globalStore as rateLimitStore };

/**
 * Reset rate limit for a specific key (useful for testing)
 */
export function resetRateLimit(key: string, store: MemoryRateLimitStore = globalStore): void {
  store.delete(key);
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(
  key: string, 
  config: RateLimitConfig,
  store: MemoryRateLimitStore = globalStore
): RateLimitResult | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  const windowMs = config.windowMs;
  const maxRequests = config.maxRequests;
  
  // Clean up old requests
  const windowStart = now - windowMs;
  const activeRequests = entry.requests.filter(timestamp => timestamp > windowStart);
  
  const remaining = Math.max(0, maxRequests - activeRequests.length);
  const oldestRequest = activeRequests[0];
  const resetTime = oldestRequest ? oldestRequest + windowMs : now + windowMs;
  
  return {
    allowed: activeRequests.length < maxRequests,
    limit: maxRequests,
    remaining,
    resetTime,
  };
}