/**
 * Site Generator Service - LLM-powered site generation orchestration
 *
 * This module orchestrates the complete site generation process using LLMs.
 * It implements a two-phase approach:
 *
 * Phase 1: Generate site foundation (metadata + theme + hero) in one call
 * Phase 2: Generate page sections in parallel (About, Values, Features, etc.)
 *
 * The service handles:
 * - Parallel LLM calls for efficiency
 * - Token usage and cost tracking
 * - Partial failure handling (some sections fail, others succeed)
 * - Retry logic for failed sections
 * - Comprehensive error logging
 *
 * @example
 * ```typescript
 * const result = await generateSiteContent({
 *   prompt: "Create a website for my garden center",
 *   name: "Green Thumb Gardens",
 *   location: "Portland, OR"
 * });
 *
 * console.log('Generated site:', result.data.site_name);
 * console.log('Total cost:', result.totalCostCents, 'cents');
 * console.log('Total tokens:', result.totalTokens);
 * ```
 */

import { generateWithOpenRouter } from '@/lib/ai/openrouter-client';
import {
  SITE_FOUNDATION_SYSTEM_PROMPT,
  PAGE_GENERATION_SYSTEM_PROMPT,
  buildFoundationPrompt,
  buildPagePrompt
} from '@/lib/ai/prompts/site-generation-prompts';
import {
  parseFoundationResponse,
  parseAboutSectionResponse,
  parseValuesSectionResponse,
  parseFeaturesSectionResponse,
  parseServicesSectionResponse,
  parseTeamSectionResponse,
  parseTestimonialsSectionResponse,
  parseContactSectionResponse,
  type FoundationData
} from '@/lib/ai/response-parser';
import {
  type BusinessInfo,
  type GeneratedSiteData,
  type TokenUsage,
  type AboutSection,
  type ValuesSection,
  type FeaturesSection,
  type ServicesSection,
  type TeamSection,
  type TestimonialsSection,
  type ContactSection,
  type SiteBranding
} from '@/lib/types/site-generation-jobs';
import { handleError } from '@/lib/types/error-handling';
import { isOpenRouterError } from '@/lib/types/openrouter';

/**
 * Pricing information for cost calculation
 * Based on OpenRouter's pricing for x-ai/grok-code-fast-1
 * These values should be updated if model or pricing changes
 */
const PRICING = {
  // Cost per 1M tokens (in cents)
  PROMPT_TOKENS_PER_MILLION: 5, // $0.05 per 1M prompt tokens
  COMPLETION_TOKENS_PER_MILLION: 10 // $0.10 per 1M completion tokens
};

/**
 * Result from site generation including data, usage, and cost
 */
export interface SiteGenerationResult {
  /** Generated site data */
  data: GeneratedSiteData;
  /** Combined token usage from all LLM calls */
  tokenUsage: TokenUsage;
  /** Total cost in cents */
  totalCostCents: number;
  /** Total number of LLM calls made */
  totalCalls: number;
  /** Sections that failed to generate (partial failure) */
  failedSections: string[];
}

/**
 * Calculate cost in cents based on token usage
 *
 * @param usage - Token usage from LLM call
 * @returns Cost in cents
 */
function calculateCost(usage: TokenUsage): number {
  const promptCost = (usage.prompt_tokens / 1_000_000) * PRICING.PROMPT_TOKENS_PER_MILLION;
  const completionCost =
    (usage.completion_tokens / 1_000_000) * PRICING.COMPLETION_TOKENS_PER_MILLION;
  return Math.ceil(promptCost + completionCost);
}

/**
 * Generate site foundation (Phase 1)
 *
 * Generates the core site metadata, branding/theme, and hero section
 * in a single LLM call. This establishes the foundation that will be
 * used to generate the individual page sections.
 *
 * @param businessInfo - Business information from user
 * @returns Foundation data including metadata, branding, and hero
 * @throws Error if generation or parsing fails
 *
 * @example
 * ```typescript
 * const foundation = await generateFoundation({
 *   prompt: "Create a website for my plant shop",
 *   name: "Urban Jungle",
 *   location: "Seattle, WA"
 * });
 * console.log('Primary color:', foundation.branding.primary_color);
 * ```
 */
export async function generateFoundation(businessInfo: BusinessInfo): Promise<FoundationData> {
  const userPrompt = buildFoundationPrompt(businessInfo);

  console.log('Generating site foundation...');

  try {
    const response = await generateWithOpenRouter<string>(
      userPrompt,
      SITE_FOUNDATION_SYSTEM_PROMPT,
      {
        temperature: 0.8, // Slightly creative for branding
        maxTokens: 2000,
        timeout: 45000 // 45 seconds for foundation
      }
    );

    // Parse the response
    const foundation = parseFoundationResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!foundation) {
      throw new Error('Failed to parse foundation response from LLM');
    }

    console.log('Foundation generated successfully:', foundation.site_name);
    return foundation;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate foundation:', errorInfo.message);
    throw new Error(`Foundation generation failed: ${errorInfo.message}`);
  }
}

/**
 * Generate About section
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns About section data or null on failure
 */
