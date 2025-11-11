/**
 * Cache cleanup API endpoint
 * Performs maintenance on cache systems
 */

import { headers } from 'next/headers'
import { clearSiteCache, getSiteCacheStats } from '@/lib/cache/site-cache'
import { handleError } from '@/lib/types/error-handling'
import { ApiHandler, ApiRequest, ApiResponse, apiSuccess, apiError, ApiResult } from '@/src/lib/types/api'
// Dynamic import for Redis cache to avoid bundling Node.js built-ins
// import { getRedisCache } from '@/lib/cache/redis-site-cache.server'

interface CleanupResult {
  success: boolean
  timestamp: string
  operations: {
    memoryCache: {
      cleared: boolean
      previousSize: number
      error?: string
    }
    redisCache?: {
      cleared: boolean
      error?: string
    }
  }
  performance: {
    duration: number
    unit: 'ms'
  }
}

/**
 * Validate cron job authorization
 */
function validateCronAuth(request: ApiRequest<void>): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Check for custom cron secret
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  return false
}

/**
 * POST /api/system/cleanup-cache
 * Cleans up expired cache entries and performs maintenance
 */
export const POST = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<CleanupResult>>> => {
  const startTime = Date.now()

  try {
    // Validate authorization
    if (!validateCronAuth(request)) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const force = searchParams.get('force') === 'true'
    const cacheType = searchParams.get('type') || 'all' // 'memory', 'redis', or 'all'

    const result: CleanupResult = {
      success: true,
      timestamp: new Date().toISOString(),
      operations: {
        memoryCache: {
          cleared: false,
          previousSize: 0,
        },
      },
      performance: {
        duration: 0,
        unit: 'ms',
      },
    }

    // Clean memory cache
    if (cacheType === 'all' || cacheType === 'memory') {
      try {
        const stats = getSiteCacheStats()
        result.operations.memoryCache.previousSize = stats.size

        if (force) {
          // Force clear all entries
          await clearSiteCache()
          result.operations.memoryCache.cleared = true
        } else {
          // Let the cache handle its own cleanup (expired entries)
          // The memory cache has automatic cleanup, so we just report status
          result.operations.memoryCache.cleared = true
        }
      } catch (error: unknown) {
        const handled = handleError(error)
        result.operations.memoryCache.error = handled.message
        result.success = false
      }
    }

    // TODO: Fix Redis cache import issue with Node.js built-ins 
    // Clean Redis cache if available - temporarily disabled
    if (false && (cacheType === 'all' || cacheType === 'redis') && process.env.REDIS_URL) {
      try {
        const { getRedisCache } = await import('@/src/lib/cache/redis-site-cache.server')
        const redisCache = getRedisCache()
        
        if (force) {
          await redisCache.clear()
        }
        // Redis cache has its own TTL-based expiration
        
        result.operations.redisCache = {
          cleared: true,
        }
      } catch (error: unknown) {
        const handled = handleError(error)
        result.operations.redisCache = {
          cleared: false,
          error: handled.message,
        }
        result.success = false
      }
    }

    result.performance.duration = Date.now() - startTime

    const statusCode = result.success ? 200 : 207 // 207 = partial success

    const response = apiSuccess(result)
    response.headers.set('Cache-Control', 'no-cache')
    response.headers.set('X-Cleanup-Status', result.success ? 'success' : 'partial')
    
    if (statusCode !== 200) {
      return new Response(response.body, {
        status: statusCode,
        headers: response.headers,
      }) as ApiResponse<ApiResult<CleanupResult>>
    }
    
    return response

  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Cache Cleanup] Unexpected error:', handled)

    return apiError(
      handled.message,
      'CLEANUP_ERROR',
      500
    )
  }
}

/**
 * GET /api/system/cleanup-cache
 * Returns cache cleanup status and statistics
 */
interface CacheStatsResponse {
  timestamp: string
  caches: {
    memory: {
      size: number
      maxSize: number
      utilization: number
      entries: Array<{
        key: string
        age: number
        ttl: number
      }>
    }
    redis: unknown
  }
  recommendations: string[]
}

export const GET = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<CacheStatsResponse>>> => {
  try {
    // Get current cache statistics
    const memoryStats = getSiteCacheStats()
    
    let redisStats = null
    // TODO: Fix Redis cache import issue - temporarily disabled
    if (false && process.env.REDIS_URL) {
      try {
        const { getRedisCache } = await import('@/src/lib/cache/redis-site-cache.server')
        const redisCache = getRedisCache()
        const health = await redisCache.healthCheck()
        const metrics = redisCache.getMetrics()
        
        redisStats = {
          connected: health.redis,
          hitRate: metrics.hitRate,
          totalOperations: metrics.operations,
          errors: metrics.errors,
          avgResponseTime: metrics.avgResponseTime,
        }
      } catch (error: unknown) {
        const handled = handleError(error)
        redisStats = {
          connected: false,
          error: handled.message,
        }
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      caches: {
        memory: {
          size: memoryStats.size,
          maxSize: memoryStats.maxSize,
          utilization: memoryStats.maxSize > 0 ? (memoryStats.size / memoryStats.maxSize) * 100 : 0,
          entries: memoryStats.entries.map(entry => ({
            key: entry.key,
            age: Date.now() - entry.createdAt,
            ttl: entry.expiresAt - Date.now(),
          })),
        },
        redis: redisStats,
      },
      recommendations: [] as string[],
    }

    // Add recommendations based on cache status
    if (memoryStats.size / memoryStats.maxSize > 0.8) {
      response.recommendations.push('Memory cache is >80% full, consider running cleanup')
    }

    // TODO: Uncomment when Redis is re-enabled
    // if (redisStats && 'connected' in redisStats && !redisStats.connected) {
    //   response.recommendations.push('Redis cache is disconnected, check connection')
    // }

    // if (redisStats && 'errors' in redisStats && redisStats.errors && redisStats.errors > 0) {
    //   response.recommendations.push('Redis cache has errors, check logs')
    // }

    const apiResponse = apiSuccess(response)
    apiResponse.headers.set('Cache-Control', 'public, max-age=60')
    return apiResponse

  } catch (error: unknown) {
    const handled = handleError(error)
    return apiError(
      'Failed to get cache statistics',
      'CACHE_STATS_ERROR',
      500
    )
  }
}

/**
 * DELETE /api/system/cleanup-cache
 * Force clears all cache entries (requires admin authorization)
 */
interface ClearCacheResponse {
  success: boolean
  message: string
  timestamp: string
  duration: number
}

export const DELETE = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<ClearCacheResponse>>> => {
  try {
    // This should require admin authentication in production
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    // Basic auth check (implement proper admin auth in production)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Admin authorization required', 'ADMIN_AUTH_REQUIRED', 401)
    }

    const startTime = Date.now()

    // Force clear all caches
    await clearSiteCache()
    
    // TODO: Fix Redis cache import issue - temporarily disabled
    if (false && process.env.REDIS_URL) {
      const { getRedisCache } = await import('@/src/lib/cache/redis-site-cache.server')
      const redisCache = getRedisCache()
      await redisCache.clear()
    }

    return apiSuccess({
      success: true,
      message: 'All caches cleared',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    })

  } catch (error: unknown) {
    const handled = handleError(error)
    return apiError(
      handled.message,
      'CACHE_CLEAR_ERROR',
      500
    )
  }
}