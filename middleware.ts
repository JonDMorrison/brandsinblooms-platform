import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { 
  resolveSiteFromHost, 
  extractHostname as extractHostnameFromResolution,
  isValidSubdomain,
  isValidCustomDomain
} from '@/src/lib/site/resolution'
import { getSiteFromCache, setSiteCache } from '@/src/lib/cache/site-cache'
// Import Redis cache functions dynamically to avoid bundling Node.js built-ins
// import { getSiteFromRedisCache, setSiteInRedisCache } from '@/src/lib/cache/redis-site-cache.server'
import { logDomainResolution } from '@/src/lib/site/middleware-utils'
import { applyMultiDomainSecurity } from '@/src/lib/security/multi-domain-security'
import { trackDomainResolution, trackPerformance } from '@/src/lib/monitoring/site-analytics'

// Environment configuration
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
const USE_REDIS_CACHE = process.env.REDIS_URL && process.env.NODE_ENV === 'production'
const ENABLE_ANALYTICS = process.env.ANALYTICS_ENABLED !== 'false'
const ENABLE_SECURITY = process.env.SECURITY_ENABLED !== 'false'

// Impersonation configuration
const IMPERSONATION_HEADER = 'x-admin-impersonation-token'
const IMPERSONATION_COOKIE = 'admin_impersonation_token'
const IMPERSONATION_QUERY_PARAM = 'admin_impersonation'

// Define public routes that don't require authentication (for main app domain)
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/verify-email',
  '/auth/reset-password',
  '/platform/terms',
  '/platform/privacy',
  '/platform/contact',
]

// Define routes that should redirect to dashboard if authenticated (for main app domain)
const authRoutes = ['/login', '/signup']

/**
 * Extracts hostname from request, properly handling proxy headers from Cloudflare/Railway
 */
function extractHostname(request: NextRequest): string {
  // Check for original hostname from proxy headers (Cloudflare/Railway)
  const forwardedHost = request.headers.get('x-forwarded-host') || 
                       request.headers.get('x-original-host') ||
                       request.headers.get('host')
  
  if (forwardedHost) {
    // Remove port if present and return clean hostname
    return forwardedHost.split(':')[0]
  }
  
  // Fallback to request URL hostname
  const url = new URL(request.url)
  return url.hostname
}

/**
 * Creates a clean URL for redirects in production (removes ports)
 */
function createRedirectUrl(request: NextRequest, targetHostname: string, pathname: string): URL {
  const url = request.nextUrl.clone()
  url.hostname = targetHostname
  url.pathname = pathname
  
  // In production, always clear the port to avoid :8080 redirects
  if (process.env.NODE_ENV === 'production') {
    url.port = ''
  }
  
  return url
}

/**
 * Next.js middleware that handles both domain-based site resolution and authentication
 */
export async function middleware(request: NextRequest) {
  const start = Date.now()
  
  try {
    // Extract basic info
    const hostname = extractHostname(request)
    const pathname = request.nextUrl.pathname
    
    // Admin routes bypass ALL checks (authentication and domain resolution)
    if (pathname.startsWith('/admin')) {
      return handleAdminRoute(request)
    }
    
    // Skip middleware for certain paths
    if (shouldSkipMiddleware(pathname)) {
      return NextResponse.next()
    }

    // Initialize Supabase client for middleware
    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Add performance headers
    supabaseResponse.headers.set('X-DNS-Prefetch-Control', 'on')
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Add cache headers for static assets
    if (pathname.startsWith('/_next/static/') || pathname.startsWith('/fonts/') || pathname.startsWith('/images/')) {
      supabaseResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    }

    // Get user for authentication checks
    const { data: { user } } = await supabase.auth.getUser()

    // Handle development environment
    if (isDevelopmentEnvironment(hostname)) {
      const devResponse = handleDevelopmentRequest(request, supabaseResponse, hostname, user)
      // If handleDevelopmentRequest returns null, continue to site domain handling
      if (devResponse === null) {
        // Continue to site domain resolution below
      } else {
        return devResponse
      }
    }

    // Check if this is the main app domain - if so, handle authentication
    if (isMainAppDomain(hostname)) {
      return handleMainAppAuthentication(request, supabaseResponse, user, pathname)
    }

    // Check for admin impersonation token before normal site resolution
    const impersonationToken = detectImpersonationToken(request)
    if (impersonationToken) {
      const impersonationContext = await validateImpersonationToken(supabase, impersonationToken)
      if (impersonationContext) {
        // Handle impersonated site access
        return await handleImpersonatedSiteAccess(
          request, 
          supabase, 
          supabaseResponse, 
          impersonationContext, 
          start
        )
      } else {
        // Invalid impersonation token - clear it and continue with normal flow
        console.warn('Invalid impersonation token detected, clearing and continuing with normal flow')
        const response = NextResponse.next({ request })
        response.cookies.delete(IMPERSONATION_COOKIE)
        // Continue with normal site resolution below
      }
    }

    // This is a site domain - resolve site and handle site-specific logic
    return await handleSiteDomain(request, supabase, supabaseResponse, hostname, start)

  } catch (error) {
    console.error('Middleware error:', error)
    logDomainResolution(extractHostname(request), null, 'MIDDLEWARE_ERROR', Date.now() - start)
    
    // In case of error, let the request through but without site context
    return NextResponse.next()
  }
}

