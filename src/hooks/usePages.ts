/**
 * Hook to fetch all available pages/routes for the current site
 * Includes: database content pages, static routes, and category pages
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
  includeStaticRoutes?: boolean
  includeCategories?: boolean
}

export function usePages(options: UsePagesOptions = {}) {
  const siteId = useSiteId()
  const {
    includeUnpublished = true,
    includeBlogs = false,
    includeStaticRoutes = true,
    includeCategories = true
  } = options

  return useSupabaseQuery<PageOption[]>(
    async (signal) => {
      if (!siteId) return []

      const allPages: PageOption[] = []

      // 1. Fetch content pages from database
      const contentTypes: ContentFilters['type'] = includeBlogs
        ? ['landing', 'about', 'contact', 'other', 'blog_post']
        : ['landing', 'about', 'contact', 'other']

      const filters: ContentFilters = {
        type: contentTypes,
        page: 1,
        limit: 1000,
        sortBy: 'title' as const,
        sortOrder: 'asc' as const
      }

      if (!includeUnpublished) {
        filters.published = true
      }

      const response = await getContent(supabase, siteId, filters)

      const contentPages: PageOption[] = response.data.map((page: any) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        isPublished: page.is_published ?? false,
        contentType: page.content_type
      }))

      allPages.push(...contentPages)

      // 2. Add static hardcoded routes (e-commerce pages)
      if (includeStaticRoutes) {
        const staticRoutes: PageOption[] = [
          {
            id: '__products',
            title: 'Products',
            slug: 'products',
            isPublished: true,
            contentType: 'static'
          },
          {
            id: '__cart',
            title: 'Cart',
            slug: 'cart',
            isPublished: true,
            contentType: 'static'
          }
        ]
        allPages.push(...staticRoutes)
      }

      // 3. Fetch category pages from product_categories table
      if (includeCategories) {
        const { data: categories, error: categoriesError } = await supabase
          .from('product_categories')
          .select('id, name, slug')
          .eq('site_id', siteId)
          .eq('is_active', true)
          .is('parent_id', null) // Top-level categories only
          .order('sort_order', { ascending: true })

        if (!categoriesError && categories) {
          const categoryPages: PageOption[] = categories.map((cat: any) => ({
            id: cat.id,
            title: cat.name,
            slug: `category/${cat.slug}`,
            isPublished: true,
            contentType: 'category'
          }))
          allPages.push(...categoryPages)
        }
      }

      // 4. Deduplicate and ensure only one home page
      // The database might have both slug="" and slug="home"
      // Keep the one with slug="home" as canonical
      const uniquePages = deduplicatePages(allPages)

      return uniquePages
    },
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      persistKey: siteId ? `pages-list-${siteId}` : undefined,
    }
  )
}

/**
 * Remove duplicate pages, prioritizing certain slugs over others
 * Specifically handles home page deduplication
 */
function deduplicatePages(pages: PageOption[]): PageOption[] {
  const seenSlugs = new Set<string>()
  const result: PageOption[] = []

  // Sort to ensure 'home' comes before empty string for home page
  const sorted = [...pages].sort((a, b) => {
    // Prioritize 'home' slug over empty string
    if ((a.slug === 'home' || a.slug === '') && (b.slug === 'home' || b.slug === '')) {
      return a.slug === 'home' ? -1 : 1
    }
    return 0
  })

  for (const page of sorted) {
    const normalizedSlug = page.slug === '' ? 'home' : page.slug

    if (!seenSlugs.has(normalizedSlug)) {
      seenSlugs.add(normalizedSlug)
      result.push(page)
    }
  }

  return result
}
