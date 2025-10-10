/**
 * Hook to fetch pages for the current site
 * Used in content editors for page link selection
 */

import { useSiteId } from '@/src/contexts/SiteContext'
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery'
import { getContent, ContentFilters } from '@/src/lib/queries/domains/content'
import { supabase } from '@/src/lib/supabase/client'

interface PageOption {
  id: string
  title: string
  slug: string
  isPublished: boolean
  contentType: string
}

interface UsePagesOptions {
  includeUnpublished?: boolean
  includeBlogs?: boolean
}

export function usePages(options: UsePagesOptions = {}) {
  const siteId = useSiteId()
  const { includeUnpublished = true, includeBlogs = false } = options

  return useSupabaseQuery<PageOption[]>(
    async (signal) => {
      if (!siteId) return []

      // Define content types to fetch
      const contentTypes = includeBlogs
        ? ['landing', 'about', 'contact', 'other', 'blog_post']
        : ['landing', 'about', 'contact', 'other']

      const filters: ContentFilters = {
        type: contentTypes,
        page: 1,
        limit: 1000, // Get all pages
        sortBy: 'title',
        sortOrder: 'asc'
      }

      // Only filter by published status if we want to exclude unpublished
      if (!includeUnpublished) {
        filters.published = true
      }

      const response = await getContent(supabase, siteId, filters)

      // Transform to PageOption format
      const pages: PageOption[] = response.data.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        isPublished: page.is_published ?? false,
        contentType: page.content_type
      }))

      return pages
    },
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000, // 2 minutes - pages don't change frequently during editing
      persistKey: siteId ? `pages-list-${siteId}` : undefined,
    }
  )
}