/**
 * Handles admin routes that bypass all middleware checks
 */
async function handleAdminRoute(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next()
  
  // Set admin context headers for downstream components
  response.headers.set('x-admin-route', 'true')
  response.headers.set('x-bypass-site-resolution', 'true')
  response.headers.set('x-bypass-auth-redirect', 'true')
  
  // Log admin route access
  const pathname = request.nextUrl.pathname
  console.log(`Admin route accessed: ${pathname} from ${extractHostname(request)}`)
  
  return response
}

/**
 * Determines if middleware should be skipped for certain paths
 */
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/_next',           // Next.js internal paths
    '/api/auth',        // Auth API routes
    '/api/images',      // Image serving API
    '/api/upload',      // File upload API
    '/favicon.ico',     // Favicon
    '/robots.txt',      // SEO files
    '/sitemap.xml',     // SEO files
    '/.well-known',     // Well-known URIs
    '/health',          // Health check endpoints
    '/monitoring',      // Monitoring endpoints
  ]
  
  return skipPaths.some(path => pathname.startsWith(path))
}

/**
 * Checks if we're in a development environment
 */
function isDevelopmentEnvironment(hostname: string): boolean {
  return (
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('.local') ||
    process.env.NODE_ENV === 'development'
  )
}

/**
 * Checks if hostname is the main app domain
 */
function isMainAppDomain(hostname: string): boolean {
  return hostname === APP_DOMAIN || hostname.endsWith('.vercel.app') || hostname.endsWith('.railway.app')
}

/**
 * Handles main app domain authentication
 */
interface User {
  id: string
  [key: string]: unknown
}

function handleMainAppAuthentication(
  request: NextRequest, 
  response: NextResponse, 
  user: User | null, 
  pathname: string
): NextResponse {
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith('/test-supabase')
  )
  
  const isAuthRoute = authRoutes.includes(pathname)

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = createRedirectUrl(request, request.nextUrl.hostname, '/dashboard')
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = createRedirectUrl(request, request.nextUrl.hostname, '/login')
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

/**
 * Handles development environment requests
 * Returns null if the request should be handled as a site domain
 */
function handleDevelopmentRequest(
  request: NextRequest, 
  response: NextResponse, 
  hostname: string,
  user: User | null
): NextResponse | null {
  const url = request.nextUrl.clone()
  const pathname = url.pathname
  
  // For subdomain.localhost, treat it as a site domain (not main app)
  if (hostname.includes('.localhost')) {
    const subdomain = hostname.split('.')[0]
    if (subdomain && subdomain !== 'localhost') {
      // Don't handle this as main app - let it fall through to site domain handling
      // This will trigger the site resolution logic
      response.cookies.set('x-dev-subdomain', subdomain, {
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
      })
      response.headers.set('x-dev-subdomain', subdomain)
      
      // Return null to indicate this should be handled as a site domain
      return null
    }
  }
  
  // Handle main app authentication in development (only for localhost without subdomain)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost:')) {
    return handleMainAppAuthentication(request, response, user, pathname)
  }
  
  logDomainResolution(hostname, 'dev', 'DEVELOPMENT', 0)
  
  return response
}

/**
 * Detects impersonation token from request
 */
