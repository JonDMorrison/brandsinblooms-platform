/**
 * Central configuration for all LLM models used in the platform
 *
 * This module provides a single source of truth for model selection across
 * site generation and content extraction features.
 */

/**
 * Model identifiers with environment variable overrides
 */
export const MODELS = {
  /**
   * Default model for general site generation
   * Override with OPENROUTER_MODEL env variable
   */
  DEFAULT: process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder:exacto',

  /**
   * Vision model for brand identity extraction (Phase 1)
   * Override with OPENROUTER_VISION_MODEL env variable
   */
  VISION: process.env.OPENROUTER_VISION_MODEL || 'qwen/qwen3-vl-32b-instruct',

  /**
   * Fast text model for content extraction (Phase 2)
   * Override with OPENROUTER_TEXT_MODEL env variable
   */
  TEXT: process.env.OPENROUTER_TEXT_MODEL || 'qwen/qwen3-coder-flash',
} as const;

/**
 * Model pricing (per 1M tokens in USD)
 * Used for cost estimation and monitoring
 *
 * Note: Update these values when changing models or when pricing changes
 */
export const MODEL_PRICING = {
  [MODELS.DEFAULT]: {
    input: 0.0,  // Free
    output: 0.0, // Free
  },
  [MODELS.VISION]: {
    input: 2.0,  // $2.00 per 1M input tokens
    output: 10.0, // $10.00 per 1M output tokens
  },
  [MODELS.TEXT]: {
    input: 0.0,  // Free
    output: 0.0, // Free
  },
} as const;

/**
 * Get the current model configuration
 * Useful for logging and debugging
 */
export function getModelConfig() {
  return {
    default: MODELS.DEFAULT,
    vision: MODELS.VISION,
    text: MODELS.TEXT,
    pricing: MODEL_PRICING,
  };
}
