/**
 * Validation Helpers for LLM Output
 *
 * This module provides helper functions for validating LLM-generated content
 * using Zod schemas. These helpers provide a consistent interface for validation
 * with proper error handling and formatting.
 *
 * Key features:
 * - Generic validation function for any schema
 * - Specialized validators for foundation and complete site data
 * - Human-readable error formatting
 * - Type-safe result objects
 *
 * @example
 * ```typescript
 * import { validateFoundationData } from './validation-helpers';
 *
 * const result = validateFoundationData(llmOutput);
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */

import { z, ZodError, ZodSchema } from 'zod';
import {
  FoundationDataSchema,
  GeneratedSiteDataSchema,
  type FoundationData,
  type GeneratedSiteData
} from './site-generation-schemas';

/**
 * Validation result type
 *
 * Success case includes validated data with proper types.
 * Failure case includes formatted error messages.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

/**
 * Format Zod validation errors into readable messages
 *
 * Converts Zod's error format into an array of human-readable strings
 * that can be logged or displayed to users/developers.
 *
 * @param error - ZodError from failed validation
 * @returns Array of formatted error messages
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   const messages = formatZodError(result.error);
 *   console.error('Validation failed:', messages);
 * }
 * ```
 */
export function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });
}

/**
 * Generic section validator
 *
 * Validates any data against a provided Zod schema. This is a flexible
 * helper that can be used with any schema from site-generation-schemas.ts.
 *
 * @param data - Unknown data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result with data or errors
 *
 * @example
 * ```typescript
 * import { HeroSectionSchema } from './site-generation-schemas';
 *
 * const result = validateSection(data, HeroSectionSchema);
 * if (result.success) {
 *   console.log('Valid hero section:', result.data);
 * }
 * ```
 */
export function validateSection<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors = formatZodError(result.error);
    console.error('Section validation failed:', errors);

    return { success: false, errors };
  } catch (error: unknown) {
    // Handle unexpected errors during validation
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown validation error';
    console.error('Validation error:', errorMessage);

    return {
      success: false,
      errors: [`Validation error: ${errorMessage}`]
    };
  }
}

/**
 * Validate foundation data from Phase 1
 *
 * Specialized validator for foundation data that includes basic site info,
 * hero section, branding, and SEO metadata. This is the initial data
 * generated in Phase 1 before individual sections are created.
 *
 * @param data - Unknown data to validate as foundation data
 * @returns Validation result with FoundationData or errors
 *
 * @example
 * ```typescript
 * const llmOutput = await generateFoundation(businessInfo);
 * const result = validateFoundationData(llmOutput);
 *
 * if (result.success) {
 *   console.log('Site name:', result.data.site_name);
 *   console.log('Primary color:', result.data.branding.primary_color);
 * } else {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateFoundationData(
  data: unknown
): ValidationResult<FoundationData> {
  try {
    const result = FoundationDataSchema.safeParse(data);

    if (result.success) {
      console.log('Foundation data validation successful');
      return { success: true, data: result.data };
    }

    const errors = formatZodError(result.error);
    console.error('Foundation data validation failed:', errors);
    console.error('Received data:', JSON.stringify(data, null, 2));

    return { success: false, errors };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown validation error';
    console.error('Foundation validation error:', errorMessage);

    return {
      success: false,
      errors: [`Foundation validation error: ${errorMessage}`]
    };
  }
}

/**
 * Validate complete generated site data
 *
 * Specialized validator for complete site data that includes all sections
 * (hero, about, values, features, services, team, testimonials, contact)
 * plus branding and SEO. This is the final output after all generation phases.
 *
 * @param data - Unknown data to validate as complete site data
 * @returns Validation result with GeneratedSiteData or errors
 *
 * @example
 * ```typescript
 * const llmOutput = await generateCompleteSite(businessInfo);
 * const result = validateGeneratedSiteData(llmOutput);
 *
 * if (result.success) {
 *   console.log('Site generated:', result.data.site_name);
 *   console.log('Sections:', {
 *     values: !!result.data.values,
 *     features: !!result.data.features,
 *     services: !!result.data.services
 *   });
 * } else {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateGeneratedSiteData(
  data: unknown
): ValidationResult<GeneratedSiteData> {
  try {
    const result = GeneratedSiteDataSchema.safeParse(data);

    if (result.success) {
      console.log('Generated site data validation successful');
      return { success: true, data: result.data };
    }

    const errors = formatZodError(result.error);
    console.error('Generated site data validation failed:', errors);
    console.error('Received data:', JSON.stringify(data, null, 2));

    return { success: false, errors };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown validation error';
    console.error('Generated site data validation error:', errorMessage);

    return {
      success: false,
      errors: [`Generated site data validation error: ${errorMessage}`]
    };
  }
}

/**
 * Validate and transform data with custom error recovery
 *
 * This advanced validator allows providing a recovery function that
 * attempts to fix common issues before failing validation. Useful for
 * handling minor LLM output inconsistencies.
 *
 * @param data - Unknown data to validate
 * @param schema - Zod schema to validate against
 * @param recoveryFn - Optional function to attempt error recovery
 * @returns Validation result with data or errors
 *
 * @example
 * ```typescript
 * const result = validateWithRecovery(
 *   data,
 *   HeroSectionSchema,
 *   (d) => {
 *     // Fix common issues
 *     if (typeof d === 'object' && d !== null) {
 *       const fixed = { ...d };
 *       if (typeof fixed.headline === 'string') {
 *         fixed.headline = fixed.headline.trim();
 *       }
 *       return fixed;
 *     }
 *     return d;
 *   }
 * );
 * ```
 */
