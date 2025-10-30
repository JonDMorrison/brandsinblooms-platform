/**
 * Configuration for LLM-based content extraction
 *
 * Defines model selections, timeouts, retry logic, and cost constraints
 * for the two-phase hybrid extraction approach.
 */

import type { GenerationOptions } from '@/lib/types/openrouter';
import { MODELS, MODEL_PRICING as PRICING } from '@/lib/ai/model-config';

/**
 * Model configurations for different extraction phases
 *
 * These can be overridden via environment variables:
 * - OPENROUTER_VISION_MODEL for vision model
 * - OPENROUTER_TEXT_MODEL for text model
 */
export const EXTRACTION_MODELS = {
  /** Phase 1: Vision model for brand identity analysis */
  VISION: MODELS.VISION,
  /** Phase 2: Fast text model for content extraction */
  TEXT: MODELS.TEXT,
} as const;

/**
 * Model pricing (per 1M tokens)
 * Used for cost estimation and monitoring
 *
 * Imported from central model config
 */
export const MODEL_PRICING = {
  [EXTRACTION_MODELS.VISION]: PRICING[MODELS.VISION],
  [EXTRACTION_MODELS.TEXT]: PRICING[MODELS.TEXT],
} as const;

/**
 * Phase 1: Visual Brand Analysis Options
 */
export const PHASE1_OPTIONS: GenerationOptions = {
  temperature: 0.3, // Low temperature for consistent brand analysis
  maxTokens: 2000, // Sufficient for brand analysis
  timeout: 20000, // 20 seconds
  retries: 2, // Retry twice on failure
  retryDelay: 1000, // 1 second between retries
} as const;

/**
 * Phase 2: Text Extraction Options
 * Used for all three parallel Phase 2 extractions
 */
export const PHASE2_OPTIONS: GenerationOptions = {
  temperature: 0.2, // Very low temperature for factual extraction
  maxTokens: 3000, // Sufficient for detailed content
  timeout: 30000, // 30 seconds (matches OpenRouter default, prevents free-tier timeouts)
  retries: 3, // Retry three times on failure (free-tier models can be queued)
  retryDelay: 1000, // 1 second between retries
} as const;

/**
 * HTML preprocessing limits
 */
export const HTML_LIMITS = {
  /** Maximum size for visual HTML (structure only) */
  VISUAL_HTML_MAX_SIZE: 10 * 1024, // 10KB
  /** Maximum size for text HTML (content only) */
  TEXT_HTML_MAX_SIZE: 15 * 1024, // 15KB
  /** Maximum size for image extraction HTML (structure with styles) */
  IMAGE_HTML_MAX_SIZE: 10 * 1024, // 10KB - reduced for faster processing
  /** Maximum screenshot size (base64) */
  SCREENSHOT_MAX_SIZE: 500 * 1024, // 500KB
} as const;

/**
 * Confidence thresholds for validation
 */
export const CONFIDENCE_THRESHOLDS = {
  /** Minimum confidence to accept brand colors */
  BRAND_COLORS: 0.3,
  /** Minimum confidence to accept contact info */
  CONTACT_INFO: 0.3,
  /** Minimum confidence to accept content */
  CONTENT: 0.3,
  /** Minimum confidence to use LLM results over fallback */
  USE_LLM_OVER_FALLBACK: 0.5,
} as const;

/**
 * Extraction behavior flags
 */
export const EXTRACTION_FLAGS = {
  /** Enable fallback to algorithmic extraction on LLM failure */
  ENABLE_FALLBACK: true,
  /** Enable screenshot capture for vision analysis */
  ENABLE_SCREENSHOT: false, // Disabled by default, requires headless browser
  /** Log detailed extraction metrics */
  LOG_METRICS: true,
  /** Log LLM prompts and responses (for debugging) */
  LOG_PROMPTS: false,
} as const;

/**
 * Note: LLM extraction is enabled by default. To disable, set:
 * ENABLE_LLM_EXTRACTION=false
 */

/**
 * Performance targets and limits
 */
export const PERFORMANCE_TARGETS = {
  /** Target total extraction time (ms) */
  TARGET_DURATION_MS: 30000, // 30 seconds
  /** Maximum total extraction time before timeout (ms) */
  MAX_DURATION_MS: 45000, // 45 seconds
  /** Target cost per site extraction */
  TARGET_COST_USD: 0.014, // $0.014 per site
  /** Maximum cost per site before warning */
  MAX_COST_USD: 0.025, // $0.025 per site
} as const;

/**
 * Validation regex patterns
 */
export const VALIDATION_PATTERNS = {
  /** Email validation pattern */
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
  /** Hex color validation pattern */
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  /** US phone number pattern (flexible) */
  PHONE: /^[\d\s\-\(\)\.+]+$/,
  /** URL validation pattern */
  URL: /^https?:\/\/.+/i,
} as const;

/**
 * Feature flag check
 * Defaults to true - set ENABLE_LLM_EXTRACTION=false to disable
 */
export function isLLMExtractionEnabled(): boolean {
  return process.env.ENABLE_LLM_EXTRACTION !== 'false';
}

/**
 * Get OpenRouter API key
 */
export function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

/**
 * Check if LLM extraction is configured and ready
 */
export function isLLMExtractionReady(): boolean {
  return isLLMExtractionEnabled() && getOpenRouterApiKey() !== undefined;
}
