/**
 * Background Job Processor
 *
 * Processes site generation jobs in the background, independent of request context.
 * Handles the complete generation workflow:
 * - LLM content generation
 * - Content moderation
 * - Cost tracking
 * - Site creation
 * - Error handling and job status updates
 */

import { getJob, updateJobStatus, updateJobResult, updateJobError } from './site-generation-jobs';
import { generateSiteContent } from '@/lib/ai/site-generator-service';
import { moderateStructuredContent } from '@/lib/security/content-moderation';
import { calculateActualCost } from './cost-management';
import { createSiteFromGenerated, getSiteUrl } from '@/lib/sites/site-creator';
import { handleError } from '@/lib/types/error-handling';
import { logSecurityEvent } from '@/lib/security/security-utils';
import type { ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

/**
 * Processing result
 */
export interface ProcessingResult {
  /** Whether processing succeeded */
  success: boolean;
  /** Site ID if successful */
  siteId?: string;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: string;
}

/**
 * Processes a site generation job in the background
 *
 * This function runs the complete generation workflow:
 * 1. Fetch job details
 * 2. Update status to 'processing'
 * 3. Generate site content with LLM (with optional scraped context)
 * 4. Moderate generated content
 * 5. Calculate actual cost
 * 6. Create site and pages in database
 * 7. Update job with result or error
 *
 * @param jobId - Job ID to process
 * @param scrapedContext - Optional scraped website context for enhanced generation
 * @returns Processing result
 *
 * @example
 * ```ts
 * // Trigger from API route (don't await)
 * processGenerationJob(jobId).catch(console.error);
 *
 * // Or use in a worker/queue with scraped context
 * await processGenerationJob(jobId, scrapedContext);
 * ```
 */
export async function processGenerationJob(
  jobId: string,
  scrapedContext?: ScrapedWebsiteContext
): Promise<ProcessingResult> {
  console.log(`[Job ${jobId}] Starting background processing`);
  const startTime = Date.now();

  try {
    // 1. Fetch job details
    console.log(`[Job ${jobId}] Fetching job details...`);
    const job = await getJob(jobId);

    if (!job) {
      console.error(`[Job ${jobId}] Job not found`);
      return {
        success: false,
        error: 'Job not found',
        errorCode: 'JOB_NOT_FOUND',
      };
    }

    // Check if job is already completed or being processed
    if (job.status !== 'pending') {
      console.warn(`[Job ${jobId}] Job already processed (status: ${job.status})`);
      return {
        success: false,
        error: `Job already ${job.status}`,
        errorCode: 'JOB_ALREADY_PROCESSED',
      };
    }

    // 2. Update status to processing
    console.log(`[Job ${jobId}] Updating status to processing...`);
    await updateJobStatus({
      jobId,
      status: 'processing',
      progress: 10,
    });

    // 3. Generate site content with LLM
    console.log(`[Job ${jobId}] Generating site content...`);
    if (scrapedContext) {
      console.log(`[Job ${jobId}] Using scraped website context from: ${scrapedContext.baseUrl}`);
    }
    let generationResult;

    try {
      // Parse business_info from JSON
      const businessInfo = job.business_info as unknown as import('@/lib/types/site-generation-jobs').BusinessInfo;
      generationResult = await generateSiteContent(businessInfo, scrapedContext);
      console.log(
        `[Job ${jobId}] Content generated. Cost: ${generationResult.totalCostCents} cents, Tokens: ${generationResult.tokenUsage.total_tokens}`
      );
    } catch (error: unknown) {
      const errorInfo = handleError(error);
      console.error(`[Job ${jobId}] LLM generation failed:`, errorInfo.message);

      await updateJobError({
        jobId,
        errorMessage: `Content generation failed: ${errorInfo.message}`,
        errorCode: 'LLM_API_FAILURE',
      });

      // Log security event
      logSecurityEvent('generation_failed', {
        userId: job.user_id,
        jobId,
        error: errorInfo.message,
        errorCode: 'LLM_API_FAILURE',
      });

      return {
        success: false,
        error: errorInfo.message,
        errorCode: 'LLM_API_FAILURE',
      };
    }

    // Update progress
    await updateJobStatus({
      jobId,
      status: 'processing',
      progress: 50,
    });

    // 4. Moderate generated content
    console.log(`[Job ${jobId}] Moderating content...`);
    const moderation = moderateStructuredContent(generationResult.data);

    if (!moderation.safe) {
      console.error(`[Job ${jobId}] Content moderation failed:`, moderation.violations);

      await updateJobError({
        jobId,
        errorMessage: `Generated content failed safety checks: ${moderation.violations.join(', ')}`,
        errorCode: 'CONTENT_MODERATION_FAILED',
        costCents: generationResult.totalCostCents,
        tokenUsage: generationResult.tokenUsage,
      });

      // Log security event
      logSecurityEvent('content_moderation_failed', {
        userId: job.user_id,
        jobId,
        violations: moderation.violations,
      });

      return {
        success: false,
        error: 'Content failed safety checks',
        errorCode: 'CONTENT_MODERATION_FAILED',
      };
    }

    console.log(`[Job ${jobId}] Content passed moderation`);

    // Update progress
    await updateJobStatus({
      jobId,
      status: 'processing',
      progress: 70,
    });

    // 5. Create site in database
    console.log(`[Job ${jobId}] Creating site...`);
    let siteResult;

    try {
      // Parse business_info for logoUrl
      const businessInfo = job.business_info as unknown as import('@/lib/types/site-generation-jobs').BusinessInfo;

      // Use the logoUrl from scraped context if available, otherwise from businessInfo
      const logoUrl = scrapedContext?.businessInfo?.logoUrl || businessInfo.logoUrl;

      siteResult = await createSiteFromGenerated(
        generationResult.data,
        job.user_id,
        logoUrl,
        scrapedContext
      );
      console.log(
        `[Job ${jobId}] Site created: ${siteResult.siteId} (${siteResult.pageIds.length} pages)`
      );
    } catch (error: unknown) {
      const errorInfo = handleError(error);
      console.error(`[Job ${jobId}] Site creation failed:`, errorInfo.message);

      await updateJobError({
        jobId,
        errorMessage: `Site creation failed: ${errorInfo.message}`,
        errorCode: 'SITE_CREATION_FAILED',
        costCents: generationResult.totalCostCents,
        tokenUsage: generationResult.tokenUsage,
      });

      // Log security event
      logSecurityEvent('site_creation_failed', {
        userId: job.user_id,
        jobId,
        error: errorInfo.message,
      });

      return {
        success: false,
        error: errorInfo.message,
        errorCode: 'SITE_CREATION_FAILED',
      };
    }

    // Update progress
    await updateJobStatus({
      jobId,
      status: 'processing',
      progress: 90,
    });

    // 6. Update job with successful result
    console.log(`[Job ${jobId}] Updating job with result...`);
    const updateSuccess = await updateJobResult({
      jobId,
      siteId: siteResult.siteId,
      generatedData: generationResult.data,
      costCents: generationResult.totalCostCents,
      tokenUsage: generationResult.tokenUsage,
    });

    if (!updateSuccess) {
      console.error(`[Job ${jobId}] Failed to update job result`);
      // Note: Site is created but job status update failed
      // The job will show as processing but site exists
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Job ${jobId}] Processing complete in ${totalTime}ms`);

    // Log successful generation
    logSecurityEvent('site_generated', {
      userId: job.user_id,
      jobId,
      siteId: siteResult.siteId,
      siteName: siteResult.siteName,
      costCents: generationResult.totalCostCents,
      totalTokens: generationResult.tokenUsage.total_tokens,
      processingTimeMs: totalTime,
    });

    return {
      success: true,
      siteId: siteResult.siteId,
    };
  } catch (error: unknown) {
    // Unexpected error - catch-all handler
    const errorInfo = handleError(error);
    console.error(`[Job ${jobId}] Unexpected error:`, errorInfo.message);

    // Try to update job with error
    try {
      await updateJobError({
        jobId,
        errorMessage: `Unexpected error: ${errorInfo.message}`,
        errorCode: 'INTERNAL_ERROR',
      });
    } catch (updateError: unknown) {
      console.error(`[Job ${jobId}] Failed to update job error:`, handleError(updateError).message);
    }

    return {
      success: false,
      error: errorInfo.message,
      errorCode: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Validates job ownership
 *
 * Checks if the user owns the job or is an admin.
 *
 * @param jobId - Job ID to validate
 * @param userId - User ID to check
 * @param isAdmin - Whether user is an admin
 * @returns Whether user can access the job
 */
export async function validateJobOwnership(
  jobId: string,
  userId: string,
  isAdmin: boolean
): Promise<boolean> {
  // Admins can access any job
  if (isAdmin) {
    return true;
  }

  // Check if user owns the job
  const job = await getJob(jobId, userId);
  return job !== null;
}