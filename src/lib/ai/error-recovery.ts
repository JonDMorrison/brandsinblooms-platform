/**
 * Error Recovery for LLM Output Validation
 *
 * This module provides error recovery mechanisms for LLM-generated content
 * that fails validation. It attempts to automatically fix common issues like
 * malformed color codes, excessive text lengths, missing fields, and array
 * length violations.
 *
 * Key features:
 * - Automatic hex color fixing (e.g., "FF5733" -> "#FF5733")
 * - Text truncation for length violations
 * - Default value injection for missing required fields
 * - Array length normalization
 * - Logging for monitoring and debugging
 *
 * @example
 * ```typescript
 * import { recoverFromValidationError } from './error-recovery';
 * import { HeroSectionSchema } from '../validation/site-generation-schemas';
 *
 * const recovered = recoverFromValidationError(invalidData, HeroSectionSchema);
 * if (recovered) {
 *   console.log('Recovery successful:', recovered);
 * }
 * ```
 */

import { ZodSchema, ZodError } from 'zod';

/**
 * Type guard to check if value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Fix malformed hex color codes
 *
 * Attempts to fix common hex color format issues:
 * - Missing # prefix: "FF5733" -> "#FF5733"
 * - Wrong case: converts to uppercase
 * - 3-digit shorthand: "F57" -> "#FF5577"
 * - Invalid characters: strips non-hex characters
 *
 * @param data - Object potentially containing color fields
 * @returns Object with fixed color codes
 *
 * @example
 * ```typescript
 * const fixed = fixHexColors({
 *   primary_color: "ff5733",  // -> "#FF5733"
 *   secondary_color: "F57"    // -> "#FF5577"
 * });
 * ```
 */
