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

import { generateWithOpenRouter } from '@/src/lib/ai/openrouter-client';
import {
  SITE_FOUNDATION_SYSTEM_PROMPT,
  PAGE_GENERATION_SYSTEM_PROMPT,
  buildFoundationPrompt,
  buildFoundationPromptWithContext,
  buildPagePrompt
} from '@/src/lib/ai/prompts/site-generation-prompts';
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
} from '@/src/lib/ai/response-parser';
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
  type SiteBranding,
  type ScrapedWebsiteContext,
  type CustomPageSection
} from '@/src/lib/types/site-generation-jobs';
import { handleError } from '@/src/lib/types/error-handling';
import { isOpenRouterError } from '@/src/lib/types/openrouter';

/**
 * Pricing information for cost calculation
 * Based on OpenRouter's pricing for the default model (configurable via OPENROUTER_MODEL)
 * These values should be updated if model pricing changes
 *
 * Note: Currently using free models, so costs are $0
 */
const PRICING = {
  // Cost per 1M tokens (in cents)
  PROMPT_TOKENS_PER_MILLION: 0, // $0.00 per 1M prompt tokens (free model)
  COMPLETION_TOKENS_PER_MILLION: 0 // $0.00 per 1M completion tokens (free model)
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
 * 3. Phase 3: Generate custom pages based on scraped context (if available)
 * 4. Combine results into complete GeneratedSiteData
 * 5. Track token usage and calculate costs
 * 6. Handle partial failures gracefully
 *
 * @param businessInfo - Business information from user input
 * @param scrapedContext - Optional scraped website context for enhanced generation
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
  businessInfo: BusinessInfo,
  scrapedContext?: ScrapedWebsiteContext
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

    // Use enhanced prompt if we have scraped context
    const foundationPrompt = scrapedContext
      ? buildFoundationPromptWithContext(businessInfo, scrapedContext)
      : buildFoundationPrompt(businessInfo);

    // Initial foundation generation with increased token limit
    let foundationResponse = await generateWithOpenRouter<string>(
      foundationPrompt,
      SITE_FOUNDATION_SYSTEM_PROMPT,
      {
        temperature: 0.8,
        maxTokens: 3000, // Increased from 2000 to 3000
        timeout: 45000
      }
    );

    totalCalls++;
    if (foundationResponse.usage) {
      totalPromptTokens += foundationResponse.usage.promptTokens;
      totalCompletionTokens += foundationResponse.usage.completionTokens;
    }

    // Check if response was truncated
    if (foundationResponse.finishReason === 'length') {
      console.log('Foundation response was truncated due to token limit, retrying with higher limit...');
      console.log('Initial response tokens:', foundationResponse.usage?.completionTokens);

      // Retry with increased token limit
      foundationResponse = await generateWithOpenRouter<string>(
        foundationPrompt,
        SITE_FOUNDATION_SYSTEM_PROMPT,
        {
          temperature: 0.8,
          maxTokens: 4000, // Retry with even higher limit
          timeout: 45000
        }
      );

      totalCalls++;
      if (foundationResponse.usage) {
        totalPromptTokens += foundationResponse.usage.promptTokens;
        totalCompletionTokens += foundationResponse.usage.completionTokens;
      }

      console.log('Retry response tokens:', foundationResponse.usage?.completionTokens);
      console.log('Retry finish reason:', foundationResponse.finishReason);
    }

    // Enhanced logging for debugging
    console.log('Foundation generation complete:');
    console.log('- Finish reason:', foundationResponse.finishReason);
    console.log('- Token usage:', foundationResponse.usage);
    console.log('- Response length:', typeof foundationResponse.content === 'string'
      ? foundationResponse.content.length
      : JSON.stringify(foundationResponse.content).length);

    const foundation = parseFoundationResponse(
      typeof foundationResponse.content === 'string'
        ? foundationResponse.content
        : JSON.stringify(foundationResponse.content)
    );

    if (!foundation) {
      // Log the full response for debugging
      console.error('Failed to parse foundation response');
      console.error('Raw response (first 500 chars):',
        typeof foundationResponse.content === 'string'
          ? foundationResponse.content.substring(0, 500)
          : JSON.stringify(foundationResponse.content).substring(0, 500)
      );
      console.error('Finish reason:', foundationResponse.finishReason);
      throw new Error('Failed to parse foundation response - cannot continue');
    }

    console.log('Foundation generated:', foundation.site_name);

    // PHASE 2: Generate page sections in parallel
    console.log('\n=== PHASE 2: Generating Page Sections (Parallel) ===');

    // Create all section generation promises - pass scraped context to all sections
    const sectionPromises = [
      // Required sections
      generateWithOpenRouter<string>(
        buildPagePrompt('about', businessInfo, foundation.branding, scrapedContext),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'about', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('contact', businessInfo, foundation.branding, scrapedContext),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.5, maxTokens: 1000, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'contact', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('testimonials', businessInfo, foundation.branding, scrapedContext),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.8, maxTokens: 2000, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'testimonials', response: res })),

      // Optional sections
      generateWithOpenRouter<string>(
        buildPagePrompt('values', businessInfo, foundation.branding, scrapedContext),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'values', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('features', businessInfo, foundation.branding, scrapedContext),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'features', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('services', businessInfo, foundation.branding, scrapedContext),
        PAGE_GENERATION_SYSTEM_PROMPT,
        { temperature: 0.7, maxTokens: 1500, timeout: 30000, retries: 2 }
      ).then(res => ({ type: 'services', response: res })),

      generateWithOpenRouter<string>(
        buildPagePrompt('team', businessInfo, foundation.branding, scrapedContext),
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

    // If contact section failed, create minimal fallback
    if (!contact) {
      console.warn('Contact section generation failed, using fallback');
      contact = {
        title: 'Contact Us',
        email: undefined,
        phone: undefined,
        address: undefined,
        hours: undefined
      };
      failedSections.push('contact-fallback-used');
    }

    // PHASE 3: Generate custom pages from scraped context (if available)
    const customPages: CustomPageSection[] = [];

    // Check for FAQ data first
    const hasFAQ = scrapedContext?.businessInfo.structuredContent?.faq &&
                   scrapedContext.businessInfo.structuredContent.faq.length > 0;

    if (hasFAQ || (scrapedContext?.recommendedPages && scrapedContext.recommendedPages.length > 0)) {
      console.log('\n=== PHASE 3: Generating Custom Pages ===');

      // Generate FAQ page if FAQ data exists
      if (hasFAQ) {
        console.log('Generating FAQ page from scraped content...');
        const faqData = scrapedContext.businessInfo.structuredContent!.faq!;

        try {
          // Build prompt for FAQ page with actual scraped FAQs
          const faqPrompt = `Generate an FAQ page using these ACTUAL questions and answers from the business website.

Business: ${businessInfo.name}
Industry: ${businessInfo.industry || 'business'}

CRITICAL INSTRUCTIONS:
- You MUST preserve these EXACT questions and answers
- DO NOT create new FAQs or modify the content
- Only improve formatting and organization
- Group related questions if appropriate
- Add a page title and description

Actual FAQs from the website:
${JSON.stringify(faqData, null, 2)}

Generate JSON in this exact format:
{
  "title": "Frequently Asked Questions",
  "slug": "faq",
  "headline": "Frequently Asked Questions",
  "description": "Find answers to common questions about our products and services",
  "items": [
    {
      "title": "[exact question from above]",
      "description": "[exact answer from above]",
      "icon": "help-circle"
    }
  ]
}

REMEMBER: Use the EXACT questions as titles and EXACT answers as descriptions. Do not create new content.`;

          const faqResponse = await generateWithOpenRouter<string>(
            faqPrompt,
            PAGE_GENERATION_SYSTEM_PROMPT,
            {
              temperature: 0.3, // Low temperature to preserve content exactly
              maxTokens: 2000,
              timeout: 30000,
              retries: 2
            }
          );

          totalCalls++;
          if (faqResponse.usage) {
            totalPromptTokens += faqResponse.usage.promptTokens;
            totalCompletionTokens += faqResponse.usage.completionTokens;
          }

          // Parse the response
          const content = typeof faqResponse.content === 'string'
            ? faqResponse.content
            : JSON.stringify(faqResponse.content);

          try {
            const parsed = JSON.parse(content);
            customPages.push({
              pageType: 'faq',
              title: parsed.title || 'Frequently Asked Questions',
              slug: parsed.slug || 'faq',
              content: {
                headline: parsed.headline || 'Frequently Asked Questions',
                description: parsed.description || 'Find answers to common questions',
                items: parsed.items || faqData.map(faq => ({
                  title: faq.question,
                  description: faq.answer,
                  icon: 'help-circle'
                }))
              }
            });
            console.log(`FAQ page generated with ${faqData.length} questions`);
          } catch (parseError) {
            console.warn('Failed to parse FAQ page response, using fallback structure');
            // Fallback: create FAQ page directly from scraped data
            customPages.push({
              pageType: 'faq',
              title: 'Frequently Asked Questions',
              slug: 'faq',
              content: {
                headline: 'Frequently Asked Questions',
                description: 'Find answers to common questions about our products and services',
                items: faqData.map(faq => ({
                  title: faq.question,
                  description: faq.answer,
                  icon: 'help-circle'
                }))
              }
            });
            failedSections.push('faq-parsing');
          }
        } catch (error: unknown) {
          const errorInfo = handleError(error);
          console.error('Failed to generate FAQ page:', errorInfo.message);
          // Fallback: create FAQ page directly from scraped data
          customPages.push({
            pageType: 'faq',
            title: 'Frequently Asked Questions',
            slug: 'faq',
            content: {
              headline: 'Frequently Asked Questions',
              description: 'Find answers to common questions about our products and services',
              items: faqData.map(faq => ({
                title: faq.question,
                description: faq.answer,
                icon: 'help-circle'
              }))
            }
          });
          failedSections.push('faq-generation');
        }
      }

      // Generate other custom pages from recommended pages
      if (scrapedContext?.recommendedPages && scrapedContext.recommendedPages.length > 0) {
        console.log('Recommended pages:', scrapedContext.recommendedPages.join(', '));

        // Filter out standard pages we already generated
        const standardPages = ['home', 'about', 'contact', 'services', 'team', 'testimonials', 'values', 'features', 'faq'];
        const customPageTypes = scrapedContext.recommendedPages.filter(
          pageType => !standardPages.includes(pageType.toLowerCase())
        );

        if (customPageTypes.length > 0) {
          console.log('Generating custom pages:', customPageTypes.join(', '));

          // Generate custom pages (limit to avoid excessive API calls)
          const pagesToGenerate = customPageTypes.slice(0, 3);

          for (const pageType of pagesToGenerate) {
            try {
              // Get page content from scraped context if available
              const pageContent = scrapedContext.pageContents?.[pageType] || '';

              // Build prompt for custom page
              const customPagePrompt = `Generate a custom page for a ${businessInfo.industry || 'business'} website.

Page Type: ${pageType}
Business: ${businessInfo.name}

${pageContent ? `Content from existing page:\n${pageContent.slice(0, 1000)}\n\nUse this as inspiration but improve and modernize the content.` : 'Create relevant content for this page type.'}

Generate JSON in this format:
{
  "title": "Page title",
  "slug": "url-slug",
  "headline": "Main headline",
  "description": "Supporting description",
  "items": [
    {
      "title": "Item title",
      "description": "Item description",
      "content": "Detailed content with **markdown**",
      "icon": "lucide-icon-name"
    }
  ]
}`;

            const customPageResponse = await generateWithOpenRouter<string>(
              customPagePrompt,
              PAGE_GENERATION_SYSTEM_PROMPT,
              {
                temperature: 0.7,
                maxTokens: 1500,
                timeout: 30000,
                retries: 1
              }
            );

            totalCalls++;
            if (customPageResponse.usage) {
              totalPromptTokens += customPageResponse.usage.promptTokens;
              totalCompletionTokens += customPageResponse.usage.completionTokens;
            }

            // Parse the response
            const content = typeof customPageResponse.content === 'string'
              ? customPageResponse.content
              : JSON.stringify(customPageResponse.content);

            try {
              const parsed = JSON.parse(content);
              customPages.push({
                pageType,
                title: parsed.title || pageType,
                slug: parsed.slug || pageType.toLowerCase().replace(/\s+/g, '-'),
                content: {
                  headline: parsed.headline,
                  description: parsed.description,
                  items: parsed.items || [],
                  richText: parsed.richText
                }
              });
              console.log(`Custom page generated: ${pageType}`);
            } catch {
              console.warn(`Failed to parse custom page: ${pageType}`);
              failedSections.push(`custom-page-${pageType}`);
            }
            } catch (error: unknown) {
              const errorInfo = handleError(error);
              console.error(`Failed to generate custom page ${pageType}:`, errorInfo.message);
              failedSections.push(`custom-page-${pageType}`);
            }
          }
        }
      }
    }

    // Build complete site data
    const siteData: GeneratedSiteData = {
      site_name: foundation.site_name,
      tagline: foundation.tagline,
      description: foundation.description,
      hero: {
        ...foundation.hero,
        // Inject scraped background image if available (takes priority over LLM-generated description)
        ...(scrapedContext?.businessInfo?.heroSection?.backgroundImage && {
          background_image: scrapedContext.businessInfo.heroSection.backgroundImage
        })
      },
      about,
      contact,
      branding: {
        ...foundation.branding,
        // Inject scraped typography if available (enhances LLM-generated branding)
        ...(scrapedContext?.businessInfo?.typography && {
          typography: scrapedContext.businessInfo.typography
        })
      },
      seo: foundation.seo,
      // Optional sections
      values: values || undefined,
      features: features || undefined,
      services: services || undefined,
      team: team || undefined,
      testimonials: testimonials || undefined,
      // Custom pages from scraped context
      customPages: customPages.length > 0 ? customPages : undefined,
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