export async function generateAboutSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<AboutSection | null> {
  const userPrompt = buildPagePrompt('about', businessInfo, theme);

  console.log('Generating About section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 30000,
      retries: 2
    });

    const section = parseAboutSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.error('Failed to parse About section response');
      return null;
    }

    console.log('About section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate About section:', errorInfo.message);
    return null;
  }
}

/**
 * Generate Values section
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns Values section data or null on failure
 */
export async function generateValuesSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<ValuesSection | null> {
  const userPrompt = buildPagePrompt('values', businessInfo, theme);

  console.log('Generating Values section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 30000,
      retries: 2
    });

    const section = parseValuesSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.error('Failed to parse Values section response');
      return null;
    }

    console.log('Values section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate Values section:', errorInfo.message);
    return null;
  }
}

/**
 * Generate Features section
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns Features section data or null on failure
 */
export async function generateFeaturesSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<FeaturesSection | null> {
  const userPrompt = buildPagePrompt('features', businessInfo, theme);

  console.log('Generating Features section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 30000,
      retries: 2
    });

    const section = parseFeaturesSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.error('Failed to parse Features section response');
      return null;
    }

    console.log('Features section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate Features section:', errorInfo.message);
    return null;
  }
}

/**
 * Generate Services section (optional)
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns Services section data or null if not applicable
 */
export async function generateServicesSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<ServicesSection | null> {
  const userPrompt = buildPagePrompt('services', businessInfo, theme);

  console.log('Generating Services section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 30000,
      retries: 2
    });

    const section = parseServicesSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.log('Services section not applicable or failed to parse');
      return null;
    }

    console.log('Services section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate Services section:', errorInfo.message);
    return null;
  }
}

/**
 * Generate Team section (optional)
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns Team section data or null if not applicable
 */
export async function generateTeamSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<TeamSection | null> {
  const userPrompt = buildPagePrompt('team', businessInfo, theme);

  console.log('Generating Team section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 30000,
      retries: 2
    });

    const section = parseTeamSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.log('Team section not applicable or failed to parse');
      return null;
    }

    console.log('Team section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate Team section:', errorInfo.message);
    return null;
  }
}

/**
 * Generate Testimonials section
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns Testimonials section data or null on failure
 */
export async function generateTestimonialsSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<TestimonialsSection | null> {
  const userPrompt = buildPagePrompt('testimonials', businessInfo, theme);

  console.log('Generating Testimonials section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.8, // More creative for testimonials
      maxTokens: 2000, // More tokens for multiple testimonials
      timeout: 30000,
      retries: 2
    });

    const section = parseTestimonialsSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.error('Failed to parse Testimonials section response');
      return null;
    }

    console.log('Testimonials section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate Testimonials section:', errorInfo.message);
    return null;
  }
}

/**
 * Generate Contact section
 *
 * @param businessInfo - Business information
 * @param theme - Site branding/theme from foundation
 * @returns Contact section data or null on failure
 */
export async function generateContactSection(
  businessInfo: BusinessInfo,
  theme: SiteBranding
): Promise<ContactSection | null> {
  const userPrompt = buildPagePrompt('contact', businessInfo, theme);

  console.log('Generating Contact section...');

  try {
    const response = await generateWithOpenRouter<string>(userPrompt, PAGE_GENERATION_SYSTEM_PROMPT, {
      temperature: 0.5, // Less creative for factual contact info
      maxTokens: 1000,
      timeout: 30000,
      retries: 2
    });

    const section = parseContactSectionResponse(
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    );

    if (!section) {
      console.error('Failed to parse Contact section response');
      return null;
    }

    console.log('Contact section generated successfully');
    return section;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to generate Contact section:', errorInfo.message);
    return null;
  }
}

/**
 * Main orchestrator for complete site generation
 *
 * This function coordinates the entire site generation process:
 * 1. Phase 1: Generate foundation (metadata, theme, hero)
 * 2. Phase 2: Generate all page sections in parallel
 * 3. Combine results into complete GeneratedSiteData
 * 4. Track token usage and calculate costs
 * 5. Handle partial failures gracefully
 *
 * @param businessInfo - Business information from user input
 * @returns Complete site generation result with data, usage, and cost
 * @throws Error if foundation generation fails (Phase 1 is critical)
 *
 * @example
 * ```typescript
 * const result = await generateSiteContent({
 *   prompt: "Create a modern website for my garden center",
 *   name: "Bloom & Grow Gardens",
 *   industry: "garden center",
 *   location: "Austin, TX",
 *   email: "hello@bloomandgrow.com",
 *   phone: "(512) 555-1234"
 * });
 *
 * if (result.failedSections.length > 0) {
 *   console.warn('Some sections failed:', result.failedSections);
 * }
 *
 * console.log('Generated site:', result.data.site_name);
 * console.log('Total cost:', result.totalCostCents / 100, 'dollars');
 * ```
 */
