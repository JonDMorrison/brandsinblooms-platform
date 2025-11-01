/**
 * Type definitions for LLM-based content extraction
 *
 * These schemas define the expected response structure from LLM models
 * during the two-phase extraction process:
 * - Phase 1: Visual brand analysis (vision model)
 * - Phase 2: Structured content extraction (text model, parallel)
 */

/**
 * Phase 1: Visual Brand Analysis Response
 *
 * Extracts visual brand identity from homepage screenshot and HTML structure.
 * Uses vision-capable model (x-ai/grok-2-vision-1212).
 */
export interface VisualBrandAnalysisResponse {
  /** Primary brand colors in hex format (e.g., ["#FF5733", "#3366FF"]) */
  brandColors: string[];
  /** Logo URL if detected in images */
  logoUrl?: string;
  /** Primary font families detected (ordered by prominence) */
  fonts?: string[];
  /** Typography styles for different text elements */
  typography?: {
    /** Heading typography (h1, h2, etc.) */
    heading?: {
      fontFamily?: string;
      fontWeight?: string | number;
      textColor?: string;
      fontSize?: string;
    };
    /** Body text typography */
    body?: {
      fontFamily?: string;
      fontWeight?: string | number;
      textColor?: string;
      fontSize?: string;
      lineHeight?: string;
    };
    /** Accent/emphasis text typography */
    accent?: {
      fontFamily?: string;
      fontWeight?: string | number;
      textColor?: string;
    };
  };
  /** Design tokens extracted from visual inspection */
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
  /** Overall visual style assessment */
  visualStyle?: {
    theme?: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant';
    mood?: string;
  };
  /** Confidence score for brand color extraction (0-1) */
  confidence: number;
}

/**
 * Phase 2A: Contact Information Extraction Response
 *
 * Extracts contact details from text content.
 * Uses fast text model (x-ai/grok-code-fast-1).
 */
export interface ContactExtractionResponse {
  /** Email addresses found */
  emails: string[];
  /** Phone numbers found (formatted) */
  phones: string[];
  /** Physical addresses found */
  addresses: string[];
  /** Business hours if available */
  hours?: Record<string, { open: string | null; close: string | null; closed: boolean }>;
  /** Social media links */
  socialLinks: Array<{ platform: string; url: string }>;
  /** Geographic coordinates if detected */
  coordinates?: { lat: number; lng: number };
  /** Confidence score for contact extraction (0-1) */
  confidence: number;
}

/**
 * Phase 2B: Content Structure Extraction Response
 *
 * Extracts main content structure and copy from text.
 * Uses fast text model (x-ai/grok-code-fast-1).
 */
export interface ContentExtractionResponse {
  /** Site metadata */
  siteTitle?: string;
  siteDescription?: string;
  favicon?: string;
  /** Business description/tagline */
  businessDescription?: string;
  tagline?: string;
  /** Key features or value propositions */
  keyFeatures: string[];
  /** Hero section content */
  heroSection?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
  };
  /** Gallery data if found */
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
  /** Main page content sections */
  pageContent?: {
    mainContent: string;
    footerText: string;
    sidebarContent?: string;
  };
  /** Confidence score for content extraction (0-1) */
  confidence: number;
}

/**
 * Phase 2C: Social Proof & Structured Data Extraction Response
 *
 * Extracts testimonials, FAQs, services, and other structured content.
 * Uses fast text model (x-ai/grok-code-fast-1).
 */
export interface SocialProofExtractionResponse {
  /** Structured content sections */
  structuredContent?: {
    businessHours?: Array<{
      day: string;
      hours: string;
      closed: boolean;
    }>;
    services?: Array<{
      name: string;
      description?: string;
      price?: string;
      duration?: string;
    }>;
    testimonials?: Array<{
      name?: string;
      role?: string;
      content: string;
      rating?: number;
    }>;
    faq?: Array<{
      question: string;
      answer: string;
    }>;
    productCategories?: Array<{
      name: string;
      description?: string;
      itemCount?: number;
    }>;
    footerContent?: {
      copyrightText?: string;
      importantLinks?: Array<{ text: string; url: string }>;
      additionalInfo?: string;
    };
  };
  /** Confidence score for structured data extraction (0-1) */
  confidence: number;
}

/**
 * Phase 2D: Image Extraction Response
 *
 * Extracts all images from HTML with categorization and metadata.
 * Uses fast text model (x-ai/grok-code-fast-1).
 */
