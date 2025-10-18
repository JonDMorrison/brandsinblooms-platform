/**
 * Site Generation Jobs Types
 * Type definitions for LLM-powered site generation job queue system
 */

import type { Tables, Json } from '@/lib/database/types';

/**
 * Site generation job from database
 *
 * NOTE: If Tables<'site_generation_jobs'> resolves to 'never', the database types
 * need to be regenerated after creating the table. Run: pnpm generate-types
 *
 * For now, we define the type explicitly to avoid type errors.
 */
export interface SiteGenerationJob {
  id: string;
  user_id: string;
  business_info: Json;
  status: JobStatus;
  progress: number;
  site_id: string | null;
  generated_data: Json | null;
  error_message: string | null;
  error_code: string | null;
  cost_cents: number | null;
  token_usage: Json | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

/**
 * Job status values
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Business information provided by user for site generation
 */
export interface BusinessInfo {
  /** User's natural language description/prompt */
  prompt: string;
  /** Business name */
  name: string;
  /** Industry/category */
  industry?: string;
  /** Business location */
  location?: string;
  /** Business description */
  description?: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
  /** Website URL (if exists) */
  website?: string;
  /** Uploaded logo URL */
  logoUrl?: string;
  /** Brand colors/theme preferences */
  brandColors?: string;
  /** Additional business details */
  additionalDetails?: Record<string, unknown>;
  /** Optional URL to scrape and base the site generation on */
  basedOnWebsite?: string;
}

/**
 * Scraped website data for LLM context
 */
export interface ScrapedWebsiteContext {
  /** Base URL of the scraped website */
  baseUrl: string;
  /** Extracted business information from the website */
  businessInfo: {
    /** Email addresses found on the site */
    emails?: string[];
    /** Phone numbers found on the site */
    phones?: string[];
    /** Physical addresses found on the site */
    addresses?: string[];
    /** Social media links found on the site */
    socialLinks?: Array<{ platform: string; url: string }>;
    /** Logo URL found on the site */
    logoUrl?: string;
    /** Brand colors extracted from the site */
    brandColors?: string[];
    /** Hero section content from the site */
    heroSection?: {
      headline?: string;
      subheadline?: string;
      ctaText?: string;
      ctaLink?: string;
      backgroundImage?: string;
    };
    /** Business description from meta or content */
    businessDescription?: string;
    /** Site tagline */
    tagline?: string;
    /** Key features or selling points */
    keyFeatures?: string[];
    /** Structured content extracted for exact preservation */
    structuredContent?: {
      /** Business hours - MUST be preserved exactly as found */
      businessHours?: Array<{
        day: string;
        hours: string;
        closed: boolean;
      }>;
      /** Services with pricing - MUST preserve names and prices exactly */
      services?: Array<{
        name: string;
        description?: string;
        price?: string;
        duration?: string;
      }>;
      /** Customer testimonials - MUST use verbatim, never create fake ones */
      testimonials?: Array<{
        name?: string;
        role?: string;
        content: string;
        rating?: number;
      }>;
      /** FAQ questions and answers - MUST preserve exactly as found */
      faq?: Array<{
        question: string;
        answer: string;
      }>;
      /** Product/Service categories for navigation */
      productCategories?: Array<{
        name: string;
        description?: string;
        itemCount?: number;
      }>;
      /** Footer content extracted from the site */
      footerContent?: {
        copyrightText?: string;
        importantLinks?: Array<{ text: string; url: string }>;
        additionalInfo?: string;
      };
    };
    /** Font families used on the site */
    fonts?: string[];
    /** Favicon URL for branding */
    favicon?: string;
    /** Original site title from meta tags */
    siteTitle?: string;
    /** Meta description for SEO */
    siteDescription?: string;
    /** Geographic coordinates if available */
    coordinates?: {
      lat: number;
      lng: number;
    };
    /** Design tokens extracted from the site for consistent styling */
    designTokens?: {
      spacing?: {
        values: string[];
        unit: 'rem' | 'px' | 'em';
      };
      borderRadius?: {
        values: string[];
      };
      shadows?: string[];
    };
    /** Image galleries found on the site */
    galleries?: Array<{
      type: 'grid' | 'carousel' | 'masonry' | 'unknown';
      images: Array<{
        url: string;
        alt?: string;
        width?: number;
        height?: number;
        aspectRatio?: string;
      }>;
      columns?: number;
      title?: string;
    }>;
    /** Detailed page content structure */
    pageContent?: Record<string, unknown>;
  };
  /** Clean text content from each scraped page, keyed by page type */
  pageContents?: Record<string, string>;
  /** Recommended page types to generate based on discovered content */
  recommendedPages?: string[];
  /** High-level summary of the website content for LLM context */
  contentSummary?: string;
}

/**
 * Token usage tracking for LLM calls
 */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  prompt_tokens: number;
  /** Number of tokens in the completion */
  completion_tokens: number;
  /** Total tokens used */
  total_tokens: number;
}

/**
 * Hero section data
 */
export interface HeroSection {
  /** Main headline */
  headline: string;
  /** Subheadline/tagline */
  subheadline: string;
  /** Call to action text */
  cta_text: string;
  /** Background image description/requirements */
  background_image?: string;
}

/**
 * About section data
 */
export interface AboutSection {
  /** Section title */
  title: string;
  /** About content paragraphs */
  content: string[];
  /** Mission statement */
  mission?: string;
  /** Vision statement */
  vision?: string;
}

/**
 * Single value item
 */
export interface ValueItem {
  /** Value title */
  title: string;
  /** Value description */
  description: string;
  /** Icon identifier (lucide icon name) */
  icon: string;
}

