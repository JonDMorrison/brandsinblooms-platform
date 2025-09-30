/**
 * Site Generation Rate Limiting Module
 *
 * Implements rate limiting specifically for LLM-powered site generation to:
 * - Prevent abuse and excessive API costs
 * - Enforce per-user generation limits (3 per hour as per plan)
 * - Track and enforce daily budgets
 * - Provide clear feedback on rate limit status
 *
 * This uses the existing rate-limiting infrastructure with custom configuration
 * for site generation workloads.
 */

import { NextRequest } from 'next/server';
import {
  createRateLimiter,
  checkRateLimit,
  RateLimitResult,
  rateLimitStore,
} from '@/lib/security/rate-limiting';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';

/**
 * Rate limit configuration for site generation
 * As per plan: 3 generations per hour per user
 */
const SITE_GENERATION_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
};

/**
 * Daily rate limit (additional safety net)
 * 10 generations per day per user
 */
const SITE_GENERATION_DAILY_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 10,
};

/**
 * Budget limits
 */
export const DAILY_PLATFORM_BUDGET_CENTS = 10000; // $100/day for entire platform
export const USER_HOURLY_BUDGET_CENTS = 1000;    // $10/hour per user

/**
 * Rate limiter instances
 */
const hourlyRateLimiter = createRateLimiter({
  ...SITE_GENERATION_RATE_LIMIT,
  keyGenerator: (request: NextRequest) => {
    // Extract user ID from request for user-specific rate limiting
    const userId = extractUserId(request);
    return `site-gen-hourly:${userId}`;
  },
});

const dailyRateLimiter = createRateLimiter({
  ...SITE_GENERATION_DAILY_LIMIT,
  keyGenerator: (request: NextRequest) => {
    const userId = extractUserId(request);
    return `site-gen-daily:${userId}`;
  },
});

/**
 * Extended rate limit result with budget information
 */
export interface GenerationRateLimitResult extends RateLimitResult {
  /** Whether within budget limits */
  withinBudget: boolean;
  /** Reason for rate limit (if not allowed) */
  reason?: string;
  /** User's estimated remaining budget (cents) */
  remainingBudget?: number;
}

/**
 * User generation budget status
 */
export interface UserGenerationBudget {
  /** Whether user is allowed to generate (within limits) */
  allowed: boolean;
  /** Remaining generations in current hour */
  remainingHourly: number;
  /** Remaining generations today */
  remainingDaily: number;
  /** User's total spend this hour (cents) */
  spentThisHour: number;
  /** User's total spend today (cents) */
  spentToday: number;
  /** Whether within budget limits */
  withinBudget: boolean;
  /** Time until hourly limit resets (seconds) */
  hourlyResetIn?: number;
  /** Time until daily limit resets (seconds) */
  dailyResetIn?: number;
}

/**
 * Extracts user ID from request
 *
 * @param request - NextRequest object
 * @returns User ID or 'anonymous' if not authenticated
 */
function extractUserId(request: NextRequest): string {
  const auth = request.headers.get('authorization');

  if (auth) {
    try {
      const base64 = auth.replace('Bearer ', '').split('.')[1];
      if (base64) {
        const decoded = JSON.parse(atob(base64));
        return decoded.sub || decoded.userId || 'authenticated';
      }
    } catch {
      return 'authenticated';
    }
  }

  return 'anonymous';
}

/**
 * Checks rate limits for site generation
 *
 * Enforces both hourly and daily limits, as well as budget constraints.
 *
 * @param userId - User ID to check limits for
 * @param request - NextRequest object for rate limiting
 * @returns Extended rate limit result with budget info
 *
 * @example
 * ```ts
 * const rateLimitResult = await checkGenerationRateLimit(userId, request);
 *
 * if (!rateLimitResult.allowed) {
 *   return apiError(
 *     `Rate limit exceeded: ${rateLimitResult.reason}`,
 *     'RATE_LIMIT_EXCEEDED',
 *     429
 *   );
 * }
 * ```
 */
