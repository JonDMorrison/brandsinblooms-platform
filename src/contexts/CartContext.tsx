'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react'
import { useAuth } from './AuthContext'
import { useSiteContext } from './SiteContext'
import { Tables } from '@/src/lib/database/types'
import { getProductImageUrl } from '@/src/lib/utils/product-transformer'

export interface CartItem {
  id: string
  productId: string
  product: Tables<'products'>
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string // Primary product image URL for cart display
}

export interface CartContextType {
  items: CartItem[]
  total: number
  itemCount: number
  isLoading: boolean
  isHydrated: boolean
  error: Error | null

  // Actions
  addItem: (product: Tables<'products'>, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

// Storage interface with metadata for TTL support
interface CartStorage {
  version: number
  items: CartItem[]
  createdAt: number
  lastActivityAt: number
  expiresAt: number
  siteId?: string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'brands-in-blooms-cart'
const CART_VERSION = 1
const CART_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Load cart from localStorage with expiration check
 * Returns empty array if cart is expired or invalid
 */
function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)

    // Handle old cart format (plain array) - migrate it
    if (Array.isArray(parsed)) {
      const migratedData: CartStorage = {
        version: CART_VERSION,
        items: parsed,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        expiresAt: Date.now() + CART_TTL,
      }
      // Save migrated format immediately
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(migratedData))
      return parsed
    }

    const cartData = parsed as CartStorage

    // Check version for future migrations
    if (cartData.version !== CART_VERSION) {
      // Could add migration logic here for future versions
    }

    // Check if cart has expired
    const now = Date.now()
    if (now > cartData.expiresAt) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }

    return cartData.items || []
  } catch (err) {
    // Clear corrupt data
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch {}
    return []
  }
}

/**
 * Save cart to localStorage with metadata and TTL
 * Implements sliding window expiration - resets timer on every save
 */
function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()

    // Try to load existing metadata to preserve createdAt
    let existingData: CartStorage | null = null
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!Array.isArray(parsed)) {
          existingData = parsed as CartStorage
        }
      }
    } catch {
      // Ignore errors, will create new metadata
    }

    const cartData: CartStorage = {
      version: CART_VERSION,
      items,
      createdAt: existingData?.createdAt || now,
      lastActivityAt: now,
      expiresAt: now + CART_TTL, // Reset expiration on every save (sliding window)
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
  } catch (err) {
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentSite } = useSiteContext()
  const [allItems, setAllItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Load cart from localStorage on mount (once only, no dependencies!)
  useEffect(() => {
    const loadedItems = loadCartFromStorage()
    setAllItems(loadedItems)
    setIsHydrated(true)
  }, []) // No dependencies - runs once on mount

  // Save cart to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!isHydrated) return // Don't save during initial load
    saveCartToStorage(allItems)
  }, [allItems, isHydrated])

  // Filter items for current site (in memory, not in storage!)
  const items = useMemo(() => {
    if (!currentSite) return allItems
    return allItems.filter(item => item.product.site_id === currentSite.id)
  }, [allItems, currentSite])

  // Calculate totals from filtered items
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const total = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items])

  const addItem = useCallback(async (product: Tables<'products'>, quantity: number) => {
    setIsLoading(true)
    setError(null)

    try {
      // Extract image URL from product (handles product_images relation or legacy images JSONB)
      const imageUrl = getProductImageUrl(product)

      setAllItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === product.id)

        if (existingItem) {
          // Update quantity for existing item (preserve existing imageUrl)
          return prevItems.map(item =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal: (item.quantity + quantity) * item.price
                }
              : item
          )
        } else {
          // Add new item with extracted image URL
          const newItem: CartItem = {
            id: `${product.id}_${Date.now()}`,
            productId: product.id,
            product,
            quantity,
            price: product.price || 0,
            subtotal: (product.price || 0) * quantity,
            imageUrl: imageUrl || undefined
          }
          return [...prevItems, newItem]
        }
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add item to cart')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true)
    setError(null)

    try {
      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }

      setAllItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                subtotal: quantity * item.price
              }
            : item
        )
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update quantity')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      setAllItems(prevItems => prevItems.filter(item => item.id !== itemId))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove item')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearCart = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setAllItems([])
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear cart')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCart = useCallback(async () => {
    if (typeof window === 'undefined') return

    try {
      const loadedItems = loadCartFromStorage()
      setAllItems(loadedItems)
    } catch (err) {
    }
  }, [])

  const value: CartContextType = useMemo(() => ({
    items, // Return filtered items
    total,
    itemCount,
    isLoading,
    isHydrated,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  }), [
    items,
    total,
    itemCount,
    isLoading,
    isHydrated,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export function useCartContext() {
  return useCart()
}

/**
 * Optional cart hook that returns undefined if CartProvider is not available.
 * Use this in components that may be rendered outside of CartProvider (e.g., editor previews).
 */
export function useCartOptional() {
  return useContext(CartContext)
}
