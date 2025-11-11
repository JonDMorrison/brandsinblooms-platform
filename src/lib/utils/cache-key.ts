/**
 * Cache key utilities for creating stable, consistent cache keys
 * Prevents duplicate cache entries caused by unstable JSON.stringify ordering
 */

/**
 * Serialize an object into a stable string representation
 * Sorts keys alphabetically to ensure consistent output regardless of property order
 *
 * @param obj - Object to serialize (filters, params, query objects)
 * @returns Stable string representation
 *
 * @example
 * stableSerialize({ b: 2, a: 1 }) === stableSerialize({ a: 1, b: 2 }) // true
 * JSON.stringify({ b: 2, a: 1 }) === JSON.stringify({ a: 1, b: 2 }) // false
 */
export function stableSerialize(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return '';
  }

  if (typeof obj !== 'object') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableSerialize).join(',')}]`;
  }

  // Sort keys alphabetically for consistent output
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    const value = (obj as Record<string, unknown>)[key];
    return `${key}:${stableSerialize(value)}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Create a stable cache key from multiple parts
 *
 * @param parts - Parts to combine into cache key
 * @returns Stable cache key string
 *
 * @example
 * createCacheKey('products', siteId, { status: 'active', category: 'plants' })
 * // => 'products_site123_{category:plants,status:active}'
 */
export function createCacheKey(...parts: unknown[]): string {
  return parts
    .filter(part => part !== null && part !== undefined)
    .map(part => {
      if (typeof part === 'object') {
        return stableSerialize(part);
      }
      return String(part);
    })
    .join('_');
}
