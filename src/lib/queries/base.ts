/**
 * Base query utilities and helpers for Supabase operations
 * Provides consistent patterns for data fetching across the application
 */

import { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { SupabaseError, isSupabaseError } from './errors';
import { Database } from '@/lib/database/types';

// Type aliases for better readability
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;
export type RowType<T extends TableName> = Tables[T]['Row'];
export type InsertType<T extends TableName> = Tables[T]['Insert'];
export type UpdateType<T extends TableName> = Tables[T]['Update'];

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sorting parameters
 */
export interface SortingParams<T = any> {
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Combined query parameters
 */
export interface QueryParams<T = any> extends PaginationParams, SortingParams<T> {
  search?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number = 1, limit: number = 10): number {
  return (page - 1) * limit;
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  count: number,
  page: number = 1,
  limit: number = 10
): PaginatedResponse<T> {
  const totalPages = Math.ceil(count / limit);
  
  return {
    data,
    count,
    page,
    pageSize: limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Handle Supabase query response
 * Throws SupabaseError if query fails
 */
export async function handleQueryResponse<T>(
  response: PostgrestResponse<T>
): Promise<T[]> {
  const { data, error } = response;
  
  if (error) {
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  return data ?? [];
}

/**
 * Handle single item response (for .single() queries)
 * Throws SupabaseError if item not found or query fails
 */
export async function handleSingleResponse<T>(
  response: PostgrestSingleResponse<T>
): Promise<T> {
  const { data, error } = response;
  
  if (error) {
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  if (!data) {
    throw new SupabaseError(
      'Item not found',
      'PGRST116',
      { message: 'No rows returned' }
    );
  }
  
  return data;
}

/**
 * Handle count response
 */
export async function handleCountResponse(
  response: PostgrestResponse<any>
): Promise<number> {
  const { count, error } = response;
  
  if (error) {
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  return count ?? 0;
}

/**
 * Retry wrapper for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-transient errors
      if (isSupabaseError(error)) {
        const supabaseError = error as SupabaseError;
        // Don't retry on auth errors, validation errors, etc.
        if (['PGRST301', 'PGRST302', 'PGRST303', '23505'].includes(supabaseError.code)) {
          throw error;
        }
      }
      
      // Wait before retrying with exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Build search conditions for text search
 */
export function buildSearchConditions(
  search: string | undefined,
  columns: string[]
): string | undefined {
  if (!search || search.trim() === '') {
    return undefined;
  }
  
  const searchTerm = `%${search.trim().toLowerCase()}%`;
  return columns.map(col => `${col}.ilike.${searchTerm}`).join(',');
}

/**
 * Type guard for checking if a value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Filter out undefined values from an object
 */
export function filterUndefined<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (isDefined(value)) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T
): T {
  if (!json) return fallback;
  
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Format date for Supabase queries
 */
export function formatDateForQuery(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date from Supabase response
 */
export function parseDateFromResponse(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Build order by clause
 */
export function buildOrderBy<T>(
  sortBy?: keyof T,
  sortOrder: 'asc' | 'desc' = 'desc'
): { column: string; ascending: boolean } | undefined {
  if (!sortBy) return undefined;
  
  return {
    column: String(sortBy),
    ascending: sortOrder === 'asc',
  };
}