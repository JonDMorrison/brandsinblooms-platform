'use client'

import { supabase } from '@/src/lib/supabase/client'
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery'
import { useSiteId } from '@/src/contexts/SiteContext'
import { Tables } from '@/src/lib/database/types'
import { handleQueryResponse } from '@/src/lib/queries/base'

type Product = Tables<'products'>

/**
 * Hook to fetch related products based on category
 * Excludes the current product and limits results
 */
export function useRelatedProducts(
  productId: string | null,
  categoryId: string | null,
  limit: number = 4
) {
  const siteId = useSiteId()

  const cacheKey = `related_products_${siteId}_${productId}_${categoryId}_${limit}`

  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !categoryId) {
        return []
      }

      const response = await supabase
        .from('products')
        .select(`
          *,
          primary_category:product_categories!products_primary_category_id_fkey (
            id,
            name,
            slug
          ),
          product_images (
            id,
            url,
            position,
            is_primary,
            alt_text
          )
        `)
        .eq('site_id', siteId)
        .eq('primary_category_id', categoryId)
        .eq('is_active', true)
        .neq('id', productId || '')
        .order('created_at', { ascending: false })
        .limit(limit)

      const data = await handleQueryResponse(response)

      // Sort product images by primary first, then position
      return data.map((product) => {
        if (product.product_images && Array.isArray(product.product_images)) {
          product.product_images.sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1
            if (!a.is_primary && b.is_primary) return 1
            return (a.position ?? 999) - (b.position ?? 999)
          })
        }
        return product
      }) as Product[]
    },
    {
      enabled: !!siteId && !!categoryId,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch related products:', error.message)
      },
    },
    [siteId, productId, categoryId, limit]
  )
}
