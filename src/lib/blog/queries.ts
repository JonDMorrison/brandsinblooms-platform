/**
 * Blog post database queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/src/lib/database/types'
import {
    BlogPost,
    BlogPostListItem,
    CreateBlogPostInput,
    UpdateBlogPostInput,
    BlogPostFilters,
    BlogQueryOptions,
    getStatusFromPublished,
    getPublishedFromStatus
} from './types'
import { PageContent } from '@/src/lib/content/schema'
import { ContentMetaData } from '@/src/lib/seo/types'

/**
 * Get all blog posts for a site
 */
export async function getBlogPosts(
    client: SupabaseClient<Database>,
    siteId: string,
    filters?: BlogPostFilters,
    options?: BlogQueryOptions
): Promise<BlogPost[]> {
    let query = client
        .from('content')
        .select('*')
        .eq('site_id', siteId)
        .eq('content_type', 'blog_post')

    // Apply filters
    if (filters?.status) {
        query = query.eq('is_published', getPublishedFromStatus(filters.status))
    } else {
        // By default, only show published posts for public queries
        // Dashboard queries should explicitly pass status filter
        query = query.eq('is_published', true)
    }

    if (filters?.author_id) {
        query = query.eq('author_id', filters.author_id)
    }

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
    }

    // Apply ordering
    const orderBy = options?.orderBy || 'published_at'
    const orderDirection = options?.orderDirection || 'desc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc', nullsFirst: false })

    // Apply pagination
    if (options?.limit) {
        query = query.limit(options.limit)
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Failed to fetch blog posts: ${error.message}`)
    }

    return (data || []).map(row => ({
        id: row.id,
        site_id: row.site_id,
        title: row.title,
        slug: row.slug,
        content: row.content as PageContent,
        author_id: row.author_id,
        status: getStatusFromPublished(row.is_published),
        published_at: row.published_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        meta_data: row.meta_data as ContentMetaData | null
    }))
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(
    client: SupabaseClient<Database>,
    postId: string
): Promise<BlogPost | null> {
    const { data, error } = await client
        .from('content')
        .select('*')
        .eq('id', postId)
        .eq('content_type', 'blog_post')
        .single()

    if (error || !data) {
        return null
    }

    return {
        id: data.id,
        site_id: data.site_id,
        title: data.title,
        slug: data.slug,
        content: data.content as PageContent,
        author_id: data.author_id,
        status: getStatusFromPublished(data.is_published),
        published_at: data.published_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        meta_data: data.meta_data as ContentMetaData | null
    }
}

/**
 * Get a blog post by slug
 */
export async function getBlogPostBySlug(
    client: SupabaseClient<Database>,
    siteId: string,
    slug: string,
    publishedOnly: boolean = true
): Promise<BlogPost | null> {
    let query = client
        .from('content')
        .select('*')
        .eq('site_id', siteId)
        .eq('content_type', 'blog_post')
        .eq('slug', slug)

    if (publishedOnly) {
        query = query.eq('is_published', true)
    }

    const { data, error } = await query.single()

    if (error || !data) {
        return null
    }

    return {
        id: data.id,
        site_id: data.site_id,
        title: data.title,
        slug: data.slug,
        content: data.content as PageContent,
        author_id: data.author_id,
        status: getStatusFromPublished(data.is_published),
        published_at: data.published_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        meta_data: data.meta_data as ContentMetaData | null
    }
}

/**
 * Create a new blog post
 */
export async function createBlogPost(
    client: SupabaseClient<Database>,
    input: CreateBlogPostInput
): Promise<BlogPost> {
    const now = new Date().toISOString()
    const isPublished = input.status === 'published'

    const { data, error } = await client
        .from('content')
        .insert({
            site_id: input.site_id,
            content_type: 'blog_post',
            title: input.title,
            slug: input.slug,
            content: input.content as any,
            author_id: input.author_id || null,
            is_published: isPublished,
            published_at: isPublished ? now : null,
            meta_data: input.meta_data as any || null,
            created_at: now,
            updated_at: now
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create blog post: ${error.message}`)
    }

    return {
        id: data.id,
        site_id: data.site_id,
        title: data.title,
        slug: data.slug,
        content: data.content as PageContent,
        author_id: data.author_id,
        status: getStatusFromPublished(data.is_published),
        published_at: data.published_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        meta_data: data.meta_data as ContentMetaData | null
    }
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
    client: SupabaseClient<Database>,
    postId: string,
    input: UpdateBlogPostInput
): Promise<BlogPost> {
    const now = new Date().toISOString()

    // Build update object
    const updateData: any = {
        updated_at: now
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.content !== undefined) updateData.content = input.content
    if (input.meta_data !== undefined) updateData.meta_data = input.meta_data

    // Handle status change
    if (input.status !== undefined) {
        const isPublished = getPublishedFromStatus(input.status)
        updateData.is_published = isPublished

        // Set published_at on first publish
        if (isPublished) {
            const { data: currentPost } = await client
                .from('content')
                .select('published_at')
                .eq('id', postId)
                .single()

            if (currentPost && !currentPost.published_at) {
                updateData.published_at = now
            }
        }
    }

    const { data, error } = await client
        .from('content')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update blog post: ${error.message}`)
    }

    return {
        id: data.id,
        site_id: data.site_id,
        title: data.title,
        slug: data.slug,
        content: data.content as PageContent,
        author_id: data.author_id,
        status: getStatusFromPublished(data.is_published),
        published_at: data.published_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        meta_data: data.meta_data as ContentMetaData | null
    }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(
    client: SupabaseClient<Database>,
    postId: string
): Promise<void> {
    const { error } = await client
        .from('content')
        .delete()
        .eq('id', postId)
        .eq('content_type', 'blog_post')

    if (error) {
        throw new Error(`Failed to delete blog post: ${error.message}`)
    }
}

/**
 * Check if slug is unique for a site
 */
export async function isSlugUnique(
    client: SupabaseClient<Database>,
    siteId: string,
    slug: string,
    excludePostId?: string
): Promise<boolean> {
    let query = client
        .from('content')
        .select('id')
        .eq('site_id', siteId)
        .eq('content_type', 'blog_post')
        .eq('slug', slug)

    if (excludePostId) {
        query = query.neq('id', excludePostId)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Failed to check slug uniqueness: ${error.message}`)
    }

    return !data || data.length === 0
}

/**
 * Get blog post count for a site
 */
export async function getBlogPostCount(
    client: SupabaseClient<Database>,
    siteId: string,
    filters?: BlogPostFilters
): Promise<number> {
    let query = client
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('content_type', 'blog_post')

    if (filters?.status) {
        query = query.eq('is_published', getPublishedFromStatus(filters.status))
    }

    const { count, error } = await query

    if (error) {
        throw new Error(`Failed to get blog post count: ${error.message}`)
    }

    return count || 0
}
