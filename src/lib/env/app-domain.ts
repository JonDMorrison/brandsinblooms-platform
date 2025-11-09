/**
 * App domain environment variable utilities
 *
 * Handles NEXT_PUBLIC_APP_DOMAIN which may be prefixed with '*.' for wildcard DNS
 * Examples:
 * - 'blooms.cc' -> 'blooms.cc'
 * - '*.blooms.cc' -> 'blooms.cc'
 * - 'localhost:3001' -> 'localhost:3001'
 * - '*.localhost:3001' -> 'localhost:3001'
 */

/**
 * Get the app domain, automatically removing wildcard prefix if present
 *
 * @returns Clean app domain without wildcard prefix
 */
export function getAppDomain(): string {
  const rawDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001'

  // Remove leading '*.' if present (wildcard DNS notation)
  return rawDomain.startsWith('*.') ? rawDomain.slice(2) : rawDomain
}

/**
 * Get the app domain without port
 *
 * @returns App domain without port number
 */
export function getAppDomainWithoutPort(): string {
  const appDomain = getAppDomain()
  return appDomain.split(':')[0]
}