export interface ImageExtractionResponse {
  /** All extracted images */
  images: Array<{
    /** Full absolute URL */
    url: string;
    /** Image type/purpose */
    type: 'hero' | 'gallery' | 'product' | 'feature' | 'team' | 'logo' | 'other';
    /** How the image was found */
    context: 'background-image' | 'css-variable' | 'img-tag' | 'picture-element' | 'data-attribute';
    /** CSS selector or element that contained the image */
    selector: string;
    /** Alt text if available */
    alt?: string;
    /** Image dimensions if available */
    dimensions?: {
      width: number;
      height: number;
    };
    /** Extraction confidence (0-1) */
    confidence: number;
  }>;
  /** Overall extraction confidence (0-1) */
  confidence: number;
}

/**
 * Phase 2E: Social Media Links Extraction Response
 *
 * Extracts social media profile URLs from HTML.
 * Uses fast text model (x-ai/grok-code-fast-1).
 */
export interface SocialMediaExtractionResponse {
  /** Extracted social media links */
  socialLinks: Array<{
    /** Platform identifier (lowercase) */
    platform: 'facebook' | 'instagram' | 'twitter' | 'x' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'snapchat' | 'whatsapp' | 'yelp';
    /** Complete URL to the business profile */
    url: string;
    /** Extraction confidence (0-1) */
    confidence: number;
    /** Where the link was found on the page */
    location: 'footer' | 'header' | 'content' | 'sidebar' | 'contact';
    /** Method used to extract the link */
    extractionMethod: 'direct_link' | 'icon_link' | 'schema_markup' | 'inferred';
    /** Username or handle if extracted */
    username?: string;
    /** Any relevant notes or warnings about this link */
    notes?: string;
  }>;
  /** Metadata about the extraction process */
  extractionMetadata: {
    /** Total number of social links found */
    totalLinksFound: number;
    /** Description of primary location where links were found */
    primarySocialSection?: string;
    /** Whether structured data (JSON-LD, schema.org) was present */
    hasStructuredData: boolean;
    /** URLs that were unclear or ambiguous */
    ambiguousLinks?: string[];
  };
  /** Overall extraction confidence (0-1) */
  confidence: number;
}

/**
 * Validation result for extracted data
 */
export interface ValidationResult {
  /** Whether the data passes validation */
  isValid: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Validation errors if any */
  errors?: string[];
  /** Validation warnings */
  warnings?: string[];
}

/**
 * Combined extraction result metadata
 */
export interface ExtractionMetadata {
  /** Phase 1 completion status */
  phase1Complete: boolean;
  /** Phase 2A completion status */
  phase2aComplete: boolean;
  /** Phase 2B completion status */
  phase2bComplete: boolean;
  /** Phase 2C completion status */
  phase2cComplete: boolean;
  /** Phase 2D completion status */
  phase2dComplete: boolean;
  /** Phase 2E completion status */
  phase2eComplete: boolean;
  /** Overall extraction success */
  success: boolean;
  /** Whether fallback extraction was used */
  usedFallback: boolean;
  /** Total time taken (ms) */
  durationMs?: number;
  /** Errors encountered during extraction */
  errors?: string[];
  /** Warnings from extraction */
  warnings?: string[];
}

/**
 * Type guard to check if response has minimum required fields
 */
export function hasMinimumBrandData(data: VisualBrandAnalysisResponse): boolean {
  return data.brandColors.length > 0 && data.confidence >= 0.3;
}

/**
 * Type guard to check if contact data is sufficient
 */
export function hasMinimumContactData(data: ContactExtractionResponse): boolean {
  return (
    (data.emails.length > 0 || data.phones.length > 0 || data.addresses.length > 0) &&
    data.confidence >= 0.3
  );
}

/**
 * Type guard to check if content data is sufficient
 */
export function hasMinimumContentData(data: ContentExtractionResponse): boolean {
  return (
    (data.siteTitle !== undefined ||
     data.businessDescription !== undefined ||
     data.keyFeatures.length > 0) &&
    data.confidence >= 0.3
  );
}

/**
 * Type guard to check if image data is sufficient
 */
export function hasMinimumImageData(data: ImageExtractionResponse): boolean {
  return (
    data.images.length > 0 &&
    data.confidence >= 0.3
  );
}

/**
 * Type guard to check if social media data is sufficient
 */
export function hasMinimumSocialMediaData(data: SocialMediaExtractionResponse): boolean {
  return (
    data.socialLinks.length > 0 &&
    data.confidence >= 0.3
  );
}
