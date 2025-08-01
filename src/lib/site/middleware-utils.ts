/**
 * Middleware utilities for domain resolution and request handling
 * Provides logging, validation, and helper functions for middleware operations
 */

import { NextRequest } from 'next/server'
import { Site } from '@/lib/database/aliases'

export interface DomainResolutionLog {
  hostname: string
  siteId: string | null
  status: DomainResolutionStatus
  duration: number
  timestamp: Date
  userAgent?: string
  ip?: string
  referer?: string
}

export type DomainResolutionStatus = 
  | 'SUCCESS'
  | 'SITE_NOT_FOUND' 
  | 'INVALID_HOSTNAME'
  | 'SITE_UNPUBLISHED'
  | 'ACCESS_DENIED'
  | 'DATABASE_ERROR'
  | 'MIDDLEWARE_ERROR'
  | 'DEVELOPMENT'
  | 'CACHE_HIT'
  | 'CACHE_MISS'

/**
 * Logs domain resolution attempts for monitoring and debugging
 */
export function logDomainResolution(
  hostname: string,
  siteId: string | null,
  status: DomainResolutionStatus,
  duration: number,
  request?: NextRequest
): void {
  const logEntry: DomainResolutionLog = {
    hostname,
    siteId,
    status,
    duration,
    timestamp: new Date(),
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: getClientIP(request),
    referer: request?.headers.get('referer') || undefined,
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Domain Resolution] ${hostname} -> ${status} (${duration}ms)`, {
      siteId,
      userAgent: logEntry.userAgent,
      ip: logEntry.ip,
    })
  }

  // In production, you might want to send to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to external logging service
    // sendToLoggingService(logEntry)
    
    // For now, log critical errors to console
    if (['DATABASE_ERROR', 'MIDDLEWARE_ERROR'].includes(status)) {
      console.error('[Domain Resolution Error]', logEntry)
    }
  }

  // Store metrics for monitoring
  recordDomainResolutionMetric(status, duration)
}

/**
 * Extracts client IP from request headers
 */
function getClientIP(request?: NextRequest): string | undefined {
  if (!request) return undefined

  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-forwarded') ||
    undefined
  )
}

/**
 * Records metrics for domain resolution performance monitoring
 */
function recordDomainResolutionMetric(status: DomainResolutionStatus, duration: number): void {
  // In a real application, you might send these to a metrics service like DataDog, New Relic, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Example metric recording
    // metrics.increment('domain_resolution.requests', 1, { status })
    // metrics.histogram('domain_resolution.duration', duration, { status })
  }
}

/**
 * Validates if a hostname is allowed for this application
 */
export function isAllowedHostname(hostname: string): boolean {
  const allowedDomains = getAllowedDomains()
  
  // Check if hostname exactly matches an allowed domain
  if (allowedDomains.includes(hostname)) {
    return true
  }
  
  // Check if hostname is a subdomain of an allowed domain
  return allowedDomains.some(domain => hostname.endsWith(`.${domain}`))
}

/**
 * Gets list of allowed domains from environment configuration
 */
function getAllowedDomains(): string[] {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
  const additionalDomains = process.env.ALLOWED_DOMAINS?.split(',') || []
  
  return [
    appDomain,
    ...additionalDomains,
    'localhost',
    '127.0.0.1',
  ].filter(Boolean)
}

/**
 * Extracts site context from request headers/cookies set by middleware
 */
export interface SiteContext {
  siteId: string | null
  subdomain: string | null
  customDomain: string | null
  siteName: string | null
  hostname: string | null
  isDevMode: boolean
  devSite?: string
  devSubdomain?: string
}

export function extractSiteContext(request: NextRequest): SiteContext {
  const headers = request.headers
  const cookies = request.cookies

  return {
    siteId: cookies.get('x-site-id')?.value || headers.get('x-site-id') || null,
    subdomain: cookies.get('x-site-subdomain')?.value || headers.get('x-site-subdomain') || null,
    customDomain: cookies.get('x-site-custom-domain')?.value || headers.get('x-site-custom-domain') || null,
    siteName: headers.get('x-site-name') || null,
    hostname: headers.get('x-hostname') || null,
    isDevMode: process.env.NODE_ENV === 'development',
    devSite: cookies.get('x-dev-site')?.value || headers.get('x-dev-site') || undefined,
    devSubdomain: cookies.get('x-dev-subdomain')?.value || headers.get('x-dev-subdomain') || undefined,
  }
}

/**
 * Validates site configuration for security
 */
export function validateSiteConfiguration(site: Site): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required fields
  if (!site.id || typeof site.id !== 'string') {
    errors.push('Site ID is required')
  }

  if (!site.name || typeof site.name !== 'string' || site.name.trim().length === 0) {
    errors.push('Site name is required')
  }

  if (!site.subdomain || typeof site.subdomain !== 'string') {
    errors.push('Subdomain is required')
  }

  // Validate subdomain format
  if (site.subdomain) {
    const subdomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
    if (!subdomainRegex.test(site.subdomain)) {
      errors.push('Invalid subdomain format')
    }
  }

  // Validate custom domain format if present
  if (site.custom_domain) {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(site.custom_domain)) {
      errors.push('Invalid custom domain format')
    }
  }

  // Check for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ]

  const fieldsToCheck = [site.name, site.description, site.business_name]
  for (const field of fieldsToCheck) {
    if (field && suspiciousPatterns.some(pattern => pattern.test(field))) {
      errors.push('Suspicious content detected in site fields')
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generates a cache key for site resolution
 */
export function generateSiteCacheKey(value: string, type: 'subdomain' | 'custom_domain'): string {
  return `site:${type}:${value.toLowerCase()}`
}

/**
 * Determines cache TTL based on site type and environment
 */
export function getSiteCacheTTL(type: 'subdomain' | 'custom_domain'): number {
  if (process.env.NODE_ENV === 'development') {
    return 60 // 1 minute in development
  }

  // In production, cache subdomains longer since they change less frequently
  return type === 'subdomain' ? 3600 : 1800 // 1 hour for subdomains, 30 minutes for custom domains
}

/**
 * Rate limiting for domain resolution requests
 */
const rateLimits = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  ip: string | undefined, 
  limit: number = 100, 
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remainingRequests?: number } {
  if (!ip) {
    return { allowed: true } // Allow if we can't identify the IP
  }

  const now = Date.now()
  const rateLimitData = rateLimits.get(ip)

  if (!rateLimitData || now > rateLimitData.resetTime) {
    // New window or first request
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remainingRequests: limit - 1 }
  }

  if (rateLimitData.count >= limit) {
    return { allowed: false, remainingRequests: 0 }
  }

  rateLimitData.count++
  return { allowed: true, remainingRequests: limit - rateLimitData.count }
}

/**
 * Cleans up old rate limit entries (should be called periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [ip, data] of Array.from(rateLimits.entries())) {
    if (now > data.resetTime) {
      rateLimits.delete(ip)
    }
  }
}

/**
 * Security headers for multi-domain setup
 */
export function getSecurityHeaders(site: Site, hostname: string): Record<string, string> {
  const headers: Record<string, string> = {}

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: In production, avoid unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https: ${hostname}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ]

  headers['Content-Security-Policy'] = cspDirectives.join('; ')

  // Additional security headers
  headers['X-Frame-Options'] = 'DENY'
  headers['X-Content-Type-Options'] = 'nosniff'
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
  headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

  return headers
}

/**
 * Generates error response data for different error types
 */
export function getErrorResponseData(
  status: DomainResolutionStatus,
  hostname: string,
  additionalData?: Record<string, unknown>
): Record<string, unknown> {
  const baseData = {
    error: status,
    hostname,
    timestamp: new Date().toISOString(),
    ...additionalData,
  }

  switch (status) {
    case 'SITE_NOT_FOUND':
      return {
        ...baseData,
        message: 'Site not found for this domain',
        suggestion: 'Check if the domain is correct or contact support',
      }

    case 'INVALID_HOSTNAME':
      return {
        ...baseData,
        message: 'Invalid hostname format',
        suggestion: 'Please use a valid domain name',
      }

    case 'SITE_UNPUBLISHED':
      return {
        ...baseData,
        message: 'Site is not publicly available',
        suggestion: 'Contact the site owner for access',
      }

    case 'ACCESS_DENIED':
      return {
        ...baseData,
        message: 'Access denied to this site',
        suggestion: 'You do not have permission to access this site',
      }

    case 'DATABASE_ERROR':
      return {
        ...baseData,
        message: 'Temporary system error',
        suggestion: 'Please try again in a few minutes',
      }

    default:
      return baseData
  }
}