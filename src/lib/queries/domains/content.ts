/**
 * Content-related query functions
 * Handles all database operations for content (pages, blog posts, events)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  handleCountResponse,
  buildPaginatedResponse,
  calculateOffset,
  buildSearchConditions,
  filterUndefined,
  buildOrderBy,
  PaginatedResponse,
  QueryParams,
  RowType,
  InsertType,
  UpdateType
} from '../base';
import { SupabaseError } from '../errors';

type Content = RowType<'content'>;
type InsertContent = InsertType<'content'>;
type UpdateContent = UpdateType<'content'>;

export type ContentType = 'page' | 'blog_post' | 'event';

export interface ContentSortOptions {
  field: 'title' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface ContentFilters extends QueryParams<Content> {
  type?: ContentType;
  published?: boolean;
  featured?: boolean;
  authorId?: string;
}

export interface ContentWithTags extends Content {
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

/**
 * Get paginated content list
 */
export async function getContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  filters: ContentFilters = {}
): Promise<PaginatedResponse<ContentWithTags>> {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    type, 
    published, 
    featured,
    authorId,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Build base query
  let countQuery = supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId);

  let dataQuery = supabase
    .from('content')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId);

  // Apply filters
  if (type) {
    countQuery = countQuery.eq('content_type', type);
    dataQuery = dataQuery.eq('content_type', type);
  }

  if (published !== undefined) {
    countQuery = countQuery.eq('is_published', published);
    dataQuery = dataQuery.eq('is_published', published);
  }

  if (featured !== undefined) {
    countQuery = countQuery.eq('is_featured', featured);
    dataQuery = dataQuery.eq('is_featured', featured);
  }

  if (authorId) {
    countQuery = countQuery.eq('author_id', authorId);
    dataQuery = dataQuery.eq('author_id', authorId);
  }

  // Apply search
  if (search) {
    const searchCondition = `title.ilike.%${search}%`;
    countQuery = countQuery.or(searchCondition);
    dataQuery = dataQuery.or(searchCondition);
  }

  // Get count
  const count = await handleCountResponse(await countQuery);

  // Apply pagination and sorting
  const offset = calculateOffset(page, limit);
  const orderBy = buildOrderBy<Content>(sortBy, sortOrder);
  
  if (orderBy) {
    dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending });
  }
  
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute query
  const data = await handleQueryResponse(await dataQuery);

  // Transform data to flatten tags
  const transformedData = data.map((item: any) => ({
    ...item,
    tags: item.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  }));

  return buildPaginatedResponse(transformedData, count, page, limit);
}

/**
 * Get a single content item by ID
 */
export async function getContentById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string
): Promise<ContentWithTags> {
  const response = await supabase
    .from('content')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('id', contentId)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags.map((t: any) => t.tag).filter(Boolean) : [],
  };
}

/**
 * Get content by slug
 */
