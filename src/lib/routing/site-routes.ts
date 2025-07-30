import { Site } from '../database/types'

/**
 * Site-aware routing utilities
 */

export interface SiteRoute {
  path: string
  requiresAuth?: boolean
  requiresSiteAccess?: boolean
  requiresEdit?: boolean
  requiresManage?: boolean
}

/**
 * Core site routes that are available on all sites
 */
export const CORE_SITE_ROUTES: Record<string, SiteRoute> = {
  home: { path: '/' },
  about: { path: '/about' },
  contact: { path: '/contact' },
  privacy: { path: '/privacy' },
  terms: { path: '/terms' },
  
  // Authentication routes
  login: { path: '/login' },
  signup: { path: '/signup' },
  forgot: { path: '/forgot-password' },
  reset: { path: '/reset-password' },
  
  // Authenticated routes
  dashboard: { path: '/dashboard', requiresAuth: true },
  profile: { path: '/profile', requiresAuth: true },
  sites: { path: '/sites', requiresAuth: true },
  
  // Site-specific authenticated routes
  editor: { 
    path: '/editor', 
    requiresAuth: true, 
    requiresSiteAccess: true, 
    requiresEdit: true 
  },
  settings: { 
    path: '/settings', 
    requiresAuth: true, 
    requiresSiteAccess: true, 
    requiresManage: true 
  },
  analytics: { 
    path: '/analytics', 
    requiresAuth: true, 
    requiresSiteAccess: true, 
    requiresEdit: true 
  },
  members: { 
    path: '/members', 
    requiresAuth: true, 
    requiresSiteAccess: true, 
    requiresManage: true 
  },
}

/**
 * Generates a site-aware URL for a given route
 */
export function generateSiteUrl(
  routeKey: string,
  site?: Site | null,
  params?: Record<string, string>
): string {
  const route = CORE_SITE_ROUTES[routeKey]
  if (!route) {
    throw new Error(`Unknown route: ${routeKey}`)
  }

  let path = route.path

  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, encodeURIComponent(value))
    })
  }

  // If no site, return the path as-is (will use current hostname)
  if (!site) {
    return path
  }

  // If site has a custom domain, use it
  if (site.custom_domain) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'http:' : 'https:'
    return `${protocol}//${site.custom_domain}${path}`
  }

  // Use subdomain approach
  const baseDomain = getBaseDomain()
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'http:' : 'https:'
  return `${protocol}//${site.subdomain}.${baseDomain}${path}`
}

/**
 * Generates a relative URL for the current site
 */
export function generateRelativeSiteUrl(
  routeKey: string,
  params?: Record<string, string>
): string {
  const route = CORE_SITE_ROUTES[routeKey]
  if (!route) {
    throw new Error(`Unknown route: ${routeKey}`)
  }

  let path = route.path

  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, encodeURIComponent(value))
    })
  }

  return path
}

/**
 * Checks if a route requires authentication
 */
export function routeRequiresAuth(routeKey: string): boolean {
  const route = CORE_SITE_ROUTES[routeKey]
  return route?.requiresAuth || false
}

/**
 * Checks if a route requires site access
 */
export function routeRequiresSiteAccess(routeKey: string): boolean {
  const route = CORE_SITE_ROUTES[routeKey]
  return route?.requiresSiteAccess || false
}

/**
 * Checks if a route requires edit permissions
 */
export function routeRequiresEdit(routeKey: string): boolean {
  const route = CORE_SITE_ROUTES[routeKey]
  return route?.requiresEdit || false
}

/**
 * Checks if a route requires manage permissions
 */
export function routeRequiresManage(routeKey: string): boolean {
  const route = CORE_SITE_ROUTES[routeKey]
  return route?.requiresManage || false
}

/**
 * Gets the base domain for the application
 */
function getBaseDomain(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    // In development, use localhost
    if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
      return `localhost:${window.location.port || '3000'}`
    }
    
    // Extract base domain (remove subdomain)
    const parts = hostname.split('.')
    if (parts.length > 2) {
      return parts.slice(-2).join('.')
    }
    return hostname
  }
  
  // Server-side fallback
  return process.env.NEXT_PUBLIC_BASE_DOMAIN || 'blooms.cc'
}

