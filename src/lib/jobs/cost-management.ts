/**
 * Cost Management Module
 *
 * Tracks and manages costs for LLM-powered site generation:
 * - Records costs for each job
 * - Calculates user and platform spending
 * - Estimates costs before generation
 * - Enforces budget limits
 * - Provides cost analytics
 *
 * This module helps control expenses and provide transparency to users.
 */

import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';
import type { TokenUsage } from '@/lib/types/site-generation-jobs';

/**
 * Budget constants (in cents)
 */
export const DAILY_PLATFORM_BUDGET_CENTS = 10000; // $100/day platform-wide
export const USER_HOURLY_BUDGET_CENTS = 1000;    // $10/hour per user
export const USER_DAILY_BUDGET_CENTS = 5000;     // $50/day per user (safety net)

/**
 * Pricing constants for OpenAI GPT-4 (adjust based on actual provider/model)
 * Prices in cents per 1K tokens
 */
export const COST_PER_1K_INPUT_TOKENS = 3;    // $0.03 per 1K input tokens
export const COST_PER_1K_OUTPUT_TOKENS = 6;   // $0.06 per 1K output tokens

/**
 * Estimated token ranges for site generation
 */
const ESTIMATED_INPUT_TOKENS = 1500;   // Typical prompt size
const ESTIMATED_OUTPUT_TOKENS = 3000;  // Typical response size

/**
 * Cost period types
 */
export type CostPeriod = 'hour' | 'day' | 'week' | 'month';

/**
 * Cost summary for a period
 */
export interface CostSummary {
  /** Total cost in cents */
  totalCents: number;
  /** Number of jobs in period */
  jobCount: number;
  /** Average cost per job (cents) */
  avgCostCents: number;
  /** Total tokens used */
  totalTokens: number;
  /** Period start date */
  periodStart: Date;
  /** Period end date */
  periodEnd: Date;
}

/**
 * User cost statistics
 */
export interface UserCostStats {
  /** Total spent this hour (cents) */
  thisHour: number;
  /** Total spent today (cents) */
  today: number;
  /** Total spent this month (cents) */
  thisMonth: number;
  /** All-time total (cents) */
  allTime: number;
  /** Jobs this hour */
  jobsThisHour: number;
  /** Jobs today */
  jobsToday: number;
  /** Remaining hourly budget (cents) */
  remainingHourlyBudget: number;
  /** Remaining daily budget (cents) */
  remainingDailyBudget: number;
  /** Whether within budget */
  withinBudget: boolean;
}

/**
 * Platform cost statistics (admin only)
 */
export interface PlatformCostStats {
  /** Total spent today (cents) */
  today: number;
  /** Total spent this month (cents) */
  thisMonth: number;
  /** Jobs today */
  jobsToday: number;
  /** Jobs this month */
  jobsThisMonth: number;
  /** Average cost per job (cents) */
  avgCostPerJob: number;
  /** Remaining daily budget (cents) */
  remainingDailyBudget: number;
  /** Whether within budget */
  withinBudget: boolean;
}

/**
 * Tracks the cost of a completed job
 *
 * Records cost and token usage in the database for analytics and budget tracking.
 *
 * @param jobId - Job ID to update
 * @param costCents - Total cost in cents
 * @param tokenUsage - Token usage details
 *
 * @example
 * ```ts
 * await trackJobCost(jobId, 175, {
 *   prompt_tokens: 1200,
 *   completion_tokens: 2800,
 *   total_tokens: 4000
 * });
 * ```
 */
export async function trackJobCost(
  jobId: string,
  costCents: number,
  tokenUsage: TokenUsage
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('site_generation_jobs')
      .update({
        cost_cents: costCents,
        token_usage: tokenUsage,
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error tracking job cost:', handleError(error));
    }
  } catch (error) {
    console.error('Error in trackJobCost:', handleError(error));
  }
}

/**
 * Gets total costs for a user in a specific period
 *
 * @param userId - User ID
 * @param period - Time period ('hour', 'day', 'week', 'month')
 * @returns Total cost in cents
 *
 * @example
 * ```ts
 * const hourlyCost = await getUserTotalCosts(userId, 'hour');
 * console.log(`User spent $${hourlyCost / 100} this hour`);
 * ```
 */
export async function getUserTotalCosts(
  userId: string,
  period: CostPeriod
): Promise<number> {
  try {
    const supabase = await createClient();
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'hour':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data, error } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());

    if (error) {
      console.error('Error fetching user costs:', handleError(error));
      return 0;
    }

    return data?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
  } catch (error) {
    console.error('Error in getUserTotalCosts:', handleError(error));
    return 0;
  }
}

/**
 * Gets platform-wide total costs for a period (admin only)
 *
 * @param period - Time period ('day', 'month')
 * @returns Total platform cost in cents
 *
 * @example
 * ```ts
 * const dailyCost = await getPlatformTotalCosts('day');
 * if (dailyCost > DAILY_PLATFORM_BUDGET_CENTS) {
 *   console.error('Platform daily budget exceeded!');
 * }
 * ```
 */
