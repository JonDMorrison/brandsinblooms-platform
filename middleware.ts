import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  resolveSiteFromHost,
  extractHostname as extractHostnameFromResolution,
  isValidSubdomain,
  isValidCustomDomain
} from '@/lib/site/resolution'
import { getSiteFromCache, setSiteCache } from '@/lib/cache/site-cache'
// Import Redis cache functions dynamically to avoid bundling Node.js built-ins
// import { getSiteFromRedisCache, setSiteInRedisCache } from '@/lib/cache/redis-site-cache.server'
import { logDomainResolution } from '@/lib/site/middleware-utils'
import { applyMultiDomainSecurity } from '@/lib/security/multi-domain-security'
import { trackDomainResolution, trackPerformance } from '@/lib/monitoring/site-analytics'
import { debug } from '@/src/lib/utils/debug'
import {
  isEditModeEnabled,
  getEditSession,
  setEditModeHeaders,
  clearEditModeCookies,
  validateEditSessionForSite
} from '@/src/lib/site-editor/middleware-helpers'
import { getSharedCookieDomain } from '@/lib/cookies/domain-config'
import { autoEnableEditModeInMiddleware } from '@/src/lib/site-editor/middleware-auto-enable'
import { getAppDomain } from '@/lib/env/app-domain'

// Environment configuration
const APP_DOMAIN = getAppDomain()
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
 * Prioritizes x-blooms-custom-domain header for custom domain proxy routing
 */
function extractHostname(request: NextRequest): string {
  // PRIORITY 1: Check for custom domain header from Cloudflare Worker proxy
  // This is set when requests come through the custom-domain-proxy
  const customDomain = request.headers.get('x-blooms-custom-domain')
  if (customDomain) {
    // Remove port if present and return clean hostname
    return customDomain.split(':')[0]
  }

  // PRIORITY 2: Check for original hostname from proxy headers (Cloudflare/Railway)
  const forwardedHost = request.headers.get('x-forwarded-host') ||
                       request.headers.get('x-original-host') ||
                       request.headers.get('host')

  if (forwardedHost) {
    // Remove port if present and return clean hostname
    return forwardedHost.split(':')[0]
  }

  // PRIORITY 3: Fallback to request URL hostname
  const url = new URL(request.url)
  return url.hostname
}

/**
 * Creates a clean URL for redirects in production (removes ports)
 */
