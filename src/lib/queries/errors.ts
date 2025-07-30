/**
 * Standardized error handling for Supabase operations
 * Provides consistent error types and utilities across the application
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom error class for Supabase operations
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
    Object.setPrototypeOf(this, SupabaseError.prototype);
  }

  /**
   * Create from PostgrestError
   */
  static fromPostgrestError(error: PostgrestError): SupabaseError {
    return new SupabaseError(
      error.message,
      error.code,
      error.details,
      error.hint
    );
  }

  /**
   * Check if error is a specific type
   */
  isType(code: string): boolean {
    return this.code === code;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      // Authentication errors
      'PGRST301': 'You are not authorized to perform this action',
      'PGRST302': 'Your session has expired. Please sign in again',
      'PGRST303': 'Invalid credentials',
      
      // Data errors
      'PGRST116': 'The requested item was not found',
      '23505': 'This item already exists',
      '23503': 'Cannot delete this item as it is referenced by other data',
      '23502': 'Required fields are missing',
      '23514': 'The provided data does not meet the requirements',
      
      // Permission errors
      '42501': 'You do not have permission to perform this action',
      
      // Connection errors
      'PGRST000': 'Unable to connect to the server. Please try again',
      'PGRST001': 'The server is currently unavailable. Please try again later',
      
      // Rate limiting
      '429': 'Too many requests. Please slow down and try again',
    };

    return errorMessages[this.code] || this.message;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      'PGRST000', // Connection error
      'PGRST001', // Server error
      '503',      // Service unavailable
      '504',      // Gateway timeout
      '429',      // Too many requests (with backoff)
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Get retry delay in milliseconds
   */
  getRetryDelay(): number {
    if (this.code === '429') {
      // Extract retry-after header if available
      const retryAfter = this.details?.['retry-after'];
      return retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default to 1 minute
    }

    // Default exponential backoff delays
    return 1000; // Start with 1 second
  }
}

/**
 * Type guard for SupabaseError
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return error instanceof SupabaseError;
}

/**
 * Type guard for PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Error handler for mutations
 */
export interface MutationErrorHandler {
  onError?: (error: SupabaseError) => void;
  onRetryableError?: (error: SupabaseError, retryCount: number) => void;
  onFatalError?: (error: SupabaseError) => void;
}

/**
 * Handle mutation errors with appropriate callbacks
 */
export function handleMutationError(
  error: unknown,
  handlers: MutationErrorHandler = {}
): void {
  let supabaseError: SupabaseError;

  if (isSupabaseError(error)) {
    supabaseError = error;
  } else if (isPostgrestError(error)) {
    supabaseError = SupabaseError.fromPostgrestError(error);
  } else if (error instanceof Error) {
    supabaseError = new SupabaseError(
      error.message,
      'UNKNOWN',
      { originalError: error }
    );
  } else {
    supabaseError = new SupabaseError(
      'An unexpected error occurred',
      'UNKNOWN',
      { originalError: error }
    );
  }

  // Call general error handler
  handlers.onError?.(supabaseError);

  // Call specific handlers based on error type
  if (supabaseError.isRetryable()) {
    handlers.onRetryableError?.(supabaseError, 0);
  } else {
    handlers.onFatalError?.(supabaseError);
  }
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: SupabaseError): Record<string, any> {
  return {
    name: error.name,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Common error messages for UI
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Unable to connect. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested item could not be found.',
  VALIDATION: 'Please check your input and try again.',
  CONFLICT: 'This item already exists.',
  SERVER: 'Server error. Please try again later.',
} as const;

/**
 * Get appropriate error message for display
 */
export function getDisplayErrorMessage(error: unknown): string {
  if (isSupabaseError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK;
    }
  }

  return ERROR_MESSAGES.GENERIC;
}