function detectImpersonationToken(request: NextRequest): string | null {
  // Check query parameter first (for initial setup)
  const queryToken = request.nextUrl.searchParams.get(IMPERSONATION_QUERY_PARAM)
  if (queryToken) return queryToken

  // Check header (for API requests)
  const headerToken = request.headers.get(IMPERSONATION_HEADER)
  if (headerToken) return headerToken

  // Check cookie (for browser sessions)
  const cookieToken = request.cookies.get(IMPERSONATION_COOKIE)?.value
  if (cookieToken) return cookieToken

  return null
}

/**
 * Validates impersonation token and returns session context
 */
interface SupabaseClient {
  rpc: (fnName: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  auth: {
    getUser: () => Promise<{ data: { user: User | null }; error: unknown }>
  }
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => {
        single: () => Promise<{ data: unknown; error: unknown }>
      }
    }
  }
}

interface ImpersonationContext {
  valid: boolean
  session_id: string
  admin_user_id: string
  admin_email: string
  site_id: string
  site_name: string
  site_subdomain: string
  site_custom_domain?: string
  [key: string]: unknown
}

async function validateImpersonationToken(
  supabase: SupabaseClient, 
  token: string
): Promise<ImpersonationContext | null> {
  try {
    const { data, error } = await supabase.rpc('get_impersonation_context', { token })
    
    if (error) {
      console.error('Error validating impersonation token:', error)
      return null
    }

    if (!data || !data.valid) {
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error validating impersonation token:', err)
    return null
  }
}

/**
 * Handles impersonated site access
 */
async function handleImpersonatedSiteAccess(
  request: NextRequest,
  supabase: SupabaseClient,
  supabaseResponse: NextResponse,
  impersonationContext: ImpersonationContext,
  start: number
): Promise<NextResponse> {
  const siteId = impersonationContext.site_id
  
  // Get the site data from the impersonation context
  const site = {
    id: siteId,
    name: impersonationContext.site_name,
    subdomain: impersonationContext.site_subdomain,
    custom_domain: impersonationContext.site_custom_domain,
    is_published: true, // Assume published for admin access
    is_active: true
  }

  // Create response with impersonation context
  const response = NextResponse.next({ request })

  // Set impersonation headers for downstream use
  response.headers.set('x-admin-impersonation', 'true')
  response.headers.set('x-impersonation-session-id', impersonationContext.session_id)
  response.headers.set('x-impersonation-admin-id', impersonationContext.admin_user_id)
  response.headers.set('x-impersonation-admin-email', impersonationContext.admin_email)
  
  // Set site context in cookies and headers
  response.cookies.set('x-site-id', site.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  })
  
  response.cookies.set('x-site-subdomain', site.subdomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  })

  // Set impersonation cookie if it came from query param
  const queryToken = request.nextUrl.searchParams.get(IMPERSONATION_QUERY_PARAM)
  if (queryToken) {
    response.cookies.set(IMPERSONATION_COOKIE, queryToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    })
  }
  
  if (site.custom_domain) {
    response.cookies.set('x-site-custom-domain', site.custom_domain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    })
  }

  // Set headers for server components
  response.headers.set('x-site-id', site.id)
  response.headers.set('x-site-subdomain', site.subdomain)
  response.headers.set('x-site-name', site.name)
  response.headers.set('x-hostname', extractHostname(request))
  
  if (site.custom_domain) {
    response.headers.set('x-site-custom-domain', site.custom_domain)
  }

  // Add performance headers
  const totalLatency = Date.now() - start
  response.headers.set('X-Response-Time', `${totalLatency}ms`)
  response.headers.set('X-Cache-Status', 'impersonation')
  response.headers.set('X-Impersonation-Mode', 'active')
  
  // Log impersonation access
  logDomainResolution(
    extractHostname(request), 
    site.id, 
    'IMPERSONATION_ACCESS', 
    totalLatency
  )

  // Track impersonation analytics if enabled
  if (ENABLE_ANALYTICS) {
    await trackDomainResolution(
      extractHostname(request), 
      site.id, 
      'IMPERSONATION_ACCESS', 
      totalLatency
    )
  }
  
  return response
}

/**
 * Handles site domain resolution and validation
 */