export function fixHexColors(data: unknown): unknown {
  if (!isPlainObject(data)) {
    return data;
  }

  const fixed: Record<string, unknown> = { ...data };
  const colorFields = [
    'primary_color',
    'secondary_color',
    'accent_color',
    'color',
    'backgroundColor',
    'textColor'
  ];

  for (const field of colorFields) {
    const value = fixed[field];

    if (typeof value === 'string') {
      let color = value.trim();

      // Remove any existing # prefix
      color = color.replace(/^#/, '');

      // Strip non-hex characters
      color = color.replace(/[^0-9A-Fa-f]/g, '');

      // Handle 3-digit shorthand (e.g., "F57" -> "FF5577")
      if (color.length === 3) {
        color = color
          .split('')
          .map((c) => c + c)
          .join('');
      }

      // Only apply if we have exactly 6 hex characters
      if (color.length === 6) {
        fixed[field] = `#${color.toUpperCase()}`;
        if (fixed[field] !== value) {
          console.log(`Fixed color ${field}: "${value}" -> "${fixed[field]}"`);
        }
      }
    }
  }

  // Recursively fix nested objects
  for (const key in fixed) {
    if (isPlainObject(fixed[key])) {
      fixed[key] = fixHexColors(fixed[key]);
    } else if (Array.isArray(fixed[key])) {
      fixed[key] = (fixed[key] as unknown[]).map((item) => fixHexColors(item));
    }
  }

  return fixed;
}

/**
 * Truncate excessive text to maximum allowed lengths
 *
 * Walks through the object structure and truncates any string fields
 * that exceed their maximum allowed length. Adds "..." to indicate truncation.
 *
 * @param data - Object potentially containing long text
 * @param maxLengths - Map of field names to maximum lengths
 * @returns Object with truncated text
 *
 * @example
 * ```typescript
 * const fixed = truncateExcessiveText(
 *   { headline: "Very long headline that exceeds the limit..." },
 *   { headline: 100 }
 * );
 * // Result: { headline: "Very long headline that exceeds the limit (truncated to 100 chars)..." }
 * ```
 */
export function truncateExcessiveText(
  data: unknown,
  maxLengths: Record<string, number>
): unknown {
  if (!isPlainObject(data)) {
    return data;
  }

  const fixed: Record<string, unknown> = { ...data };

  for (const field in fixed) {
    const value = fixed[field];
    const maxLength = maxLengths[field];

    if (typeof value === 'string' && maxLength && value.length > maxLength) {
      // Truncate to maxLength - 3 to make room for "..."
      const truncated = value.substring(0, maxLength - 3) + '...';
      fixed[field] = truncated;
      console.log(
        `Truncated ${field}: ${value.length} chars -> ${truncated.length} chars`
      );
    } else if (isPlainObject(value)) {
      // Recursively truncate nested objects
      fixed[field] = truncateExcessiveText(value, maxLengths);
    } else if (Array.isArray(value)) {
      // Recursively truncate array items
      fixed[field] = value.map((item) => truncateExcessiveText(item, maxLengths));
    }
  }

  return fixed;
}

/**
 * Fill missing required fields with default values
 *
 * Provides sensible defaults for missing required fields to allow
 * partial LLM outputs to be salvaged. Only fills truly missing fields,
 * doesn't override existing values (even if empty strings).
 *
 * @param data - Partial data with missing fields
 * @param defaults - Default values for required fields
 * @returns Complete data with defaults filled in
 *
 * @example
 * ```typescript
 * const fixed = fillMissingRequiredFields(
 *   { headline: "Hello" },
 *   { headline: "Default", subheadline: "Default subtitle", cta_text: "Learn More" }
 * );
 * // Result: { headline: "Hello", subheadline: "Default subtitle", cta_text: "Learn More" }
 * ```
 */
export function fillMissingRequiredFields<T extends Record<string, unknown>>(
  data: Partial<T>,
  defaults: T
): T {
  const filled: Record<string, unknown> = { ...defaults };

  // Override defaults with actual data (even if null/undefined/empty)
  for (const key in data) {
    if (key in data) {
      filled[key] = data[key];
    }
  }

  const missingFields = Object.keys(defaults).filter(
    (key) => !(key in data) || data[key] === undefined
  );

  if (missingFields.length > 0) {
    console.log(`Filled missing fields with defaults: ${missingFields.join(', ')}`);
  }

  return filled as T;
}

/**
 * Sanitize array lengths to fit within constraints
 *
 * Ensures arrays don't exceed maximum lengths by truncating them.
 * Also ensures minimum lengths by duplicating items or adding placeholders.
 *
 * @param data - Object potentially containing arrays
 * @param constraints - Map of field names to {min, max} constraints
 * @returns Object with sanitized arrays
 *
 * @example
 * ```typescript
 * const fixed = sanitizeArrayLengths(
 *   { values: [item1, item2, ...item20] },
 *   { values: { min: 2, max: 8 } }
 * );
 * // Result: { values: [item1, item2, ...item8] } (truncated to 8)
 * ```
 */
export function sanitizeArrayLengths(
  data: unknown,
  constraints: Record<string, { min?: number; max?: number }>
): unknown {
  if (!isPlainObject(data)) {
    return data;
  }

  const fixed: Record<string, unknown> = { ...data };

  for (const field in fixed) {
    const value = fixed[field];
    const constraint = constraints[field];

    if (Array.isArray(value) && constraint) {
      const { min, max } = constraint;
      let array = [...value];

      // Truncate if exceeds max
      if (max !== undefined && array.length > max) {
        array = array.slice(0, max);
        console.log(`Truncated array ${field}: ${value.length} -> ${max} items`);
      }

      // Pad if below min (duplicate last item or use placeholder)
      if (min !== undefined && array.length < min && array.length > 0) {
        const lastItem = array[array.length - 1];
        while (array.length < min) {
          array.push(lastItem);
        }
        console.log(`Padded array ${field}: ${value.length} -> ${min} items`);
      }

      fixed[field] = array;
    } else if (isPlainObject(value)) {
      // Recursively sanitize nested objects
      fixed[field] = sanitizeArrayLengths(value, constraints);
    }
  }

  return fixed;
}

/**
 * Clean null values from objects and arrays
 * Removes null, undefined, and empty string values from optional fields
 */
export function cleanNullValues(data: unknown): unknown {
  if (!isPlainObject(data)) {
    return data;
  }

  const cleaned: Record<string, unknown> = {};

  for (const key in data as Record<string, unknown>) {
    const value = (data as Record<string, unknown>)[key];

    // Skip null, undefined, and empty strings for optional fields
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Recursively clean nested objects
    if (isPlainObject(value)) {
      cleaned[key] = cleanNullValues(value);
    }
    // Recursively clean arrays
    else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => cleanNullValues(item));
    }
    // Keep other values as-is
    else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Comprehensive error recovery for validation failures
 *
 * Attempts multiple recovery strategies in sequence to fix common LLM
 * output issues. Returns recovered data if validation passes after recovery,
 * or null if recovery fails.
 *
 * Recovery strategies applied:
 * 1. Clean null values from optional fields
 * 2. Fix hex color codes
 * 3. Truncate excessive text
 * 4. Sanitize array lengths
 * 5. Fill missing required fields (if defaults provided)
 *
 * @param data - Invalid data from LLM
 * @param schema - Zod schema to validate against
 * @param options - Recovery options with defaults and constraints
 * @returns Recovered and validated data, or null if recovery impossible
 *
 * @example
 * ```typescript
 * const recovered = recoverFromValidationError(
 *   invalidHeroData,
 *   HeroSectionSchema,
 *   {
 *     maxLengths: { headline: 100, subheadline: 200, cta_text: 30 },
 *     defaults: { headline: 'Welcome', subheadline: 'Discover more', cta_text: 'Get Started' }
 *   }
 * );
 *
 * if (recovered) {
 *   console.log('Successfully recovered data');
 * } else {
 *   console.error('Recovery failed, data too invalid');
 * }
 * ```
 */
export function recoverFromValidationError<T>(
  data: unknown,
  schema: ZodSchema<T>,
  options?: {
    maxLengths?: Record<string, number>;
    arrayConstraints?: Record<string, { min?: number; max?: number }>;
    defaults?: Partial<T>;
  }
): T | null {
  try {
    console.log('Attempting validation error recovery...');

    let recovered = data;

    // Step 1: Clean null values from optional fields
    recovered = cleanNullValues(recovered);

    // Step 2: Fix hex colors
    recovered = fixHexColors(recovered);

    // Step 3: Truncate excessive text
    if (options?.maxLengths) {
      recovered = truncateExcessiveText(recovered, options.maxLengths);
    }

    // Step 4: Sanitize array lengths
    if (options?.arrayConstraints) {
      recovered = sanitizeArrayLengths(recovered, options.arrayConstraints);
    }

    // Step 5: Fill missing fields with defaults
    if (options?.defaults && isPlainObject(recovered) && isPlainObject(options.defaults)) {
      recovered = fillMissingRequiredFields(
        recovered as Partial<Record<string, unknown>>,
        options.defaults as Record<string, unknown>
      );
    }

    // Attempt validation with recovered data
    const result = schema.safeParse(recovered);

    if (result.success) {
      console.log('Validation error recovery successful');
      return result.data;
    }

    // Log remaining errors
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    });
    console.log('Recovery attempted but validation still failed:', errors);

    return null;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown recovery error';
    console.error('Error during recovery:', errorMessage);
    return null;
  }
}

