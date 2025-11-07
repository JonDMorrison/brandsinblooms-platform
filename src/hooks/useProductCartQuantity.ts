import { useMemo } from 'react'
import { useCart } from '@/src/contexts/CartContext'

/**
 * Hook to get the current quantity of a specific product in the cart
 *
 * @param productId - The ID of the product to check
 * @returns The total quantity of the product in the cart (0 if not in cart)
 *
 * @example
 * ```tsx
 * const quantity = useProductCartQuantity(product.id)
 * // quantity = 0 (not in cart) or 1, 2, 3... (items in cart)
 * ```
 */
export function useProductCartQuantity(productId: string): number {
  const { items } = useCart()

  const quantity = useMemo(() => {
    const cartItem = items.find(item => item.productId === productId)
    return cartItem?.quantity || 0
  }, [items, productId])

  return quantity
}
