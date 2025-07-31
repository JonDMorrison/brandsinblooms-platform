/**
 * Redis-based site caching implementation for production environments
 * Provides distributed caching with automatic failover to memory cache
 */

import { Site } from '@/lib/database/aliases'
import { generateSiteCacheKey, getSiteCacheTTL } from '@/lib/site/middleware-utils'
import { MemorySiteCache } from './site-cache'

interface RedisCacheConfig {
  url?: string
  maxRetries?: number
  retryDelayMs?: number
  keyPrefix?: string
  fallbackToMemory?: boolean
}

interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  operations: number
  avgResponseTime: number
  lastError?: string
  lastErrorTime?: number
}

/**
 * Redis cache implementation with automatic failover
 */
export class RedisSiteCache {
  private redis: any = null
  private memoryFallback: MemorySiteCache | null = null
  private config: Required<RedisCacheConfig>
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    operations: 0,
    avgResponseTime: 0,
  }
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  constructor(config: RedisCacheConfig = {}) {
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      keyPrefix: config.keyPrefix || 'site:',
      fallbackToMemory: config.fallbackToMemory !== false,
    }

    // Initialize memory fallback if enabled
    if (this.config.fallbackToMemory) {
      this.memoryFallback = new MemorySiteCache(500) // Smaller size for fallback
    }

    // Initialize Redis connection
    this.initializeRedis()
  }

  /**
   * Initialize Redis connection with error handling
   */
  private async initializeRedis(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.connectToRedis()
    return this.connectionPromise
  }

  /**
   * Connect to Redis with retry logic
   */
  private async connectToRedis(): Promise<void> {
    try {
      // Dynamic import to avoid bundling Redis in edge environments
      const { createClient } = await import('redis')
      
      this.redis = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.config.maxRetries) {
              console.error('[Redis Cache] Max reconnection attempts exceeded')
              return false
            }
            return Math.min(retries * this.config.retryDelayMs, 5000)
          },
        },
      })

      this.redis.on('error', this.handleRedisError.bind(this))
      this.redis.on('connect', () => {
        console.log('[Redis Cache] Connected successfully')
        this.isConnected = true
      })
      this.redis.on('disconnect', () => {
        console.warn('[Redis Cache] Disconnected')
        this.isConnected = false
      })

      await this.redis.connect()
      this.isConnected = true
    } catch (error) {
      console.error('[Redis Cache] Failed to initialize:', error)
      this.handleRedisError(error)
    }
  }

  /**
   * Handle Redis errors with fallback
   */
  private handleRedisError(error: any): void {
    this.metrics.errors++
    this.metrics.lastError = error.message
    this.metrics.lastErrorTime = Date.now()
    this.isConnected = false

    console.error('[Redis Cache] Error:', error.message)

    if (!this.config.fallbackToMemory) {
      throw error
    }
  }

  /**
   * Execute Redis operation with metrics and fallback
   */
  private async executeWithMetrics<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    this.metrics.operations++

    try {
      if (!this.isConnected && this.redis) {
        await this.initializeRedis()
      }

      const result = await operation()
      
      // Update metrics
      const responseTime = Date.now() - startTime
      this.metrics.avgResponseTime = (
        (this.metrics.avgResponseTime * (this.metrics.operations - 1) + responseTime) /
        this.metrics.operations
      )

      return result
    } catch (error) {
      this.handleRedisError(error)

      // Try fallback if available
      if (fallbackOperation && this.config.fallbackToMemory) {
        console.warn('[Redis Cache] Using memory fallback')
        return await fallbackOperation()
      }

      throw error
    }
  }

  /**
   * Get site from cache
   */
  async get(key: string): Promise<Site | null> {
    const cacheKey = `${this.config.keyPrefix}${key}`

    return this.executeWithMetrics(
      async () => {
        const result = await this.redis.get(cacheKey)
        if (result) {
          this.metrics.hits++
          return JSON.parse(result) as Site
        }
        this.metrics.misses++
        return null
      },
      this.memoryFallback ? () => this.memoryFallback!.get(key) : undefined
    )
  }

  /**
   * Set site in cache with TTL
   */
  async set(key: string, site: Site, ttlSeconds: number): Promise<void> {
    const cacheKey = `${this.config.keyPrefix}${key}`
    const value = JSON.stringify(site)

    return this.executeWithMetrics(
      async () => {
        await this.redis.setEx(cacheKey, ttlSeconds, value)
      },
      this.memoryFallback ? () => this.memoryFallback!.set(key, site, ttlSeconds) : undefined
    )
  }

  /**
   * Delete site from cache
   */
  async delete(key: string): Promise<void> {
    const cacheKey = `${this.config.keyPrefix}${key}`

    return this.executeWithMetrics(
      async () => {
        await this.redis.del(cacheKey)
      },
      this.memoryFallback ? () => this.memoryFallback!.delete(key) : undefined
    )
  }

  /**
   * Clear all cached sites
   */
  async clear(): Promise<void> {
    const pattern = `${this.config.keyPrefix}*`

    return this.executeWithMetrics(
      async () => {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(keys)
        }
      },
      this.memoryFallback ? () => this.memoryFallback!.clear() : undefined
    )
  }

  /**
   * Get multiple sites from cache in batch
   */
  async mget(keys: string[]): Promise<(Site | null)[]> {
    const cacheKeys = keys.map(key => `${this.config.keyPrefix}${key}`)

    return this.executeWithMetrics(
      async () => {
        const results = await this.redis.mGet(cacheKeys)
        return results.map((result: string | null) => {
          if (result) {
            this.metrics.hits++
            return JSON.parse(result) as Site
          }
          this.metrics.misses++
          return null
        })
      },
      this.memoryFallback ? async () => {
        const results = await Promise.all(keys.map(key => this.memoryFallback!.get(key)))
        return results
      } : undefined
    )
  }

  /**
   * Set multiple sites in cache in batch
   */
  async mset(entries: Array<{ key: string; site: Site; ttl: number }>): Promise<void> {
    return this.executeWithMetrics(
      async () => {
        const pipeline = this.redis.multi()
        
        for (const { key, site, ttl } of entries) {
          const cacheKey = `${this.config.keyPrefix}${key}`
          const value = JSON.stringify(site)
          pipeline.setEx(cacheKey, ttl, value)
        }
        
        await pipeline.exec()
      },
      this.memoryFallback ? async () => {
        await Promise.all(entries.map(({ key, site, ttl }) => 
          this.memoryFallback!.set(key, site, ttl)
        ))
      } : undefined
    )
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redis: boolean
    memory: boolean
    latency?: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      if (this.redis && this.isConnected) {
        await this.redis.ping()
        const latency = Date.now() - startTime
        
        return {
          status: 'healthy',
          redis: true,
          memory: !!this.memoryFallback,
          latency,
        }
      } else if (this.memoryFallback) {
        return {
          status: 'degraded',
          redis: false,
          memory: true,
          error: 'Redis unavailable, using memory fallback',
        }
      } else {
        return {
          status: 'unhealthy',
          redis: false,
          memory: false,
          error: 'No cache available',
        }
      }
    } catch (error: any) {
      return {
        status: this.memoryFallback ? 'degraded' : 'unhealthy',
        redis: false,
        memory: !!this.memoryFallback,
        error: error.message,
      }
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & {
    hitRate: number
    errorRate: number
    isConnected: boolean
  } {
    const totalRequests = this.metrics.hits + this.metrics.misses
    
    return {
      ...this.metrics,
      hitRate: totalRequests > 0 ? this.metrics.hits / totalRequests : 0,
      errorRate: this.metrics.operations > 0 ? this.metrics.errors / this.metrics.operations : 0,
      isConnected: this.isConnected,
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      operations: 0,
      avgResponseTime: 0,
    }
  }

  /**
   * Close connections and cleanup
   */
  async destroy(): Promise<void> {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.quit()
      }
    } catch (error) {
      console.error('[Redis Cache] Error during cleanup:', error)
    }

    if (this.memoryFallback) {
      this.memoryFallback.destroy()
    }

    this.isConnected = false
    this.redis = null
    this.connectionPromise = null
  }
}