interface Site {
  id: string
  name: string
  subdomain: string
  custom_domain?: string
  is_published: boolean
  is_active: boolean
  [key: string]: unknown
}

interface SiteResolution {
  isValid: boolean
  type: 'subdomain' | 'custom_domain'
  value: string
}

async function handleSiteDomain(
  request: NextRequest,
  supabase: SupabaseClient,
  supabaseResponse: NextResponse,
  hostname: string,
  start: number
): Promise<NextResponse> {
  // Resolve site from hostname
  const siteResolution = resolveSiteFromHost(hostname)
  
  if (!siteResolution.isValid) {
    logDomainResolution(hostname, null, 'INVALID_HOSTNAME', Date.now() - start)
    return handleInvalidDomain(request, hostname)
  }

  // Try to get site from cache first (Redis in production, memory in development)
  let site = null
  let cacheStatus: 'hit' | 'miss' = 'miss'
  
  // TODO: Fix Redis cache import issue with Node.js built-ins in webpack bundle
  // Temporarily using memory cache only until Redis issue is resolved
  if (false && USE_REDIS_CACHE) {
    try {
      // Dynamic import to avoid bundling Redis client with Node.js built-ins
      const { getSiteFromRedisCache } = await import('@/src/lib/cache/redis-site-cache.server')
      site = await getSiteFromRedisCache(siteResolution.value, siteResolution.type)
    } catch (importError) {
      console.warn('[Middleware] Redis cache import failed, falling back to memory cache:', importError)
      site = await getSiteFromCache(siteResolution.value, siteResolution.type)
    }
  } else {
    site = await getSiteFromCache(siteResolution.value, siteResolution.type)
  }
  
  if (site) {
    cacheStatus = 'hit'
  } else {
    // Cache miss - query database
    try {
      const dbStart = Date.now()
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq(siteResolution.type, siteResolution.value)
        .eq('is_active', true)
        .single()

      const dbLatency = Date.now() - dbStart

      if (error || !data) {
        if (ENABLE_ANALYTICS) {
          await trackDomainResolution(hostname, null, 'SITE_NOT_FOUND', Date.now() - start)
        }
        logDomainResolution(hostname, null, 'SITE_NOT_FOUND', Date.now() - start)
        return handleSiteNotFound(request, hostname, siteResolution)
      }

      site = data
      
      // Cache the site for future requests
      // TODO: Fix Redis cache import issue with Node.js built-ins in webpack bundle
      // Temporarily using memory cache only until Redis issue is resolved
      if (false && USE_REDIS_CACHE) {
        try {
          // Dynamic import to avoid bundling Redis client with Node.js built-ins
          const { setSiteInRedisCache } = await import('@/src/lib/cache/redis-site-cache.server')
          await setSiteInRedisCache(siteResolution.value, siteResolution.type, site)
        } catch (importError) {
          console.warn('[Middleware] Redis cache import failed, falling back to memory cache:', importError)
          await setSiteCache(siteResolution.value, siteResolution.type, site)
        }
      } else {
        await setSiteCache(siteResolution.value, siteResolution.type, site)
      }

      // Track database performance
      if (ENABLE_ANALYTICS) {
        await trackPerformance(site.id, 'ttfb', dbLatency, 'ms')
      }
    } catch (dbError) {
      console.error('Database error during site resolution:', dbError)
      if (ENABLE_ANALYTICS) {
        await trackDomainResolution(hostname, null, 'DATABASE_ERROR', Date.now() - start)
      }
      logDomainResolution(hostname, null, 'DATABASE_ERROR', Date.now() - start)
      return handleDatabaseError(request, hostname)
    }
  }

  // Check if site is published (for non-authenticated users)
  if (!site.is_published) {
    // Check if user is authenticated and has access to this site
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      logDomainResolution(hostname, site.id, 'SITE_UNPUBLISHED', Date.now() - start)
      return handleUnpublishedSite(request, site)
    }

    // Check user access to unpublished site
    const { data: membership } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('site_id', site.id)
      .eq('is_active', true)
      .single()

    if (!membership) {
      logDomainResolution(hostname, site.id, 'ACCESS_DENIED', Date.now() - start)
      return handleUnpublishedSite(request, site)
    }
  }

  // Apply multi-domain security if enabled
  if (ENABLE_SECURITY) {
    const securityResult = await applyMultiDomainSecurity(request, site)
    if (!securityResult.success) {
      if (ENABLE_ANALYTICS) {
        await trackDomainResolution(hostname, site.id, 'SECURITY_VIOLATION', Date.now() - start)
      }
      return securityResult.response!
    }
    // Use the security-enhanced response
    var response = securityResult.response!
  } else {
    // Create standard response
    var response = NextResponse.next({ request })
  }
  
  // Set site context in cookies and headers for downstream use
  response.cookies.set('x-site-id', site.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  })
  
  response.cookies.set('x-site-subdomain', site.subdomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  })
  
  if (site.custom_domain) {
    response.cookies.set('x-site-custom-domain', site.custom_domain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    })
  }

  // Set headers for server components
  response.headers.set('x-site-id', site.id)
  response.headers.set('x-site-subdomain', site.subdomain)
  response.headers.set('x-site-name', site.name)
  response.headers.set('x-hostname', hostname)
  
  if (site.custom_domain) {
    response.headers.set('x-site-custom-domain', site.custom_domain)
  }

  // Add performance and cache headers
  const totalLatency = Date.now() - start
  response.headers.set('X-Response-Time', `${totalLatency}ms`)
  response.headers.set('X-Cache-Status', cacheStatus)
  response.headers.set('X-Cache-Provider', USE_REDIS_CACHE ? 'redis' : 'memory')
  
  // Track successful resolution
  if (ENABLE_ANALYTICS) {
    await trackDomainResolution(hostname, site.id, cacheStatus === 'hit' ? 'CACHED' : 'SUCCESS', totalLatency)
    await trackPerformance(site.id, 'ttfb', totalLatency, 'ms')
  }

  logDomainResolution(hostname, site.id, 'SUCCESS', totalLatency)
  
  return response
}

