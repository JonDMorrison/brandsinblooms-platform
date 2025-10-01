/**
 * OpenRouter API client for LLM integration
 *
 * This module provides a production-ready client for the OpenRouter API,
 * which serves as a gateway to multiple LLM providers including OpenAI,
 * Anthropic, Google, and others.
 *
 * Features:
 * - Automatic retries with exponential backoff
 * - Timeout handling
 * - Structured JSON output via OpenAI SDK
 * - Comprehensive error handling
 * - Type-safe responses
 *
 * @see https://openrouter.ai/docs
 */

import OpenAI from 'openai';
import { handleError } from '@/lib/types/error-handling';
import {
  type OpenRouterConfig,
  type GenerationOptions,
  type GenerationResponse,
  OpenRouterErrorType,
  createOpenRouterError,
  type OpenRouterError
} from '@/lib/types/openrouter';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<GenerationOptions> = {
  temperature: 1,
  maxTokens: 4096,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
};

/**
 * OpenRouter configuration from environment variables
 */
function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENROUTER_MODEL || 'x-ai/grok-code-fast-1';

  if (!apiKey) {
    throw createOpenRouterError(
      OpenRouterErrorType.AUTHENTICATION_ERROR,
      'OPENROUTER_API_KEY environment variable is not set'
    );
  }

  return { apiKey, baseURL, model };
}

/**
 * Create an OpenAI client configured for OpenRouter
 */
function createOpenRouterClient(): OpenAI {
  const config = getOpenRouterConfig();

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
      'X-Title': 'Brands in Blooms Platform'
    }
  });
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert OpenAI SDK errors to OpenRouter errors
 */
function handleOpenAIError(error: unknown): OpenRouterError {
  const errorInfo = handleError(error);

  // Check for specific error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('invalid api key') || message.includes('unauthorized')) {
      return createOpenRouterError(
        OpenRouterErrorType.AUTHENTICATION_ERROR,
        'Invalid OpenRouter API key',
        { details: errorInfo.details }
      );
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return createOpenRouterError(
        OpenRouterErrorType.RATE_LIMIT_ERROR,
        'OpenRouter rate limit exceeded',
        { statusCode: 429, details: errorInfo.details }
      );
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return createOpenRouterError(
        OpenRouterErrorType.TIMEOUT_ERROR,
        'Request to OpenRouter timed out',
        { details: errorInfo.details }
      );
    }

    // Connection errors
    if (message.includes('connection') || message.includes('network')) {
      return createOpenRouterError(
        OpenRouterErrorType.CONNECTION_ERROR,
        'Failed to connect to OpenRouter',
        { details: errorInfo.details }
      );
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('validation')) {
      return createOpenRouterError(
        OpenRouterErrorType.INVALID_REQUEST_ERROR,
        'Invalid request parameters',
        { details: errorInfo.details }
      );
    }
  }

  // Default to API error
  return createOpenRouterError(
    OpenRouterErrorType.API_ERROR,
    errorInfo.message,
    {
      code: errorInfo.code,
      details: errorInfo.details
    }
  );
}

/**
 * Generate content using OpenRouter with retries
 *
 * @param prompt - The user prompt to send to the LLM
 * @param systemPrompt - The system prompt that sets context and instructions
 * @param options - Optional generation parameters
 * @returns Typed response from the LLM
 *
 * @example
 * ```typescript
 * const response = await generateWithOpenRouter<{ title: string; description: string }>(
 *   "Create a homepage for a flower shop",
 *   "You are a web design expert. Generate structured page content.",
 *   { temperature: 0.7, maxTokens: 2000 }
 * );
 * console.log(response.content.title);
 * ```
 */
