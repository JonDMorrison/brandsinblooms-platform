/**
 * Multi-domain security implementation for production environments
 * Handles CSRF protection, CORS, rate limiting, and security headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { Site } from '@/lib/database/aliases'
import { handleError } from '@/lib/types/error-handling'
import { debug } from '@/src/lib/utils/debug'

// Security configuration
interface SecurityConfig {
  csrf: {
    enabled: boolean
    cookieName: string
    headerName: string
    secretKey: string
  }
  cors: {
    enabled: boolean
    allowedOrigins: string[]
    allowCredentials: boolean
    maxAge: number
  }
  rateLimit: {
    enabled: boolean
    windowMs: number
    maxRequests: number
    keyGenerator: (req: NextRequest) => string
  }
  headers: {
    hsts: boolean
    csp: boolean
    frameOptions: string
    contentTypeOptions: boolean
  }
}

// Rate limiting storage
interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval?: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  isRateLimited(key: string, windowMs: number, maxRequests: number): {
    limited: boolean
    remainingRequests: number
    resetTime: number
  } {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new window
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false,
      })
      return {
        limited: false,
        remainingRequests: maxRequests - 1,
        resetTime: now + windowMs,
      }
    }

    entry.count++
    const limited = entry.count > maxRequests

    if (limited) {
      entry.blocked = true
    }

    return {
      limited,
      remainingRequests: Math.max(0, maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }

  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global instances
let rateLimitStore: RateLimitStore | null = null
let securityConfig: SecurityConfig | null = null

/**
 * Get security configuration
 */
function getSecurityConfig(): SecurityConfig {
  if (!securityConfig) {
    securityConfig = {
      csrf: {
        enabled: process.env.CSRF_PROTECTION === 'true',
        cookieName: process.env.CSRF_COOKIE_NAME || '__Host-csrf-token',
        headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
        secretKey: process.env.CSRF_SECRET_KEY || 'default-secret-change-in-production',
      },
      cors: {
        enabled: process.env.CORS_ENABLED !== 'false',
        allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '*').split(','),
        allowCredentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
        maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10),
      },
      rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        keyGenerator: (req) => {
          // Use site-specific rate limiting
          const siteId = req.headers.get('x-site-id') || 'unknown'
          const ip = getClientIP(req)
          return `${siteId}:${ip}`
        },
      },
      headers: {
        hsts: process.env.SECURITY_HSTS !== 'false',
        csp: process.env.SECURITY_CSP !== 'false',
        frameOptions: process.env.SECURITY_FRAME_OPTIONS || 'SAMEORIGIN',
        contentTypeOptions: process.env.SECURITY_CONTENT_TYPE_OPTIONS !== 'false',
      },
    }
  }
  return securityConfig
}

/**
 * Get rate limit store
 */
function getRateLimitStore(): RateLimitStore {
  if (!rateLimitStore) {
    rateLimitStore = new RateLimitStore()
  }
  return rateLimitStore
}

/**
 * Extract client IP address
 */
function getClientIP(req: NextRequest): string {
  // Check various headers for the real IP
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-client-ip') ||
    'unknown'
  )
}

/**
 * Generate CSRF token
 */