/**
 * Handles invalid domain requests
 */
function handleInvalidDomain(request: NextRequest, hostname: string): NextResponse {
  const url = createRedirectUrl(request, APP_DOMAIN, '/domain-error')
  url.searchParams.set('error', 'invalid_domain')
  url.searchParams.set('hostname', hostname)
  
  return NextResponse.redirect(url)
}

/**
 * Handles site not found scenarios
 */
function handleSiteNotFound(
  request: NextRequest, 
  hostname: string, 
  siteResolution: SiteResolution
): NextResponse {
  // For subdomain not found, offer to create site
  if (siteResolution.type === 'subdomain' && isValidSubdomain(siteResolution.value)) {
    const url = createRedirectUrl(request, APP_DOMAIN, '/create-site')
    url.searchParams.set('subdomain', siteResolution.value)
    return NextResponse.redirect(url)
  }
  
  // For custom domain not found, show setup instructions
  if (siteResolution.type === 'custom_domain' && isValidCustomDomain(siteResolution.value)) {
    const url = createRedirectUrl(request, APP_DOMAIN, '/domain-setup')
    url.searchParams.set('domain', siteResolution.value)
    return NextResponse.redirect(url)
  }
  
  // General site not found
  const url = createRedirectUrl(request, APP_DOMAIN, '/site-not-found')
  url.searchParams.set('hostname', hostname)
  
  return NextResponse.redirect(url)
}

/**
 * Handles unpublished site access
 */
function handleUnpublishedSite(request: NextRequest, site: Site): NextResponse {
  const url = createRedirectUrl(request, APP_DOMAIN, '/site-maintenance')
  
  return NextResponse.redirect(url)
}

/**
 * Handles database errors
 */
function handleDatabaseError(request: NextRequest, hostname: string): NextResponse {
  const url = createRedirectUrl(request, APP_DOMAIN, '/system-error')
  url.searchParams.set('hostname', hostname)
  
  return NextResponse.redirect(url)
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - robots.txt (SEO file)
     * - icon-*.png (PWA icons)
     * - apple-icon*.png (Apple icons)
     * - screenshot-*.png (PWA screenshots)
     * - *.worker.js (Service workers)
     * - health, monitoring (system endpoints)
     */
    '/((?!_next/static|_next/image|favicon\.ico|manifest\.json|robots\.txt|icon-.*\.png|apple-icon.*\.png|screenshot-.*\.png|.*\.worker\.js|health|monitoring).*)',
  ],
}