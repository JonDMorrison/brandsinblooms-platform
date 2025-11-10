/**
 * Cookie domain configuration utilities for multi-tenant authentication
 *
 * This module provides utilities to configure cookie domains that enable
 * authentication sharing across the main app and customer site subdomains.
 *
 * Key Concepts:
 * - Main site: localhost:3001 or blooms.cc
 * - Customer subdomains: *.localhost:3001 or *.blooms.cc
 * - Custom domains: customdomain.com (cannot share cookies with main site)
 *
 * Cookie Domain Strategy:
 * - For localhost: Use '.localhost' to share across all *.localhost subdomains
 * - For production: Use '.blooms.cc' to share across main and all subdomains
 * - Cookies set with leading dot (.) are accessible to all subdomains
 */

import { getAppDomain } from '@/src/lib/env/app-domain'

/**
 * Get the cookie domain for sharing authentication across main app and customer sites
 *
 * @returns Cookie domain string with leading dot for subdomain sharing, or undefined for default behavior
 *
 * Examples:
 * - localhost:3001 -> '.localhost' (shares to *.localhost:3001)
 * - blooms-staging.cc -> '.blooms-staging.cc' (shares to *.blooms-staging.cc)
 * - blooms.cc -> '.blooms.cc' (shares to *.blooms.cc)
 */
export function getSharedCookieDomain(): string | undefined {
  const appDomain = getAppDomain()

  // Handle localhost development
  if (appDomain.includes('localhost')) {
    // '.localhost' allows cookies to be shared across:
    // - localhost:3001 (main site)
    // - *.localhost:3001 (all customer subdomains)
    return '.localhost'
  }

  // Handle production/staging domains
  // Remove port if present and extract base domain
  const domainWithoutPort = appDomain.split(':')[0]
  const parts = domainWithoutPort.split('.')

  if (parts.length >= 2) {
    // For blooms.cc or blooms-staging.cc, return '.blooms.cc' or '.blooms-staging.cc'
    // This shares cookies across:
    // - blooms.cc (or blooms-staging.cc) - main site
    // - *.blooms.cc (or *.blooms-staging.cc) - all customer subdomains
    const baseDomain = parts.slice(-2).join('.')
    return `.${baseDomain}`
  }

  // Fallback: undefined means browser will use default (current domain only)
  return undefined
}

/**
 * Get the base domain without subdomain (used for domain detection)
 *
 * @returns Base domain string without leading dot
 *
 * Examples:
 * - localhost:3001 -> 'localhost'
 * - blooms-staging.cc -> 'blooms-staging.cc'
 * - www.blooms.cc -> 'blooms.cc'
 */
export function getBaseDomain(): string {
  const appDomain = getAppDomain()

  if (appDomain.includes('localhost')) {
    return 'localhost'
  }

  const domainWithoutPort = appDomain.split(':')[0]
  const parts = domainWithoutPort.split('.')

  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }

  return domainWithoutPort
}

/**
 * Check if a hostname is a subdomain of the main app domain
 *
 * @param hostname - The hostname to check
 * @returns true if hostname is a subdomain, false otherwise
 *
 * Examples:
 * - isSubdomain('mysite.localhost') -> true (localhost development)
 * - isSubdomain('mysite.blooms.cc') -> true (production)
 * - isSubdomain('customdomain.com') -> false (custom domain)
 * - isSubdomain('localhost') -> false (main site)
 * - isSubdomain('blooms.cc') -> false (main site)
 */
export function isSubdomain(hostname: string): boolean {
  const baseDomain = getBaseDomain()
  const hostnameWithoutPort = hostname.split(':')[0]

  // Must end with base domain
  if (!hostnameWithoutPort.endsWith(baseDomain)) {
    return false
  }

  // Must have more parts than base domain (has subdomain prefix)
  const hostParts = hostnameWithoutPort.split('.')
  const baseParts = baseDomain.split('.')

  return hostParts.length > baseParts.length
}

/**
 * Check if a hostname can share cookies with the main app domain
 *
 * @param hostname - The hostname to check
 * @returns true if cookies can be shared, false otherwise
 */
export function canShareCookies(hostname: string): boolean {
  const baseDomain = getBaseDomain()
  const hostnameWithoutPort = hostname.split(':')[0]

  // Main domain or subdomain can share cookies
  return hostnameWithoutPort === baseDomain || isSubdomain(hostname)
}
