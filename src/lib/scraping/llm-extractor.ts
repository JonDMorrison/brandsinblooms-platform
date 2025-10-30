/**
 * LLM-based content extraction system
 *
 * Two-phase hybrid approach:
 * - Phase 1: Vision model for brand identity (grok-2-vision)
 * - Phase 2: Fast text model for content extraction (grok-code-fast), parallel
 *
 * Falls back to algorithmic extraction on failure.
 */

import { generateWithVision, generateWithOpenRouter } from '@/lib/ai/openrouter-client';
import type { VisionMessage } from '@/lib/ai/openrouter-client';
import { extractBusinessInfo, type ExtractedBusinessInfo } from './content-extractor';
import { handleError } from '@/lib/types/error-handling';
import {
  preprocessHtmlForVision,
  preprocessHtmlForText,
  extractFavicon
} from './preprocessors/html-preprocessor';
import {
  VISUAL_EXTRACTION_SYSTEM_PROMPT,
  buildVisualExtractionPrompt
} from './prompts/visual-extraction-prompt';
import {
  CONTACT_EXTRACTION_SYSTEM_PROMPT,
  buildContactExtractionPrompt
} from './prompts/contact-extraction-prompt';
import {
  CONTENT_EXTRACTION_SYSTEM_PROMPT,
  buildContentExtractionPrompt
} from './prompts/content-extraction-prompt';
import {
  SOCIAL_PROOF_EXTRACTION_SYSTEM_PROMPT,
  buildSocialProofExtractionPrompt
} from './prompts/social-proof-extraction-prompt';
import {
  EXTRACTION_MODELS,
  PHASE1_OPTIONS,
  PHASE2_OPTIONS,
  EXTRACTION_FLAGS,
  CONFIDENCE_THRESHOLDS
} from './llm-extractor-config';
import type {
  VisualBrandAnalysisResponse,
  ContactExtractionResponse,
  ContentExtractionResponse,
  SocialProofExtractionResponse,
  ExtractionMetadata
} from '@/lib/types/extraction-schemas';
import {
  hasMinimumBrandData,
  hasMinimumContactData,
  hasMinimumContentData
} from '@/lib/types/extraction-schemas';

/**
 * Main entry point for LLM-based extraction
 *
 * @param html - Raw HTML content
 * @param baseUrl - Base URL of the website
 * @param screenshot - Optional base64-encoded screenshot
 * @returns Extracted business information
 */
