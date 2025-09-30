/**
 * Response parsing utilities for LLM-generated content
 *
 * This module handles parsing and validation of JSON responses from LLMs.
 * LLMs sometimes wrap JSON in markdown code blocks or include extra text,
 * so we need robust parsing that can extract and validate the JSON content.
 *
 * Key features:
 * - Extract JSON from markdown code blocks
 * - Handle extra text before/after JSON
 * - Validate structure using type guards AND Zod schemas
 * - Automatic error recovery for common issues
 * - Comprehensive error handling
 */

import {
  isFoundationData,
  isAboutSection,
  isValuesSection,
  isFeaturesSection,
  isServicesSection,
  isTeamSection,
  isTestimonialsSection,
  isContactSection
} from '@/lib/types/type-guards';
import {
  type AboutSection,
  type ValuesSection,
  type FeaturesSection,
  type ServicesSection,
  type TeamSection,
  type TestimonialsSection,
  type ContactSection,
  type HeroSection,
  type SiteBranding,
  type SeoMetadata
} from '@/lib/types/site-generation-jobs';
import { handleError } from '@/lib/types/error-handling';
import {
  validateFoundationData,
  validateSection
} from '@/lib/validation/validation-helpers';
import {
  AboutSectionSchema,
  ValuesSectionSchema,
  FeaturesSectionSchema,
  ServicesSectionSchema,
  TeamSectionSchema,
  TestimonialsSectionSchema,
  ContactSectionSchema,
  FoundationDataSchema
} from '@/lib/validation/site-generation-schemas';
import { recoverFromValidationError } from '@/lib/ai/error-recovery';

/**
 * Foundation data structure from Phase 1
 */
export interface FoundationData {
  site_name: string;
  tagline: string;
  description: string;
  hero: HeroSection;
  branding: SiteBranding;
  seo: SeoMetadata;
}

/**
 * Extract JSON from response that may be wrapped in markdown code blocks
 *
 * LLMs sometimes return JSON wrapped like:
 * ```json
 * { ... }
 * ```
 *
 * Or with extra text:
 * "Here's the JSON you requested:\n```json\n{ ... }\n```"
 *
 * This function extracts the actual JSON content.
 *
 * @param response - Raw response string from LLM
 * @returns Parsed JSON object or null if parsing fails
 *
 * @example
 * ```typescript
 * const response = "```json\n{\"title\": \"Hello\"}\n```";
 * const json = extractJsonFromResponse(response);
 * // Returns: { title: "Hello" }
 * ```
 */
export function extractJsonFromResponse(response: string): Record<string, unknown> | null {
  try {
    // First, try to find JSON in markdown code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      const jsonContent = codeBlockMatch[1].trim();
      return JSON.parse(jsonContent) as Record<string, unknown>;
    }

    // Try to find JSON between curly braces (most common pattern)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    }

    // Try to parse the entire response as JSON (in case it's clean)
    const trimmedResponse = response.trim();
    if (trimmedResponse.startsWith('{') && trimmedResponse.endsWith('}')) {
      return JSON.parse(trimmedResponse) as Record<string, unknown>;
    }

    // No JSON found
    console.error('No JSON found in response:', response.substring(0, 200));
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Failed to extract JSON from response:', errorInfo.message);
    console.error('Response preview:', response.substring(0, 200));
    return null;
  }
}

/**
 * Validate that parsed JSON has the expected structure
 *
 * This is a basic structural validation that checks for the presence
 * of expected keys. More detailed validation is done by type guards.
 *
 * @param data - Parsed JSON object
 * @param expectedType - Type name for logging
 * @returns True if structure looks valid
 */
export function validateJsonStructure(data: unknown, expectedType: string): boolean {
  if (typeof data !== 'object' || data === null) {
    console.error(`Invalid ${expectedType}: not an object`);
    return false;
  }

  const obj = data as Record<string, unknown>;

  // All section types should have a title (except foundation)
  if (expectedType !== 'foundation' && !('title' in obj)) {
    console.error(`Invalid ${expectedType}: missing 'title' field`);
    return false;
  }

  return true;
}

/**
 * Parse foundation response from Phase 1
 *
 * Foundation includes: site_name, tagline, description, hero, branding, seo
 *
 * Now uses Zod validation with automatic error recovery for common issues.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated FoundationData or null
 *
 * @example
 * ```typescript
 * const response = await generateWithOpenRouter(...);
 * const foundation = parseFoundationResponse(response.content);
 * if (foundation) {
 *   console.log('Site name:', foundation.site_name);
 * }
 * ```
 */
