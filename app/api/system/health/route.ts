/**
 * System health check API endpoint
 * Provides comprehensive health status for monitoring
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Dynamic import for Redis cache to avoid bundling Node.js built-ins
// import { getRedisCacheHealth } from '@/lib/cache/redis-site-cache.server'
import { getSiteCacheStats } from '@/lib/cache/site-cache'
import { getAnalyticsHealth } from '@/lib/monitoring/site-analytics'
import { handleError } from '@/lib/types/error-handling'
import { ApiHandler, ApiRequest, ApiResponse, apiSuccess, apiError, ApiResult } from '@/src/lib/types/api'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  services: {
    database: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      responseTime?: number
      error?: string
    }
    cache: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      provider: 'redis' | 'memory'
      hitRate?: number
      size?: number
      error?: string
    }
    analytics: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      eventCount?: number
      error?: string
    }
  }
  performance: {
    averageResponseTime: number
    requestsPerMinute: number
    errorRate: number
  }
  environment: {
    nodeVersion: string
    nextVersion: string
    platform: string
    region?: string
  }
}

const startTime = Date.now()

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<HealthCheckResult['services']['database']> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for health check
          },
        },
      }
    )

    const start = Date.now()
    const { error } = await supabase.from('sites').select('id').limit(1)
    const responseTime = Date.now() - start

    if (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      }
    }

    return {
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
    }
  } catch (error: unknown) {
    const handled = handleError(error)
    return {
      status: 'unhealthy',
      error: handled.message,
    }
  }
}

/**
 * Check cache health
 */
async function checkCacheHealth(): Promise<HealthCheckResult['services']['cache']> {
  try {
    // TODO: Fix Redis cache import issue - temporarily disabled
    // Check if Redis is available
    if (false && process.env.REDIS_URL) {
      const { getRedisCacheHealth } = await import('@/src/lib/cache/redis-site-cache.server')
      const redisHealth = await getRedisCacheHealth()
      return {
        status: redisHealth.status,
        provider: 'redis',
        hitRate: redisHealth.metrics.hitRate * 100,
        size: redisHealth.metrics.hits + redisHealth.metrics.misses,
        error: redisHealth.error,
      }
    } else {
      // Check memory cache
      const memoryStats = getSiteCacheStats()
      return {
        status: 'healthy',
        provider: 'memory',
        size: memoryStats.size,
      }
    }
  } catch (error: unknown) {
    const handled = handleError(error)
    return {
      status: 'unhealthy',
      provider: process.env.REDIS_URL ? 'redis' : 'memory',
      error: handled.message,
    }
  }
}

/**
 * Check analytics health
 */
async function checkAnalyticsHealth(): Promise<HealthCheckResult['services']['analytics']> {
  try {
    const analyticsHealth = await getAnalyticsHealth()
    return {
      status: analyticsHealth.status,
      eventCount: analyticsHealth.storage.eventCount,
      error: analyticsHealth.lastError,
    }
  } catch (error: unknown) {
    const handled = handleError(error)
    return {
      status: 'unhealthy',
      error: handled.message,
    }
  }
}

/**
 * Calculate overall system status
 */
function calculateOverallStatus(services: HealthCheckResult['services']): HealthCheckResult['status'] {
  const statuses = Object.values(services).map(service => service.status)
  
  if (statuses.every(status => status === 'healthy')) {
    return 'healthy'
  } else if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy'
  } else {
    return 'degraded'
  }
}

/**
 * GET /api/system/health
 * Returns comprehensive system health status
 */
