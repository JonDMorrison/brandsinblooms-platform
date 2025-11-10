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
function recordDomainResolutionMetric(_status: DomainResolutionStatus, _duration: number): void {
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
  const { getAppDomain } = require('@/lib/env/app-domain')
  const appDomain = getAppDomain()
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
    // Use env var or default to 1 minute in development
    const devTTL = parseInt(process.env.SITE_CACHE_TTL_DEV || '60', 10)
    return devTTL
  }

  // In production, use environment variables with sensible defaults
  // Subdomains change less frequently, so cache longer
  if (type === 'subdomain') {
    const subdomainTTL = parseInt(process.env.SITE_CACHE_TTL_SUBDOMAIN || '3600', 10)
    return subdomainTTL // Default: 1 hour
  }

  // Custom domains may change more frequently
  const customDomainTTL = parseInt(process.env.SITE_CACHE_TTL_CUSTOM_DOMAIN || '1800', 10)
  return customDomainTTL // Default: 30 minutes
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

  // Determine allowed frame ancestors for preview functionality
  function getAllowedFrameAncestors(): string {
    const { getAppDomain } = require('@/lib/env/app-domain')
    const isDevelopment = process.env.NODE_ENV === 'development'
    const appDomain = getAppDomain()
    const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('staging') ||
                     appDomain.includes('staging')

    // Allow frame ancestors in development AND staging for preview functionality
    if (!isDevelopment && !isStaging) {
      return "'self'"
    }

    // Derive dashboard URL from app domain
    const appUrl = new URL(appDomain.startsWith('http') ? appDomain : `http://${appDomain}`)
    const dashboardUrls: string[] = []
    
    if (appUrl.hostname === 'localhost') {
      // Local development - handle both same-port and different-port scenarios
      const appPort = appUrl.port || '3001'
      const dashboardPort = appPort === '3001' ? '3000' : '3001' // Switch ports
      
      dashboardUrls.push(
        // Same port (if dashboard and site share same server)
        `http://localhost:${appPort}`,
        `https://localhost:${appPort}`,
        `http://127.0.0.1:${appPort}`,
        `https://127.0.0.1:${appPort}`,
        // Different port (if dashboard runs separately)
        `http://localhost:${dashboardPort}`,
        `https://localhost:${dashboardPort}`,
        `http://127.0.0.1:${dashboardPort}`,
        `https://127.0.0.1:${dashboardPort}`
      )
      
      // Handle subdomain development (dev.localhost)
      if (hostname.includes('.localhost')) {
        const subdomain = hostname.split('.')[0]
        dashboardUrls.push(
          // Same port scenarios
          `http://${subdomain}.localhost:${appPort}`,
          `https://${subdomain}.localhost:${appPort}`,
          // Different port scenarios
          `http://${subdomain}.localhost:${dashboardPort}`,
          `https://${subdomain}.localhost:${dashboardPort}`
        )
      }
    } else {
      // Production/staging - derive dashboard from app domain
      const protocol = appUrl.protocol
      const hostname = appUrl.hostname

      // Handle staging domains (blooms-staging.cc)
      if (hostname.includes('staging')) {
        // For staging: dashboard is on main domain, sites are on subdomains
        dashboardUrls.push(
          `${protocol}//${hostname}`, // Main staging domain (dashboard)
          `${protocol}//admin.${hostname}`, // Admin subdomain if exists
          `${protocol}//dashboard.${hostname}` // Dashboard subdomain if exists
        )

        // Allow all subdomains of staging domain to be framed by dashboard
        // This enables preview functionality where dashboard can frame customer sites
        if (site.subdomain) {
          dashboardUrls.push(
            `${protocol}//${site.subdomain}.${hostname}` // Customer site subdomains
          )
        }
      } else {
        // Production patterns
        const baseDomain = hostname.replace(/^(sites?|app|www)\./, '') // Remove common prefixes

        if (hostname.startsWith('sites.') || hostname.startsWith('app.')) {
          // If app is on sites.domain.com, dashboard likely on admin.domain.com or dashboard.domain.com
          dashboardUrls.push(
            `${protocol}//admin.${baseDomain}`,
            `${protocol}//dashboard.${baseDomain}`,
            `${protocol}//app.${baseDomain}`
          )
        } else if (hostname.startsWith('www.')) {
          // If app is on www.domain.com, dashboard likely on admin.domain.com
          dashboardUrls.push(
            `${protocol}//admin.${baseDomain}`,
            `${protocol}//dashboard.${baseDomain}`
          )
        } else {
          // If app is on domain.com, dashboard could be admin.domain.com or same domain different port
          dashboardUrls.push(
            `${protocol}//admin.${hostname}`,
            `${protocol}//dashboard.${hostname}`,
            `${protocol}//${hostname}:3000` // Different port on same domain
          )
        }
      }
    }
    
    return ["'self'", ...dashboardUrls].join(' ')
  }

  const allowedFrameAncestors = getAllowedFrameAncestors()

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: In production, avoid unsafe-inline/eval
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: https: ${hostname}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    `frame-ancestors ${allowedFrameAncestors}`,
  ]

  headers['Content-Security-Policy'] = cspDirectives.join('; ')

  // Additional security headers
  headers['X-Frame-Options'] = isDevelopment ? 'SAMEORIGIN' : 'DENY'
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