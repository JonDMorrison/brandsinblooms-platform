'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { Tables } from '@/src/lib/database/types'

type Product = Tables<'products'>
type ProductImage = Tables<'product_images'>

interface ProductWithImages extends Product {
  product_images?: ProductImage[]
}

interface UseProductSearchOptions {
  limit?: number
  debounceMs?: number
}

export function useProductSearch(options: UseProductSearchOptions = {}) {
  const { limit = 10, debounceMs = 300 } = options
  const { currentSite: site } = useSiteContext()
  const supabase = useSupabase()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchQuery, debounceMs])

  // Fetch products when debounced query changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!site?.id) {
        setProducts([])
        setIsLoading(false)
        return
      }

      // Don't search if query is empty or too short
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setProducts([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const query = debouncedQuery.toLowerCase().trim()

        // Search in name and description using ilike for case-insensitive search
        const { data, error: searchError } = await supabase
          .from('products')
          .select(`
            *,
            product_images (
              id,
              url,
              position,
              is_primary,
              alt_text
            )
          `)
          .eq('site_id', site.id)
          .eq('is_active', true)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .order('name', { ascending: true })
          .limit(limit)

        if (searchError) throw searchError

        // Sort product images by primary first, then position
        const productsWithSortedImages = (data || []).map((product) => {
          if (product.product_images && Array.isArray(product.product_images)) {
            product.product_images.sort((a, b) => {
              if (a.is_primary && !b.is_primary) return -1
              if (!a.is_primary && b.is_primary) return 1
              return (a.position ?? 999) - (b.position ?? 999)
            })
          }
          return product
        })

        setProducts(productsWithSortedImages)
      } catch (err) {
        console.error('Product search error:', err)
        setError('Failed to search products')
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [debouncedQuery, site?.id, limit, supabase])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    setProducts([])
    setError(null)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    products,
    isLoading,
    error,
    hasResults: products.length > 0,
    clearSearch,
  }
}
