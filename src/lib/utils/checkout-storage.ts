/**
 * Checkout Storage Utility
 *
 * Manages persistent storage of shipping information during checkout
 * with TTL (time-to-live) expiration and version control.
 *
 * Storage Strategy:
 * - Uses localStorage for persistence across page refreshes and navigation
 * - 1-hour TTL for privacy (shorter than cart's 24-hour TTL)
 * - Site-specific storage keys for multi-tenant isolation
 * - Versioned schema for future migrations
 * - Auto-cleanup on expiration and order completion
 */

import { ShippingAddress } from '@/src/lib/validation/checkout-schemas'

// Storage configuration
const CHECKOUT_STORAGE_PREFIX = 'brands-in-blooms-checkout'
const CHECKOUT_VERSION = 1
const CHECKOUT_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Storage structure with metadata for TTL support
 */
interface CheckoutStorage {
  version: number
  shippingAddress: ShippingAddress
  siteId: string
  createdAt: number
  lastUpdatedAt: number
  expiresAt: number
}

/**
 * Generate site-specific storage key
 */
function getStorageKey(siteId: string): string {
  return `${CHECKOUT_STORAGE_PREFIX}-${siteId}`
}

/**
 * Load shipping address from localStorage
 * Returns null if not found, expired, or invalid
 *
 * @param siteId - Site ID for multi-tenant isolation
 * @returns Shipping address or null
 */
export function loadShippingAddress(siteId: string): ShippingAddress | null {
  // Server-side or missing siteId guard
  if (typeof window === 'undefined' || !siteId) {
    return null
  }

  try {
    const storageKey = getStorageKey(siteId)
    const stored = localStorage.getItem(storageKey)

    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as CheckoutStorage

    // Version check for future migrations
    if (parsed.version !== CHECKOUT_VERSION) {
      console.warn(
        `[Checkout Storage] Version mismatch: expected ${CHECKOUT_VERSION}, got ${parsed.version}. Clearing data.`
      )
      clearShippingAddress(siteId)
      return null
    }

    // Site ID validation (prevent cross-site data leakage)
    if (parsed.siteId !== siteId) {
      console.warn(
        `[Checkout Storage] Site ID mismatch: expected ${siteId}, got ${parsed.siteId}. Clearing data.`
      )
      clearShippingAddress(siteId)
      return null
    }

    // Expiration check
    const now = Date.now()
    if (now > parsed.expiresAt) {
      console.log('[Checkout Storage] Shipping address has expired, clearing it')
      clearShippingAddress(siteId)
      return null
    }

    return parsed.shippingAddress
  } catch (err) {
    console.error('[Checkout Storage] Failed to load shipping address:', err)
    // Clear corrupt data
    try {
      clearShippingAddress(siteId)
    } catch {
      // Ignore cleanup errors
    }
    return null
  }
}

/**
 * Save shipping address to localStorage with TTL
 * Implements sliding window expiration - resets timer on every save
 *
 * @param siteId - Site ID for multi-tenant isolation
 * @param shippingAddress - Shipping address to save
 * @returns Success boolean
 */
export function saveShippingAddress(
  siteId: string,
  shippingAddress: ShippingAddress
): boolean {
  // Server-side or missing data guard
  if (typeof window === 'undefined' || !siteId || !shippingAddress) {
    return false
  }

  try {
    const storageKey = getStorageKey(siteId)
    const now = Date.now()

    // Try to preserve createdAt from existing data
    let existingData: CheckoutStorage | null = null
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        existingData = JSON.parse(stored) as CheckoutStorage
      }
    } catch {
      // Ignore errors, will create new metadata
    }

    const checkoutData: CheckoutStorage = {
      version: CHECKOUT_VERSION,
      shippingAddress,
      siteId,
      createdAt: existingData?.createdAt || now,
      lastUpdatedAt: now,
      expiresAt: now + CHECKOUT_TTL, // Reset expiration on save (sliding window)
    }

    localStorage.setItem(storageKey, JSON.stringify(checkoutData))
    return true
  } catch (err) {
    console.error('[Checkout Storage] Failed to save shipping address:', err)
    return false
  }
}

/**
 * Clear shipping address from localStorage
 * Should be called after successful order completion or manual clear
 *
 * @param siteId - Site ID for multi-tenant isolation
 */
export function clearShippingAddress(siteId: string): void {
  if (typeof window === 'undefined' || !siteId) {
    return
  }

  try {
    const storageKey = getStorageKey(siteId)
    localStorage.removeItem(storageKey)
  } catch (err) {
    console.error('[Checkout Storage] Failed to clear shipping address:', err)
  }
}

/**
 * Check if shipping address exists and is valid (not expired)
 *
 * @param siteId - Site ID for multi-tenant isolation
 * @returns True if valid address exists
 */
export function hasValidShippingAddress(siteId: string): boolean {
  return loadShippingAddress(siteId) !== null
}

/**
 * Get remaining TTL in milliseconds
 * Returns 0 if no valid address exists
 *
 * @param siteId - Site ID for multi-tenant isolation
 * @returns Milliseconds until expiration
 */
export function getShippingAddressTTL(siteId: string): number {
  if (typeof window === 'undefined' || !siteId) {
    return 0
  }

  try {
    const storageKey = getStorageKey(siteId)
    const stored = localStorage.getItem(storageKey)

    if (!stored) {
      return 0
    }

    const parsed = JSON.parse(stored) as CheckoutStorage
    const now = Date.now()
    const remaining = Math.max(0, parsed.expiresAt - now)

    return remaining
  } catch {
    return 0
  }
}
