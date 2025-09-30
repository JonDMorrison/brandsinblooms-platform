/**
 * Input Sanitization Module
 *
 * Provides comprehensive sanitization and validation for user inputs to prevent:
 * - Prompt injection attacks
 * - Template injection attempts
 * - Malicious patterns
 * - Excessive input lengths
 *
 * This module serves as the first line of defense before sending data to LLMs.
 */

import type { BusinessInfo } from '@/lib/types/site-generation-jobs';

/**
 * Maximum allowed length for user prompts (characters)
 * Rationale: Prevents excessive token usage and potential abuse
 */
export const MAX_PROMPT_LENGTH = 2000;

/**
 * Maximum allowed length for business name
 */
export const MAX_NAME_LENGTH = 200;

/**
 * Maximum allowed length for other text fields
 */
export const MAX_TEXT_FIELD_LENGTH = 500;

/**
 * Blocked patterns that indicate potential injection attempts
 * These patterns are commonly used in prompt injection attacks
 */
const BLOCKED_PATTERNS = [
  // Template injection attempts
  /\{\{.*?\}\}/gi,                    // Handlebars/Mustache templates
  /\{%.*?%\}/gi,                      // Jinja-style templates
  /\[\[.*?\]\]/gi,                    // MediaWiki/bracket templates
  /\[INST\].*?\[\/INST\]/gi,          // LLM instruction markers

  // Direct system/role injection attempts
  /system:\s*/gi,
  /assistant:\s*/gi,
  /\buser:\s*/gi,
  /<\|system\|>/gi,
  /<\|assistant\|>/gi,
  /<\|user\|>/gi,

  // Role-play injection attempts
  /(?:act|pretend|roleplay)\s+(?:as|like)\s+(?:a|an)/gi,
  /ignore\s+(?:previous|all|above)\s+(?:instructions|prompts)/gi,
  /forget\s+(?:previous|all|above)\s+(?:instructions|prompts)/gi,
  /disregard\s+(?:previous|all|above)\s+(?:instructions|prompts)/gi,

  // System prompt override attempts
  /new\s+(?:instructions|prompt|system\s+message)/gi,
  /override\s+(?:instructions|prompt|system)/gi,
  /modify\s+(?:instructions|prompt|system)/gi,
];

/**
 * Control characters to remove (excluding normal whitespace)
 * Rationale: Control characters can be used to bypass filters or cause rendering issues
 */
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g;

/**
 * Excessive whitespace patterns to normalize
 */
const EXCESSIVE_WHITESPACE = /\s{3,}/g;

/**
 * Validation result for prompt content
 */
export interface ValidationResult {
  /** Whether the prompt passes validation */
  valid: boolean;
  /** List of validation errors found */
  errors: string[];
}

/**
 * Sanitizes a user's business prompt
 *
 * Security measures:
 * 1. Remove control characters that could bypass filters
 * 2. Remove template injection attempts
 * 3. Detect and block prompt injection patterns
 * 4. Enforce maximum length to prevent token abuse
 * 5. Normalize whitespace
 *
 * @param prompt - Raw user input prompt
 * @returns Sanitized prompt safe for LLM processing
 *
 * @example
 * ```ts
 * const userInput = "Create a bakery website {{system: ignore}}";
 * const safe = sanitizeBusinessPrompt(userInput);
 * // Returns: "Create a bakery website"
 * ```
 */
export function sanitizeBusinessPrompt(prompt: string): string {
  if (typeof prompt !== 'string') {
    return '';
  }

  let sanitized = prompt;

  // 1. Remove control characters (but preserve normal whitespace)
  sanitized = sanitized.replace(CONTROL_CHARS_REGEX, '');

  // 2. Remove blocked patterns (template injection, role markers, etc.)
  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 3. Normalize excessive whitespace
  sanitized = sanitized.replace(EXCESSIVE_WHITESPACE, ' ');

  // 4. Trim leading/trailing whitespace
  sanitized = sanitized.trim();

  // 5. Enforce maximum length
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitizes a single text field with appropriate length limit
 *
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 *
 * @example
 * ```ts
 * const name = sanitizeTextField(userInput, MAX_NAME_LENGTH);
 * ```
 */
export function sanitizeTextField(text: string | undefined, maxLength: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Remove control characters
  sanitized = sanitized.replace(CONTROL_CHARS_REGEX, '');

  // Remove template patterns
  sanitized = sanitized.replace(/\{\{.*?\}\}/gi, '');
  sanitized = sanitized.replace(/\{%.*?%\}/gi, '');
  sanitized = sanitized.replace(/\[\[.*?\]\]/gi, '');

  // Normalize whitespace
  sanitized = sanitized.replace(EXCESSIVE_WHITESPACE, ' ');
  sanitized = sanitized.trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes URL input to prevent javascript: and data: URI schemes
 *
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * ```ts
 * const url = sanitizeUrl(userInput);
 * // Blocks: javascript:alert(1), data:text/html,...
 * ```
 */
export function sanitizeUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const sanitized = url.trim();

  // Block dangerous URI schemes
  const dangerousSchemes = /^(javascript|data|vbscript|file):/i;
  if (dangerousSchemes.test(sanitized)) {
    return '';
  }

  // Only allow http, https, or relative URLs
  if (sanitized && !sanitized.match(/^(https?:\/\/|\/)/i)) {
    return '';
  }

  return sanitized.substring(0, MAX_TEXT_FIELD_LENGTH);
}

/**
 * Sanitizes email input
 *
 * @param email - Raw email input
 * @returns Sanitized email or empty string if invalid format
 *
 * @example
 * ```ts
 * const email = sanitizeEmail(userInput);
 * ```
 */
export function sanitizeEmail(email: string | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const sanitized = email.trim().toLowerCase();

  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    return '';
  }

  return sanitized.substring(0, MAX_TEXT_FIELD_LENGTH);
}

