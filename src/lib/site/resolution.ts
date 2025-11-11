/**
 * Site resolution utilities for domain and subdomain handling
 * Extracts site information from hostnames for multi-tenant architecture
 */

import { getAppDomain } from '@/src/lib/env/app-domain'

export interface SiteResolution {
  type: 'subdomain' | 'custom_domain'
  value: string
  isValid: boolean
}

export interface HostParseResult {
  hostname: string
  subdomain?: string
  domain?: string
  isLocalhost: boolean
  isValidFormat: boolean
}

/**
 * Parses a hostname to extract subdomain and domain information
 */
export function parseHostname(hostname: string): HostParseResult {
  if (!hostname) {
    return {
      hostname: '',
      isLocalhost: false,
      isValidFormat: false
    }
  }

  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  // Handle localhost and development scenarios
  if (isLocalhost) {
    return {
      hostname,
      isLocalhost: true,
      isValidFormat: true
    }
  }

  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  const isValidFormat = hostnameRegex.test(hostname)

  if (!isValidFormat) {
    return {
      hostname,
      isLocalhost: false,
      isValidFormat: false
    }
  }

  const parts = hostname.split('.')
  
  // If it's a single part, it's likely a subdomain of localhost or invalid
  if (parts.length < 2) {
    return {
      hostname,
      isLocalhost: false,
      isValidFormat: false
    }
  }

  // For domains like subdomain.example.com
  if (parts.length >= 3) {
    const subdomain = parts[0]
    const domain = parts.slice(1).join('.')
    
    return {
      hostname,
      subdomain,
      domain,
      isLocalhost: false,
      isValidFormat: true
    }
  }

  // For domains like example.com (custom domain)
  return {
    hostname,
    domain: hostname,
    isLocalhost: false,
    isValidFormat: true
  }
}

/**
 * Check if hostname is the main platform domain (not a customer site)
 */
function isMainPlatformDomain(hostname: string): boolean {
  const appDomain = getAppDomain()
  const appDomainWithoutPort = appDomain.split(':')[0]

  // Remove port from hostname for comparison
  const hostnameWithoutPort = hostname.split(':')[0]

  return (
    hostnameWithoutPort === appDomain ||
    hostnameWithoutPort === appDomainWithoutPort ||
    hostname.endsWith('.railway.app')
  )
}

/**
 * Resolves site information from a given hostname
 * Returns the type of resolution (subdomain/custom_domain) and the value to query
 */
export function resolveSiteFromHost(hostname: string): SiteResolution {
  const parsed = parseHostname(hostname)

  if (!parsed.isValidFormat) {
    return {
      type: 'subdomain',
      value: '',
      isValid: false
    }
  }

  // IMPORTANT: If this is the main platform domain, it's NOT a site domain
  // This prevents infinite redirect loops when accessing blooms.cc directly
  if (isMainPlatformDomain(hostname)) {
    return {
      type: 'subdomain',
      value: '',
      isValid: false
    }
  }

  // Handle localhost development
  if (parsed.isLocalhost) {
    // For development, we might want to extract subdomain from localhost
    // e.g., subdomain.localhost:3000 -> subdomain
    const subdomain = hostname.split('.')[0]
    if (subdomain && subdomain !== 'localhost' && !subdomain.includes(':')) {
      return {
        type: 'subdomain',
        value: subdomain,
        isValid: true
      }
    }

    // Default to a development subdomain
    return {
      type: 'subdomain',
      value: 'dev',
      isValid: true
    }
  }

  // If we have a subdomain, use subdomain resolution
  if (parsed.subdomain) {
    return {
      type: 'subdomain',
      value: parsed.subdomain,
      isValid: true
    }
  }

  // If we only have a domain, use custom domain resolution
  if (parsed.domain) {
    return {
      type: 'custom_domain',
      value: parsed.domain,
      isValid: true
    }
  }

  return {
    type: 'subdomain',
    value: '',
    isValid: false
  }
}

/**
 * Validates a subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || subdomain.length === 0) {
    return false
  }

  // Subdomain validation rules:
  // - 1-63 characters
  // - alphanumeric and hyphens only
  // - cannot start or end with hyphen
  // - cannot contain consecutive hyphens
  const subdomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
  
  if (!subdomainRegex.test(subdomain)) {
    return false
  }

  // Additional checks
  const reservedSubdomains = [
    'www', 'mail', 'ftp', 'api', 'admin', 'blog', 'shop', 'store',
    'support', 'help', 'docs', 'status', 'staging', 'test',
    'cdn', 'static', 'assets', 'media', 'images', 'files'
  ]

  if (reservedSubdomains.includes(subdomain.toLowerCase())) {
    return false
  }

  return true
}

/**
 * Validates a custom domain format
 */
export function isValidCustomDomain(domain: string): boolean {
  if (!domain || domain.length === 0) {
    return false
  }

  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!domainRegex.test(domain)) {
    return false
  }

  // Must have at least one dot (e.g., example.com)
  if (!domain.includes('.')) {
    return false
  }

  // Check TLD validity (basic check)
  const parts = domain.split('.')
  const tld = parts[parts.length - 1]
  
  if (tld.length < 2 || tld.length > 6) {
    return false
  }

  return true
}

/**
 * Extracts hostname from various input sources
 */
export function extractHostname(input: string | URL | Request): string {
  if (typeof input === 'string') {
    try {
      const url = new URL(input)
      return url.hostname
    } catch {
      // If it's not a full URL, treat as hostname
      return input
    }
  }

  if (input instanceof URL) {
    return input.hostname
  }

  if (input instanceof Request) {
    const url = new URL(input.url)
    return url.hostname
  }

  return ''
}

/**
 * Builds a full URL from site resolution and current path
 */
export function buildSiteUrl(siteResolution: SiteResolution, path: string = '', protocol: string = 'https'): string {
  if (!siteResolution.isValid) {
    return ''
  }

  let hostname: string
  
  if (siteResolution.type === 'subdomain') {
    // For development, you might want to customize this base domain
    const baseDomain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'yourdomain.com'
    hostname = `${siteResolution.value}.${baseDomain}`
  } else {
    hostname = siteResolution.value
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${protocol}://${hostname}${cleanPath}`
}