/**
 * Cross-site navigation utilities
 */
export class SiteRouter {
  private currentSite: Site | null

  constructor(currentSite: Site | null = null) {
    this.currentSite = currentSite
  }

  /**
   * Navigate to a route within the current site
   */
  navigateToRoute(routeKey: string, params?: Record<string, string>): string {
    return generateRelativeSiteUrl(routeKey, params)
  }

  /**
   * Navigate to a different site
   */
  navigateToSite(targetSite: Site, routeKey: string = 'home', params?: Record<string, string>): string {
    return generateSiteUrl(routeKey, targetSite, params)
  }

  /**
   * Navigate to the main platform (no site context)
   */
  navigateToPlatform(routeKey: string = 'home', params?: Record<string, string>): string {
    const route = CORE_SITE_ROUTES[routeKey]
    if (!route) {
      throw new Error(`Unknown route: ${routeKey}`)
    }

    let path = route.path

    // Replace path parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, encodeURIComponent(value))
      })
    }

    // Navigate to main domain
    const baseDomain = getBaseDomain()
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'http:' : 'https:'
    return `${protocol}//${baseDomain}${path}`
  }

  /**
   * Check if current URL matches a site route
   */
  matchesRoute(routeKey: string): boolean {
    if (typeof window === 'undefined') return false
    
    const route = CORE_SITE_ROUTES[routeKey]
    if (!route) return false

    const currentPath = window.location.pathname
    return currentPath === route.path
  }

  /**
   * Get the current route key if it matches any known routes
   */
  getCurrentRouteKey(): string | null {
    if (typeof window === 'undefined') return null
    
    const currentPath = window.location.pathname
    
    for (const [key, route] of Object.entries(CORE_SITE_ROUTES)) {
      if (route.path === currentPath) {
        return key
      }
    }
    
    return null
  }
}

/**
 * React hook for site-aware routing
 */
export function useSiteRouter(currentSite: Site | null = null) {
  const router = new SiteRouter(currentSite)
  
  return {
    navigateToRoute: router.navigateToRoute.bind(router),
    navigateToSite: router.navigateToSite.bind(router),
    navigateToPlatform: router.navigateToPlatform.bind(router),
    matchesRoute: router.matchesRoute.bind(router),
    getCurrentRouteKey: router.getCurrentRouteKey.bind(router),
    generateUrl: (routeKey: string, params?: Record<string, string>) => 
      generateSiteUrl(routeKey, currentSite, params),
    generateRelativeUrl: (routeKey: string, params?: Record<string, string>) => 
      generateRelativeSiteUrl(routeKey, params),
  }
}

/**
 * Breadcrumb utilities for site-aware navigation
 */
export interface Breadcrumb {
  label: string
  href: string
  active?: boolean
}

export function generateBreadcrumbs(
  currentRoute: string,
  site?: Site | null,
  additionalCrumbs: Breadcrumb[] = []
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = []

  // Add site home
  if (site) {
    crumbs.push({
      label: site.name || 'Home',
      href: generateRelativeSiteUrl('home'),
    })
  } else {
    crumbs.push({
      label: 'Home',
      href: generateRelativeSiteUrl('home'),
    })
  }

  // Add route-specific breadcrumbs
  const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'Profile',
    sites: 'My Sites',
    editor: 'Editor',
    settings: 'Settings',
    analytics: 'Analytics',
    members: 'Members',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  }

  if (currentRoute !== 'home' && routeLabels[currentRoute]) {
    crumbs.push({
      label: routeLabels[currentRoute],
      href: generateRelativeSiteUrl(currentRoute),
    })
  }

  // Add additional breadcrumbs
  crumbs.push(...additionalCrumbs)

  // Mark the last item as active
  if (crumbs.length > 0) {
    crumbs[crumbs.length - 1].active = true
  }

  return crumbs
}

export default {
  generateSiteUrl,
  generateRelativeSiteUrl,
  routeRequiresAuth,
  routeRequiresSiteAccess,
  routeRequiresEdit,
  routeRequiresManage,
  SiteRouter,
  useSiteRouter,
  generateBreadcrumbs,
  CORE_SITE_ROUTES,
}