/**
 * Validation utilities for extracted data
 *
 * Validates format and quality of data extracted by LLM models.
 */

import { VALIDATION_PATTERNS } from '../llm-extractor-config';
import type { ValidationResult } from '@/lib/types/extraction-schemas';

/**
 * Validate brand colors
 *
 * Checks:
 * - Valid hex format (#RRGGBB)
 * - Not too many colors (2-6 is typical)
 * - Not all grayscale
 *
 * @param colors - Array of color hex codes
 * @returns Validation result with confidence score
 */
export function validateBrandColors(colors: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if empty
  if (colors.length === 0) {
    errors.push('No brand colors provided');
    return {
      isValid: false,
      confidence: 0,
      errors,
      warnings
    };
  }

  // Validate each color format
  const validColors = colors.filter(color => VALIDATION_PATTERNS.HEX_COLOR.test(color));

  if (validColors.length === 0) {
    errors.push('No valid hex colors found');
    return {
      isValid: false,
      confidence: 0,
      errors,
      warnings
    };
  }

  if (validColors.length < colors.length) {
    warnings.push(`${colors.length - validColors.length} invalid color format(s) removed`);
  }

  // Check if too many colors
  if (validColors.length > 6) {
    warnings.push('More than 6 colors provided, may include non-brand colors');
  }

  // Check if all grayscale (boring brand)
  const isGrayscale = (hex: string): boolean => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff < 10; // Colors are very close
  };

  const grayscaleCount = validColors.filter(isGrayscale).length;
  if (grayscaleCount === validColors.length) {
    warnings.push('All colors are grayscale, brand may lack color identity');
  }

  // Calculate confidence based on validation
  let confidence = 1.0;

  // Reduce confidence for warnings
  if (validColors.length > 6) {
    confidence -= 0.2;
  }
  if (grayscaleCount === validColors.length) {
    confidence -= 0.3;
  }
  if (validColors.length < 2) {
    confidence -= 0.2;
  }

  // Ensure confidence doesn't go below 0.3
  confidence = Math.max(0.3, confidence);

  return {
    isValid: true,
    confidence,
    errors,
    warnings
  };
}

/**
 * Validate contact information
 *
 * Checks:
 * - Email format validity
 * - Phone number format
 * - Presence of at least some contact info
 *
 * @param emails - Array of email addresses
 * @param phones - Array of phone numbers
 * @param addresses - Array of physical addresses
 * @returns Validation result with confidence score
 */
export function validateContactInfo(
  emails: string[],
  phones: string[],
  addresses: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if any contact info provided
  const totalItems = emails.length + phones.length + addresses.length;
  if (totalItems === 0) {
    errors.push('No contact information provided');
    return {
      isValid: false,
      confidence: 0,
      errors,
      warnings
    };
  }

  // Validate email formats
  const validEmails = emails.filter(email => VALIDATION_PATTERNS.EMAIL.test(email));
  if (validEmails.length < emails.length) {
    warnings.push(`${emails.length - validEmails.length} invalid email(s) removed`);
  }

  // Validate phone formats (basic check)
  const validPhones = phones.filter(phone => VALIDATION_PATTERNS.PHONE.test(phone));
  if (validPhones.length < phones.length) {
    warnings.push(`${phones.length - validPhones.length} invalid phone(s) removed`);
  }

  // Check addresses (should be at least 10 chars to be meaningful)
  const validAddresses = addresses.filter(addr => addr.length >= 10);
  if (validAddresses.length < addresses.length) {
    warnings.push(`${addresses.length - validAddresses.length} invalid address(es) removed`);
  }

  const validTotal = validEmails.length + validPhones.length + validAddresses.length;

  if (validTotal === 0) {
    errors.push('No valid contact information found');
    return {
      isValid: false,
      confidence: 0,
      errors,
      warnings
    };
  }

  // Calculate confidence based on quantity and quality
  let confidence = 0.5; // Base confidence

  // Add confidence for each type of contact info
  if (validEmails.length > 0) {
    confidence += 0.2;
  }
  if (validPhones.length > 0) {
    confidence += 0.2;
  }
  if (validAddresses.length > 0) {
    confidence += 0.1;
  }

  // Bonus for multiple items of each type
  if (validTotal >= 3) {
    confidence += 0.1;
  }

  // Cap at 1.0
  confidence = Math.min(1.0, confidence);

  return {
    isValid: true,
    confidence,
    errors,
    warnings
  };
}

/**
 * Validate URL format
 *
 * @param url - URL to validate
 * @returns Whether URL is valid
 */
export function validateUrl(url: string): boolean {
  return VALIDATION_PATTERNS.URL.test(url);
}

/**
 * Validate social media links
 *
 * @param links - Array of social media link objects
 * @returns Validation result
 */
export function validateSocialLinks(
  links: Array<{ platform: string; url: string }>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (links.length === 0) {
    warnings.push('No social media links provided');
    return {
      isValid: true,
      confidence: 0.5,
      errors,
      warnings
    };
  }

  // Validate each link
  const validLinks = links.filter(link => {
    if (!link.platform || !link.url) {
      return false;
    }
    return validateUrl(link.url);
  });

  if (validLinks.length < links.length) {
    warnings.push(`${links.length - validLinks.length} invalid social link(s) removed`);
  }

  // Calculate confidence
  const confidence = validLinks.length > 0 ? 0.7 + (validLinks.length * 0.1) : 0.3;

  return {
    isValid: validLinks.length > 0,
    confidence: Math.min(1.0, confidence),
    errors,
    warnings
  };
}

/**
 * Validate business hours format
 *
 * @param hours - Business hours object
 * @returns Validation result
 */
export function validateBusinessHours(
  hours: Record<string, { open: string | null; close: string | null; closed: boolean }>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const presentDays = Object.keys(hours);

  if (presentDays.length === 0) {
    errors.push('No business hours provided');
    return {
      isValid: false,
      confidence: 0,
      errors,
      warnings
    };
  }

  // Check if all days are present
  if (presentDays.length < 7) {
    warnings.push(`Only ${presentDays.length} days provided, expected 7`);
  }

  // Validate each day
  let validDays = 0;
  presentDays.forEach(day => {
    const dayLower = day.toLowerCase();
    if (!daysOfWeek.includes(dayLower)) {
      warnings.push(`Invalid day name: ${day}`);
      return;
    }

    const dayHours = hours[day];
    if (dayHours.closed) {
      validDays++;
    } else if (dayHours.open && dayHours.close) {
      validDays++;
    } else {
      warnings.push(`Invalid hours for ${day}`);
    }
  });

  const confidence = validDays / 7;

  return {
    isValid: validDays > 0,
    confidence: Math.max(0.3, confidence),
    errors,
    warnings
  };
}
