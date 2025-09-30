/**
 * Site Generation Status API Endpoint
 *
 * GET /api/sites/generate/[jobId]
 * Returns the current status of a site generation job.
 *
 * This endpoint:
 * - Authenticates the user
 * - Validates job ownership (or admin)
 * - Returns job status with all details
 * - Includes site information if completed
 * - Includes error details if failed
 */

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import type {
  GenerationStatusResponse,
  GenerationErrorCode,
  TokenUsageInfo,
} from '@/lib/types/api-types';
import { handleError } from '@/lib/types/error-handling';
import { getJob } from '@/lib/jobs/site-generation-jobs';
import { validateJobOwnership } from '@/lib/jobs/background-processor';
import { getSiteUrl } from '@/lib/sites/site-creator';
import type { TokenUsage, SiteGenerationJob } from '@/lib/types/site-generation-jobs';

/**
 * GET /api/sites/generate/[jobId]
 * Returns job status and results
 *
 * @param request - Next.js request
 * @param params - Route parameters containing jobId
 * @returns Job status response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const resolvedParams = await params;
  const jobId = resolvedParams.jobId;
  const requestId = Math.random().toString(36).substring(2, 10);

  console.log(`[${requestId}] GET /api/sites/generate/${jobId} - Request received`);

  try {
    // 1. Authentication check
    const user = await getUser();

    if (!user) {
      console.log(`[${requestId}] Authentication failed - no user`);
      return apiError(
        'Authentication required',
        'AUTHENTICATION_REQUIRED' as GenerationErrorCode,
        401
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    // 2. Check if user is admin or site_owner
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'site_owner';

    // 3. Validate job ownership
    console.log(`[${requestId}] Validating job ownership...`);
    const canAccess = await validateJobOwnership(jobId, user.id, isAdmin);

    if (!canAccess) {
      console.log(`[${requestId}] Job ownership validation failed`);

      // Check if job exists at all
      const job = await getJob(jobId);

      if (!job) {
        return apiError(
          'Job not found',
          'JOB_NOT_FOUND' as GenerationErrorCode,
          404
        );
      }

      // Job exists but user doesn't own it
      return apiError(
        'You do not have permission to view this job',
        'JOB_OWNERSHIP_VIOLATION' as GenerationErrorCode,
        403
      );
    }

    // 4. Fetch job details
    console.log(`[${requestId}] Fetching job details...`);
    const jobResult = await getJob(jobId, isAdmin ? undefined : user.id);

    if (!jobResult) {
      return apiError(
        'Job not found',
        'JOB_NOT_FOUND' as GenerationErrorCode,
        404
      );
    }

    const job = jobResult as SiteGenerationJob;

    // 5. Build response
    const response: GenerationStatusResponse = {
      jobId: job.id,
      status: job.status,
      progress: job.progress || 0,
      createdAt: job.created_at,
      updatedAt: job.updated_at || job.created_at,
    };

    // Add completion timestamp if available
    if (job.completed_at) {
      response.completedAt = job.completed_at;
    }

    // Add site information if completed
    if (job.status === 'completed' && job.site_id) {
      // Fetch site details
      const { data: site } = await supabase
        .from('sites')
        .select('name, subdomain')
        .eq('id', job.site_id)
        .single();

      if (site) {
        response.siteId = job.site_id;
        response.siteName = site.name;
        response.siteUrl = getSiteUrl(site.subdomain);
      }
    }

    // Add error information if failed
    if (job.status === 'failed') {
      response.errorMessage = job.error_message || 'Generation failed';
      response.errorCode = job.error_code || 'UNKNOWN_ERROR';
    }

    // Add cost and token usage if available
    if (job.cost_cents !== null && job.cost_cents !== undefined) {
      response.costCents = job.cost_cents;
    }

    if (job.token_usage) {
      const tokenUsage = job.token_usage as unknown as TokenUsage;
      response.tokenUsage = {
        promptTokens: tokenUsage.prompt_tokens || 0,
        completionTokens: tokenUsage.completion_tokens || 0,
        totalTokens: tokenUsage.total_tokens || 0,
      };
    }

    console.log(`[${requestId}] Returning job status: ${job.status}`);

    return apiSuccess(response);
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[${requestId}] Unexpected error:`, errorInfo.message);

    return apiError(
      'An unexpected error occurred',
      'INTERNAL_ERROR' as GenerationErrorCode,
      500
    );
  }
}