export async function extractBusinessInfoWithLLM(
  html: string,
  baseUrl: string,
  screenshot?: string
): Promise<ExtractedBusinessInfo> {
  const startTime = Date.now();
  const metadata: ExtractionMetadata = {
    phase1Complete: false,
    phase2aComplete: false,
    phase2bComplete: false,
    phase2cComplete: false,
    success: false,
    usedFallback: false,
    errors: [],
    warnings: []
  };

  try {
    // Preprocess HTML for both phases
    const visualHtml = preprocessHtmlForVision(html);
    const textHtml = preprocessHtmlForText(html, baseUrl);  // Pass baseUrl for hero image URL resolution

    if (EXTRACTION_FLAGS.LOG_METRICS) {
      console.log('[LLM Extraction] Preprocessed HTML:');
      console.log(`  Visual HTML: ${visualHtml.length} bytes`);
      console.log(`  Text HTML: ${textHtml.length} bytes`);
    }

    // Phase 1: Visual brand analysis
    let visualData: VisualBrandAnalysisResponse | undefined;
    try {
      visualData = await extractVisualBrand(visualHtml, baseUrl, screenshot);
      metadata.phase1Complete = true;

      if (EXTRACTION_FLAGS.LOG_METRICS) {
        console.log('[LLM Extraction] Phase 1 complete:');
        console.log(`  Brand colors: ${visualData.brandColors.length}`);
        console.log(`  Logo: ${visualData.logoUrl ? 'found' : 'not found'}`);
        console.log(`  Confidence: ${visualData.confidence}`);
      }
    } catch (error: unknown) {
      const errorInfo = handleError(error);
      metadata.errors?.push(`Phase 1 failed: ${errorInfo.message}`);
      console.warn(`[LLM Extraction] Phase 1 failed: ${errorInfo.message}`);
    }

    // Phase 2: Parallel text extraction
    const phase2Results = await Promise.allSettled([
      extractContactInfo(textHtml, baseUrl),
      extractContentStructure(textHtml, baseUrl),
      extractSocialProof(textHtml, baseUrl)
    ]);

    // Extract results from Phase 2
    let contactData: ContactExtractionResponse | undefined;
    let contentData: ContentExtractionResponse | undefined;
    let socialProofData: SocialProofExtractionResponse | undefined;

    // Phase 2A: Contact info
    if (phase2Results[0].status === 'fulfilled') {
      contactData = phase2Results[0].value;
      metadata.phase2aComplete = true;

      if (EXTRACTION_FLAGS.LOG_METRICS) {
        console.log('[LLM Extraction] Phase 2A complete:');
        console.log(`  Emails: ${contactData.emails.length}`);
        console.log(`  Phones: ${contactData.phones.length}`);
        console.log(`  Confidence: ${contactData.confidence}`);
      }
    } else {
      const errorInfo = handleError(phase2Results[0].reason);
      metadata.errors?.push(`Phase 2A failed: ${errorInfo.message}`);
      console.warn(`[LLM Extraction] Phase 2A failed: ${errorInfo.message}`);
    }

    // Phase 2B: Content structure
    if (phase2Results[1].status === 'fulfilled') {
      contentData = phase2Results[1].value;
      metadata.phase2bComplete = true;

      if (EXTRACTION_FLAGS.LOG_METRICS) {
        console.log('[LLM Extraction] Phase 2B complete:');
        console.log(`  Site title: ${contentData.siteTitle || 'not found'}`);
        console.log(`  Key features: ${contentData.keyFeatures.length}`);
        console.log(`  Confidence: ${contentData.confidence}`);
      }
    } else {
      const errorInfo = handleError(phase2Results[1].reason);
      metadata.errors?.push(`Phase 2B failed: ${errorInfo.message}`);
      console.warn(`[LLM Extraction] Phase 2B failed: ${errorInfo.message}`);
    }

    // Phase 2C: Social proof
    if (phase2Results[2].status === 'fulfilled') {
      socialProofData = phase2Results[2].value;
      metadata.phase2cComplete = true;

      if (EXTRACTION_FLAGS.LOG_METRICS) {
        console.log('[LLM Extraction] Phase 2C complete:');
        console.log(`  Testimonials: ${socialProofData.structuredContent?.testimonials?.length || 0}`);
        console.log(`  Services: ${socialProofData.structuredContent?.services?.length || 0}`);
        console.log(`  Confidence: ${socialProofData.confidence}`);
      }
    } else {
      const errorInfo = handleError(phase2Results[2].reason);
      metadata.errors?.push(`Phase 2C failed: ${errorInfo.message}`);
      console.warn(`[LLM Extraction] Phase 2C failed: ${errorInfo.message}`);
    }

    // Merge results
    const result = mergeExtractionResults(
      visualData,
      contactData,
      contentData,
      socialProofData,
      baseUrl
    );

    // Check if we have minimum required data
    const hasMinimum = hasMinimumData(result);
    metadata.success = hasMinimum;
    metadata.durationMs = Date.now() - startTime;

    if (EXTRACTION_FLAGS.LOG_METRICS) {
      console.log(`[LLM Extraction] Complete in ${metadata.durationMs}ms`);
      console.log(`  Success: ${metadata.success}`);
      console.log(`  Errors: ${metadata.errors?.length || 0}`);
    }

    // Fallback to algorithmic if needed
    if (!hasMinimum && EXTRACTION_FLAGS.ENABLE_FALLBACK) {
      metadata.warnings?.push('Insufficient LLM data, using fallback');
      console.warn('[LLM Extraction] Insufficient data, falling back to algorithmic extraction');
      metadata.usedFallback = true;
      return extractBusinessInfo(html, baseUrl);
    }

    return result;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    metadata.errors?.push(`Extraction failed: ${errorInfo.message}`);
    metadata.durationMs = Date.now() - startTime;

    console.error('[LLM Extraction] Fatal error:', errorInfo.message);

    // Fallback to algorithmic extraction
    if (EXTRACTION_FLAGS.ENABLE_FALLBACK) {
      console.warn('[LLM Extraction] Using fallback extraction');
      metadata.usedFallback = true;
      return extractBusinessInfo(html, baseUrl);
    }

    throw new Error(`LLM extraction failed: ${errorInfo.message}`);
  }
}

/**
 * Phase 1: Extract visual brand identity
 */