function createRedirectUrl(request: NextRequest, targetHostname: string, pathname: string): URL {
  // Create a new URL from scratch to avoid cloning issues that can cause 0.0.0.0 redirects
  const protocol = request.nextUrl.protocol
  const url = new URL(`${protocol}//${targetHostname}${pathname}`)
  
  // Preserve query params from original request if needed
  const originalParams = request.nextUrl.searchParams
  originalParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  
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
    
    // Hard-exempt dev tools and their APIs before any other logic
    if (pathname.startsWith('/dev') || pathname.startsWith('/api/dev')) {
      debug.middleware(`Early skip for dev path: ${pathname}`)
      return NextResponse.next()
    }
    
    // Debug logging for environment variables and request details
    debug.middleware('Request details:', {
      hostname,
      pathname,
      requestUrl: request.url,
      nextUrl: request.nextUrl.toString(),
      APP_DOMAIN,
      NODE_ENV: process.env.NODE_ENV,
      headers: {
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-original-host': request.headers.get('x-original-host'),
        'host': request.headers.get('host')
      }
    })
    
    // Admin routes bypass ALL checks (authentication and domain resolution)
    if (pathname.startsWith('/admin')) {
      return handleAdminRoute(request)
    }

    // Skip middleware for certain paths (must come BEFORE all other checks)
    if (shouldSkipMiddleware(pathname)) {
      debug.middleware(`Skipping middleware for path: ${pathname}`)
      return NextResponse.next()
    }

    // Initialize Supabase client for middleware
    let supabaseResponse = NextResponse.next({ request })
    const cookieDomain = getSharedCookieDomain()

    console.log('🍪 [MIDDLEWARE] Initializing Supabase client with cookie domain:', cookieDomain)

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
            cookiesToSet.forEach(({ name, value, options }) => {
              // Override cookie domain to enable sharing across main app and customer subdomains
              const cookieOptions = {
                ...options,
                domain: cookieDomain,
              }
              console.log('🍪 [MIDDLEWARE] Setting cookie:', {
                name,
                domain: cookieOptions.domain,
                path: cookieOptions.path || '/',
                sameSite: cookieOptions.sameSite
              })
              supabaseResponse.cookies.set(name, value, cookieOptions)
            })
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

    // Get user for authentication checks (cache for reuse in this request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Store cached user data for reuse throughout this request to avoid multiple getUser() calls
    const cachedUser = user
    const cachedUserError = userError

    // Validate user session if authenticated
    if (user) {
      try {
        // Use RPC function to bypass RLS and check user status
        const { data: statusData, error: statusError } = await supabase.rpc(
          'check_user_active_status',
          { target_user_id: user.id }
        )

        // Get first result from array
        const profile = Array.isArray(statusData) ? statusData[0] : statusData

        // If user is deactivated, clear their session and redirect to login
        if (statusError || !profile || profile.is_active === false) {
          console.warn('🚫 [MIDDLEWARE] Deactivated user detected, clearing session:', {
            userId: user.id,
            email: user.email,
            statusError: statusError?.message,
            isActive: profile?.is_active
          })

          // Sign out the user
          await supabase.auth.signOut()

          // Clear auth cookies manually
          supabaseResponse.cookies.delete('sb-access-token')
          supabaseResponse.cookies.delete('sb-refresh-token')

          // Redirect to login with message
          const loginUrl = createRedirectUrl(request, APP_DOMAIN, '/login')
          loginUrl.searchParams.set('message', 'account_deactivated')
          loginUrl.searchParams.set('reason', 'Your account has been deactivated')
          return NextResponse.redirect(loginUrl)
        }
      } catch (error) {
        console.error('🚫 [MIDDLEWARE] Error checking user status:', error)
        // Continue without blocking if validation fails - will be caught at next check
      }
    }

    // ALWAYS LOG authentication status (console.log always shows)
    const allCookies = request.cookies.getAll()
    const authCookies = allCookies.filter(c => c.name.startsWith('sb-'))

    console.log('🔐 [MIDDLEWARE AUTH CHECK]', {
      hostname,
      pathname,
      hasUser: !!user,
      userId: user?.id || 'none',
      userEmail: user?.email || 'none',
      cookieCount: allCookies.length,
      authCookies: authCookies.map(c => c.name),
      allCookieNames: allCookies.map(c => c.name)
    })

    // Log what domain getSharedCookieDomain() returns
    const expectedDomain = getSharedCookieDomain()
    console.log('🍪 [COOKIE DOMAIN] Expected shared domain:', expectedDomain)

    // Log authentication status (debug mode)
    if (user) {
      debug.middleware(`✅ User authenticated: ${user.id} (${user.email})`)
      const authCookies = request.cookies.getAll().filter(c => c.name.startsWith('sb-'))
      debug.middleware(`Auth cookies present: ${authCookies.map(c => `${c.name} (domain: ${c.value ? 'set' : 'unset'})`).join(', ')}`)
    } else {
      debug.middleware(`❌ No authenticated user`)
      const allCookies = request.cookies.getAll()
      debug.middleware(`Total cookies: ${allCookies.length}`)
    }

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
    console.log('🚀 [MIDDLEWARE] Calling handleSiteDomain for:', hostname)
    return await handleSiteDomain(request, supabase, supabaseResponse, hostname, start, cachedUser, cachedUserError)

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
  debug.middleware(`Admin route accessed: ${pathname} from ${extractHostname(request)}`)

  return response
}

