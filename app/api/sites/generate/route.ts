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
import { createClientFromRequest } from '@/src/lib/supabase/api-server';
import { apiSuccess, apiError } from '@/lib/types/api';
import type {
  GenerateSiteRequest,
  GenerateSiteResponse,
  GenerationErrorCode,
} from '@/lib/types/api-types';
import type { SiteGenerationJob, ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';
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
import { createJob, updateJobStatus } from '@/lib/jobs/site-generation-jobs';
import { processGenerationJob } from '@/lib/jobs/background-processor';
import { logSecurityEvent } from '@/lib/security/security-utils';
import type { BusinessInfo } from '@/lib/types/site-generation-jobs';
import { discoverAndScrapePages } from '@/lib/scraping/page-discovery';
import { analyzeScrapedWebsite } from '@/lib/scraping/content-analyzer';
import { downloadAndUploadLogo } from '@/lib/storage/logo-processor';

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
    // 1. Create Supabase client (supports both Bearer token and cookies)
    const supabase = await createClientFromRequest(request);

    // 2. Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
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

    // 3. Authorization check (admin-only initially)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
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
      logoUrl: requestBody.logoUrl,
      brandColors: requestBody.brandColors,
      basedOnWebsite: requestBody.basedOnWebsite,
      additionalDetails: requestBody.additionalDetails,
    });

    // Debug: Log if scraping URL was provided
    if (businessInfo.basedOnWebsite) {
      console.log(`[${requestId}] ✅ basedOnWebsite field received: ${businessInfo.basedOnWebsite}`);
    } else {
      console.log(`[${requestId}] ℹ️  No basedOnWebsite field provided (manual mode)`);
    }

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

    // 8. Create job (note: businessInfo may have been updated with processed logo URL)
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

    // 9. Process manually provided logo URL if it's external (before scraping)
    if (!businessInfo.basedOnWebsite && businessInfo.logoUrl) {
      // Check if the logo URL is external (not already our storage URL)
      const isExternalUrl = businessInfo.logoUrl.startsWith('http://') || businessInfo.logoUrl.startsWith('https://');
      const isOurStorage = businessInfo.logoUrl.includes('/api/images/') || businessInfo.logoUrl.includes('.s3.');

      if (isExternalUrl && !isOurStorage) {
        console.log(`[${requestId}] Processing manually provided external logo: ${businessInfo.logoUrl}`);

        const tempSiteId = `temp-${job.id}`;
        try {
          const uploadedLogoUrl = await downloadAndUploadLogo(
            businessInfo.logoUrl,
            tempSiteId,
            user.id
          );

          if (uploadedLogoUrl) {
            businessInfo.logoUrl = uploadedLogoUrl;
            console.log(`[${requestId}] Manual logo successfully uploaded to: ${uploadedLogoUrl}`);
          } else {
            console.warn(`[${requestId}] Manual logo upload failed, keeping original URL`);
          }
        } catch (logoError: unknown) {
          const errorInfo = handleError(logoError);
          console.error(`[${requestId}] Manual logo processing error: ${errorInfo.message}`);
          // Keep the original URL
        }
      }
    }

    // 10. Scrape website if basedOnWebsite is provided (run before background processing)
    let scrapedContext: ScrapedWebsiteContext | undefined = undefined;

    if (businessInfo.basedOnWebsite) {
      console.log(`[${requestId}] Scraping website: ${businessInfo.basedOnWebsite}`);

      try {
        // Update job status to indicate scraping
        await updateJobStatus({
          jobId: job.id,
          status: 'processing',
          progress: 5,
        });

        // Discover and scrape pages
        const discoveryResult = await discoverAndScrapePages(businessInfo.basedOnWebsite);

        console.log(
          `[${requestId}] Scraped ${discoveryResult.totalPagesScraped} of ${discoveryResult.totalPagesFound} pages`
        );

        if (discoveryResult.pages.length > 0) {
          // Analyze scraped content
          const analyzed = analyzeScrapedWebsite(discoveryResult.pages);

          // Process logo if found in scraped data
          let processedLogoUrl: string | undefined = undefined;

          if (analyzed.businessInfo.logoUrl) {
            console.log(`[${requestId}] Processing scraped logo: ${analyzed.businessInfo.logoUrl}`);

            // Generate a temporary site ID for logo upload (will be updated once site is created)
            const tempSiteId = `temp-${job.id}`;

            try {
              const uploadedLogoUrl = await downloadAndUploadLogo(
                analyzed.businessInfo.logoUrl,
                tempSiteId,
                user.id
              );

              if (uploadedLogoUrl) {
                processedLogoUrl = uploadedLogoUrl;
                console.log(`[${requestId}] Logo successfully uploaded to: ${uploadedLogoUrl}`);

                // Update businessInfo with the processed logo URL
                businessInfo.logoUrl = uploadedLogoUrl;
              } else {
                console.warn(`[${requestId}] Logo download/upload failed, using original URL`);
                // Keep the original URL as fallback
                processedLogoUrl = analyzed.businessInfo.logoUrl;
              }
            } catch (logoError: unknown) {
              const errorInfo = handleError(logoError);
              console.error(`[${requestId}] Logo processing error: ${errorInfo.message}`);
              // Keep the original URL as fallback
              processedLogoUrl = analyzed.businessInfo.logoUrl;
            }
          }

          // Build scraped context for LLM - include all extracted fields
          scrapedContext = {
            baseUrl: analyzed.baseUrl,
            businessInfo: {
              emails: analyzed.businessInfo.emails,
              phones: analyzed.businessInfo.phones,
              addresses: analyzed.businessInfo.addresses,
              socialLinks: analyzed.businessInfo.socialLinks,
              logoUrl: processedLogoUrl || analyzed.businessInfo.logoUrl, // Use processed or original
              brandColors: analyzed.businessInfo.brandColors,
              heroSection: analyzed.businessInfo.heroSection, // Include hero section
              businessDescription: analyzed.businessInfo.businessDescription,
              tagline: analyzed.businessInfo.tagline,
              keyFeatures: analyzed.businessInfo.keyFeatures,
              structuredContent: analyzed.businessInfo.structuredContent, // Include structured content for preservation
            },
            pageContents: Object.fromEntries(analyzed.pageContents),
            recommendedPages: analyzed.recommendedPages,
            contentSummary: analyzed.contentSummary,
          };

          console.log(
            `[${requestId}] Website analysis complete. Recommended pages: ${analyzed.recommendedPages.join(', ')}`
          );

          // Summary of scraped data
          console.log(`[${requestId}] Scraped ${discoveryResult.totalPagesScraped} pages successfully`);
          console.log(`[${requestId}] Extracted contact info: ${analyzed.businessInfo.emails?.length || 0} emails, ${analyzed.businessInfo.phones?.length || 0} phones`);
          console.log(`[${requestId}] Branding: ${analyzed.businessInfo.brandColors?.length || 0} colors, ${processedLogoUrl ? 'logo processed and uploaded' : analyzed.businessInfo.logoUrl ? 'logo found' : 'no logo'}`);
          console.log(`[${requestId}] Social links: ${analyzed.businessInfo.socialLinks?.length || 0} platforms`);

          // Log structured content extraction
          if (analyzed.businessInfo.structuredContent) {
            const sc = analyzed.businessInfo.structuredContent;
            console.log(`[${requestId}] Structured content extracted:`);
            if (sc.businessHours?.length) {
              console.log(`[${requestId}]   - Business hours: ${sc.businessHours.length} entries`);
            }
            if (sc.services?.length) {
              console.log(`[${requestId}]   - Services: ${sc.services.length} items with pricing`);
            }
            if (sc.testimonials?.length) {
              console.log(`[${requestId}]   - Testimonials: ${sc.testimonials.length} customer reviews`);
            }
          }

          // Log hero section extraction
          if (analyzed.businessInfo.heroSection) {
            console.log(`[${requestId}] Hero section extracted:`);
            if (analyzed.businessInfo.heroSection.headline) {
              console.log(`[${requestId}]   - Headline: "${analyzed.businessInfo.heroSection.headline.substring(0, 50)}..."`);
            }
            if (analyzed.businessInfo.heroSection.subheadline) {
              console.log(`[${requestId}]   - Subheadline: "${analyzed.businessInfo.heroSection.subheadline.substring(0, 50)}..."`);
            }
            if (analyzed.businessInfo.heroSection.ctaText) {
              console.log(`[${requestId}]   - CTA: "${analyzed.businessInfo.heroSection.ctaText}"`);
            }
          }
        } else {
          console.warn(`[${requestId}] No pages scraped, continuing without context`);
        }

        // Reset job to pending for background processing
        await updateJobStatus({
          jobId: job.id,
          status: 'pending',
          progress: 0,
        });
      } catch (error: unknown) {
        const errorInfo = handleError(error);
        console.error(`[${requestId}] Scraping failed:`, errorInfo.message);
        console.log(`[${requestId}] Continuing generation without scraped context`);

        // Log scraping failure but don't fail the entire job
        logSecurityEvent('website_scraping_failed', {
          userId: user.id,
          requestId,
          jobId: job.id,
          websiteUrl: businessInfo.basedOnWebsite,
          error: errorInfo.message,
        });

        // Reset job to pending for background processing
        await updateJobStatus({
          jobId: job.id,
          status: 'pending',
          progress: 0,
        });
      }
    }

    // 10. Trigger background processing (fire and forget)
    // Don't await - return immediately with job ID
    processGenerationJob(job.id, scrapedContext).catch((error: unknown) => {
      console.error(`[${requestId}] Background processing error:`, handleError(error).message);
    });

    // 11. Log successful job creation
    logSecurityEvent('generation_job_created', {
      userId: user.id,
      requestId,
      jobId: job.id,
      businessName: businessInfo.name,
      estimatedCost,
    });

    // 12. Build response
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
      const supabase = await createClientFromRequest(request);
      const { data: { user } } = await supabase.auth.getUser();
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