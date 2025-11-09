import { Site } from '@/src/lib/database/aliases'
import { getAppDomain } from '@/lib/env/app-domain'

/**
 * Builds the customer-facing site URL from site data
 * Uses custom_domain if available, otherwise falls back to subdomain.localhost:port
 * Only includes port for localhost development - staging/production domains are clean
 */
export function buildCustomerSiteUrl(site: Site): string {
  const appDomain = getAppDomain()
  const isLocalhost = appDomain.includes('localhost')

  // If site has a custom domain, use that
  if (site.custom_domain) {
    // Check if custom domain already includes port
    if (site.custom_domain.includes(':')) {
      return site.custom_domain
    }
    // Only add port if we're in localhost development
    if (isLocalhost && appDomain.includes(':')) {
      const port = appDomain.split(':')[1]
      return `${site.custom_domain}:${port}`
    }
    // For staging/production custom domains, return clean URL without port
    return site.custom_domain
  }

  // Use subdomain.localhost:port format (only add port for localhost)
  const baseDomain = appDomain.split(':')[0] // Get 'localhost' from 'localhost:3001'

  if (isLocalhost && appDomain.includes(':')) {
    const port = appDomain.split(':')[1]
    return `${site.subdomain}.${baseDomain}:${port}`
  }

  // For non-localhost environments, return clean subdomain URL
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