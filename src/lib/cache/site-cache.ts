/**
 * Site caching implementation for domain resolution performance
 * Provides in-memory caching with TTL support for site data
 */

import { Site } from '@/src/lib/database/types'
import { generateSiteCacheKey, getSiteCacheTTL } from '@/src/lib/site/middleware-utils'

interface CacheEntry {
  data: Site
  expiresAt: number
  createdAt: number
}

// In-memory cache implementation
export class MemorySiteCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxSize: number
  private cleanupInterval?: NodeJS.Timeout

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
    this.startCleanupInterval()
  }

  /**
   * Gets a site from cache
   */
  async get(key: string): Promise<Site | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Sets a site in cache with TTL
   */
  async set(key: string, site: Site, ttlSeconds: number): Promise<void> {
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const entry: CacheEntry = {
      data: site,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now(),
    }

    this.cache.set(key, entry)
  }

  /**
   * Removes a site from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Clears all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate?: number
    entries: Array<{ key: string; createdAt: number; expiresAt: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
    }))

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries,
    }
  }

  /**
   * Evicts expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now()
    let removedCount = 0

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        removedCount++
      }
    }

    if (removedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Site Cache] Cleaned up ${removedCount} expired entries`)
    }
  }

  /**
   * Evicts oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
    
    // Sort by creation time and remove oldest 10%
    entries.sort(([, a], [, b]) => a.createdAt - b.createdAt)
    const toRemove = Math.max(1, Math.floor(this.maxSize * 0.1))

    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Site Cache] Evicted ${toRemove} oldest entries`)
    }
  }

  /**
   * Starts periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    // Don't keep the process alive just for cleanup
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Stops the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    this.cache.clear()
  }
}

// Global cache instance
let globalCache: MemorySiteCache | null = null

/**
 * Gets the global cache instance
 */
function getCache(): MemorySiteCache {
  if (!globalCache) {
    const maxSize = parseInt(process.env.SITE_CACHE_MAX_SIZE || '1000', 10)
    globalCache = new MemorySiteCache(maxSize)
  }
  return globalCache
}

/**
 * Gets a site from cache by subdomain or custom domain
 */
export async function getSiteFromCache(
  value: string,
  type: 'subdomain' | 'custom_domain'
): Promise<Site | null> {
  const cache = getCache()
  const key = generateSiteCacheKey(value, type)
  
  try {
    const site = await cache.get(key)
    
    if (process.env.NODE_ENV === 'development' && site) {
      console.log(`[Site Cache] HIT: ${key}`)
    }
    
    return site
  } catch (error) {
    console.error('[Site Cache] Error getting from cache:', error)
    return null
  }
}

/**
 * Sets a site in cache
 */
export async function setSiteCache(
  value: string,
  type: 'subdomain' | 'custom_domain',
  site: Site
): Promise<void> {
  const cache = getCache()
  const key = generateSiteCacheKey(value, type)
  const ttl = getSiteCacheTTL(type)
  
  try {
    await cache.set(key, site, ttl)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Site Cache] SET: ${key} (TTL: ${ttl}s)`)
    }
  } catch (error) {
    console.error('[Site Cache] Error setting cache:', error)
  }
}

/**
 * Removes a site from cache
 */
export async function deleteSiteFromCache(
  value: string,
  type: 'subdomain' | 'custom_domain'
): Promise<void> {
  const cache = getCache()
  const key = generateSiteCacheKey(value, type)
  
  try {
    await cache.delete(key)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Site Cache] DELETE: ${key}`)
    }
  } catch (error) {
    console.error('[Site Cache] Error deleting from cache:', error)
  }
}

/**
 * Invalidates cache for a specific site (both subdomain and custom domain)
 */
export async function invalidateSiteCache(site: Site): Promise<void> {
  const promises: Promise<void>[] = []
  
  // Invalidate subdomain cache
  promises.push(deleteSiteFromCache(site.subdomain, 'subdomain'))
  
  // Invalidate custom domain cache if present
  if (site.custom_domain) {
    promises.push(deleteSiteFromCache(site.custom_domain, 'custom_domain'))
  }
  
  await Promise.all(promises)
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Site Cache] Invalidated cache for site: ${site.id}`)
  }
}

/**
 * Clears all cached sites
 */
export async function clearSiteCache(): Promise<void> {
  const cache = getCache()
  
  try {
    await cache.clear()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Site Cache] Cleared all entries')
    }
  } catch (error) {
    console.error('[Site Cache] Error clearing cache:', error)
  }
}

/**
 * Gets cache statistics for monitoring
 */
export function getSiteCacheStats(): {
  size: number
  maxSize: number
  hitRate?: number
  entries: Array<{ key: string; createdAt: number; expiresAt: number }>
} {
  const cache = getCache()
  return cache.getStats()
}

/**
 * Warms up the cache with frequently accessed sites
 */
export async function warmupSiteCache(sites: Site[]): Promise<void> {
  const promises: Promise<void>[] = []
  
  for (const site of sites) {
    // Cache by subdomain
    promises.push(setSiteCache(site.subdomain, 'subdomain', site))
    
    // Cache by custom domain if present
    if (site.custom_domain) {
      promises.push(setSiteCache(site.custom_domain, 'custom_domain', site))
    }
  }
  
  await Promise.all(promises)
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Site Cache] Warmed up cache with ${sites.length} sites`)
  }
}

/**
 * Redis-based cache implementation for production use
 * This is a placeholder for when you want to use Redis instead of memory cache
 */
export class RedisSiteCache {
  // Implementation would use Redis client
  // This is for future enhancement when you need distributed caching
  
  constructor(redisUrl?: string) {
    // Initialize Redis client
    throw new Error('RedisSiteCache not implemented yet - use memory cache for now')
  }
}

/**
 * Cache factory function - returns appropriate cache implementation
 */
export function createSiteCache(): MemorySiteCache {
  // In future, could switch between Memory and Redis based on environment
  const cacheType = process.env.SITE_CACHE_TYPE || 'memory'
  
  switch (cacheType) {
    case 'redis':
      throw new Error('Redis cache not implemented yet')
    case 'memory':
    default:
      return getCache()
  }
}

/**
 * Middleware to add cache headers to responses
 */
export function addCacheHeaders(
  response: Response,
  cacheStatus: 'hit' | 'miss',
  ttl?: number
): void {
  response.headers.set('X-Site-Cache', cacheStatus)
  
  if (ttl) {
    response.headers.set('X-Site-Cache-TTL', ttl.toString())
  }
  
  response.headers.set('X-Site-Cache-Time', Date.now().toString())
}