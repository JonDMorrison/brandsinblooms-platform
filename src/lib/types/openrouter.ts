/**
 * OpenRouter types and interfaces for LLM integration
 *
 * OpenRouter is an API gateway that provides access to multiple LLM providers.
 * These types define the request/response structure for OpenRouter API calls.
 */

/**
 * OpenRouter API configuration options
 */
export interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * Options for generation requests to OpenRouter
 */
export interface GenerationOptions {
  /** Temperature for response randomness (0-2, default: 1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p sampling (0-1) */
  topP?: number;
  /** Frequency penalty (-2 to 2) */
  frequencyPenalty?: number;
  /** Presence penalty (-2 to 2) */
  presencePenalty?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts on failure (default: 3) */
  retries?: number;
  /** Retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
}

/**
 * Structured response from OpenRouter generation
 */
export interface GenerationResponse<T = unknown> {
  /** The parsed response data */
  content: T;
  /** Usage information from the API */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model that generated the response */
  model: string;
  /** Finish reason (e.g., 'stop', 'length', 'content_filter') */
  finishReason?: string;
}

/**
 * OpenRouter API error types
 */
export enum OpenRouterErrorType {
  /** Authentication failed (invalid API key) */
  AUTHENTICATION_ERROR = 'authentication_error',
  /** Request validation failed */
  INVALID_REQUEST_ERROR = 'invalid_request_error',
  /** Rate limit exceeded */
  RATE_LIMIT_ERROR = 'rate_limit_error',
  /** Server error from OpenRouter */
  API_ERROR = 'api_error',
  /** Request timeout */
  TIMEOUT_ERROR = 'timeout_error',
  /** Network connectivity issue */
  CONNECTION_ERROR = 'connection_error',
  /** Invalid JSON response */
  PARSING_ERROR = 'parsing_error',
  /** Unknown error type */
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * OpenRouter API error structure
 */
export interface OpenRouterError {
  type: OpenRouterErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  details?: string;
}

/**
 * Type guard to check if an error is an OpenRouter error
 */
export function isOpenRouterError(error: unknown): error is OpenRouterError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Create an OpenRouter error object
 */
export function createOpenRouterError(
  type: OpenRouterErrorType,
  message: string,
  options?: {
    code?: string;
    statusCode?: number;
    details?: string;
  }
): OpenRouterError {
  return {
    type,
    message,
    code: options?.code,
    statusCode: options?.statusCode,
    details: options?.details
  };
}