export async function getContentBySlug(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string
): Promise<ContentWithTags> {
  const response = await supabase
    .from('content')
    .select(`
      *,
      tags:taggings(
        tag:tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags.map((t: any) => t.tag).filter(Boolean) : [],
  };
}

/**
 * Create new content
 */
export async function createContent(
  supabase: SupabaseClient<Database>,
  data: InsertContent,
  tagIds?: string[]
): Promise<Content> {
  // Create content
  const response = await supabase
    .from('content')
    .insert(data)
    .select()
    .single();

  const content = await handleSingleResponse(response);

  // Add tags if provided
  if (tagIds && tagIds.length > 0) {
    const taggings = tagIds.map(tagId => ({
      tag_id: tagId,
      taggable_id: content.id,
      taggable_type: 'content' as const,
    }));

    const { error } = await supabase
      .from('taggings')
      .insert(taggings);

    if (error) {
      console.error('Failed to add tags:', error);
      // Don't throw - content was created successfully
    }
  }

  return content;
}

/**
 * Update content
 */
export async function updateContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string,
  data: UpdateContent,
  tagIds?: string[]
): Promise<Content> {
  const filteredData = filterUndefined(data);
  
  // Update content
  const response = await supabase
    .from('content')
    .update({
      ...filteredData,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', contentId)
    .select()
    .single();

  const content = await handleSingleResponse(response);

  // Update tags if provided
  if (tagIds !== undefined) {
    // Remove existing tags
    await supabase
      .from('taggings')
      .delete()
      .eq('taggable_id', contentId)
      .eq('taggable_type', 'content');

    // Add new tags
    if (tagIds.length > 0) {
      const taggings = tagIds.map(tagId => ({
        tag_id: tagId,
        taggable_id: contentId,
        taggable_type: 'content' as const,
      }));

      const { error } = await supabase
        .from('taggings')
        .insert(taggings);

      if (error) {
        console.error('Failed to update tags:', error);
      }
    }
  }

  return content;
}

/**
 * Delete content
 */
export async function deleteContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string
): Promise<void> {
  const response = await supabase
    .from('content')
    .delete()
    .eq('site_id', siteId)
    .eq('id', contentId);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Publish/unpublish content
 */
export async function toggleContentPublished(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string,
  published: boolean
): Promise<Content> {
  const updateData: UpdateContent = {
    is_published: published,
    updated_at: new Date().toISOString(),
  };

  if (published) {
    updateData.published_at = new Date().toISOString();
  }

  const response = await supabase
    .from('content')
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', contentId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Toggle featured status
 */
export async function toggleContentFeatured(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string,
  featured: boolean
): Promise<Content> {
  const response = await supabase
    .from('content')
    .update({
      is_featured: featured,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', contentId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Reorder content
 */
export async function reorderContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string,
  newOrder: number
): Promise<Content> {
  const response = await supabase
    .from('content')
    .update({
      sort_order: newOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', contentId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Get content by type
 */
export async function getContentByType(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentType: 'page' | 'blog_post' | 'event'
): Promise<ContentWithTags[]> {
  const query = supabase
    .from('content')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      tags:taggings(
        tag:tags(id, name, slug)
      )
    `)
    .eq('site_id', siteId)
    .eq('content_type', contentType)
    .order('created_at', { ascending: false });

  const data = await handleQueryResponse(await query);
  return data.map((item: any) => ({
    ...item,
    tags: item.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  }));
}

/**
 * Get published content
 */
export async function getPublishedContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentType?: 'page' | 'blog_post' | 'event'
): Promise<ContentWithTags[]> {
  let query = supabase
    .from('content')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      tags:taggings(
        tag:tags(id, name, slug)
      )
    `)
    .eq('site_id', siteId)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const data = await handleQueryResponse(await query);
  return data.map((item: any) => ({
    ...item,
    tags: item.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  }));
}

/**
 * Search content
 */
export async function searchContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  searchQuery: string
): Promise<ContentWithTags[]> {
  const query = supabase
    .from('content')
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      tags:taggings(
        tag:tags(id, name, slug)
      )
    `)
    .eq('site_id', siteId)
    .or(`title.ilike.%${searchQuery}%,meta_description.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false });

  const data = await handleQueryResponse(await query);
  return data.map((item: any) => ({
    ...item,
    tags: item.tags?.map((t: any) => t.tag).filter(Boolean) || [],
  }));
}

/**
 * Get content statistics
 */
export async function getContentStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  total: number;
  published: number;
  draft: number;
  pages: number;
  blogPosts: number;
  events: number;
}> {
  const [
    total,
    published,
    pages,
    blogPosts,
    events
  ] = await Promise.all([
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_published', true),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('content_type', 'page'),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('content_type', 'blog_post'),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('content_type', 'event'),
  ]);

  const totalCount = total.count || 0;
  const publishedCount = published.count || 0;

  return {
    total: totalCount,
    published: publishedCount,
    draft: totalCount - publishedCount,
    pages: pages.count || 0,
    blogPosts: blogPosts.count || 0,
    events: events.count || 0,
  };
}

/**
 * Check slug availability
 */
export async function checkSlugAvailability(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('content')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const response = await query.maybeSingle();

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }

  return response.data === null;
}