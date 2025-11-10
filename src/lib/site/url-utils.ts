import { Site } from '@/src/lib/database/aliases'
import { getAppDomain } from '@/src/lib/env/app-domain'

/**
 * Builds the customer-facing site URL from site data
 * Uses custom_domain if available, otherwise falls back to subdomain.baseDomain:port
 * Only includes port for local development - staging/production domains are clean
 * Local development is detected by port presence (e.g., localhost:3001, blooms.local:3001)
 */
export function buildCustomerSiteUrl(site: Site): string {
  const appDomain = getAppDomain()

  // Extract base domain and port
  const [baseDomain, port] = appDomain.split(':')
  const isLocalDevelopment = !!port  // True if port exists (local dev), false otherwise (production)

  // If site has a custom domain, use that
  if (site.custom_domain) {
    // Check if custom domain already includes port
    if (site.custom_domain.includes(':')) {
      return site.custom_domain
    }
    // Add port if in local development
    if (isLocalDevelopment) {
      return `${site.custom_domain}:${port}`
    }
    // For staging/production custom domains, return clean URL without port
    return site.custom_domain
  }

  // Use subdomain.baseDomain:port format (only add port for local development)
  if (isLocalDevelopment) {
    return `${site.subdomain}.${baseDomain}:${port}`
  }

  // For production environments, return clean subdomain URL
  return `${site.subdomain}.${baseDomain}`
}

/**
 * Gets the base customer site URL (without protocol) for display purposes
 */
export function getCustomerSiteDisplayUrl(site: Site): string {
  return buildCustomerSiteUrl(site)
}

/**
 * Gets the full customer site URL with protocol
 */
export function getCustomerSiteFullUrl(site: Site): string {
  const baseUrl = buildCustomerSiteUrl(site)
  return `http://${baseUrl}`
}