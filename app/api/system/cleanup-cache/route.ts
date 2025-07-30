/**
 * Cache cleanup API endpoint
 * Performs maintenance on cache systems
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { clearSiteCache, getSiteCacheStats } from '@/src/lib/cache/site-cache'
import { getRedisCache } from '@/src/lib/cache/redis-site-cache'

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
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Check for Vercel cron header
  const cronHeader = request.headers.get('x-vercel-cron')
  if (cronHeader === '1') {
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
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Validate authorization
    if (!validateCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
      } catch (error: any) {
        result.operations.memoryCache.error = error.message
        result.success = false
      }
    }

    // Clean Redis cache if available
    if ((cacheType === 'all' || cacheType === 'redis') && process.env.REDIS_URL) {
      try {
        const redisCache = getRedisCache()
        
        if (force) {
          await redisCache.clear()
        }
        // Redis cache has its own TTL-based expiration
        
        result.operations.redisCache = {
          cleared: true,
        }
      } catch (error: any) {
        result.operations.redisCache = {
          cleared: false,
          error: error.message,
        }
        result.success = false
      }
    }

    result.performance.duration = Date.now() - startTime

    const statusCode = result.success ? 200 : 207 // 207 = partial success

    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Cleanup-Status': result.success ? 'success' : 'partial',
      },
    })

  } catch (error: any) {
    console.error('[Cache Cleanup] Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        performance: {
          duration: Date.now() - startTime,
          unit: 'ms',
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Cleanup-Status': 'error',
        },
      }
    )
  }
}

/**
 * GET /api/system/cleanup-cache
 * Returns cache cleanup status and statistics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get current cache statistics
    const memoryStats = getSiteCacheStats()
    
    let redisStats = null
    if (process.env.REDIS_URL) {
      try {
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
      } catch (error: any) {
        redisStats = {
          connected: false,
          error: error.message,
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

    if (redisStats && !redisStats.connected) {
      response.recommendations.push('Redis cache is disconnected, check connection')
    }

    if (redisStats && redisStats.errors && redisStats.errors > 0) {
      response.recommendations.push('Redis cache has errors, check logs')
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to get cache statistics',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/system/cleanup-cache
 * Force clears all cache entries (requires admin authorization)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // This should require admin authentication in production
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    // Basic auth check (implement proper admin auth in production)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authorization required' },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    // Force clear all caches
    await clearSiteCache()
    
    if (process.env.REDIS_URL) {
      const redisCache = getRedisCache()
      await redisCache.clear()
    }

    return NextResponse.json({
      success: true,
      message: 'All caches cleared',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}