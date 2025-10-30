/**
 * Dev-Only Scraper Preview API Endpoint
 *
 * POST /api/dev/scraper-preview
 *
 * This endpoint provides a synchronous preview of the scraping and analysis
 * pipeline for development and testing purposes. It returns comprehensive
 * metrics and debugging information.
 *
 * Security:
 * - Only available in development and staging environments
 * - Requires authentication
 * - Enforces rate limiting
 * - Validates and sanitizes URLs to prevent SSRF
 *
 * @returns Detailed scraping results, analysis, and metrics
 */

import { NextRequest } from 'next/server';
import { createClientFromRequest } from '@/src/lib/supabase/api-server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { handleError } from '@/lib/types/error-handling';
import {
  sanitizeUrl,
  validateWebsiteUrl
} from '@/lib/security/input-sanitization';
import {
  checkScrapingRateLimit
} from '@/lib/security/site-generation-rate-limit';
import { discoverAndScrapePages } from '@/lib/scraping/page-discovery';
import { analyzeScrapedWebsite } from '@/lib/scraping/content-analyzer';
import type {
  ScraperPreviewRequest,
  ScraperPreviewResponse,
  ScrapingMetrics,
  ExtractedDataSummary
} from '@/lib/types/dev-api-types';
import type { ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

/**
 * Calculates scraping metrics from discovery results
 */
function calculateScrapingMetrics(discovery: ReturnType<typeof discoverAndScrapePages> extends Promise<infer T> ? T : never): ScrapingMetrics {
  const totalDataSize = discovery.pages.reduce((sum, page) => sum + page.html.length, 0);
  const averagePageSize = discovery.pages.length > 0
    ? Math.round(totalDataSize / discovery.pages.length)
    : 0;

  return {
    totalPagesFound: discovery.totalPagesFound,
    totalPagesScraped: discovery.totalPagesScraped,
    failedPages: discovery.errors.length,
    averagePageSize,
    totalDataSize,
    failedUrls: discovery.errors.length > 0 ? discovery.errors : undefined,
  };
}

/**
 * Extracts summary of analyzed data for quick overview
 */
function extractDataSummary(businessInfo: Awaited<ReturnType<typeof analyzeScrapedWebsite>>['businessInfo']): ExtractedDataSummary {
  return {
    hasLogo: Boolean(businessInfo.logoUrl),
    logoUrl: businessInfo.logoUrl,
    brandColorsCount: businessInfo.brandColors?.length || 0,
    brandColors: businessInfo.brandColors,
    emailsCount: businessInfo.emails?.length || 0,
    emails: businessInfo.emails,
    phonesCount: businessInfo.phones?.length || 0,
    phones: businessInfo.phones,
    socialLinksCount: businessInfo.socialLinks?.length || 0,
    socialPlatforms: businessInfo.socialLinks?.map(link => link.platform),
    hasHeroSection: Boolean(businessInfo.heroSection),
    heroHeadline: businessInfo.heroSection?.headline,
    hasBusinessHours: Boolean(businessInfo.structuredContent?.businessHours?.length),
    hasServices: Boolean(businessInfo.structuredContent?.services?.length),
    servicesCount: businessInfo.structuredContent?.services?.length,
    hasTestimonials: Boolean(businessInfo.structuredContent?.testimonials?.length),
    testimonialsCount: businessInfo.structuredContent?.testimonials?.length,
    keyFeaturesCount: businessInfo.keyFeatures?.length || 0,
  };
}

/**
 * Estimates token count for a text (rough approximation)
 * Uses ~4 characters per token as a rough estimate
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Builds the LLM context from analyzed website
 */
function buildLLMContext(analyzed: Awaited<ReturnType<typeof analyzeScrapedWebsite>>): ScrapedWebsiteContext {
  return {
    baseUrl: analyzed.baseUrl,
    businessInfo: {
      emails: analyzed.businessInfo.emails,
      phones: analyzed.businessInfo.phones,
      addresses: analyzed.businessInfo.addresses,
      socialLinks: analyzed.businessInfo.socialLinks,
      logoUrl: analyzed.businessInfo.logoUrl,
      brandColors: analyzed.businessInfo.brandColors,
      heroSection: analyzed.businessInfo.heroSection,
      businessDescription: analyzed.businessInfo.businessDescription,
      tagline: analyzed.businessInfo.tagline,
      keyFeatures: analyzed.businessInfo.keyFeatures,
      structuredContent: analyzed.businessInfo.structuredContent,
    },
    pageContents: Object.fromEntries(analyzed.pageContents),
    recommendedPages: analyzed.recommendedPages,
    contentSummary: analyzed.contentSummary,
  };
}

/**
 * POST /api/dev/scraper-preview
 * Provides synchronous scraping preview for development
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();

  console.log(`[${requestId}] POST /api/dev/scraper-preview - Request received`);

  try {
    // 1. Environment check - only allow in development or staging
    const environment = process.env.NODE_ENV;
    const isProduction = environment === 'production' && !process.env.VERCEL_ENV?.includes('preview');

    if (isProduction) {
      console.log(`[${requestId}] Access denied - production environment`);
      return new Response('Not Found', { status: 404 });
    }

    // 2. Create Supabase client and authenticate
    const supabase = await createClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.log(`[${requestId}] Authentication failed`);
      return apiError(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
        401
      );
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    // 3. Parse and validate request body
    let requestBody: ScraperPreviewRequest;

    try {
      requestBody = await request.json();
    } catch {
      return apiError(
        'Invalid JSON in request body',
        'INVALID_INPUT',
        400
      );
    }

    if (!requestBody.websiteUrl) {
      return apiError(
        'websiteUrl is required',
        'INVALID_INPUT',
        400
      );
    }

    // 4. Sanitize and validate URL
    const sanitizedUrl = sanitizeUrl(requestBody.websiteUrl);

    if (!sanitizedUrl) {
      return apiError(
        'Invalid URL format',
        'INVALID_URL',
        400
      );
    }

    const urlValidation = validateWebsiteUrl(sanitizedUrl);

    if (!urlValidation.valid) {
      return apiError(
        urlValidation.error || 'Invalid URL',
        'INVALID_URL',
        400
      );
    }

    console.log(`[${requestId}] URL validated: ${sanitizedUrl}`);

    // 5. Check rate limiting
    const rateLimitResult = await checkScrapingRateLimit(user.id);

    if (!rateLimitResult.allowed) {
      console.log(`[${requestId}] Rate limit exceeded for user ${user.id}`);
      return apiError(
        rateLimitResult.error || 'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    console.log(`[${requestId}] Rate limit check passed. Remaining: ${rateLimitResult.remaining}`);

    const warnings: string[] = [];

    // 6. Start scraping phase
    console.log(`[${requestId}] Starting scraping phase for: ${sanitizedUrl}`);
    const scrapingStartTime = Date.now();

    let discoveryResult;
    try {
      discoveryResult = await discoverAndScrapePages(sanitizedUrl);

      if (discoveryResult.pages.length === 0) {
        const firstError = discoveryResult.errors?.[0]?.error || 'Unknown error';
        console.error(`[${requestId}] No pages scraped. Discovery errors:`, discoveryResult.errors);
        throw new Error(`No pages could be scraped from the website. First error: ${firstError}`);
      }
    } catch (error: unknown) {
      const errorInfo = handleError(error);
      console.error(`[${requestId}] Scraping failed:`, errorInfo.message);

      return apiError(
        `Failed to scrape website: ${errorInfo.message}`,
        'SCRAPING_FAILED',
        500
      );
    }

    const scrapingDuration = Date.now() - scrapingStartTime;
    const scrapingMetrics = calculateScrapingMetrics(discoveryResult);

    console.log(`[${requestId}] Scraping complete in ${scrapingDuration}ms`);
    console.log(`[${requestId}] Scraped ${scrapingMetrics.totalPagesScraped}/${scrapingMetrics.totalPagesFound} pages`);

    if (scrapingMetrics.failedPages > 0) {
      warnings.push(`Failed to scrape ${scrapingMetrics.failedPages} pages`);
    }

    // 7. Start analysis phase
    console.log(`[${requestId}] Starting analysis phase`);
    const analysisStartTime = Date.now();

    let analyzed;
    try {
      analyzed = await analyzeScrapedWebsite(discoveryResult.pages);
    } catch (error: unknown) {
      const errorInfo = handleError(error);
      console.error(`[${requestId}] Analysis failed:`, errorInfo.message);

      return apiError(
        `Failed to analyze website: ${errorInfo.message}`,
        'ANALYSIS_FAILED',
        500
      );
    }

    const analysisDuration = Date.now() - analysisStartTime;
    const extractedSummary = extractDataSummary(analyzed.businessInfo);

    console.log(`[${requestId}] Analysis complete in ${analysisDuration}ms`);
    console.log(`[${requestId}] Extracted: ${extractedSummary.emailsCount} emails, ${extractedSummary.phonesCount} phones, ${extractedSummary.brandColorsCount} colors`);

    if (extractedSummary.hasLogo) {
      console.log(`[${requestId}] Logo found: ${extractedSummary.logoUrl}`);
    } else {
      warnings.push('No logo found on the website');
    }

    // 8. Build LLM context
    console.log(`[${requestId}] Building LLM context`);
    const llmContext = buildLLMContext(analyzed);
    const contextString = JSON.stringify(llmContext);
    const estimatedTokens = estimateTokenCount(contextString);

    console.log(`[${requestId}] LLM context built: ${contextString.length} chars, ~${estimatedTokens} tokens`);

    if (estimatedTokens > 8000) {
      warnings.push(`Large context size: ~${estimatedTokens} tokens may impact LLM performance`);
    }

    // 9. Calculate total duration
    const totalDuration = Date.now() - startTime;

    // 10. Build response
    const response: ScraperPreviewResponse = {
      scraping: {
        discovery: discoveryResult,
        duration: scrapingDuration,
        metrics: scrapingMetrics,
      },
      analysis: {
        result: {
          baseUrl: analyzed.baseUrl,
          businessInfo: analyzed.businessInfo,
          pageContents: Object.fromEntries(analyzed.pageContents),
          recommendedPages: analyzed.recommendedPages,
          contentSummary: analyzed.contentSummary,
        },
        duration: analysisDuration,
        extracted: extractedSummary,
      },
      llmContext: {
        context: llmContext,
        estimatedTokens,
        contextSize: contextString.length,
      },
      execution: {
        totalDuration,
        timestamp: new Date().toISOString(),
        environment: environment === 'development' ? 'development' : 'staging',
      },
    };

    if (warnings.length > 0) {
      response.warnings = warnings;
    }

    console.log(`[${requestId}] Request completed successfully in ${totalDuration}ms`);

    return apiSuccess(response);

  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error(`[${requestId}] Unexpected error:`, errorInfo.message);

    return apiError(
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      500
    );
  }
}