async function generateCSRFToken(secretKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${Date.now()}-${Math.random()}`)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const token = Buffer.from(data).toString('base64') + '.' + Buffer.from(signature).toString('base64')
  return token
}

/**
 * Verify CSRF token
 */
async function verifyCSRFToken(token: string, secretKey: string): Promise<boolean> {
  try {
    const [dataStr, signatureStr] = token.split('.')
    if (!dataStr || !signatureStr) return false

    const encoder = new TextEncoder()
    const data = Buffer.from(dataStr, 'base64')
    const signature = Buffer.from(signatureStr, 'base64')

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const isValid = await crypto.subtle.verify('HMAC', key, signature, data)

    // Check token age (valid for 24 hours)
    if (isValid) {
      const timestampStr = new TextDecoder().decode(data).split('-')[0]
      const timestamp = parseInt(timestampStr, 10)
      const age = Date.now() - timestamp
      return age < 24 * 60 * 60 * 1000 // 24 hours
    }

    return false
  } catch {
    return false
  }
}

/**
 * Check if origin is allowed for CORS
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) {
    return true
  }

  for (const allowed of allowedOrigins) {
    if (allowed === origin) {
      return true
    }
    
    // Support wildcard subdomains (e.g., *.example.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2)
      if (origin.endsWith(`.${domain}`) || origin === domain) {
        return true
      }
    }
  }

  return false
}

/**
 * Apply CSRF protection
 */
export async function applyCSRFProtection(
  request: NextRequest,
  response: NextResponse,
  site: Site
): Promise<{ success: boolean; error?: string }> {
  const config = getSecurityConfig()
  
  if (!config.csrf.enabled) {
    return { success: true }
  }

  const method = request.method.toUpperCase()
  
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // Set CSRF token for future use
    const token = await generateCSRFToken(config.csrf.secretKey)
    response.cookies.set(config.csrf.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      domain: site.custom_domain || undefined,
    })
    return { success: true }
  }

  // Verify CSRF token for unsafe methods
  const tokenFromHeader = request.headers.get(config.csrf.headerName)
  const tokenFromCookie = request.cookies.get(config.csrf.cookieName)?.value

  if (!tokenFromHeader || !tokenFromCookie) {
    return { success: false, error: 'CSRF token missing' }
  }

  if (tokenFromHeader !== tokenFromCookie) {
    return { success: false, error: 'CSRF token mismatch' }
  }

  const isValid = await verifyCSRFToken(tokenFromHeader, config.csrf.secretKey)
  if (!isValid) {
    return { success: false, error: 'CSRF token invalid' }
  }

  return { success: true }
}

/**
 * Apply CORS headers
 */
export function applyCORSHeaders(
  request: NextRequest,
  response: NextResponse,
  _site: Site
): { success: boolean; error?: string } {
  const config = getSecurityConfig()
  
  if (!config.cors.enabled) {
    return { success: true }
  }

  const origin = request.headers.get('origin')
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    if (origin && isOriginAllowed(origin, config.cors.allowedOrigins)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (config.cors.allowedOrigins.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token')
    response.headers.set('Access-Control-Max-Age', config.cors.maxAge.toString())
    
    if (config.cors.allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return { success: true }
  }

  // Handle actual requests
  if (origin) {
    if (isOriginAllowed(origin, config.cors.allowedOrigins)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      return { success: false, error: `Origin ${origin} not allowed` }
    }
  }

  if (config.cors.allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return { success: true }
}

/**
 * Apply rate limiting
 */
export function applyRateLimit(
  request: NextRequest,
  _site: Site
): { success: boolean; error?: string; headers?: Record<string, string> } {
  const config = getSecurityConfig()
  
  if (!config.rateLimit.enabled) {
    return { success: true }
  }

  const store = getRateLimitStore()
  const key = config.rateLimit.keyGenerator(request)
  
  const result = store.isRateLimited(
    key,
    config.rateLimit.windowMs,
    config.rateLimit.maxRequests
  )

  const headers = {
    'X-RateLimit-Limit': config.rateLimit.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remainingRequests.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    'X-RateLimit-Window': config.rateLimit.windowMs.toString(),
  }

  if (result.limited) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      headers: {
        ...headers,
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
      },
    }
  }

  return { success: true, headers }
}

/**
 * Apply security headers
 */
export function applySecurityHeaders(
  response: NextResponse,
  site: Site,
  request?: NextRequest
): void {
  const config = getSecurityConfig()

  // Check if this is an iframe preview request
  const isPreviewMode = request &&
    request.nextUrl.searchParams.get('_preview_mode') === 'iframe'

  // Enhanced debug logging for preview mode detection
  if (process.env.NODE_ENV !== 'production') {
    const searchParams = request?.nextUrl.searchParams
    const previewModeParam = searchParams?.get('_preview_mode')
    const dashboardOriginParam = searchParams?.get('_dashboard_origin')

    debug.security('🔍 Preview Mode Detection Analysis:', {
      fullUrl: request?.url,
      pathname: request?.nextUrl.pathname,
      allSearchParams: searchParams ? Object.fromEntries(searchParams.entries()) : 'NO_PARAMS',
      previewModeParam,
      isPreviewModeIframe: previewModeParam === 'iframe',
      dashboardOriginParam,
      hasPreviewModeParam: !!previewModeParam,
      finalIsPreviewMode: isPreviewMode,
      willSkipXFrameOptions: isPreviewMode,
      parameterPreservationWorking: !!(previewModeParam && request?.nextUrl.pathname === '/home')
    })

    if (isPreviewMode) {
      debug.security('✅ PREVIEW MODE DETECTED - Iframe embedding will be ALLOWED')
    } else {
      debug.security('❌ Normal page load - Iframe embedding will be BLOCKED')
      if (request?.nextUrl.pathname === '/home' && !previewModeParam) {
        debug.security('⚠️  WARNING: This is /home but no _preview_mode param - redirect may have lost parameters!')
      }
    }
  }

  // HSTS (HTTP Strict Transport Security)
  if (config.headers.hsts && process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Content Security Policy
  if (config.headers.csp) {
    // Determine allowed frame ancestors for preview functionality
    function getAllowedFrameAncestors(): string {
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('staging') ||
                       process.env.NEXT_PUBLIC_APP_DOMAIN?.includes('staging')

      // Allow frame ancestors in development AND staging for preview functionality
      if (!isDevelopment && !isStaging) {
        return "'self'"
      }
      
      // Derive dashboard URL from app URL
      const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL!)
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
        if (site.subdomain && site.subdomain !== 'localhost') {
          dashboardUrls.push(
            // Same port scenarios
            `http://${site.subdomain}.localhost:${appPort}`,
            `https://${site.subdomain}.localhost:${appPort}`,
            // Different port scenarios
            `http://${site.subdomain}.localhost:${dashboardPort}`,
            `https://${site.subdomain}.localhost:${dashboardPort}`
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

    // Build img-src directive with proper sources
    const imgSrcSources = ["'self'", "data:", "https:"]

    // Add localhost HTTP support in development for local S3/MinIO testing
    if (process.env.NODE_ENV === 'development') {
      imgSrcSources.push("http://localhost:*", "http://127.0.0.1:*")
    }

    // Add custom domain if configured
    if (site.custom_domain) {
      imgSrcSources.push(`https://${site.custom_domain}`)
    }

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src ${imgSrcSources.join(' ')}`,
      "font-src 'self' data: https://fonts.gstatic.com",
      // Allow local development connections to Supabase + Stripe
      process.env.NODE_ENV === 'development'
        ? "connect-src 'self' https://api.stripe.com https://m.stripe.network wss: https: http://localhost:* http://127.0.0.1:*"
        : "connect-src 'self' https://api.stripe.com https://m.stripe.network wss: https:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      `frame-ancestors ${allowedFrameAncestors}`,
      "base-uri 'self'",
      "form-action 'self'",
    ]

    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  // X-Frame-Options - skip for preview mode to let CSP frame-ancestors handle security
  if (!isPreviewMode) {
    const frameOptions = process.env.NODE_ENV === 'development' ? 'SAMEORIGIN' : config.headers.frameOptions
    response.headers.set('X-Frame-Options', frameOptions)

    // Debug logging for X-Frame-Options
    if (process.env.NODE_ENV !== 'production') {
      debug.security('🚫 X-Frame-Options BLOCKING iframes:', {
        header: frameOptions,
        reason: 'Not in preview mode',
        effect: 'Iframe embedding will be blocked by browser'
      })
    }
  } else {
    // Debug logging for skipped X-Frame-Options
    if (process.env.NODE_ENV !== 'production') {
      debug.security('✅ X-Frame-Options SKIPPED - iframe embedding ALLOWED', {
        reason: 'Preview mode detected (_preview_mode=iframe)',
        security: 'CSP frame-ancestors will handle iframe security',
        effect: 'Dashboard iframe preview will work'
      })
    }
  }

  // X-Content-Type-Options
  if (config.headers.contentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Additional security headers
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Remove powered-by header
  response.headers.delete('x-powered-by')
}

/**
 * Create security error response
 */
export function createSecurityErrorResponse(
  error: string,
  statusCode: number = 403,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Security violation',
      message: error,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

/**
 * Comprehensive security middleware
 */
export async function applyMultiDomainSecurity(
  request: NextRequest,
  site: Site
): Promise<{
  success: boolean
  response?: NextResponse
  error?: string
}> {
  try {
    // Create base response
    const response = NextResponse.next({ request })

    // Apply CORS headers
    const corsResult = applyCORSHeaders(request, response, site)
    if (!corsResult.success) {
      return {
        success: false,
        response: createSecurityErrorResponse(corsResult.error!, 403),
        error: corsResult.error,
      }
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, site)
    if (!rateLimitResult.success) {
      const errorResponse = createSecurityErrorResponse(
        rateLimitResult.error!,
        429,
        rateLimitResult.headers
      )
      return {
        success: false,
        response: errorResponse,
        error: rateLimitResult.error,
      }
    }

    // Add rate limit headers to response
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    // Apply CSRF protection
    const csrfResult = await applyCSRFProtection(request, response, site)
    if (!csrfResult.success) {
      return {
        success: false,
        response: createSecurityErrorResponse(csrfResult.error!, 403),
        error: csrfResult.error,
      }
    }

    // Apply security headers
    applySecurityHeaders(response, site, request)

    return { success: true, response }
  } catch (error: unknown) {
    const handled = handleError(error)
    console.error('[Multi-Domain Security] Unexpected error:', handled)
    return {
      success: false,
      response: createSecurityErrorResponse('Internal security error', 500),
      error: handled.message,
    }
  }
}

/**
 * Validate domain ownership for security
 */
export async function validateDomainOwnership(
  domain: string,
  siteId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // This would typically involve:
    // 1. DNS TXT record verification
    // 2. HTTP verification file check
    // 3. Certificate validation
    
    // For now, we'll implement a basic check
    // In production, you'd want to implement proper domain verification
    
    const isValidDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/.test(domain)
    
    if (!isValidDomain) {
      return { valid: false, error: 'Invalid domain format' }
    }

    // Check if domain is not a reserved domain
    const reservedDomains = ['localhost', 'blooms.cc', 'railway.app']
    if (reservedDomains.some(reserved => domain.includes(reserved))) {
      return { valid: false, error: 'Domain is reserved' }
    }

    return { valid: true }
  } catch (error: unknown) {
    const handled = handleError(error)
    return { valid: false, error: handled.message }
  }
}

/**
 * Cleanup security resources
 */
export function cleanupSecurity(): void {
  if (rateLimitStore) {
    rateLimitStore.destroy()
    rateLimitStore = null
  }
  securityConfig = null
}