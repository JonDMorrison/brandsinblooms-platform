'use client'

import { supabase } from '@/src/lib/supabase/client'
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery'
import { useSiteId } from '@/src/contexts/SiteContext'
import { Tables } from '@/src/lib/database/types'
import { handleSingleResponse } from '@/src/lib/queries/base'

type Product = Tables<'products'>
type ProductImage = Tables<'product_images'>
type ProductCategory = Tables<'product_categories'>

export type ProductWithDetails = Product & {
  product_images?: ProductImage[]
  primary_category?: ProductCategory | null
  product_category_assignments?: Array<{
    category: ProductCategory
  }>
}

/**
 * Hook to fetch a single product by slug with all related data
 */
export function useProduct(slug: string | null) {
  const siteId = useSiteId()

  const cacheKey = `product_${siteId}_${slug}`

  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !slug) throw new Error('Site ID and slug are required')

      const response = await supabase
        .from('products')
        .select(`
          *,
          primary_category:product_categories!products_primary_category_id_fkey (
            id,
            name,
            slug,
            description,
            icon,
            color,
            image_url
          ),
          product_category_assignments (
            category:product_categories (
              id,
              name,
              slug,
              icon,
              color
            )
          ),
          product_images (
            id,
            url,
            position,
            is_primary,
            alt_text,
            caption,
            width,
            height,
            storage_type,
            cdn_url
          )
        `)
        .eq('site_id', siteId)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      const data = await handleSingleResponse(response)

      // Sort product images by position and primary first
      if (data.product_images && Array.isArray(data.product_images)) {
        data.product_images.sort((a, b) => {
          // Primary image always first
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          // Then by position
          return (a.position ?? 999) - (b.position ?? 999)
        })
      }

      return data as ProductWithDetails
    },
    {
      enabled: !!siteId && !!slug,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch product:', error.message)
      },
    },
    [siteId, slug]
  )
}
