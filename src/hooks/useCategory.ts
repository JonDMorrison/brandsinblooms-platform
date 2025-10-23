'use client'

import { supabase } from '@/lib/supabase/client'
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery'
import { useSiteId } from '@/src/contexts/SiteContext'
import { Tables } from '@/lib/database/types'
import { handleSingleResponse } from '@/src/lib/queries/base'

type Category = Tables<'product_categories'>

export type CategoryWithDetails = Category & {
  parent?: Category | null
  children?: Category[]
  product_count?: number
}

/**
 * Hook to fetch a single category by slug with related data
 */
export function useCategory(slug: string | null) {
  const siteId = useSiteId()

  const cacheKey = `category_${siteId}_${slug}`

  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !slug) throw new Error('Site ID and slug are required')

      const response = await supabase
        .from('product_categories')
        .select(`
          *,
          parent:parent_id (
            id,
            name,
            slug,
            icon,
            color
          ),
          children:product_categories!parent_id (
            id,
            name,
            slug,
            description,
            icon,
            color,
            image_url,
            is_active
          ),
          product_category_assignments!product_category_assignments_category_id_fkey (
            product_id
          )
        `)
        .eq('site_id', siteId)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      const data = await handleSingleResponse(response)

      // Calculate product count from assignments
      const assignments = (data.product_category_assignments as unknown[]) || []
      const product_count = assignments.length

      // Filter active children only
      const children = ((data.children as Category[]) || []).filter(
        (child) => child.is_active
      )

      return {
        ...data,
        product_count,
        children,
      } as CategoryWithDetails
    },
    {
      enabled: !!siteId && !!slug,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch category:', error.message)
      },
    },
    [siteId, slug]
  )
}
