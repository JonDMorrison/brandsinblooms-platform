/**
 * Content Moderation Module
 *
 * Validates and sanitizes LLM-generated content to prevent:
 * - Cross-Site Scripting (XSS) attacks
 * - Script injection
 * - Dangerous HTML elements
 * - Malicious URLs
 * - SQL injection patterns
 *
 * This module validates content AFTER generation and BEFORE storing in the database.
 */

import type { GeneratedSiteData, ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

/**
 * Content validation result
 */
export interface ContentValidationResult {
  /** Whether content passes all safety checks */
  safe: boolean;
  /** List of specific violations found */
  violations: string[];
}

/**
 * XSS and script injection patterns
 * These patterns detect common XSS attack vectors
 */
const XSS_PATTERNS = [
  // Script tags
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<script\b[^>]*>/gi,

  // Event handlers (most common XSS vectors)
  /\bon\w+\s*=/gi,                                    // onclick, onerror, onload, etc.
  /\bon\w+\s*:\s*/gi,                                 // CSS event handler syntax

  // JavaScript protocol in URLs
  /javascript\s*:/gi,

  // Data URIs (can contain HTML/JS)
  /data:\s*text\/html/gi,
  /data:\s*application\/javascript/gi,

  // VBScript protocol (IE)
  /vbscript\s*:/gi,

  // Dangerous HTML tags
  /<iframe\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<applet\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<base\b[^>]*>/gi,

  // Expression functions (IE)
  /expression\s*\(/gi,

  // Import statements
  /@import/gi,

  // Form actions to javascript
  /<form[^>]+action\s*=\s*["']?\s*javascript:/gi,
];

/**
 * SQL injection patterns
 * While our LLM shouldn't generate SQL, we check defensively
 */
const SQL_INJECTION_PATTERNS = [
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bDROP\b.*\bTABLE\b)/gi,
  /(\bDELETE\b.*\bFROM\b)/gi,
  /(\bINSERT\b.*\bINTO\b)/gi,
  /(\bUPDATE\b.*\bSET\b)/gi,
  /(\bEXEC\b.*\()/gi,
  /(\bEXECUTE\b.*\()/gi,
  /;.*--/g,                         // SQL comment after semicolon
  /'\s*OR\s*'?\d*'?\s*=\s*'?\d*/gi, // Classic OR 1=1
];

/**
 * Suspicious URL patterns
 * Detects potentially malicious URLs
 */
const SUSPICIOUS_URL_PATTERNS = [
  // IP addresses as URLs (often used for phishing)
  /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/g,

  // Known malicious TLDs (expanded list)
  /\.(?:xyz|top|work|click|link|gq|ml|cf|tk|ga)\b/gi,

  // Double slashes (URL confusion attacks)
  /https?:\/\/.*\/\//g,

  // URL encoding obfuscation
  /%(?:2[ef]|3[ce]|2b)/gi,
];

/**
 * Maximum allowed length for various content types
 * Prevents excessive content that could cause performance issues
 */
const MAX_TEXT_LENGTH = 5000;
const MAX_URL_LENGTH = 2000;
const MAX_ARRAY_LENGTH = 50;

/**
 * Validates generated content for security threats
 *
 * Checks for:
 * - XSS patterns and script injection
 * - Dangerous HTML elements
 * - SQL injection patterns
 * - Malicious URLs
 * - Excessive content length
 *
 * @param content - Content to validate (string or object)
 * @returns Validation result with violations list
 *
 * @example
 * ```ts
 * const result = validateGeneratedContent(llmOutput);
 * if (!result.safe) {
 *   console.error('Unsafe content detected:', result.violations);
 *   await updateJobError({
 *     jobId,
 *     errorMessage: 'Generated content failed safety checks',
 *     errorCode: 'CONTENT_MODERATION_FAILED'
 *   });
 * }
 * ```
 */
export function validateGeneratedContent(content: string | object): ContentValidationResult {
  const violations: string[] = [];

  // Convert to string for pattern matching
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

  // Check for XSS patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(contentStr)) {
      violations.push('XSS pattern detected');
      break; // Only report once
    }
  }

  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(contentStr)) {
      violations.push('SQL injection pattern detected');
      break;
    }
  }

  // Check for suspicious URLs
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (pattern.test(contentStr)) {
      violations.push('Suspicious URL pattern detected');
      break;
    }
  }

  // Check content length
  if (contentStr.length > MAX_TEXT_LENGTH * 10) {
    violations.push('Content exceeds maximum allowed length');
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}

