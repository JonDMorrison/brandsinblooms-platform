/**
 * Utility types for handling null/undefined conversions
 * Used throughout the codebase to convert Supabase's null returns to TypeScript's undefined
 */

/**
 * Converts nullable properties to optional undefined properties
 * @example
 * type User = { name: string | null; email: string | null }
 * type OptionalUser = NullableToOptional<User>
 * // Result: { name?: string | undefined; email?: string | undefined }
 */
export type NullableToOptional<T> = {
  [K in keyof T]: T[K] extends infer U | null
    ? U extends null
      ? never
      : U | undefined
    : T[K]
}

/**
 * Recursively converts all null values to undefined in a type
 */
export type DeepNullToUndefined<T> = T extends null
  ? undefined
  : T extends (infer U)[]
  ? DeepNullToUndefined<U>[]
  : T extends object
  ? { [K in keyof T]: DeepNullToUndefined<T[K]> }
  : T

/**
 * Converts a null value to undefined
 * @param value - The value that may be null
 * @returns The value or undefined if it was null
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/**
 * Converts all null properties in an object to undefined
 * @param obj - Object with potentially null properties
 * @returns Object with undefined instead of null
 */
export function nullsToUndefined<T extends Record<string, unknown>>(
  obj: T
): NullableToOptional<T> {
  const result: Record<string, unknown> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = nullToUndefined(obj[key])
    }
  }
  
  return result as NullableToOptional<T>
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Converts undefined to null (for database operations)
 * @param value - The value that may be undefined
 * @returns The value or null if it was undefined
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

/**
 * Converts all undefined properties in an object to null
 * Useful when preparing data for database insertion
 */
export function undefinedsToNull<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: T[K] extends undefined ? null : T[K] } {
  const result: Record<string, unknown> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = undefinedToNull(obj[key])
    }
  }
  
  return result as { [K in keyof T]: T[K] extends undefined ? null : T[K] }
}

/**
 * Safely parses JSON and converts nulls to undefined
 * @param value - JSON string or object
 * @returns Parsed object with nulls converted to undefined
 */
export function safeParseJsonWithNulls<T = unknown>(
  value: string | object | null | undefined
): T | undefined {
  if (!value) return undefined
  
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return nullsToUndefined(parsed) as T
  } catch {
    return undefined
  }
}