/**
 * Apply smart defaults for common LLM output patterns
 *
 * Provides intelligent defaults based on field names and common patterns.
 * Used when defaults aren't explicitly provided.
 *
 * @param fieldName - Name of the field needing a default
 * @param fieldType - Expected type of the field
 * @returns Default value for the field
 */
export function getSmartDefault(
  fieldName: string,
  fieldType: 'string' | 'number' | 'array' | 'object'
): unknown {
  const lowercaseField = fieldName.toLowerCase();

  // String defaults
  if (fieldType === 'string') {
    if (lowercaseField.includes('color')) return '#000000';
    if (lowercaseField.includes('title')) return 'Untitled';
    if (lowercaseField.includes('name')) return 'Unnamed';
    if (lowercaseField.includes('email')) return 'contact@example.com';
    if (lowercaseField.includes('phone')) return '555-0100';
    if (lowercaseField.includes('description')) return 'No description provided';
    if (lowercaseField.includes('headline')) return 'Welcome';
    if (lowercaseField.includes('cta')) return 'Learn More';
    return '';
  }

  // Number defaults
  if (fieldType === 'number') {
    if (lowercaseField.includes('rating')) return 5;
    if (lowercaseField.includes('price')) return 0;
    return 0;
  }

  // Array defaults
  if (fieldType === 'array') {
    return [];
  }

  // Object defaults
  if (fieldType === 'object') {
    return {};
  }

  return null;
}

/**
 * Log recovery attempt for monitoring
 *
 * Creates structured logs for recovery attempts to help monitor
 * and improve the recovery process over time.
 *
 * @param data - Original invalid data
 * @param schema - Schema being validated against
 * @param error - Validation error
 * @param recovered - Whether recovery was successful
 */
export function logRecoveryAttempt(
  data: unknown,
  schemaName: string,
  error: ZodError,
  recovered: boolean
): void {
  const errorSummary = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message
  }));

  console.log('Recovery attempt logged:', {
    timestamp: new Date().toISOString(),
    schemaName,
    recovered,
    errorCount: error.issues.length,
    errors: errorSummary,
    dataPreview: JSON.stringify(data).substring(0, 200)
  });
}