/**
 * Blog-specific types and interfaces
 */

import { ContentMetaData, SEOMetadata } from '@/src/lib/seo/types'
import { PageContent } from '@/src/lib/content/schema'

export type BlogPostStatus = 'draft' | 'published'

/**
 * Blog post data structure
 * Maps to content table with content_type = 'blog_post'
 */
export interface BlogPost {
    id: string
    site_id: string
    title: string
    slug: string
    content: PageContent
    author_id: string | null
    status: BlogPostStatus
    published_at: string | null
    created_at: string
    updated_at: string
    meta_data: ContentMetaData | null
}

/**
 * Blog post list item (for index pages)
 */
export interface BlogPostListItem {
    id: string
    title: string
    slug: string
    excerpt?: string
    featured_image?: string
    author_id: string | null
    author_name?: string
    published_at: string | null
    category?: string
    tags?: string[]
}

/**
 * Blog post create input
 */
export interface CreateBlogPostInput {
    site_id: string
    title: string
    slug: string
    content: PageContent
    author_id?: string
    status?: BlogPostStatus
    meta_data?: ContentMetaData
}

/**
 * Blog post update input
 */
export interface UpdateBlogPostInput {
    title?: string
    slug?: string
    content?: PageContent
    status?: BlogPostStatus
    meta_data?: ContentMetaData
}

/**
 * Blog query filters
 */
export interface BlogPostFilters {
    status?: BlogPostStatus
    author_id?: string
    category?: string
    tag?: string
    search?: string
}

/**
 * Blog query options
 */
export interface BlogQueryOptions {
    limit?: number
    offset?: number
    orderBy?: 'published_at' | 'created_at' | 'updated_at' | 'title'
    orderDirection?: 'asc' | 'desc'
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // Replace spaces and special chars with hyphens
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Get blog post status from is_published boolean
 */
export function getStatusFromPublished(isPublished: boolean | null): BlogPostStatus {
    return isPublished ? 'published' : 'draft'
}

/**
 * Get is_published boolean from status
 */
export function getPublishedFromStatus(status: BlogPostStatus): boolean {
    return status === 'published'
}
