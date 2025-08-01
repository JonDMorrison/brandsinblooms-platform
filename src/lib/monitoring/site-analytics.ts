/**
 * Site-specific analytics and monitoring implementation
 * Tracks performance, errors, and usage metrics per site
 */

import { Site } from '@/lib/database/aliases'
import { handleError } from '@/lib/types/error-handling'

// Analytics event types
interface BaseEvent {
  siteId: string
  timestamp: number
  sessionId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

interface PageViewEvent extends BaseEvent {
  type: 'page_view'
  path: string
  referrer?: string
  userAgent?: string
  domain: string
}

interface DomainResolutionEvent extends BaseEvent {
  type: 'domain_resolution'
  hostname: string
  resolutionType: 'subdomain' | 'custom_domain'
  status: 'success' | 'failed' | 'cached'
  latency: number
  error?: string
}

interface ErrorEvent extends BaseEvent {
  type: 'error'
  errorType: 'domain_not_found' | 'site_not_found' | 'database_error' | 'middleware_error' | 'security_violation'
  message: string
  stack?: string
  hostname?: string
  path?: string
}

interface PerformanceEvent extends BaseEvent {
  type: 'performance'
  metricName: 'ttfb' | 'fcp' | 'lcp' | 'cls' | 'fid' | 'cache_hit_rate'
  value: number
  unit: 'ms' | 'score' | 'percentage'
}

interface SecurityEvent extends BaseEvent {
  type: 'security'
  eventType: 'rate_limit_exceeded' | 'csrf_violation' | 'cors_violation' | 'invalid_domain'
  clientIp?: string
  userAgent?: string
  blocked: boolean
}

type AnalyticsEvent = PageViewEvent | DomainResolutionEvent | ErrorEvent | PerformanceEvent | SecurityEvent

// Analytics storage interface
interface AnalyticsStorage {
  store(event: AnalyticsEvent): Promise<void>
  query(filters: AnalyticsQuery): Promise<AnalyticsResult>
  aggregate(metrics: AggregateQuery): Promise<AggregateResult>
}

interface AnalyticsQuery {
  siteId?: string
  eventType?: AnalyticsEvent['type']
  startTime?: number
  endTime?: number
  limit?: number
  offset?: number
}

interface AnalyticsResult {
  events: AnalyticsEvent[]
  total: number
  hasMore: boolean
}

interface AggregateQuery {
  siteId?: string
  metric: string
  groupBy?: 'hour' | 'day' | 'week' | 'month'
  startTime?: number
  endTime?: number
}

interface AggregateResult {
  data: Array<{
    timestamp: number
    value: number
    count?: number
  }>
  total: number
  average: number
}

// In-memory analytics storage (for development and small deployments)
class InMemoryAnalyticsStorage implements AnalyticsStorage {
  private events: AnalyticsEvent[] = []
  private readonly maxEvents: number

  constructor(maxEvents: number = 10000) {
    this.maxEvents = maxEvents
  }

  async store(event: AnalyticsEvent): Promise<void> {
    this.events.push(event)
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  async query(filters: AnalyticsQuery): Promise<AnalyticsResult> {
    let filteredEvents = this.events

    // Apply filters
    if (filters.siteId) {
      filteredEvents = filteredEvents.filter(e => e.siteId === filters.siteId)
    }
    if (filters.eventType) {
      filteredEvents = filteredEvents.filter(e => e.type === filters.eventType)
    }
    if (filters.startTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startTime!)
    }
    if (filters.endTime) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endTime!)
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp)

    const total = filteredEvents.length
    const offset = filters.offset || 0
    const limit = filters.limit || 100

    const paginatedEvents = filteredEvents.slice(offset, offset + limit)