/**
 * Values section data
 */
export interface ValuesSection {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** List of values */
  values: ValueItem[];
}

/**
 * Single feature item
 */
export interface FeatureItem {
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Icon identifier */
  icon: string;
}

/**
 * Features section data
 */
export interface FeaturesSection {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** List of features */
  features: FeatureItem[];
}

/**
 * Single service item
 */
export interface ServiceItem {
  /** Service name */
  name: string;
  /** Service description */
  description: string;
  /** Service price or pricing info */
  price?: string;
  /** Service duration */
  duration?: string;
}

/**
 * Services section data
 */
export interface ServicesSection {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** List of services */
  services: ServiceItem[];
}

/**
 * Single team member
 */
export interface TeamMember {
  /** Member name */
  name: string;
  /** Job title/role */
  role: string;
  /** Bio/description */
  bio: string;
  /** Profile image description */
  image?: string;
}

/**
 * Team section data
 */
export interface TeamSection {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** List of team members */
  members: TeamMember[];
}

/**
 * Single testimonial
 */
export interface Testimonial {
  /** Customer name */
  name: string;
  /** Customer role/company */
  role?: string;
  /** Testimonial content */
  content: string;
  /** Rating (1-5) */
  rating?: number;
}

/**
 * Testimonials section data
 */
export interface TestimonialsSection {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** List of testimonials */
  testimonials: Testimonial[];
}

/**
 * Contact section data
 */
export interface ContactSection {
  /** Section title */
  title: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
  /** Physical address */
  address?: string;
  /** Business hours */
  hours?: string;
  /** Additional contact info */
  additionalInfo?: Record<string, string>;
}

/**
 * Site branding/theme data
 */
export interface SiteBranding {
  /** Primary brand color (hex) */
  primary_color: string;
  /** Secondary brand color (hex) */
  secondary_color?: string;
  /** Accent color (hex) */
  accent_color?: string;
  /** Logo description/requirements */
  logo_description?: string;
  /** Font suggestions */
  font_family?: string;
}

/**
 * SEO metadata
 */
export interface SeoMetadata {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Keywords */
  keywords?: string[];
  /** Social media preview image description */
  og_image?: string;
}

/**
 * Custom page section for flexible page generation
 */
export interface CustomPageSection {
  /** Page type identifier (e.g., 'services', 'team', 'faq') */
  pageType: string;
  /** Page title */
  title: string;
  /** URL slug for the page */
  slug: string;
  /** Page content structure */
  content: {
    /** Main headline for the page */
    headline?: string;
    /** Supporting description */
    description?: string;
    /** List of items/sections on the page */
    items?: Array<{
      /** Item title */
      title: string;
      /** Item description */
      description?: string;
      /** Detailed content for the item */
      content?: string;
      /** Image URL or description */
      image?: string;
      /** Icon identifier (lucide icon name) */
      icon?: string;
    }>;
    /** Rich text content for the page */
    richText?: string;
  };
}

/**
 * Complete generated site data structure from LLM
 */
export interface GeneratedSiteData {
  /** Site name */
  site_name: string;
  /** Site tagline/slogan */
  tagline: string;
  /** Site description */
  description: string;
  /** Hero section */
  hero: HeroSection;
  /** About section */
  about: AboutSection;
  /** Values section */
  values?: ValuesSection;
  /** Features section */
  features?: FeaturesSection;
  /** Services section */
  services?: ServicesSection;
  /** Team section */
  team?: TeamSection;
  /** Testimonials section */
  testimonials?: TestimonialsSection;
  /** Contact section */
  contact: ContactSection;
  /** Branding/theme */
  branding: SiteBranding;
  /** SEO metadata */
  seo: SeoMetadata;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Custom pages based on scraped content */
  customPages?: CustomPageSection[];
}

/**
 * Parameters for creating a new job
 */
export interface CreateJobParams {
  /** User ID who initiated the job */
  userId: string;
  /** Business information from user input */
  businessInfo: BusinessInfo;
}

/**
 * Parameters for updating job status
 */
export interface UpdateJobStatusParams {
  /** Job ID */
  jobId: string;
  /** New status */
  status: JobStatus;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Parameters for updating job result
 */
export interface UpdateJobResultParams {
  /** Job ID */
  jobId: string;
  /** Created site ID */
  siteId: string;
  /** Generated site data */
  generatedData: GeneratedSiteData;
  /** Cost in cents */
  costCents?: number;
  /** Token usage */
  tokenUsage?: TokenUsage;
}

/**
 * Parameters for updating job error
 */
export interface UpdateJobErrorParams {
  /** Job ID */
  jobId: string;
  /** Error message */
  errorMessage: string;
  /** Error code/category */
  errorCode?: string;
  /** Cost incurred before failure (cents) */
  costCents?: number;
  /** Token usage before failure */
  tokenUsage?: TokenUsage;
}

/**
 * Job statistics response
 */
export interface JobStatistics {
  /** Total number of jobs */
  total_jobs: number;
  /** Pending jobs count */
  pending_jobs: number;
  /** Processing jobs count */
  processing_jobs: number;
  /** Completed jobs count */
  completed_jobs: number;
  /** Failed jobs count */
  failed_jobs: number;
  /** Total cost in cents */
  total_cost_cents: number;
  /** Average completion time in seconds */
  avg_completion_time_seconds: number | null;
}

/**
 * Options for querying user jobs
 */
export interface GetUserJobsOptions {
  /** User ID */
  userId: string;
  /** Maximum number of jobs to return */
  limit?: number;
  /** Filter by status */
  status?: JobStatus;
  /** Include only recent jobs (days) */
  recentDays?: number;
}