/**
 * Sanitizes text by removing dangerous patterns
 *
 * This is more aggressive than validation - it removes content.
 * Use when you want to salvage content rather than reject it entirely.
 *
 * @param text - Raw text to sanitize
 * @returns Sanitized text safe for display
 *
 * @example
 * ```ts
 * const safe = sanitizeGeneratedText(llmOutput);
 * ```
 */
export function sanitizeGeneratedText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<script\b[^>]*>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\bon\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  sanitized = sanitized.replace(/data:\s*text\/html/gi, '');

  // Remove dangerous tags
  sanitized = sanitized.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
  sanitized = sanitized.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<applet\b[^>]*>[\s\S]*?<\/applet>/gi, '');

  // Trim to max length
  if (sanitized.length > MAX_TEXT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_TEXT_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Sanitizes a URL to ensure it's safe
 *
 * @param url - URL to sanitize
 * @returns Safe URL or empty string if invalid
 *
 * @example
 * ```ts
 * const safeUrl = sanitizeUrl(generatedUrl);
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Block dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return '';
  }

  // Only allow http, https, mailto, or relative URLs
  if (trimmed && !trimmed.match(/^(https?:\/\/|mailto:|\/)/i)) {
    return '';
  }

  // Limit length
  if (trimmed.length > MAX_URL_LENGTH) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitizes an array of strings
 *
 * @param arr - Array to sanitize
 * @param maxLength - Maximum array length
 * @returns Sanitized array
 */
function sanitizeStringArray(arr: unknown, maxLength: number = MAX_ARRAY_LENGTH): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxLength)
    .map(item => sanitizeGeneratedText(item));
}

/**
 * Moderates structured site data from LLM output
 *
 * Performs deep validation and sanitization of the entire GeneratedSiteData structure.
 * This is the main function to call before storing LLM output.
 *
 * @param data - Generated site data from LLM
 * @returns Content validation result
 *
 * @example
 * ```ts
 * const llmOutput: GeneratedSiteData = await callLLM(prompt);
 * const moderation = moderateStructuredContent(llmOutput);
 *
 * if (!moderation.safe) {
 *   throw new Error(`Content moderation failed: ${moderation.issues.join(', ')}`);
 * }
 *
 * // Safe to store in database
 * await updateJobResult({ jobId, generatedData: llmOutput, ... });
 * ```
 */
export function moderateStructuredContent(data: GeneratedSiteData): ContentValidationResult {
  const issues: string[] = [];

  try {
    // Validate overall structure
    const overallValidation = validateGeneratedContent(data);
    if (!overallValidation.safe) {
      issues.push(...overallValidation.violations);
    }

    // Validate specific fields
    if (data.site_name) {
      const nameValidation = validateGeneratedContent(data.site_name);
      if (!nameValidation.safe) {
        issues.push('Site name contains unsafe content');
      }
    }

    if (data.tagline) {
      const taglineValidation = validateGeneratedContent(data.tagline);
      if (!taglineValidation.safe) {
        issues.push('Tagline contains unsafe content');
      }
    }

    if (data.description) {
      const descValidation = validateGeneratedContent(data.description);
      if (!descValidation.safe) {
        issues.push('Description contains unsafe content');
      }
    }

    // Validate hero section
    if (data.hero) {
      const heroValidation = validateGeneratedContent(data.hero);
      if (!heroValidation.safe) {
        issues.push('Hero section contains unsafe content');
      }
    }

    // Validate about section
    if (data.about?.content && Array.isArray(data.about.content)) {
      for (const paragraph of data.about.content) {
        const paraValidation = validateGeneratedContent(paragraph);
        if (!paraValidation.safe) {
          issues.push('About section contains unsafe content');
          break;
        }
      }
    }

    // Validate values section
    if (data.values?.values && Array.isArray(data.values.values)) {
      if (data.values.values.length > MAX_ARRAY_LENGTH) {
        issues.push('Values array exceeds maximum length');
      }
      for (const value of data.values.values) {
        const valueValidation = validateGeneratedContent(value);
        if (!valueValidation.safe) {
          issues.push('Values section contains unsafe content');
          break;
        }
      }
    }

    // Validate features section
    if (data.features?.features && Array.isArray(data.features.features)) {
      if (data.features.features.length > MAX_ARRAY_LENGTH) {
        issues.push('Features array exceeds maximum length');
      }
      for (const feature of data.features.features) {
        const featureValidation = validateGeneratedContent(feature);
        if (!featureValidation.safe) {
          issues.push('Features section contains unsafe content');
          break;
        }
      }
    }

    // Validate services section
    if (data.services?.services && Array.isArray(data.services.services)) {
      if (data.services.services.length > MAX_ARRAY_LENGTH) {
        issues.push('Services array exceeds maximum length');
      }
      for (const service of data.services.services) {
        const serviceValidation = validateGeneratedContent(service);
        if (!serviceValidation.safe) {
          issues.push('Services section contains unsafe content');
          break;
        }
      }
    }

    // Validate team section
    if (data.team?.members && Array.isArray(data.team.members)) {
      if (data.team.members.length > MAX_ARRAY_LENGTH) {
        issues.push('Team members array exceeds maximum length');
      }
      for (const member of data.team.members) {
        const memberValidation = validateGeneratedContent(member);
        if (!memberValidation.safe) {
          issues.push('Team section contains unsafe content');
          break;
        }
      }
    }

    // Validate testimonials section
    if (data.testimonials?.testimonials && Array.isArray(data.testimonials.testimonials)) {
      if (data.testimonials.testimonials.length > MAX_ARRAY_LENGTH) {
        issues.push('Testimonials array exceeds maximum length');
      }
      for (const testimonial of data.testimonials.testimonials) {
        const testimonialValidation = validateGeneratedContent(testimonial);
        if (!testimonialValidation.safe) {
          issues.push('Testimonials section contains unsafe content');
          break;
        }
      }
    }

    // Validate contact section
    if (data.contact) {
      const contactValidation = validateGeneratedContent(data.contact);
      if (!contactValidation.safe) {
        issues.push('Contact section contains unsafe content');
      }

      // Specifically validate email and URLs in contact
      if (data.contact.email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(data.contact.email)) {
          issues.push('Invalid email format in contact section');
        }
      }
    }

    // Validate branding colors
    if (data.branding) {
      const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

      if (data.branding.primary_color && !hexColorPattern.test(data.branding.primary_color)) {
        issues.push('Invalid primary color format');
      }

      if (data.branding.secondary_color && !hexColorPattern.test(data.branding.secondary_color)) {
        issues.push('Invalid secondary color format');
      }

      if (data.branding.accent_color && !hexColorPattern.test(data.branding.accent_color)) {
        issues.push('Invalid accent color format');
      }
    }

    // Validate SEO metadata
    if (data.seo) {
      if (data.seo.title && data.seo.title.length > 100) {
        issues.push('SEO title exceeds maximum length');
      }

      if (data.seo.description && data.seo.description.length > 300) {
        issues.push('SEO description exceeds maximum length');
      }

      if (data.seo.keywords && Array.isArray(data.seo.keywords) && data.seo.keywords.length > 20) {
        issues.push('Too many SEO keywords');
      }
    }

  } catch (error) {
    issues.push('Error during content moderation');
  }

  return {
    safe: issues.length === 0,
    violations: issues,
  };
}

/**
 * Sanitizes entire GeneratedSiteData structure
 *
 * Use this to sanitize content rather than rejecting it.
 * Note: This modifies the object in place for performance.
 *
 * @param data - Generated site data to sanitize
 * @returns Sanitized data
 *
 * @example
 * ```ts
 * const sanitized = sanitizeGeneratedSiteData(llmOutput);
 * // Now safe to store
 * ```
 */
export function sanitizeGeneratedSiteData(data: GeneratedSiteData): GeneratedSiteData {
  // Sanitize top-level strings
  if (data.site_name) {
    data.site_name = sanitizeGeneratedText(data.site_name);
  }
  if (data.tagline) {
    data.tagline = sanitizeGeneratedText(data.tagline);
  }
  if (data.description) {
    data.description = sanitizeGeneratedText(data.description);
  }

  // Sanitize hero section
  if (data.hero) {
    data.hero.headline = sanitizeGeneratedText(data.hero.headline);
    data.hero.subheadline = sanitizeGeneratedText(data.hero.subheadline);
    data.hero.cta_text = sanitizeGeneratedText(data.hero.cta_text);
    if (data.hero.background_image) {
      data.hero.background_image = sanitizeGeneratedText(data.hero.background_image);
    }
  }

  // Sanitize about section
  if (data.about) {
    data.about.title = sanitizeGeneratedText(data.about.title);
    if (Array.isArray(data.about.content)) {
      data.about.content = sanitizeStringArray(data.about.content);
    }
    if (data.about.mission) {
      data.about.mission = sanitizeGeneratedText(data.about.mission);
    }
    if (data.about.vision) {
      data.about.vision = sanitizeGeneratedText(data.about.vision);
    }
  }

  // Sanitize values section
  if (data.values?.values && Array.isArray(data.values.values)) {
    data.values.values = data.values.values.slice(0, MAX_ARRAY_LENGTH).map(value => ({
      title: sanitizeGeneratedText(value.title),
      description: sanitizeGeneratedText(value.description),
      icon: sanitizeGeneratedText(value.icon),
    }));
  }

  // Sanitize contact section
  if (data.contact) {
    data.contact.title = sanitizeGeneratedText(data.contact.title);
    data.contact.email = sanitizeGeneratedText(data.contact.email);
    if (data.contact.phone) {
      data.contact.phone = sanitizeGeneratedText(data.contact.phone);
    }
    if (data.contact.address) {
      data.contact.address = sanitizeGeneratedText(data.contact.address);
    }
  }

  return data;
}

/**
 * Checks if a URL is safe (HTTP/HTTPS only)
 *
 * @param url - URL to validate
 * @returns true if URL is safe, false otherwise
 *
 * @example
 * ```ts
 * if (isSafeUrl(logoUrl)) {
 *   // Safe to use
 * }
 * ```
 */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates scraped website content for malicious patterns
 *
 * Performs comprehensive validation of all fields in the scraped context:
 * - Validates all text content for XSS and injection patterns
 * - Validates URLs (logo, social links) for safe protocols
 * - Checks email, phone, and address fields
 * - Ensures all content meets security standards
 *
 * @param data - Scraped website context to validate
 * @returns true if content is safe, false if malicious patterns detected
 *
 * @example
 * ```ts
 * const scrapedData = await scrapeWebsite(url);
 * const isSafe = moderateScrapedContent(scrapedData);
 *
 * if (!isSafe) {
 *   throw new Error('Scraped content contains malicious patterns');
 * }
 * ```
 */
export function moderateScrapedContent(data: ScrapedWebsiteContext): boolean {
  // Check all text fields
  const textFields: string[] = [];

  // Add content summary
  if (data.contentSummary) {
    textFields.push(data.contentSummary);
  }

  // Add page contents
  if (data.pageContents) {
    const pageContentValues = Object.values(data.pageContents).filter(
      (value): value is string => typeof value === 'string'
    );
    textFields.push(...pageContentValues);
  }

  // Add business info text fields
  if (data.businessInfo.emails) {
    textFields.push(...data.businessInfo.emails);
  }

  if (data.businessInfo.phones) {
    textFields.push(...data.businessInfo.phones);
  }

  if (data.businessInfo.addresses) {
    textFields.push(...data.businessInfo.addresses);
  }

  if (data.businessInfo.brandColors) {
    textFields.push(...data.businessInfo.brandColors);
  }

  // Validate all text fields
  for (const text of textFields) {
    if (text) {
      const validation = validateGeneratedContent(text);
      if (!validation.safe) {
        return false;
      }
    }
  }

  // Validate URLs
  if (data.businessInfo.logoUrl && !isSafeUrl(data.businessInfo.logoUrl)) {
    return false;
  }

  // Validate social links
  if (data.businessInfo.socialLinks) {
    for (const social of data.businessInfo.socialLinks) {
      if (!isSafeUrl(social.url)) {
        return false;
      }
    }
  }

  return true;
}