export function parseFoundationResponse(response: string): FoundationData | null {
  try {
    // Extract JSON from response
    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from foundation response');
      return null;
    }

    // Validate structure (basic check before Zod)
    if (!validateJsonStructure(json, 'foundation')) {
      return null;
    }

    // Validate with type guard (backward compatibility)
    if (!isFoundationData(json)) {
      console.error('Foundation data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateFoundationData(json);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed, attempting recovery...');
    const recovered = recoverFromValidationError(
      json,
      FoundationDataSchema,
      {
        maxLengths: {
          site_name: 100,
          tagline: 200,
          description: 1000,
          headline: 100,
          subheadline: 200,
          cta_text: 30,
          title: 60
        }
      }
    );

    if (recovered) {
      console.log('Error recovery successful for foundation data');
      return recovered;
    }

    // Log failure
    console.error('Validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing foundation response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse About section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated AboutSection or null
 */
export function parseAboutSectionResponse(response: string): AboutSection | null {
  try {
    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from About section response');
      return null;
    }

    if (!validateJsonStructure(json, 'AboutSection')) {
      return null;
    }

    if (!isAboutSection(json)) {
      console.error('About section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, AboutSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for About section, attempting recovery...');
    const recovered = recoverFromValidationError(json, AboutSectionSchema, {
      maxLengths: { title: 100, mission: 500, vision: 500 },
      arrayConstraints: { content: { min: 1, max: 10 } }
    });

    if (recovered) {
      console.log('Error recovery successful for About section');
      return recovered;
    }

    console.error('About section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing About section response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse Values section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated ValuesSection or null
 */
export function parseValuesSectionResponse(response: string): ValuesSection | null {
  try {
    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from Values section response');
      return null;
    }

    if (!validateJsonStructure(json, 'ValuesSection')) {
      return null;
    }

    if (!isValuesSection(json)) {
      console.error('Values section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, ValuesSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for Values section, attempting recovery...');
    const recovered = recoverFromValidationError(json, ValuesSectionSchema, {
      maxLengths: { title: 100, subtitle: 200 },
      arrayConstraints: { values: { min: 2, max: 8 } }
    });

    if (recovered) {
      console.log('Error recovery successful for Values section');
      return recovered;
    }

    console.error('Values section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing Values section response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse Features section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated FeaturesSection or null
 */
export function parseFeaturesSectionResponse(response: string): FeaturesSection | null {
  try {
    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from Features section response');
      return null;
    }

    if (!validateJsonStructure(json, 'FeaturesSection')) {
      return null;
    }

    if (!isFeaturesSection(json)) {
      console.error('Features section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, FeaturesSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for Features section, attempting recovery...');
    const recovered = recoverFromValidationError(json, FeaturesSectionSchema, {
      maxLengths: { title: 100, subtitle: 200 },
      arrayConstraints: { features: { min: 2, max: 12 } }
    });

    if (recovered) {
      console.log('Error recovery successful for Features section');
      return recovered;
    }

    console.error('Features section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing Features section response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse Services section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated ServicesSection or null
 */
export function parseServicesSectionResponse(response: string): ServicesSection | null {
  try {
    // Services section can return null if not applicable
    const trimmed = response.trim().toLowerCase();
    if (trimmed === 'null' || trimmed === '{}') {
      return null;
    }

    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from Services section response');
      return null;
    }

    if (!validateJsonStructure(json, 'ServicesSection')) {
      return null;
    }

    if (!isServicesSection(json)) {
      console.error('Services section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, ServicesSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for Services section, attempting recovery...');
    const recovered = recoverFromValidationError(json, ServicesSectionSchema, {
      maxLengths: { title: 100, subtitle: 200, name: 100, description: 500, price: 50, duration: 50 },
      arrayConstraints: { services: { min: 1, max: 20 } }
    });

    if (recovered) {
      console.log('Error recovery successful for Services section');
      return recovered;
    }

    console.error('Services section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing Services section response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse Team section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated TeamSection or null
 */
export function parseTeamSectionResponse(response: string): TeamSection | null {
  try {
    // Team section can return null if not applicable
    const trimmed = response.trim().toLowerCase();
    if (trimmed === 'null' || trimmed === '{}') {
      return null;
    }

    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from Team section response');
      return null;
    }

    if (!validateJsonStructure(json, 'TeamSection')) {
      return null;
    }

    if (!isTeamSection(json)) {
      console.error('Team section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, TeamSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for Team section, attempting recovery...');
    const recovered = recoverFromValidationError(json, TeamSectionSchema, {
      maxLengths: { title: 100, subtitle: 200, name: 100, role: 100, bio: 500 },
      arrayConstraints: { members: { min: 1, max: 50 } }
    });

    if (recovered) {
      console.log('Error recovery successful for Team section');
      return recovered;
    }

    console.error('Team section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing Team section response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse Testimonials section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated TestimonialsSection or null
 */
export function parseTestimonialsSectionResponse(response: string): TestimonialsSection | null {
  try {
    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from Testimonials section response');
      return null;
    }

    if (!validateJsonStructure(json, 'TestimonialsSection')) {
      return null;
    }

    if (!isTestimonialsSection(json)) {
      console.error('Testimonials section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, TestimonialsSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for Testimonials section, attempting recovery...');
    const recovered = recoverFromValidationError(json, TestimonialsSectionSchema, {
      maxLengths: { title: 100, subtitle: 200, name: 100, role: 100, content: 1000 },
      arrayConstraints: { testimonials: { min: 1, max: 20 } }
    });

    if (recovered) {
      console.log('Error recovery successful for Testimonials section');
      return recovered;
    }

    console.error('Testimonials section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing Testimonials section response:', errorInfo.message);
    return null;
  }
}

/**
 * Parse Contact section response
 *
 * Now uses Zod validation with automatic error recovery.
 *
 * @param response - Raw response from LLM
 * @returns Parsed and validated ContactSection or null
 */
export function parseContactSectionResponse(response: string): ContactSection | null {
  try {
    const json = extractJsonFromResponse(response);
    if (!json) {
      console.error('Failed to extract JSON from Contact section response');
      return null;
    }

    if (!validateJsonStructure(json, 'ContactSection')) {
      return null;
    }

    if (!isContactSection(json)) {
      console.error('Contact section data failed type guard validation');
      console.error('Received data:', JSON.stringify(json, null, 2));
      return null;
    }

    // Validate with Zod schema
    const zodResult = validateSection(json, ContactSectionSchema);
    if (zodResult.success) {
      return zodResult.data;
    }

    // Attempt error recovery
    console.log('Zod validation failed for Contact section, attempting recovery...');
    const recovered = recoverFromValidationError(json, ContactSectionSchema, {
      maxLengths: { title: 100, email: 200, phone: 50, address: 300, hours: 200 }
    });

    if (recovered) {
      console.log('Error recovery successful for Contact section');
      return recovered;
    }

    console.error('Contact section validation failed:', zodResult.errors);
    return null;
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Error parsing Contact section response:', errorInfo.message);
    return null;
  }
}

/**
 * Generic parser for page sections with type inference
 *
 * This is a convenience function that routes to the appropriate
 * section-specific parser based on the section type.
 *
 * @param response - Raw response from LLM
 * @param sectionType - Type of section being parsed
 * @returns Parsed and validated section data or null
 *
 * @example
 * ```typescript
 * const about = parsePageSectionResponse(response, 'about');
 * const values = parsePageSectionResponse(response, 'values');
 * ```
 */
export function parsePageSectionResponse<
  T extends
    | AboutSection
    | ValuesSection
    | FeaturesSection
    | ServicesSection
    | TeamSection
    | TestimonialsSection
    | ContactSection
>(
  response: string,
  sectionType: 'about' | 'values' | 'features' | 'services' | 'team' | 'testimonials' | 'contact'
): T | null {
  switch (sectionType) {
    case 'about':
      return parseAboutSectionResponse(response) as T | null;
    case 'values':
      return parseValuesSectionResponse(response) as T | null;
    case 'features':
      return parseFeaturesSectionResponse(response) as T | null;
    case 'services':
      return parseServicesSectionResponse(response) as T | null;
    case 'team':
      return parseTeamSectionResponse(response) as T | null;
    case 'testimonials':
      return parseTestimonialsSectionResponse(response) as T | null;
    case 'contact':
      return parseContactSectionResponse(response) as T | null;
    default:
      console.error(`Unknown section type: ${sectionType}`);
      return null;
  }
}