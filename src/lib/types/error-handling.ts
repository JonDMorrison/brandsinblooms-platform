/**
 * Error handling types and utilities for the Brands in Blooms platform
 */

/**
 * Supabase error type definition
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Type guard to check if an error is a Supabase error
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Generic error handler that provides consistent error processing
 */
export function handleError(error: unknown): {
  message: string;
  details?: string;
  code?: string;
} {
  // Handle Supabase errors
  if (isSupabaseError(error)) {
    return {
      message: error.message,
      details: error.details,
      code: error.code
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  // Handle unknown error types
  return {
    message: 'An unexpected error occurred',
    details: String(error)
  };
}