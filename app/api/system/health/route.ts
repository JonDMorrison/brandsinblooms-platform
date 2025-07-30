/**
 * System health check API endpoint
 * Provides comprehensive health status for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRedisCacheHealth } from '@/src/lib/cache/redis-site-cache'
import { getSiteCacheStats } from '@/src/lib/cache/site-cache'
import { getAnalyticsHealth } from '@/src/lib/monitoring/site-analytics'

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
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
    }
  }
}

/**
 * Check cache health
 */
async function checkCacheHealth(): Promise<HealthCheckResult['services']['cache']> {
  try {
    // Check if Redis is available
    if (process.env.REDIS_URL) {
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
  } catch (error: any) {
    return {
      status: 'unhealthy',
      provider: process.env.REDIS_URL ? 'redis' : 'memory',
      error: error.message,
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
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
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
export async function GET(request: NextRequest): Promise<NextResponse> {
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
      services: includeDetails ? services : {} as any,
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

      return new NextResponse(metrics, {
        status: statusCode,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } else if (format === 'simple') {
      // Simple text format for basic monitoring
      return new NextResponse(result.status.toUpperCase(), {
        status: statusCode,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // Default JSON format
    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': result.status,
        'X-Health-Timestamp': result.timestamp,
      },
    })

  } catch (error: any) {
    console.error('[Health Check] Unexpected error:', error)
    
    const errorResult: Partial<HealthCheckResult> = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        cache: { status: 'unhealthy', provider: 'memory', error: 'Health check failed' },
        analytics: { status: 'unhealthy', error: 'Health check failed' },
      },
    }

    return NextResponse.json(errorResult, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
      },
    })
  }
}

/**
 * HEAD /api/system/health
 * Lightweight health check that only returns status code
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
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
      return new NextResponse(null, {
        status: 503,
        headers: {
          'X-Health-Status': 'unhealthy',
          'Cache-Control': 'no-cache',
        },
      })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'healthy',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'Cache-Control': 'no-cache',
      },
    })
  }
}