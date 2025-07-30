import { PostgrestResponse } from '@supabase/supabase-js';

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export async function executeQuery<T>(
  query: Promise<PostgrestResponse<T>>
): Promise<T[]> {
  const { data, error } = await query;
  
  if (error) {
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  return data ?? [];
}

export async function executeQuerySingle<T>(
  query: Promise<PostgrestResponse<T>>
): Promise<T | null> {
  const { data, error } = await query;
  
  if (error) {
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  return Array.isArray(data) ? data[0] || null : data;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}