    return {
      events: paginatedEvents,
      total,
      hasMore: offset + limit < total,
    }
  }

  async aggregate(query: AggregateQuery): Promise<AggregateResult> {
    let events = this.events

    // Filter by site
    if (query.siteId) {
      events = events.filter(e => e.siteId === query.siteId)
    }

    // Filter by time range
    if (query.startTime) {
      events = events.filter(e => e.timestamp >= query.startTime!)
    }
    if (query.endTime) {
      events = events.filter(e => e.timestamp <= query.endTime!)
    }

    // Group and aggregate
    const groups = new Map<number, { values: number[]; count: number }>()
    
    for (const event of events) {
      let groupKey = event.timestamp
      
      // Group by time period
      if (query.groupBy) {
        const date = new Date(event.timestamp)
        switch (query.groupBy) {
          case 'hour':
            groupKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime()
            break
          case 'day':
            groupKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
            break
          case 'week':
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            groupKey = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime()
            break
          case 'month':
            groupKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime()
            break
        }
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { values: [], count: 0 })
      }

      const group = groups.get(groupKey)!
      group.count++

      // Extract metric value
      let value = 1 // Default count
      if (event.type === 'performance' && (event as PerformanceEvent).metricName === query.metric) {
        value = (event as PerformanceEvent).value
      } else if (event.type === 'domain_resolution' && query.metric === 'latency') {
        value = (event as DomainResolutionEvent).latency
      }

      group.values.push(value)
    }

    // Convert to result format
    const data = Array.from(groups.entries()).map(([timestamp, group]) => ({
      timestamp,
      value: group.values.reduce((sum, val) => sum + val, 0) / group.values.length,
      count: group.count,
    })).sort((a, b) => a.timestamp - b.timestamp)

    const allValues = Array.from(groups.values()).flatMap(g => g.values)
    const total = allValues.length
    const average = total > 0 ? allValues.reduce((sum, val) => sum + val, 0) / total : 0

    return { data, total, average }
  }
}

// Global analytics instance
let analyticsStorage: AnalyticsStorage | null = null

/**
 * Get analytics storage instance
 */