// Global cache instance
let globalRedisCache: RedisSiteCache | null = null

/**
 * Get global Redis cache instance
 */
export function getRedisCache(): RedisSiteCache {
  if (!globalRedisCache) {
    globalRedisCache = new RedisSiteCache({
      url: process.env.REDIS_URL,
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'site:',
      fallbackToMemory: process.env.REDIS_FALLBACK_MEMORY !== 'false',
    })
  }
  return globalRedisCache
}

/**
 * High-level cache operations using Redis with fallback
 */
export async function getSiteFromRedisCache(
  value: string,
  type: 'subdomain' | 'custom_domain'
): Promise<Site | null> {
  const cache = getRedisCache()
  const key = generateSiteCacheKey(value, type)
  
  try {
    return await cache.get(key)
  } catch (error) {
    console.error('[Redis Site Cache] Error getting site:', error)
    return null
  }
}

/**
 * Set site in Redis cache
 */
export async function setSiteInRedisCache(
  value: string,
  type: 'subdomain' | 'custom_domain',
  site: Site
): Promise<void> {
  const cache = getRedisCache()
  const key = generateSiteCacheKey(value, type)
  const ttl = getSiteCacheTTL(type)
  
  try {
    await cache.set(key, site, ttl)
  } catch (error) {
    console.error('[Redis Site Cache] Error setting site:', error)
    // Don't throw - cache errors shouldn't break the application
  }
}

/**
 * Batch warm-up cache with multiple sites
 */
export async function warmupRedisCache(sites: Site[]): Promise<void> {
  const cache = getRedisCache()
  const entries: Array<{ key: string; site: Site; ttl: number }> = []
  
  for (const site of sites) {
    // Add subdomain entry
    entries.push({
      key: generateSiteCacheKey(site.subdomain, 'subdomain'),
      site,
      ttl: getSiteCacheTTL('subdomain'),
    })
    
    // Add custom domain entry if present
    if (site.custom_domain) {
      entries.push({
        key: generateSiteCacheKey(site.custom_domain, 'custom_domain'),
        site,
        ttl: getSiteCacheTTL('custom_domain'),
      })
    }
  }
  
  try {
    await cache.mset(entries)
    console.log(`[Redis Cache] Warmed up ${entries.length} site entries`)
  } catch (error) {
    console.error('[Redis Cache] Error during warmup:', error)
  }
}

/**
 * Get cache health status
 */
export async function getRedisCacheHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  redis: boolean
  memory: boolean
  latency?: number
  error?: string
  metrics: ReturnType<RedisSiteCache['getMetrics']>
}> {
  const cache = getRedisCache()
  const health = await cache.healthCheck()
  const metrics = cache.getMetrics()
  
  return {
    ...health,
    metrics,
  }
}

/**
 * Cache middleware for adding performance headers
 */
export function addRedisCacheHeaders(
  response: Response,
  cacheStatus: 'hit' | 'miss' | 'error',
  latency?: number
): void {
  response.headers.set('X-Redis-Cache', cacheStatus)
  response.headers.set('X-Cache-Provider', 'redis')
  
  if (latency !== undefined) {
    response.headers.set('X-Cache-Latency', `${latency}ms`)
  }
  
  response.headers.set('X-Cache-Time', new Date().toISOString())
}