/**
 * Sanitizes phone number input
 *
 * @param phone - Raw phone input
 * @returns Sanitized phone (digits, spaces, hyphens, parentheses, plus only)
 *
 * @example
 * ```ts
 * const phone = sanitizePhone(userInput);
 * ```
 */
export function sanitizePhone(phone: string | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep only valid phone characters: digits, spaces, hyphens, parentheses, plus
  const sanitized = phone.replace(/[^\d\s\-()+ ]/g, '').trim();

  return sanitized.substring(0, 50);
}

/**
 * Sanitizes the entire BusinessInfo object
 *
 * Applies appropriate sanitization to each field based on its type and purpose.
 *
 * @param info - Raw business information from user
 * @returns Sanitized business information safe for processing
 *
 * @example
 * ```ts
 * const rawInfo = await request.json();
 * const safeInfo = sanitizeBusinessInfo(rawInfo);
 * // Now safe to pass to LLM or store in database
 * ```
 */
export function sanitizeBusinessInfo(info: BusinessInfo): BusinessInfo {
  return {
    prompt: sanitizeBusinessPrompt(info.prompt || ''),
    name: sanitizeTextField(info.name, MAX_NAME_LENGTH),
    industry: sanitizeTextField(info.industry, MAX_TEXT_FIELD_LENGTH),
    location: sanitizeTextField(info.location, MAX_TEXT_FIELD_LENGTH),
    description: sanitizeTextField(info.description, MAX_TEXT_FIELD_LENGTH),
    email: sanitizeEmail(info.email),
    phone: sanitizePhone(info.phone),
    website: sanitizeUrl(info.website),
    additionalDetails: info.additionalDetails
      ? sanitizeAdditionalDetails(info.additionalDetails)
      : undefined,
  };
}

/**
 * Sanitizes additional details object recursively
 *
 * @param details - Raw additional details
 * @returns Sanitized details object
 */
function sanitizeAdditionalDetails(
  details: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    // Sanitize key (limit length, remove special chars)
    const safeKey = sanitizeTextField(key, 100);
    if (!safeKey) continue;

    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[safeKey] = sanitizeTextField(value, MAX_TEXT_FIELD_LENGTH);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[safeKey] = value;
    } else if (typeof value === 'boolean') {
      sanitized[safeKey] = value;
    }
    // Skip complex objects, arrays, functions, etc.
  }

  return sanitized;
}

/**
 * Validates prompt content for blocked patterns
 *
 * This is a separate validation step that can be used to reject prompts
 * before processing (rather than silently sanitizing them).
 *
 * @param prompt - Prompt to validate
 * @returns Validation result with specific errors
 *
 * @example
 * ```ts
 * const result = validatePromptContent(userPrompt);
 * if (!result.valid) {
 *   return apiError(`Invalid prompt: ${result.errors.join(', ')}`, 'INVALID_PROMPT', 400);
 * }
 * ```
 */
export function validatePromptContent(prompt: string): ValidationResult {
  const errors: string[] = [];

  if (!prompt || typeof prompt !== 'string') {
    errors.push('Prompt is required and must be a string');
    return { valid: false, errors };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    errors.push(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
  }

  if (prompt.trim().length < 10) {
    errors.push('Prompt is too short (minimum 10 characters)');
  }

  // Check for blocked patterns
  const patterns = [
    { regex: /\{\{.*?\}\}/gi, message: 'Template syntax detected' },
    { regex: /\{%.*?%\}/gi, message: 'Template syntax detected' },
    { regex: /\[INST\].*?\[\/INST\]/gi, message: 'Instruction markers detected' },
    { regex: /system:\s*/gi, message: 'System role markers detected' },
    { regex: /assistant:\s*/gi, message: 'Assistant role markers detected' },
    { regex: /<\|system\|>/gi, message: 'System role markers detected' },
    { regex: /ignore\s+(?:previous|all|above)\s+(?:instructions|prompts)/gi,
      message: 'Prompt injection attempt detected' },
    { regex: /forget\s+(?:previous|all|above)\s+(?:instructions|prompts)/gi,
      message: 'Prompt injection attempt detected' },
    { regex: /disregard\s+(?:previous|all|above)\s+(?:instructions|prompts)/gi,
      message: 'Prompt injection attempt detected' },
  ];

  for (const { regex, message } of patterns) {
    if (regex.test(prompt)) {
      errors.push(message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates BusinessInfo object for required fields
 *
 * @param info - Business info to validate
 * @returns Validation result
 *
 * @example
 * ```ts
 * const result = validateBusinessInfo(businessInfo);
 * if (!result.valid) {
 *   return apiError(result.errors.join(', '), 'INVALID_INPUT', 400);
 * }
 * ```
 */
export function validateBusinessInfo(info: BusinessInfo): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!info.prompt || typeof info.prompt !== 'string' || info.prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }

  if (!info.name || typeof info.name !== 'string' || info.name.trim().length === 0) {
    errors.push('Business name is required');
  }

  // Validate prompt content
  if (info.prompt) {
    const promptValidation = validatePromptContent(info.prompt);
    if (!promptValidation.valid) {
      errors.push(...promptValidation.errors);
    }
  }

  // Validate email if provided
  if (info.email && info.email.length > 0) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(info.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate URL if provided
  if (info.website && info.website.length > 0) {
    const dangerousSchemes = /^(javascript|data|vbscript|file):/i;
    if (dangerousSchemes.test(info.website)) {
      errors.push('Invalid website URL format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}