export const GET = async (request: ApiRequest<void>): Promise<ApiResponse<ApiResult<HealthCheckResult>>> => {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'
    const includeDetails = searchParams.get('details') !== 'false'

    // Run health checks in parallel
    const [databaseHealth, cacheHealth, analyticsHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkAnalyticsHealth(),
    ])

    const services = {
      database: databaseHealth,
      cache: cacheHealth,
      analytics: analyticsHealth,
    }

    const result: HealthCheckResult = {
      status: calculateOverallStatus(services),
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      services: includeDetails ? services : {} as HealthCheckResult['services'],
      performance: {
        averageResponseTime: 0, // This would be calculated from actual metrics
        requestsPerMinute: 0,   // This would be calculated from actual metrics
        errorRate: 0,           // This would be calculated from actual metrics
      },
      environment: {
        nodeVersion: process.version,
        nextVersion: '15.0.0', // Would be imported from next/package.json
        platform: process.platform,
        region: process.env.VERCEL_REGION || process.env.AWS_REGION,
      },
    }

    // Set appropriate status code
    const statusCode = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 207 : 503

    // Return different formats
    if (format === 'prometheus') {
      // Prometheus metrics format
      const metrics = [
        `# HELP system_health System health status (1=healthy, 0.5=degraded, 0=unhealthy)`,
        `# TYPE system_health gauge`,
        `system_health{service="overall"} ${result.status === 'healthy' ? 1 : result.status === 'degraded' ? 0.5 : 0}`,
        `system_health{service="database"} ${services.database.status === 'healthy' ? 1 : services.database.status === 'degraded' ? 0.5 : 0}`,
        `system_health{service="cache"} ${services.cache.status === 'healthy' ? 1 : services.cache.status === 'degraded' ? 0.5 : 0}`,
        `system_health{service="analytics"} ${services.analytics.status === 'healthy' ? 1 : services.analytics.status === 'degraded' ? 0.5 : 0}`,
        ``,
        `# HELP system_uptime_seconds System uptime in seconds`,
        `# TYPE system_uptime_seconds counter`,
        `system_uptime_seconds ${Math.floor(result.uptime / 1000)}`,
        ``,
        `# HELP database_response_time_ms Database response time in milliseconds`,
        `# TYPE database_response_time_ms gauge`,
        `database_response_time_ms ${services.database.responseTime || 0}`,
      ].join('\n')

      return new Response(metrics, {
        status: statusCode,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }) as ApiResponse<ApiResult<HealthCheckResult>>
    } else if (format === 'simple') {
      // Simple text format for basic monitoring
      return new Response(result.status.toUpperCase(), {
        status: statusCode,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }) as ApiResponse<ApiResult<HealthCheckResult>>
    }

    // Default JSON format
    const response = apiSuccess(result)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Health-Status', result.status)
    response.headers.set('X-Health-Timestamp', result.timestamp)
    
    if (statusCode !== 200) {
      return new Response(response.body, {
        status: statusCode,
        headers: response.headers,
      }) as ApiResponse<ApiResult<HealthCheckResult>>
    }
    
    return response

  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Health Check] Unexpected error:', handled)
    
    const errorResult: Partial<HealthCheckResult> = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        cache: { status: 'unhealthy', provider: 'memory', error: 'Health check failed' },
        analytics: { status: 'unhealthy', error: 'Health check failed' },
      },
    }

    return apiError(
      'Health check failed',
      'HEALTH_CHECK_ERROR',
      503
    )
  }
}

/**
 * HEAD /api/system/health
 * Lightweight health check that only returns status code
 */
export const HEAD: ApiHandler<void, null> = async (request: ApiRequest<void>): Promise<ApiResponse<null>> => {
  try {
    // Quick database connectivity check
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No-op for health check
          },
        },
      }
    )

    const { error } = await supabase.from('sites').select('id').limit(1)
    
    if (error) {
      return new Response(null, {
        status: 503,
        headers: {
          'X-Health-Status': 'unhealthy',
          'Cache-Control': 'no-cache',
        },
      }) as ApiResponse<null>
    }

    return new Response(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'healthy',
        'Cache-Control': 'no-cache',
      },
    }) as ApiResponse<null>

  } catch (error: unknown) {
    return new Response(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'Cache-Control': 'no-cache',
      },
    }) as ApiResponse<null>
  }
}