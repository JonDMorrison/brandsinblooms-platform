/**
 * Site Generation API Endpoint
 *
 * POST /api/sites/generate
 * Initiates async site generation and returns job ID immediately.
 *
 * This endpoint:
 * - Authenticates the user
 * - Validates admin privileges (initially admin-only)
 * - Enforces rate limits
 * - Validates and sanitizes input
 * - Checks budget constraints
 * - Creates a generation job
 * - Triggers background processing
 * - Returns 202 Accepted with job ID
 */

import { NextRequest } from 'next/server';
import { getUser, getUserProfile } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import type {
  GenerateSiteRequest,
  GenerateSiteResponse,
  GenerationErrorCode,
} from '@/lib/types/api-types';
import type { SiteGenerationJob } from '@/lib/types/site-generation-jobs';
import { handleError } from '@/lib/types/error-handling';
import {
  sanitizeBusinessInfo,
  validateBusinessInfo,
} from '@/lib/security/input-sanitization';
import {
  checkGenerationRateLimit,
  checkPlatformBudget,
} from '@/lib/security/site-generation-rate-limit';
import {
  checkBudgetLimit,
  estimateGenerationCost,
} from '@/lib/jobs/cost-management';
import { createJob } from '@/lib/jobs/site-generation-jobs';
import { processGenerationJob } from '@/lib/jobs/background-processor';
import { logSecurityEvent } from '@/lib/security/security-utils';
import type { BusinessInfo } from '@/lib/types/site-generation-jobs';

/**
 * POST /api/sites/generate
 * Starts async site generation
 *
 * @returns 202 Accepted with job ID and status URL
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[${requestId}] POST /api/sites/generate - Request received`);

  try {
    // 1. Authentication check
    const user = await getUser();

    if (!user) {
      console.log(`[${requestId}] Authentication failed - no user`);
      logSecurityEvent('generation_unauthorized_attempt', {
        userId: 'anonymous',
        requestId,
      });

      return apiError(
        'Authentication required',
        'AUTHENTICATION_REQUIRED' as GenerationErrorCode,
        401
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    // 2. Authorization check (admin-only initially)
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthorized = profile?.role === 'admin' || profile?.role === 'site_owner';

    if (!isAuthorized) {
      console.log(`[${requestId}] Authorization failed - not admin or site_owner`);
      logSecurityEvent('generation_unauthorized_attempt', {
        userId: user.id,
        requestId,
      });

      return apiError(
        'Site generation is currently available to administrators and site owners only',
        'ADMIN_REQUIRED' as GenerationErrorCode,
        403
      );
    }

    // 3. Rate limiting check
    console.log(`[${requestId}] Checking rate limits...`);
    const rateLimitResult = await checkGenerationRateLimit(user.id, request);

    if (!rateLimitResult.allowed) {
      console.log(`[${requestId}] Rate limit exceeded: ${rateLimitResult.reason}`);
      logSecurityEvent('generation_rate_limited', {
        userId: user.id,
        requestId,
        reason: rateLimitResult.reason,
        retryAfter: rateLimitResult.retryAfter,
      });

      return apiError(
        rateLimitResult.reason || 'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED' as GenerationErrorCode,
        429
      );
    }

    // 4. Parse and validate request body
    let requestBody: GenerateSiteRequest;

    try {
      requestBody = await request.json();
    } catch {
      return apiError(
        'Invalid JSON in request body',
        'INVALID_INPUT' as GenerationErrorCode,
        400
      );
    }

    // 5. Sanitize input
    console.log(`[${requestId}] Sanitizing input...`);
    const businessInfo: BusinessInfo = sanitizeBusinessInfo({
      prompt: requestBody.prompt,
      name: requestBody.name,
      industry: requestBody.industry,
      location: requestBody.location,
      description: requestBody.description,
      email: requestBody.email,
      phone: requestBody.phone,
      website: requestBody.website,
      additionalDetails: requestBody.additionalDetails,
    });

    // 6. Validate input
    console.log(`[${requestId}] Validating input...`);
    const validation = validateBusinessInfo(businessInfo);

    if (!validation.valid) {
      console.log(`[${requestId}] Validation failed:`, validation.errors);
      return apiError(
        `Invalid input: ${validation.errors.join(', ')}`,
        'INVALID_INPUT' as GenerationErrorCode,
        400
      );
    }

    // 7. Budget checks
    console.log(`[${requestId}] Checking budgets...`);

    // Estimate cost
    const estimatedCost = estimateGenerationCost(businessInfo.prompt.length);
    console.log(`[${requestId}] Estimated cost: ${estimatedCost} cents`);

    // Check user budget
    const withinUserBudget = await checkBudgetLimit(user.id, estimatedCost);

    if (!withinUserBudget) {
      console.log(`[${requestId}] User budget exceeded`);
      logSecurityEvent('generation_budget_exceeded', {
        userId: user.id,
        requestId,
        estimatedCost,
      });

      return apiError(
        'Budget limit exceeded. Please try again later.',
        'BUDGET_EXCEEDED' as GenerationErrorCode,
        429
      );
    }

    // Check platform budget
    const platformBudget = await checkPlatformBudget();

    if (!platformBudget.withinBudget) {
      console.log(`[${requestId}] Platform budget exceeded`);
      logSecurityEvent('platform_budget_exceeded', {
        userId: user.id,
        requestId,
        spentToday: platformBudget.spentToday,
      });

      return apiError(
        'Platform generation capacity reached. Please try again tomorrow.',
        'BUDGET_EXCEEDED' as GenerationErrorCode,
        429
      );
    }

    // 8. Create job
    console.log(`[${requestId}] Creating job...`);
    const jobResult = await createJob({
      userId: user.id,
      businessInfo,
    });

    if (!jobResult) {
      console.error(`[${requestId}] Failed to create job`);
      return apiError(
        'Failed to create generation job',
        'INTERNAL_ERROR' as GenerationErrorCode,
        500
      );
    }

    const job = jobResult as SiteGenerationJob;

    console.log(`[${requestId}] Job created: ${job.id}`);

    // 9. Trigger background processing (fire and forget)
    // Don't await - return immediately with job ID
    processGenerationJob(job.id).catch((error: unknown) => {
      console.error(`[${requestId}] Background processing error:`, handleError(error).message);
    });

    // 10. Log successful job creation
    logSecurityEvent('generation_job_created', {
      userId: user.id,
      requestId,
      jobId: job.id,
      businessName: businessInfo.name,
      estimatedCost,
    });

    // 11. Build response
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const statusUrl = `${baseUrl}/api/sites/generate/${job.id}`;

    const response: GenerateSiteResponse = {
      jobId: job.id,
      status: 'pending',
      statusUrl,
      estimatedTime: 60000, // 60 seconds estimate
      message: 'Site generation started. Check status URL for progress.',
    };

    console.log(`[${requestId}] Returning 202 Accepted`);

    // Return 202 Accepted
    return new Response(
      JSON.stringify({
        data: response,
        success: true,
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[${requestId}] Unexpected error:`, errorInfo.message);

    // Log error
    try {
      const user = await getUser();
      logSecurityEvent('generation_error', {
        userId: user?.id || 'unknown',
        requestId,
        error: errorInfo.message,
      });
    } catch {
      // Ignore logging errors
    }

    return apiError(
      'An unexpected error occurred',
      'INTERNAL_ERROR' as GenerationErrorCode,
      500
    );
  }
}