export async function checkGenerationRateLimit(
  userId: string,
  request: NextRequest
): Promise<GenerationRateLimitResult> {
  // Check hourly rate limit
  const hourlyResult = hourlyRateLimiter(request);

  if (!hourlyResult.allowed) {
    return {
      ...hourlyResult,
      withinBudget: true, // Don't check budget if rate limited
      reason: `Hourly rate limit exceeded. You can generate ${SITE_GENERATION_RATE_LIMIT.maxRequests} sites per hour. Try again in ${hourlyResult.retryAfter || 0} seconds.`,
    };
  }

  // Check daily rate limit
  const dailyResult = dailyRateLimiter(request);

  if (!dailyResult.allowed) {
    return {
      ...dailyResult,
      withinBudget: true,
      reason: `Daily rate limit exceeded. You can generate ${SITE_GENERATION_DAILY_LIMIT.maxRequests} sites per day. Try again in ${dailyResult.retryAfter || 0} seconds.`,
    };
  }

  // Check budget constraints
  const budgetStatus = await checkUserGenerationBudget(userId);

  if (!budgetStatus.allowed || !budgetStatus.withinBudget) {
    return {
      ...hourlyResult,
      allowed: false,
      withinBudget: false,
      reason: 'Budget limit exceeded. Please try again later.',
      remainingBudget: USER_HOURLY_BUDGET_CENTS - budgetStatus.spentThisHour,
    };
  }

  // All checks passed
  return {
    ...hourlyResult,
    withinBudget: true,
    remainingBudget: USER_HOURLY_BUDGET_CENTS - budgetStatus.spentThisHour,
  };
}

/**
 * Checks if user is within generation budget limits
 *
 * Queries the database to calculate user's spending in the current hour
 * and validates against budget constraints.
 *
 * @param userId - User ID to check budget for
 * @returns Budget status with detailed information
 *
 * @example
 * ```ts
 * const budget = await checkUserGenerationBudget(userId);
 *
 * if (!budget.withinBudget) {
 *   console.log(`User has spent $${budget.spentThisHour / 100} this hour`);
 *   return apiError('Budget limit exceeded', 'BUDGET_EXCEEDED', 429);
 * }
 * ```
 */
export async function checkUserGenerationBudget(userId: string): Promise<UserGenerationBudget> {
  try {
    const supabase = await createClient();
    const now = new Date();

    // Calculate time windows
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query hourly costs
    const { data: hourlyJobs, error: hourlyError } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString());

    if (hourlyError) {
      console.error('Error fetching hourly jobs:', handleError(hourlyError));
      // Default to allowing if query fails (fail open)
      return {
        allowed: true,
        remainingHourly: SITE_GENERATION_RATE_LIMIT.maxRequests,
        remainingDaily: SITE_GENERATION_DAILY_LIMIT.maxRequests,
        spentThisHour: 0,
        spentToday: 0,
        withinBudget: true,
      };
    }

    // Query daily costs
    const { data: dailyJobs, error: dailyError } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo.toISOString());

    if (dailyError) {
      console.error('Error fetching daily jobs:', handleError(dailyError));
      return {
        allowed: true,
        remainingHourly: SITE_GENERATION_RATE_LIMIT.maxRequests,
        remainingDaily: SITE_GENERATION_DAILY_LIMIT.maxRequests,
        spentThisHour: 0,
        spentToday: 0,
        withinBudget: true,
      };
    }

    // Calculate total costs
    const spentThisHour = hourlyJobs?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
    const spentToday = dailyJobs?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;

    // Calculate remaining generations based on rate limits
    const remainingHourly = Math.max(0, SITE_GENERATION_RATE_LIMIT.maxRequests - (hourlyJobs?.length || 0));
    const remainingDaily = Math.max(0, SITE_GENERATION_DAILY_LIMIT.maxRequests - (dailyJobs?.length || 0));

    // Check budget constraints
    const withinBudget = spentThisHour < USER_HOURLY_BUDGET_CENTS;
    const allowed = remainingHourly > 0 && remainingDaily > 0 && withinBudget;

    return {
      allowed,
      remainingHourly,
      remainingDaily,
      spentThisHour,
      spentToday,
      withinBudget,
      hourlyResetIn: Math.ceil((oneHourAgo.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000),
      dailyResetIn: Math.ceil((oneDayAgo.getTime() + 24 * 60 * 60 * 1000 - now.getTime()) / 1000),
    };
  } catch (error) {
    console.error('Error checking user budget:', handleError(error));

    // Default to allowing if error occurs (fail open for better UX)
    return {
      allowed: true,
      remainingHourly: SITE_GENERATION_RATE_LIMIT.maxRequests,
      remainingDaily: SITE_GENERATION_DAILY_LIMIT.maxRequests,
      spentThisHour: 0,
      spentToday: 0,
      withinBudget: true,
    };
  }
}