export async function getPlatformTotalCosts(period: CostPeriod): Promise<number> {
  try {
    const supabase = await createClient();
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'hour':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data, error } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .gte('created_at', periodStart.toISOString());

    if (error) {
      console.error('Error fetching platform costs:', handleError(error));
      return 0;
    }

    return data?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
  } catch (error) {
    console.error('Error in getPlatformTotalCosts:', handleError(error));
    return 0;
  }
}

/**
 * Estimates the cost of a site generation before calling the LLM
 *
 * Provides cost estimate based on prompt length and historical averages.
 *
 * @param promptLength - Length of the user prompt in characters
 * @returns Estimated cost in cents
 *
 * @example
 * ```ts
 * const estimatedCost = estimateGenerationCost(userPrompt.length);
 * console.log(`Estimated cost: $${estimatedCost / 100}`);
 *
 * // Check if user can afford it
 * if (!await checkBudgetLimit(userId, estimatedCost)) {
 *   return apiError('Insufficient budget', 'BUDGET_EXCEEDED', 429);
 * }
 * ```
 */
export function estimateGenerationCost(promptLength: number): number {
  // Rough estimation: 4 characters per token (English text average)
  const estimatedInputTokens = Math.ceil(promptLength / 4) + 1000; // +1000 for system prompt
  const estimatedOutputTokens = ESTIMATED_OUTPUT_TOKENS;

  // Calculate cost based on token pricing
  const inputCost = (estimatedInputTokens / 1000) * COST_PER_1K_INPUT_TOKENS;
  const outputCost = (estimatedOutputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;

  const totalCostCents = Math.ceil(inputCost + outputCost);

  // Add 20% buffer for safety
  return Math.ceil(totalCostCents * 1.2);
}

/**
 * Calculates actual cost from token usage
 *
 * @param tokenUsage - Token usage from LLM response
 * @returns Actual cost in cents
 *
 * @example
 * ```ts
 * const actualCost = calculateActualCost({
 *   prompt_tokens: 1200,
 *   completion_tokens: 2800,
 *   total_tokens: 4000
 * });
 * ```
 */
export function calculateActualCost(tokenUsage: TokenUsage): number {
  const inputCost = (tokenUsage.prompt_tokens / 1000) * COST_PER_1K_INPUT_TOKENS;
  const outputCost = (tokenUsage.completion_tokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;

  return Math.ceil(inputCost + outputCost);
}

/**
 * Checks if user is within budget limits for estimated cost
 *
 * Verifies user has sufficient budget remaining before allowing generation.
 *
 * @param userId - User ID
 * @param estimatedCost - Estimated cost in cents
 * @returns True if within budget, false otherwise
 *
 * @example
 * ```ts
 * const estimatedCost = estimateGenerationCost(prompt.length);
 * const canAfford = await checkBudgetLimit(userId, estimatedCost);
 *
 * if (!canAfford) {
 *   return apiError('Budget limit exceeded', 'BUDGET_EXCEEDED', 429);
 * }
 * ```
 */
export async function checkBudgetLimit(
  userId: string,
  estimatedCost: number
): Promise<boolean> {
  try {
    // Get user's current spending
    const hourlyCost = await getUserTotalCosts(userId, 'hour');
    const dailyCost = await getUserTotalCosts(userId, 'day');

    // Check if estimated cost would exceed limits
    const withinHourlyBudget = (hourlyCost + estimatedCost) <= USER_HOURLY_BUDGET_CENTS;
    const withinDailyBudget = (dailyCost + estimatedCost) <= USER_DAILY_BUDGET_CENTS;

    // Also check platform budget
    const platformDailyCost = await getPlatformTotalCosts('day');
    const withinPlatformBudget = (platformDailyCost + estimatedCost) <= DAILY_PLATFORM_BUDGET_CENTS;

    return withinHourlyBudget && withinDailyBudget && withinPlatformBudget;
  } catch (error) {
    console.error('Error checking budget limit:', handleError(error));
    // Default to allowing if check fails (fail open)
    return true;
  }
}

/**
 * Gets comprehensive cost statistics for a user
 *
 * Provides detailed breakdown of user's spending and remaining budgets.
 *
 * @param userId - User ID
 * @returns User cost statistics
 *
 * @example
 * ```ts
 * const stats = await getUserCostStats(userId);
 * console.log(`Spent this hour: $${stats.thisHour / 100}`);
 * console.log(`Remaining budget: $${stats.remainingHourlyBudget / 100}`);
 * ```
 */
export async function getUserCostStats(userId: string): Promise<UserCostStats> {
  try {
    const supabase = await createClient();
    const now = new Date();

    // Get costs for different periods
    const [thisHour, today, thisMonth] = await Promise.all([
      getUserTotalCosts(userId, 'hour'),
      getUserTotalCosts(userId, 'day'),
      getUserTotalCosts(userId, 'month'),
    ]);

    // Get all-time total
    const { data: allJobs, error: allError } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .eq('user_id', userId);

    const allTime = allError ? 0 : allJobs?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;

    // Get job counts
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: hourlyJobs } = await supabase
      .from('site_generation_jobs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo.toISOString());

    const { data: dailyJobs } = await supabase
      .from('site_generation_jobs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo.toISOString());

    const remainingHourlyBudget = Math.max(0, USER_HOURLY_BUDGET_CENTS - thisHour);
    const remainingDailyBudget = Math.max(0, USER_DAILY_BUDGET_CENTS - today);
    const withinBudget = thisHour < USER_HOURLY_BUDGET_CENTS && today < USER_DAILY_BUDGET_CENTS;

    return {
      thisHour,
      today,
      thisMonth,
      allTime,
      jobsThisHour: hourlyJobs?.length || 0,
      jobsToday: dailyJobs?.length || 0,
      remainingHourlyBudget,
      remainingDailyBudget,
      withinBudget,
    };
  } catch (error) {
    console.error('Error getting user cost stats:', handleError(error));
    return {
      thisHour: 0,
      today: 0,
      thisMonth: 0,
      allTime: 0,
      jobsThisHour: 0,
      jobsToday: 0,
      remainingHourlyBudget: USER_HOURLY_BUDGET_CENTS,
      remainingDailyBudget: USER_DAILY_BUDGET_CENTS,
      withinBudget: true,
    };
  }
}

/**
 * Gets platform-wide cost statistics (admin only)
 *
 * @returns Platform cost statistics
 *
 * @example
 * ```ts
 * const stats = await getPlatformCostStats();
 * console.log(`Platform spent today: $${stats.today / 100}`);
 * console.log(`Within budget: ${stats.withinBudget}`);
 * ```
 */
export async function getPlatformCostStats(): Promise<PlatformCostStats> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get daily costs
    const { data: dailyJobs, error: dailyError } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .gte('created_at', oneDayAgo.toISOString());

    const today = dailyError ? 0 : dailyJobs?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
    const jobsToday = dailyJobs?.length || 0;

    // Get monthly costs
    const { data: monthlyJobs, error: monthlyError } = await supabase
      .from('site_generation_jobs')
      .select('cost_cents')
      .gte('created_at', oneMonthAgo.toISOString());

    const thisMonth = monthlyError ? 0 : monthlyJobs?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
    const jobsThisMonth = monthlyJobs?.length || 0;

    const avgCostPerJob = jobsThisMonth > 0 ? Math.round(thisMonth / jobsThisMonth) : 0;
    const remainingDailyBudget = Math.max(0, DAILY_PLATFORM_BUDGET_CENTS - today);
    const withinBudget = today < DAILY_PLATFORM_BUDGET_CENTS;

    return {
      today,
      thisMonth,
      jobsToday,
      jobsThisMonth,
      avgCostPerJob,
      remainingDailyBudget,
      withinBudget,
    };
  } catch (error) {
    console.error('Error getting platform cost stats:', handleError(error));
    return {
      today: 0,
      thisMonth: 0,
      jobsToday: 0,
      jobsThisMonth: 0,
      avgCostPerJob: 0,
      remainingDailyBudget: DAILY_PLATFORM_BUDGET_CENTS,
      withinBudget: true,
    };
  }
}

/**
 * Gets detailed cost summary for a period
 *
 * @param userId - Optional user ID (omit for platform-wide)
 * @param period - Time period
 * @returns Cost summary with detailed analytics
 *
 * @example
 * ```ts
 * const summary = await getCostSummary(userId, 'month');
 * console.log(`Average cost per job: $${summary.avgCostCents / 100}`);
 * console.log(`Total tokens used: ${summary.totalTokens}`);
 * ```
 */
export async function getCostSummary(
  userId: string | null,
  period: CostPeriod
): Promise<CostSummary> {
  try {
    const supabase = await createClient();
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'hour':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    let query = supabase
      .from('site_generation_jobs')
      .select('cost_cents, token_usage')
      .gte('created_at', periodStart.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cost summary:', handleError(error));
      return {
        totalCents: 0,
        jobCount: 0,
        avgCostCents: 0,
        totalTokens: 0,
        periodStart,
        periodEnd: now,
      };
    }

    const totalCents = data?.reduce((sum, job) => sum + (job.cost_cents || 0), 0) || 0;
    const jobCount = data?.length || 0;
    const avgCostCents = jobCount > 0 ? Math.round(totalCents / jobCount) : 0;

    const totalTokens = data?.reduce((sum, job) => {
      const usage = job.token_usage as unknown as TokenUsage | null;
      return sum + (usage?.total_tokens || 0);
    }, 0) || 0;

    return {
      totalCents,
      jobCount,
      avgCostCents,
      totalTokens,
      periodStart,
      periodEnd: now,
    };
  } catch (error) {
    console.error('Error in getCostSummary:', handleError(error));
    const now = new Date();
    return {
      totalCents: 0,
      jobCount: 0,
      avgCostCents: 0,
      totalTokens: 0,
      periodStart: now,
      periodEnd: now,
    };
  }
}