export async function generateWithOpenRouter<T = unknown>(
  prompt: string,
  systemPrompt: string,
  options?: GenerationOptions
): Promise<GenerationResponse<T>> {
  const config = getOpenRouterConfig();
  const client = createOpenRouterClient();

  // Merge options with defaults
  const finalOptions: Required<GenerationOptions> = {
    temperature: options?.temperature ?? DEFAULT_CONFIG.temperature!,
    maxTokens: options?.maxTokens ?? DEFAULT_CONFIG.maxTokens!,
    topP: options?.topP ?? 1,
    frequencyPenalty: options?.frequencyPenalty ?? 0,
    presencePenalty: options?.presencePenalty ?? 0,
    timeout: options?.timeout ?? DEFAULT_CONFIG.timeout!,
    retries: options?.retries ?? DEFAULT_CONFIG.retries!,
    retryDelay: options?.retryDelay ?? DEFAULT_CONFIG.retryDelay!
  };

  let lastError: OpenRouterError | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= finalOptions.retries; attempt++) {
    try {
      // Add delay before retry (except first attempt)
      if (attempt > 0) {
        const delay = finalOptions.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await sleep(delay);
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

      try {
        // Make API request with JSON mode
        const completion = await client.chat.completions.create(
          {
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: finalOptions.temperature,
            max_tokens: finalOptions.maxTokens,
            top_p: finalOptions.topP,
            frequency_penalty: finalOptions.frequencyPenalty,
            presence_penalty: finalOptions.presencePenalty,
            response_format: { type: 'json_object' }
          },
          {
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        // Extract response
        const message = completion.choices[0]?.message;
        if (!message?.content) {
          throw createOpenRouterError(
            OpenRouterErrorType.API_ERROR,
            'No content in response from OpenRouter'
          );
        }

        // Parse JSON response
        let parsedContent: T;
        try {
          parsedContent = JSON.parse(message.content) as T;
        } catch (parseError: unknown) {
          throw createOpenRouterError(
            OpenRouterErrorType.PARSING_ERROR,
            'Failed to parse JSON response from OpenRouter',
            {
              details: `Raw content: ${message.content.substring(0, 200)}...`
            }
          );
        }

        // Return successful response
        return {
          content: parsedContent,
          usage: completion.usage
            ? {
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens
              }
            : undefined,
          model: completion.model,
          finishReason: completion.choices[0]?.finish_reason
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      lastError = handleOpenAIError(error);

      // Don't retry on authentication or validation errors
      if (
        lastError.type === OpenRouterErrorType.AUTHENTICATION_ERROR ||
        lastError.type === OpenRouterErrorType.INVALID_REQUEST_ERROR
      ) {
        throw lastError;
      }

      // If this is the last retry, throw the error
      if (attempt === finalOptions.retries) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(
        `OpenRouter request failed (attempt ${attempt + 1}/${finalOptions.retries + 1}): ${lastError.message}`
      );
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || createOpenRouterError(
    OpenRouterErrorType.UNKNOWN_ERROR,
    'Request failed after all retries'
  );
}

/**
 * Generate content with a simple string response (non-JSON mode)
 *
 * @param prompt - The user prompt to send to the LLM
 * @param systemPrompt - The system prompt that sets context and instructions
 * @param options - Optional generation parameters
 * @returns String response from the LLM
 */
export async function generateTextWithOpenRouter(
  prompt: string,
  systemPrompt: string,
  options?: GenerationOptions
): Promise<string> {
  const config = getOpenRouterConfig();
  const client = createOpenRouterClient();

  const finalOptions: Required<GenerationOptions> = {
    temperature: options?.temperature ?? DEFAULT_CONFIG.temperature!,
    maxTokens: options?.maxTokens ?? DEFAULT_CONFIG.maxTokens!,
    topP: options?.topP ?? 1,
    frequencyPenalty: options?.frequencyPenalty ?? 0,
    presencePenalty: options?.presencePenalty ?? 0,
    timeout: options?.timeout ?? DEFAULT_CONFIG.timeout!,
    retries: options?.retries ?? DEFAULT_CONFIG.retries!,
    retryDelay: options?.retryDelay ?? DEFAULT_CONFIG.retryDelay!
  };

  let lastError: OpenRouterError | null = null;

  for (let attempt = 0; attempt <= finalOptions.retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = finalOptions.retryDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

      try {
        const completion = await client.chat.completions.create(
          {
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: finalOptions.temperature,
            max_tokens: finalOptions.maxTokens,
            top_p: finalOptions.topP,
            frequency_penalty: finalOptions.frequencyPenalty,
            presence_penalty: finalOptions.presencePenalty
          },
          {
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        const message = completion.choices[0]?.message;
        if (!message?.content) {
          throw createOpenRouterError(
            OpenRouterErrorType.API_ERROR,
            'No content in response from OpenRouter'
          );
        }

        return message.content;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: unknown) {
      lastError = handleOpenAIError(error);

      if (
        lastError.type === OpenRouterErrorType.AUTHENTICATION_ERROR ||
        lastError.type === OpenRouterErrorType.INVALID_REQUEST_ERROR
      ) {
        throw lastError;
      }

      if (attempt === finalOptions.retries) {
        throw lastError;
      }

      console.warn(
        `OpenRouter request failed (attempt ${attempt + 1}/${finalOptions.retries + 1}): ${lastError.message}`
      );
    }
  }

  throw lastError || createOpenRouterError(
    OpenRouterErrorType.UNKNOWN_ERROR,
    'Request failed after all retries'
  );
}