export async function generateSiteContent(
  businessInfo: BusinessInfo
): Promise<SiteGenerationResult> {
  console.log('Starting site generation for:', businessInfo.name);

  const startTime = Date.now();
  const failedSections: string[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCalls = 0;

  try {
    // PHASE 1: Generate foundation (critical - must succeed)
    console.log('\n=== PHASE 1: Generating Foundation ===');
    const foundationResponse = await generateWithOpenRouter<string>(
      buildFoundationPrompt(businessInfo),
      SITE_FOUNDATION_SYSTEM_PROMPT,
      {
        temperature: 0.8,
        maxTokens: 2000,
        timeout: 45000
      }
    );

    totalCalls++;
    if (foundationResponse.usage) {
      totalPromptTokens += foundationResponse.usage.promptTokens;
      totalCompletionTokens += foundationResponse.usage.completionTokens;
    }

    const foundation = parseFoundationResponse(
      typeof foundationResponse.content === 'string'
        ? foundationResponse.content
        : JSON.stringify(foundationResponse.content)
    );

    if (!foundation) {
      throw new Error('Failed to parse foundation response - cannot continue');
    }

    console.log('Foundation generated:', foundation.site_name);

    // PHASE 2: Generate page sections in parallel
    console.log('\n=== PHASE 2: Generating Page Sections (Parallel) ===');

    // Create all section generation promises
    const sectionPromises = [
      // Required sections
      generateWithOpenRouter<string>(
        buildPagePrompt('about', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'about', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('contact', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.5, maxTokens: 1000, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'contact', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('testimonials', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.8, maxTokens: 2000, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'testimonials', response: res })),

      // Optional sections
      generateWithOpenRouter<string>(
        buildPagePrompt('values', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'values', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('features', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'features', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('services', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'services', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('team', businessInfo, foundation.branding),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'team', response: res }))
    ];

    // Wait for all sections to complete (or fail)
    const sectionResults = await Promise.allSettled(sectionPromises);

    // Parse and collect section results
    let about: AboutSection | null = null;
    let contact: ContactSection | null = null;
    let testimonials: TestimonialsSection | null = null;
    let values: ValuesSection | null = null;
    let features: FeaturesSection | null = null;
    let services: ServicesSection | null = null;
    let team: TeamSection | null = null;

    for (const result of sectionResults) {
      if (result.status === 'fulfilled') {
        const { type, response } = result.value;
        totalCalls++;

        // Track token usage
        if (response.usage) {
          totalPromptTokens += response.usage.promptTokens;
          totalCompletionTokens += response.usage.completionTokens;
        }

        // Parse section based on type
        const content =
          typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

        switch (type) {
          case 'about':
            about = parseAboutSectionResponse(content);
            if (!about) failedSections.push('about');
            break;
          case 'contact':
            contact = parseContactSectionResponse(content);
            if (!contact) failedSections.push('contact');
            break;
          case 'testimonials':
            testimonials = parseTestimonialsSectionResponse(content);
            if (!testimonials) failedSections.push('testimonials');
            break;
          case 'values':
            values = parseValuesSectionResponse(content);
            break;
          case 'features':
            features = parseFeaturesSectionResponse(content);
            break;
          case 'services':
            services = parseServicesSectionResponse(content);
            break;
          case 'team':
            team = parseTeamSectionResponse(content);
            break;
        }
      } else {
        // Section generation failed
        const error = result.reason;
        const errorInfo = handleError(error);
        console.error('Section generation failed:', errorInfo.message);

        // Try to determine which section failed
        if (isOpenRouterError(error)) {
          failedSections.push('unknown-section');
        }
      }
    }

    // Validate required sections
    if (!about) {
      throw new Error('About section is required but failed to generate');
    }
    if (!contact) {
      throw new Error('Contact section is required but failed to generate');
    }

    // Build complete site data
    const siteData: GeneratedSiteData = {
      site_name: foundation.site_name,
      tagline: foundation.tagline,
      description: foundation.description,
      hero: foundation.hero,
      about,
      contact,
      branding: foundation.branding,
      seo: foundation.seo,
      // Optional sections
      values: values || undefined,
      features: features || undefined,
      services: services || undefined,
      team: team || undefined,
      testimonials: testimonials || undefined,
      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTimeMs: Date.now() - startTime,
        failedSections
      }
    };

    // Calculate final token usage and cost
    const tokenUsage: TokenUsage = {
      prompt_tokens: totalPromptTokens,
      completion_tokens: totalCompletionTokens,
      total_tokens: totalPromptTokens + totalCompletionTokens
    };

    const totalCostCents = calculateCost(tokenUsage);

    console.log('\n=== Generation Complete ===');
    console.log('Total calls:', totalCalls);
    console.log('Total tokens:', tokenUsage.total_tokens);
    console.log('Total cost:', totalCostCents, 'cents');
    console.log('Generation time:', Date.now() - startTime, 'ms');
    if (failedSections.length > 0) {
      console.warn('Failed sections:', failedSections.join(', '));
    }

    return {
      data: siteData,
      tokenUsage,
      totalCostCents,
      totalCalls,
      failedSections
    };
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Site generation failed:', errorInfo.message);

    // Re-throw with context
    throw new Error(`Site generation failed: ${errorInfo.message}`);
  }
}