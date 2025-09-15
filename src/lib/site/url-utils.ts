import { Site } from '@/src/lib/database/aliases'

/**
 * Builds the customer-facing site URL from site data
 * Uses custom_domain if available, otherwise falls back to subdomain.localhost:port
 */
export function buildCustomerSiteUrl(site: Site): string {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001'
  
  // If site has a custom domain, use that
  if (site.custom_domain) {
    // Check if custom domain already includes port
    if (site.custom_domain.includes(':')) {
      return site.custom_domain
    }
    // Add port if we're in development
    const port = appDomain.includes(':') ? appDomain.split(':')[1] : '3001'
    return `${site.custom_domain}:${port}`
  }
  
  // Use subdomain.localhost:port format
  const baseDomain = appDomain.split(':')[0] // Get 'localhost' from 'localhost:3001'
  const port = appDomain.includes(':') ? appDomain.split(':')[1] : '3001'
  
  return `${site.subdomain}.${baseDomain}:${port}`
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