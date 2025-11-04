'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { Tables } from '@/src/lib/database/types'
import { filterProductsBySearch } from '@/src/lib/products/search-utils'

type Product = Tables<'products'>
type ProductImage = Tables<'product_images'>
type ProductCategory = Tables<'product_categories'>

interface ProductWithImagesAndCategory extends Product {
  product_images?: ProductImage[]
  primary_category?: ProductCategory | null
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
  const [products, setProducts] = useState<ProductWithImagesAndCategory[]>([])
  const [totalCount, setTotalCount] = useState(0)
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
        setTotalCount(0)
        setIsLoading(false)
        return
      }

      // Don't search if query is empty or too short
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setProducts([])
        setTotalCount(0)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const query = debouncedQuery.toLowerCase().trim()

        // Fetch ALL active products with category data
        // We do filtering entirely client-side to ensure category name matches are found
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
            ),
            primary_category:product_categories!products_primary_category_id_fkey (
              id,
              name,
              slug
            )
          `)
          .eq('site_id', site.id)
          .eq('is_active', true)
          .order('name', { ascending: true })

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

        // Client-side filter to include category name matches
        const filteredProducts = filterProductsBySearch(
          productsWithSortedImages,
          query,
          (product) => product.primary_category?.name || ''
        )

        // Track total count before applying limit
        setTotalCount(filteredProducts.length)

        // Apply display limit
        const limitedProducts = filteredProducts.slice(0, limit)
        setProducts(limitedProducts)
      } catch (err) {
        console.error('Product search error:', err)
        setError('Failed to search products')
        setProducts([])
        setTotalCount(0)
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
    setTotalCount(0)
    setError(null)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    products,
    totalCount,
    displayedCount: products.length,
    isLoading,
    error,
    hasResults: products.length > 0,
    clearSearch,
  }
}
