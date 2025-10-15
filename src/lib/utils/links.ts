/**
 * Link utility functions for handling internal and external URLs
 */

/**
 * Detects if a URL is external (starts with http:// or https://)
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Detects if a URL is internal (starts with /)
 */
export function isInternalUrl(url: string): boolean {
  if (!url) return false
  return url.startsWith('/') && !url.startsWith('//')
}

/**
 * Normalizes a URL:
 * - "www.google.com" → "https://www.google.com"
 * - "google.com" → "https://google.com"
 * - "/about" → "/about" (unchanged)
 * - "https://google.com" → "https://google.com" (unchanged)
 * - Empty string → "#" (fallback)
 */
export function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') return '#'

  const trimmedUrl = url.trim()

  // Already has protocol, return as-is
  if (isExternalUrl(trimmedUrl)) {
    return trimmedUrl
  }

  // Internal route (starts with /)
  if (isInternalUrl(trimmedUrl)) {
    return trimmedUrl
  }

  // Looks like a domain without protocol (www.example.com, example.com)
  // Add https:// prefix
  if (trimmedUrl.includes('.') || trimmedUrl.startsWith('www.')) {
    return `https://${trimmedUrl}`
  }

  // Default: treat as internal route
  return trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`
}
