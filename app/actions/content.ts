'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase/server'
import { updateContent as updateContentQuery } from '@/src/lib/queries/domains/content'
import type { UpdateType } from '@/src/lib/queries/base'

type UpdateContent = UpdateType<'content'>

/**
 * Server action to update content with cache revalidation
 * This ensures that blog posts and other content types display updated data immediately
 */
export async function updateContentWithRevalidation(
  siteId: string,
  contentId: string,
  data: UpdateContent
) {
  const supabase = await createClient()

  // Update content in database
  const result = await updateContentQuery(supabase, siteId, contentId, data)

  // Revalidate relevant paths to ensure fresh data displays
  // 1. Revalidate the blog index page if this is a blog post
  if (data.content_type === 'blog_post' || result.content_type === 'blog_post') {
    revalidatePath('/blog', 'page')
  }

  // 2. Revalidate the specific content page by slug
  if (result.slug) {
    revalidatePath(`/${result.slug}`, 'page')
  }

  // 3. Revalidate all pages under the dynamic catch-all route to ensure sidebar updates
  // This is necessary because blog posts can appear in sidebars on other blog pages
  revalidatePath('/', 'layout')

  return result
}

/**
 * Revalidate a specific content path
 * Useful for manual cache invalidation
 */
export async function revalidateContentPath(path: string) {
  revalidatePath(path, 'page')
}

/**
 * Revalidate all blog-related paths
 * Useful when multiple blog posts are updated or reorganized
 */
export async function revalidateBlogPaths() {
  revalidatePath('/blog', 'page')
  revalidatePath('/', 'layout')
}