/**
 * Gets current rate limit status for a user
 *
 * Useful for displaying rate limit information to users.
 *
 * @param userId - User ID to check
 * @returns Rate limit status information
 *
 * @example
 * ```ts
 * const status = await getUserRateLimitStatus(userId);
 * console.log(`You have ${status.remainingHourly} generations remaining this hour`);
 * ```
 */
export async function getUserRateLimitStatus(userId: string): Promise<UserGenerationBudget> {
  return checkUserGenerationBudget(userId);
}

/**
 * Resets rate limit for a specific user (admin function)
 *
 * Use with caution - this bypasses rate limiting.
 *
 * @param userId - User ID to reset limits for
 *
 * @example
 * ```ts
 * // Admin endpoint
 * await resetUserRateLimit(userId);
 * ```
 */
export async function resetUserRateLimit(userId: string): Promise<void> {
  const hourlyKey = `site-gen-hourly:${userId}`;
  const dailyKey = `site-gen-daily:${userId}`;

  rateLimitStore.delete(hourlyKey);
  rateLimitStore.delete(dailyKey);
}

/**
 * Checks platform-wide budget status (admin function)
 *
 * Ensures the entire platform hasn't exceeded daily budget limits.
 *
 * @returns Platform budget status
 *
 * @example
 * ```ts
 * const platformBudget = await checkPlatformBudget();
 * if (!platformBudget.withinBudget) {
 *   console.error('Platform daily budget exceeded!');
 *   // Disable new generations or alert admins
 * }
 * ```
 */
export async function checkPlatformBudget(): Promise<{
  withinBudget: boolean;
  spentToday: number;
  remainingBudget: number;
}> {
  try {
    const supabase = await createClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Query all jobs from the last 24 hours
    const { data: jobs, error } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .gte('created_at', oneDayAgo.toISOString());

    if (error) {
      console.error('Error fetching platform costs:', handleError(error));
      // Default to within budget if query fails
      return {
        withinBudget: true,
        spentToday: 0,
        remainingBudget: DAILY_PLATFORM_BUDGET_CENTS,
      };
    }

    const spentToday = jobs?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
    const remainingBudget = DAILY_PLATFORM_BUDGET_CENTS - spentToday;
    const withinBudget = remainingBudget > 0;

    return {
      withinBudget,
      spentToday,
      remainingBudget: Math.max(0, remainingBudget),
    };
  } catch (error) {
    console.error('Error checking platform budget:', handleError(error));

    return {
      withinBudget: true,
      spentToday: 0,
      remainingBudget: DAILY_PLATFORM_BUDGET_CENTS,
    };
  }
}

/**
 * Estimates the time until user can generate again
 *
 * @param userId - User ID
 * @returns Seconds until next generation is allowed, or 0 if available now
 *
 * @example
 * ```ts
 * const waitTime = await getTimeUntilNextGeneration(userId);
 * if (waitTime > 0) {
 *   return apiError(
 *     `Please wait ${waitTime} seconds before generating again`,
 *     'RATE_LIMITED',
 *     429
 *   );
 * }
 * ```
 */
export async function getTimeUntilNextGeneration(userId: string): Promise<number> {
  const budget = await checkUserGenerationBudget(userId);

  if (budget.allowed) {
    return 0;
  }

  // Return the shorter of hourly or daily reset times
  const hourlyReset = budget.hourlyResetIn || Number.MAX_SAFE_INTEGER;
  const dailyReset = budget.dailyResetIn || Number.MAX_SAFE_INTEGER;

  return Math.min(hourlyReset, dailyReset);
}