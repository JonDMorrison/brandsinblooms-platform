/**
 * Dev-Only API Types
 * Type definitions for development-only API endpoints
 */

import type {
  ExtractedBusinessInfo
} from '@/lib/scraping/content-extractor';
import type {
  PageDiscoveryResult,
  DiscoveredPage
} from '@/lib/scraping/page-discovery';
import type {
  ScrapedWebsiteContext
} from '@/lib/types/site-generation-jobs';

/**
 * Request body for scraper preview endpoint
 */
export interface ScraperPreviewRequest {
  /** URL of the website to scrape */
  websiteUrl: string;
  /** Maximum number of pages to scrape (optional, default from config) */
  maxPages?: number;
  /** Enable verbose output with detailed metrics */
  verbose?: boolean;
}

/**
 * Detailed scraping result for a single page
 */
export interface ScrapedPageResult {
  /** Page URL */
  url: string;
  /** Page type classification */
  pageType: string;
  /** Title extracted from the page */
  title?: string;
  /** Whether the page was successfully scraped */
  success: boolean;
  /** Error message if scraping failed */
  error?: string;
  /** Size of HTML content in bytes */
  htmlSize?: number;
  /** Number of links found on the page */
  linkCount?: number;
  /** Screenshot if available */
  screenshot?: string;
}

/**
 * Metrics for the scraping phase
 */
export interface ScrapingMetrics {
  /** Total number of pages found via navigation links */
  totalPagesFound: number;
  /** Number of pages successfully scraped */
  totalPagesScraped: number;
  /** Number of pages that failed to scrape */
  failedPages: number;
  /** Average page size in bytes */
  averagePageSize: number;
  /** Total data size scraped in bytes */
  totalDataSize: number;
  /** URLs that failed to scrape with error messages */
  failedUrls?: Array<{
    url: string;
    error: string;
  }>;
}

/**
 * Extracted data summary for quick overview
 */
export interface ExtractedDataSummary {
  /** Whether a logo was found */
  hasLogo: boolean;
  /** Logo URL if found */
  logoUrl?: string;
  /** Number of brand colors extracted */
  brandColorsCount: number;
  /** Brand colors if found */
  brandColors?: string[];
  /** Number of email addresses found */
  emailsCount: number;
  /** Email addresses if found */
  emails?: string[];
  /** Number of phone numbers found */
  phonesCount: number;
  /** Phone numbers if found */
  phones?: string[];
  /** Number of social links found */
  socialLinksCount: number;
  /** Social platforms found */
  socialPlatforms?: string[];
  /** Whether hero section was extracted */
  hasHeroSection: boolean;
  /** Hero headline if found */
  heroHeadline?: string;
  /** Whether business hours were found */
  hasBusinessHours: boolean;
  /** Whether services with pricing were found */
  hasServices: boolean;
  /** Number of services found */
  servicesCount?: number;
  /** Whether testimonials were found */
  hasTestimonials: boolean;
  /** Number of testimonials found */
  testimonialsCount?: number;
  /** Key features count */
  keyFeaturesCount: number;
}

/**
 * Complete response for scraper preview endpoint
 */
export interface ScraperPreviewResponse {
  /** Scraping phase results */
  scraping: {
    /** Page discovery and scraping results */
    discovery: PageDiscoveryResult;
    /** Duration of scraping in milliseconds */
    duration: number;
    /** Scraping metrics */
    metrics: ScrapingMetrics;
  };
  /** Analysis phase results */
  analysis: {
    /** Analyzed website data */
    result: {
      baseUrl: string;
      businessInfo: ExtractedBusinessInfo;
      pageContents: Record<string, string>;
      recommendedPages: string[];
      contentSummary: string;
    };
    /** Duration of analysis in milliseconds */
    duration: number;
    /** Summary of extracted data */
    extracted: ExtractedDataSummary;
  };
  /** LLM context generation */
  llmContext: {
    /** Generated context for LLM */
    context: ScrapedWebsiteContext;
    /** Estimated token count */
    estimatedTokens: number;
    /** Context size in characters */
    contextSize: number;
  };
  /** Execution metadata */
  execution: {
    /** Total duration in milliseconds */
    totalDuration: number;
    /** Timestamp of execution */
    timestamp: string;
    /** Environment where executed */
    environment: 'development' | 'staging';
  };
  /** Any warnings or non-fatal issues */
  warnings?: string[];
}

/**
 * Error response for dev API endpoints
 */
export interface DevApiErrorResponse {
  /** Error message */
  error: string;
  /** Error code */
  code: string;
  /** Success flag (always false for errors) */
  success: false;
  /** Additional error details */
  details?: string;
  /** Stack trace (only in development) */
  stack?: string;
}