/**
 * Determines if middleware should be skipped for certain paths
 */
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/_next',           // Next.js internal paths
    '/api',             // All API routes handle their own authentication
    '/dev',             // Development tools (handle their own authentication)
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
  // Extract domain without port from APP_DOMAIN
  const appDomainWithoutPort = APP_DOMAIN.split(':')[0]

  console.log('🔍 [isMainAppDomain] Checking:', {
    hostname,
    APP_DOMAIN,
    appDomainWithoutPort,
    isMatch: hostname === APP_DOMAIN || hostname === appDomainWithoutPort
  })

  return (
    hostname === APP_DOMAIN ||
    hostname === appDomainWithoutPort ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.railway.app')
  )
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
    const url = createRedirectUrl(request, APP_DOMAIN, '/dashboard')
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = createRedirectUrl(request, APP_DOMAIN, '/login')
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
  
  // For subdomain.localhost or subdomain.local, treat it as a site domain (not main app)
  if (hostname.includes('.localhost') || hostname.includes('.local')) {
    const subdomain = hostname.split('.')[0]
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'blooms') {
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
  // For plain localhost (main platform domain), don't require authentication for public routes
  if (hostname === 'localhost' || hostname === '127.0.0.1' || (hostname.includes('localhost:') && !hostname.includes('.'))) {
    // This is the main platform domain, not a site domain
    // Allow access to public routes without authentication
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
  start: number,
  cachedUser: User | null,
  cachedUserError: unknown
): Promise<NextResponse> {
  console.log('📍 [handleSiteDomain] ENTERED - hostname:', hostname)

  // Resolve site from hostname
  console.log('🔍 [SITE RESOLUTION]', { hostname })
  debug.middleware(`🔍 Resolving site for hostname: ${hostname}`)
  const siteResolution = resolveSiteFromHost(hostname)

  if (!siteResolution.isValid) {
    console.log('❌ [SITE RESOLUTION] Invalid hostname:', hostname)
    debug.middleware(`❌ Invalid hostname: ${hostname}`)
    logDomainResolution(hostname, null, 'INVALID_HOSTNAME', Date.now() - start)
    return handleInvalidDomain(request, hostname)
  }

  console.log('✅ [SITE RESOLUTION] Valid:', { type: siteResolution.type, value: siteResolution.value })
  debug.middleware(`✅ Site resolution valid: type=${siteResolution.type}, value=${siteResolution.value}`)

  // Try to get site from cache first (Redis in production, memory in development)
  let site = null
  let cacheStatus: 'hit' | 'miss' = 'miss'
  
  // TODO: Fix Redis cache import issue with Node.js built-ins in webpack bundle
  // Temporarily using memory cache only until Redis issue is resolved
  if (false && USE_REDIS_CACHE) {
    try {
      // Dynamic import to avoid bundling Redis client with Node.js built-ins
      const { getSiteFromRedisCache } = await import('@/lib/cache/redis-site-cache.server')
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
          const { setSiteInRedisCache } = await import('@/lib/cache/redis-site-cache.server')
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

  // Log successful site resolution
  console.log('🎯 [SITE FOUND]', {
    siteName: site.name,
    siteId: site.id,
    subdomain: site.subdomain,
    isPublished: site.is_published
  })
  debug.middleware(`🎯 Site found: ${site.name} (${site.id}) - subdomain: ${site.subdomain}, published: ${site.is_published}`)

  // Check if site is published (for non-authenticated users)
  if (!site.is_published) {
    debug.middleware(`⚠️ Site is unpublished, checking user access...`)
    // Reuse cached user data from earlier in middleware
    const user = cachedUser

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

  console.log('✅ [handleSiteDomain] Passed unpublished check, continuing...')

  // Apply multi-domain security if enabled
  if (ENABLE_SECURITY) {
    console.log('🔒 [handleSiteDomain] Applying security checks...')
    const securityResult = await applyMultiDomainSecurity(request, site)
    if (!securityResult.success) {
      console.log('❌ [handleSiteDomain] Security check failed, returning early')
      if (ENABLE_ANALYTICS) {
        await trackDomainResolution(hostname, site.id, 'SECURITY_VIOLATION', Date.now() - start)
      }
      return securityResult.response!
    }
    // Use the security-enhanced response
    console.log('✅ [handleSiteDomain] Security passed, using enhanced response')
    var response = securityResult.response!
  } else {
    // Create standard response
    console.log('ℹ️ [handleSiteDomain] Security disabled, creating standard response')
    var response = NextResponse.next({ request })
  }

  console.log('🎬 [handleSiteDomain] About to start auto-enable section...')

  // AUTO-ENABLE EDIT MODE for authenticated users with permissions
  // This enables seamless cross-domain authentication from dashboard to customer sites
  console.log('🔧 [AUTO-ENABLE] Starting auto-enable check...')
  const editModeActive = isEditModeEnabled(request)
  console.log('🔧 [AUTO-ENABLE] Edit mode currently active?', editModeActive)

  if (!editModeActive) {
    // Reuse cached user data from earlier in middleware
    const currentUser = cachedUser
    console.log('🔧 [AUTO-ENABLE] User check:', {
      hasUser: !!currentUser,
      userId: currentUser?.id || 'none',
      siteId: site.id
    })

    if (currentUser) {
      // User is authenticated but edit mode not active - try to auto-enable
      console.log('🔧 [AUTO-ENABLE] Attempting to enable edit mode...')
      debug.middleware(`[Auto Edit Mode] User ${currentUser.id} authenticated, attempting auto-enable for site ${site.id}`)
      const enabled = await autoEnableEditModeInMiddleware(request, response, supabase, currentUser.id, site.id)
      console.log('🔧 [AUTO-ENABLE] Result:', enabled ? '✅ SUCCESS' : '❌ FAILED')
    } else {
      console.log('🔧 [AUTO-ENABLE] ❌ No authenticated user, skipping')
      debug.middleware(`[Auto Edit Mode] No authenticated user, skipping auto-enable`)
    }
  } else {
    console.log('🔧 [AUTO-ENABLE] ℹ️ Already active, skipping')
    debug.middleware(`[Auto Edit Mode] Edit mode already active, skipping auto-enable`)
  }

  // Check for edit mode session (may have just been set by auto-enable above)
  const editModeNowActive = isEditModeEnabled(request) || response.cookies.get('x-site-edit-mode')?.value === 'true'
  if (editModeNowActive) {
    const editValidation = validateEditSessionForSite(request, site.id)

    if (editValidation.valid && editValidation.session) {
      // Set edit mode headers for downstream components
      setEditModeHeaders(response, editValidation.session)
      debug.middleware(`Edit mode active for site ${site.id} by user ${editValidation.session.userId}`)
    } else {
      // Check if we just set it in the response (not yet in request)
      const newEditSession = response.cookies.get('x-site-edit-session')?.value
      if (newEditSession) {
        try {
          const session = JSON.parse(newEditSession)
          setEditModeHeaders(response, session)
          debug.middleware(`[Auto Edit Mode] Edit mode headers set from newly created session`)
        } catch (error) {
          debug.middleware(`Error parsing new edit session: ${error}`)
          clearEditModeCookies(response)
        }
      } else {
        // Invalid or expired edit session - clear cookies
        clearEditModeCookies(response)
        debug.middleware('Edit mode session invalid or expired, clearing cookies')
      }
    }
  }

  // Set site context in cookies and headers for downstream use
  const siteContextCookieDomain = getSharedCookieDomain()

  response.cookies.set('x-site-id', site.id, {
    domain: siteContextCookieDomain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  })

  response.cookies.set('x-site-subdomain', site.subdomain, {
    domain: siteContextCookieDomain,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  })

  if (site.custom_domain) {
    response.cookies.set('x-site-custom-domain', site.custom_domain, {
      domain: siteContextCookieDomain,
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
  // Check if this request came through the custom domain proxy
  const isProxiedCustomDomain = request.headers.get('x-blooms-custom-domain') !== null

  // For custom domains that came through the proxy, we CANNOT redirect
  // because that would break the custom domain experience.
  // Instead, return a 404 response directly.
  if (isProxiedCustomDomain && siteResolution.type === 'custom_domain') {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Not Configured - ${hostname}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%);
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 48px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 24px;
      color: #065f46;
      margin: 0 0 16px 0;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .domain {
      background: #d1fae5;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      color: #065f46;
      margin: 24px 0;
      border: 1px solid #6ee7b7;
    }
    .steps {
      text-align: left;
      margin: 24px 0;
    }
    .steps ol {
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
      color: #4a5568;
    }
    .footer {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #d1fae5;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌐 No Site Configured</h1>
    <p>This domain is pointing to Brands in Blooms, but no site has been configured for it yet.</p>

    <div class="domain">${hostname}</div>

    <div class="steps">
      <p><strong>To set up this domain:</strong></p>
      <ol>
        <li>Log into your Brands in Blooms dashboard</li>
        <li>Go to your site settings</li>
        <li>Add this domain as your custom domain</li>
        <li>Wait a few minutes for changes to take effect</li>
      </ol>
    </div>

    <div class="footer">
      If you're not the site owner, please contact them to set up this domain.
    </div>
  </div>
</body>
</html>`,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }

  // For subdomain not found (not through proxy), offer to create site
  if (siteResolution.type === 'subdomain' && isValidSubdomain(siteResolution.value)) {
    const url = createRedirectUrl(request, APP_DOMAIN, '/create-site')
    url.searchParams.set('subdomain', siteResolution.value)
    return NextResponse.redirect(url)
  }

  // For custom domain not found (not through proxy), show setup instructions
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
     * - api (API routes)
     * - dev (development tools)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - robots.txt (SEO file)
     * - icon-*.png (PWA icons)
     * - apple-icon*.png (Apple icons)
     * - screenshot-*.png (PWA screenshots)
     * - *.worker.js (Service workers)
     * - health, monitoring (system endpoints)
     */
    '/((?!_next/static|_next/image|api|dev|favicon\.ico|manifest\.json|robots\.txt|icon-.*\.png|apple-icon.*\.png|screenshot-.*\.png|.*\.worker\.js|health|monitoring).*)',
  ],
}