async function extractVisualBrand(
  visualHtml: string,
  baseUrl: string,
  screenshot?: string
): Promise<VisualBrandAnalysisResponse> {
  const userPrompt = buildVisualExtractionPrompt(visualHtml, baseUrl, screenshot);

  // Build messages with optional screenshot
  const messages: VisionMessage[] = [
    { role: 'system', content: VISUAL_EXTRACTION_SYSTEM_PROMPT }
  ];

  if (screenshot) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        {
          type: 'image_url',
          image_url: {
            url: screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`,
            detail: 'high'
          }
        }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userPrompt });
  }

  if (EXTRACTION_FLAGS.LOG_PROMPTS) {
    console.log('[LLM Extraction] Phase 1 prompt:', userPrompt.substring(0, 500));
  }

  const response = await generateWithVision<VisualBrandAnalysisResponse>(
    messages,
    EXTRACTION_MODELS.VISION,
    PHASE1_OPTIONS
  );

  return response.content;
}

/**
 * Phase 2A: Extract contact information
 */
async function extractContactInfo(
  textHtml: string,
  baseUrl: string
): Promise<ContactExtractionResponse> {
  const userPrompt = buildContactExtractionPrompt(textHtml, baseUrl);

  if (EXTRACTION_FLAGS.LOG_PROMPTS) {
    console.log('[LLM Extraction] Phase 2A prompt:', userPrompt.substring(0, 500));
  }

  const response = await generateWithOpenRouter<ContactExtractionResponse>(
    userPrompt,
    CONTACT_EXTRACTION_SYSTEM_PROMPT,
    PHASE2_OPTIONS,
    EXTRACTION_MODELS.TEXT
  );

  return response.content;
}

/**
 * Phase 2B: Extract content structure
 */
async function extractContentStructure(
  textHtml: string,
  baseUrl: string
): Promise<ContentExtractionResponse> {
  const userPrompt = buildContentExtractionPrompt(textHtml, baseUrl);

  if (EXTRACTION_FLAGS.LOG_PROMPTS) {
    console.log('[LLM Extraction] Phase 2B prompt:', userPrompt.substring(0, 500));
  }

  const response = await generateWithOpenRouter<ContentExtractionResponse>(
    userPrompt,
    CONTENT_EXTRACTION_SYSTEM_PROMPT,
    PHASE2_OPTIONS,
    EXTRACTION_MODELS.TEXT
  );

  return response.content;
}

/**
 * Phase 2C: Extract social proof and structured data
 */
async function extractSocialProof(
  textHtml: string,
  baseUrl: string
): Promise<SocialProofExtractionResponse> {
  const userPrompt = buildSocialProofExtractionPrompt(textHtml, baseUrl);

  if (EXTRACTION_FLAGS.LOG_PROMPTS) {
    console.log('[LLM Extraction] Phase 2C prompt:', userPrompt.substring(0, 500));
  }

  const response = await generateWithOpenRouter<SocialProofExtractionResponse>(
    userPrompt,
    SOCIAL_PROOF_EXTRACTION_SYSTEM_PROMPT,
    PHASE2_OPTIONS,
    EXTRACTION_MODELS.TEXT
  );

  return response.content;
}

/**
 * Merge extraction results into ExtractedBusinessInfo format
 */
function mergeExtractionResults(
  visual?: VisualBrandAnalysisResponse,
  contact?: ContactExtractionResponse,
  content?: ContentExtractionResponse,
  socialProof?: SocialProofExtractionResponse,
  baseUrl?: string
): ExtractedBusinessInfo {
  return {
    // Contact information (from Phase 2A)
    emails: contact?.emails || [],
    phones: contact?.phones || [],
    addresses: contact?.addresses || [],
    hours: contact?.hours,
    coordinates: contact?.coordinates,

    // Social media (from Phase 2A)
    socialLinks: contact?.socialLinks || [],

    // Branding (from Phase 1)
    logoUrl: visual?.logoUrl,
    brandColors: visual?.brandColors || [],
    fonts: visual?.fonts,
    designTokens: visual?.designTokens,

    // Content (from Phase 2B)
    businessDescription: content?.businessDescription,
    tagline: content?.tagline,
    keyFeatures: content?.keyFeatures || [],
    heroSection: content?.heroSection,
    galleries: content?.galleries,

    // Metadata (from Phase 2B)
    siteTitle: content?.siteTitle,
    siteDescription: content?.siteDescription,
    favicon: content?.favicon,

    // Page content (from Phase 2B)
    pageContent: content?.pageContent,

    // Structured content (from Phase 2C)
    structuredContent: socialProof?.structuredContent
  };
}

/**
 * Check if extraction has minimum required data
 */
function hasMinimumData(data: ExtractedBusinessInfo): boolean {
  // Check if we have at least some useful data
  const hasContact = data.emails.length > 0 || data.phones.length > 0 || data.addresses.length > 0;
  const hasBranding = data.brandColors.length > 0 || data.logoUrl !== undefined;
  const hasContent =
    data.siteTitle !== undefined ||
    data.businessDescription !== undefined ||
    data.keyFeatures.length > 0;

  // We need at least 2 of the 3 categories
  const categoriesFound = [hasContact, hasBranding, hasContent].filter(Boolean).length;

  return categoriesFound >= 2;
}
