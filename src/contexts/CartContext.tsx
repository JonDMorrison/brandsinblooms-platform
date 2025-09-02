'use client'

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  ReactNode 
} from 'react'
import { useAuth } from './AuthContext'
import { useSiteContext } from './SiteContext'
import { Tables } from '@/src/lib/database/types'

export interface CartItem {
  id: string
  productId: string
  product: Tables<'products'>
  quantity: number
  price: number
  subtotal: number
}

export interface CartContextType {
  items: CartItem[]
  total: number
  itemCount: number
  isLoading: boolean
  error: Error | null
  
  // Actions
  addItem: (product: Tables<'products'>, quantity: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'brands-in-blooms-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { currentSite } = useSiteContext()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        // Filter items by current site
        const siteItems = parsedCart.filter((item: CartItem) => 
          currentSite && item.product.site_id === currentSite.id
        )
        setItems(siteItems)
      }
    } catch (err) {
      console.error('Failed to load cart from storage:', err)
    }
  }, [currentSite])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save cart to storage:', err)
    }
  }, [items])

  const addItem = useCallback(async (product: Tables<'products'>, quantity: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      setItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === product.id)
        
        if (existingItem) {
          // Update quantity for existing item
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
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}_${Date.now()}`,
            productId: product.id,
            product,
            quantity,
            price: product.price || 0,
            subtotal: (product.price || 0) * quantity
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
      
      setItems(prevItems =>
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
      setItems(prevItems => prevItems.filter(item => item.id !== itemId))
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
      setItems([])
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
    // Placeholder for future server sync
    // For now, just reload from localStorage
    if (typeof window === 'undefined') return
    
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        const siteItems = parsedCart.filter((item: CartItem) => 
          currentSite && item.product.site_id === currentSite.id
        )
        setItems(siteItems)
      }
    } catch (err) {
      console.error('Failed to refresh cart:', err)
    }
  }, [currentSite])

  const value: CartContextType = {
    items,
    total,
    itemCount,
    isLoading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  }

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