export function validateWithRecovery<T>(
  data: unknown,
  schema: ZodSchema<T>,
  recoveryFn?: (data: unknown) => unknown
): ValidationResult<T> {
  // First, try direct validation
  const initialResult = validateSection(data, schema);
  if (initialResult.success) {
    return initialResult;
  }

  // If recovery function provided, try it
  if (recoveryFn) {
    console.log('Attempting error recovery...');
    try {
      const recovered = recoveryFn(data);
      const recoveryResult = validateSection(recovered, schema);

      if (recoveryResult.success) {
        console.log('Error recovery successful');
        return recoveryResult;
      }

      console.log('Error recovery attempted but validation still failed');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown recovery error';
      console.error('Error recovery failed:', errorMessage);
    }
  }

  // Return original errors if recovery failed or wasn't attempted
  return initialResult;
}

/**
 * Batch validate multiple sections
 *
 * Validates multiple data items against their respective schemas.
 * Returns all results, allowing partial success handling.
 *
 * @param items - Array of data and schema pairs to validate
 * @returns Array of validation results
 *
 * @example
 * ```typescript
 * const results = batchValidate([
 *   { data: heroData, schema: HeroSectionSchema, name: 'hero' },
 *   { data: aboutData, schema: AboutSectionSchema, name: 'about' }
 * ]);
 *
 * const failures = results.filter(r => !r.success);
 * if (failures.length > 0) {
 *   console.error('Some sections failed:', failures);
 * }
 * ```
 */
export function batchValidate<T>(
  items: Array<{
    data: unknown;
    schema: ZodSchema<T>;
    name: string;
  }>
): Array<ValidationResult<T> & { name: string }> {
  return items.map(({ data, schema, name }) => {
    const result = validateSection(data, schema);
    return { ...result, name };
  });
}

/**
 * Check if validation result is successful (type guard)
 *
 * Narrows the ValidationResult type to success case for TypeScript.
 *
 * @param result - Validation result to check
 * @returns True if validation succeeded
 *
 * @example
 * ```typescript
 * const result = validateFoundationData(data);
 * if (isValidationSuccess(result)) {
 *   // TypeScript knows result.data exists here
 *   console.log(result.data.site_name);
 * }
 * ```
 */
export function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Extract all error messages from validation result
 *
 * Helper to get error messages from a failed validation result.
 * Returns empty array for successful validations.
 *
 * @param result - Validation result
 * @returns Array of error messages (empty if successful)
 *
 * @example
 * ```typescript
 * const result = validateSection(data, schema);
 * const errors = getValidationErrors(result);
 * if (errors.length > 0) {
 *   console.error('Errors:', errors.join(', '));
 * }
 * ```
 */
export function getValidationErrors<T>(result: ValidationResult<T>): string[] {
  return isValidationSuccess(result) ? [] : result.errors;
}