function getAnalyticsStorage(): AnalyticsStorage {
  if (!analyticsStorage) {
    // In production, you might want to use a database or external analytics service
    const storageType = process.env.ANALYTICS_STORAGE_TYPE || 'memory'
    
    switch (storageType) {
      case 'memory':
      default:
        analyticsStorage = new InMemoryAnalyticsStorage(
          parseInt(process.env.ANALYTICS_MAX_EVENTS || '10000', 10)
        )
        break
    }
  }
  return analyticsStorage
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Track page view
 */
export async function trackPageView(
  site: Site,
  path: string,
  request?: Request
): Promise<void> {
  const storage = getAnalyticsStorage()
  
  const event: PageViewEvent = {
    type: 'page_view',
    siteId: site.id,
    timestamp: Date.now(),
    path,
    domain: site.custom_domain || `${site.subdomain}.blooms.cc`,
    sessionId: generateSessionId(),
  }

  if (request) {
    event.referrer = request.headers.get('referer') || undefined
    event.userAgent = request.headers.get('user-agent') || undefined
  }

  try {
    await storage.store(event)
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to track page view:', handled)
  }
}

/**
 * Track domain resolution
 */
export async function trackDomainResolution(
  hostname: string,
  siteId: string | null,
  status: 'SUCCESS' | 'SITE_NOT_FOUND' | 'INVALID_HOSTNAME' | 'DATABASE_ERROR' | 'CACHED',
  latency: number
): Promise<void> {
  const storage = getAnalyticsStorage()
  
  const event: DomainResolutionEvent = {
    type: 'domain_resolution',
    siteId: siteId || 'unknown',
    timestamp: Date.now(),
    hostname,
    resolutionType: hostname.includes('.') && !hostname.includes('blooms.cc') ? 'custom_domain' : 'subdomain',
    status: status === 'SUCCESS' || status === 'CACHED' ? 'success' : 'failed',
    latency,
  }

  if (status === 'CACHED') {
    event.status = 'cached'
  }

  if (status !== 'SUCCESS' && status !== 'CACHED') {
    event.error = status
  }

  try {
    await storage.store(event)
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to track domain resolution:', handled)
  }
}

/**
 * Track error
 */
export async function trackError(
  siteId: string | null,
  errorType: ErrorEvent['errorType'],
  message: string,
  options?: {
    stack?: string
    hostname?: string
    path?: string
    userId?: string
  }
): Promise<void> {
  const storage = getAnalyticsStorage()
  
  const event: ErrorEvent = {
    type: 'error',
    siteId: siteId || 'unknown',
    timestamp: Date.now(),
    errorType,
    message,
    ...options,
  }

  try {
    await storage.store(event)
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to track error:', handled)
  }
}

/**
 * Track performance metric
 */
export async function trackPerformance(
  siteId: string,
  metricName: PerformanceEvent['metricName'],
  value: number,
  unit: PerformanceEvent['unit'] = 'ms'
): Promise<void> {
  const storage = getAnalyticsStorage()
  
  const event: PerformanceEvent = {
    type: 'performance',
    siteId,
    timestamp: Date.now(),
    metricName,
    value,
    unit,
  }

  try {
    await storage.store(event)
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to track performance:', handled)
  }
}

/**
 * Track security event
 */
export async function trackSecurityEvent(
  siteId: string | null,
  eventType: SecurityEvent['eventType'],
  blocked: boolean,
  options?: {
    clientIp?: string
    userAgent?: string
    userId?: string
  }
): Promise<void> {
  const storage = getAnalyticsStorage()
  
  const event: SecurityEvent = {
    type: 'security',
    siteId: siteId || 'unknown',
    timestamp: Date.now(),
    eventType,
    blocked,
    ...options,
  }

  try {
    await storage.store(event)
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to track security event:', handled)
  }
}

/**
 * Get site analytics dashboard data
 */
export async function getSiteAnalytics(
  siteId: string,
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<{
  pageViews: AggregateResult
  domainResolutions: AggregateResult
  errors: AnalyticsResult
  performance: {
    averageLatency: number
    cacheHitRate: number
  }
  security: {
    blockedRequests: number
    securityViolations: AnalyticsResult
  }
}> {
  const storage = getAnalyticsStorage()
  const now = Date.now()
  
  // Calculate time range
  let startTime: number
  switch (timeRange) {
    case 'hour':
      startTime = now - (60 * 60 * 1000)
      break
    case 'day':
      startTime = now - (24 * 60 * 60 * 1000)
      break
    case 'week':
      startTime = now - (7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startTime = now - (30 * 24 * 60 * 60 * 1000)
      break
  }

  try {
    // Get aggregated data
    const [pageViews, domainResolutions, errors, securityEvents] = await Promise.all([
      storage.aggregate({
        siteId,
        metric: 'page_views',
        groupBy: timeRange,
        startTime,
        endTime: now,
      }),
      storage.aggregate({
        siteId,
        metric: 'latency',
        groupBy: timeRange,
        startTime,
        endTime: now,
      }),
      storage.query({
        siteId,
        eventType: 'error',
        startTime,
        endTime: now,
        limit: 50,
      }),
      storage.query({
        siteId,
        eventType: 'security',
        startTime,
        endTime: now,
        limit: 100,
      }),
    ])

    // Calculate performance metrics
    const performanceEvents = await storage.query({
      siteId,
      eventType: 'performance',
      startTime,
      endTime: now,
      limit: 1000,
    })

    const latencyEvents = performanceEvents.events.filter(e => 
      e.type === 'performance' && (e as PerformanceEvent).metricName === 'ttfb'
    ) as PerformanceEvent[]

    const averageLatency = latencyEvents.length > 0
      ? latencyEvents.reduce((sum, e) => sum + e.value, 0) / latencyEvents.length
      : 0

    // Calculate cache hit rate
    const resolutionEvents = await storage.query({
      siteId,
      eventType: 'domain_resolution',
      startTime,
      endTime: now,
      limit: 1000,
    })

    const totalResolutions = resolutionEvents.events.length
    const cachedResolutions = resolutionEvents.events.filter(e => 
      e.type === 'domain_resolution' && (e as DomainResolutionEvent).status === 'cached'
    ).length

    const cacheHitRate = totalResolutions > 0 ? (cachedResolutions / totalResolutions) * 100 : 0

    // Security metrics
    const blockedRequests = securityEvents.events.filter(e => 
      e.type === 'security' && (e as SecurityEvent).blocked
    ).length

    return {
      pageViews,
      domainResolutions,
      errors,
      performance: {
        averageLatency,
        cacheHitRate,
      },
      security: {
        blockedRequests,
        securityViolations: securityEvents,
      },
    }
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to get site analytics:', handled)
    throw error
  }
}

/**
 * Get system-wide analytics
 */
export async function getSystemAnalytics(
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalSites: number
  totalPageViews: number
  averageLatency: number
  errorRate: number
  topSites: Array<{ siteId: string; pageViews: number }>
  systemHealth: {
    uptime: number
    errorCount: number
    securityViolationCount: number
  }
}> {
  const storage = getAnalyticsStorage()
  const now = Date.now()
  
  // Calculate time range
  let startTime: number
  switch (timeRange) {
    case 'hour':
      startTime = now - (60 * 60 * 1000)
      break
    case 'day':
      startTime = now - (24 * 60 * 60 * 1000)
      break
    case 'week':
      startTime = now - (7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startTime = now - (30 * 24 * 60 * 60 * 1000)
      break
  }

  try {
    // Get all events in time range
    const [allEvents, errorEvents, securityEvents] = await Promise.all([
      storage.query({ startTime, endTime: now, limit: 10000 }),
      storage.query({ eventType: 'error', startTime, endTime: now, limit: 1000 }),
      storage.query({ eventType: 'security', startTime, endTime: now, limit: 1000 }),
    ])

    // Calculate metrics
    const uniqueSites = new Set(allEvents.events.map(e => e.siteId)).size
    const pageViewEvents = allEvents.events.filter(e => e.type === 'page_view')
    const performanceEvents = allEvents.events.filter(e => e.type === 'performance') as PerformanceEvent[]

    const averageLatency = performanceEvents.length > 0
      ? performanceEvents
          .filter(e => e.metricName === 'ttfb')
          .reduce((sum, e) => sum + e.value, 0) / performanceEvents.filter(e => e.metricName === 'ttfb').length
      : 0

    const errorRate = allEvents.total > 0 ? (errorEvents.total / allEvents.total) * 100 : 0

    // Top sites by page views
    const sitePageViews = new Map<string, number>()
    pageViewEvents.forEach(event => {
      const count = sitePageViews.get(event.siteId) || 0
      sitePageViews.set(event.siteId, count + 1)
    })

    const topSites = Array.from(sitePageViews.entries())
      .map(([siteId, pageViews]) => ({ siteId, pageViews }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 10)

    return {
      totalSites: uniqueSites,
      totalPageViews: pageViewEvents.length,
      averageLatency,
      errorRate,
      topSites,
      systemHealth: {
        uptime: 99.9, // This would be calculated from actual uptime data
        errorCount: errorEvents.total,
        securityViolationCount: securityEvents.total,
      },
    }
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Analytics] Failed to get system analytics:', handled)
    throw error
  }
}

/**
 * Health check for analytics system
 */
export async function getAnalyticsHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  storage: {
    type: string
    connected: boolean
    eventCount: number
  }
  lastError?: string
}> {
  try {
    const storage = getAnalyticsStorage()
    
    // Test storage
    await storage.store({
      type: 'performance',
      siteId: 'health-check',
      timestamp: Date.now(),
      metricName: 'ttfb',
      value: 100,
      unit: 'ms',
    })

    const recentEvents = await storage.query({
      startTime: Date.now() - (5 * 60 * 1000), // Last 5 minutes
      limit: 10,
    })

    return {
      status: 'healthy',
      storage: {
        type: 'memory', // or 'database', 'external' etc.
        connected: true,
        eventCount: recentEvents.total,
      },
    }
  } catch (error: unknown) {
    const handled = handleError(error)
    return {
      status: 'unhealthy',
      storage: {
        type: 'unknown',
        connected: false,
        eventCount: 0,
      },
      lastError: handled.message,
    }
  }
}

/**
 * Export analytics data for backup or analysis
 */
export async function exportAnalyticsData(
  siteId?: string,
  startTime?: number,
  endTime?: number,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const storage = getAnalyticsStorage()
  
  const events = await storage.query({
    siteId,
    startTime,
    endTime,
    limit: 10000, // Adjust based on your needs
  })

  if (format === 'csv') {
    // Convert to CSV format
    const headers = ['timestamp', 'type', 'siteId', 'data']
    const rows = events.events.map(event => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.siteId,
      JSON.stringify(event),
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  // Return JSON format
  return JSON.stringify(events, null, 2)
}