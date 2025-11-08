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

export type ContentType = 'landing' | 'about' | 'contact' | 'other' | 'blog_post' | 'event';

export interface ContentSortOptions {
  field: 'title' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface ContentFilters extends QueryParams<Content> {
  type?: ContentType | ContentType[];
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
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
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
    .select('*')
    .eq('site_id', siteId);

  // Apply filters
  if (type) {
    if (Array.isArray(type)) {
      countQuery = countQuery.in('content_type', type);
      dataQuery = dataQuery.in('content_type', type);
    } else {
      countQuery = countQuery.eq('content_type', type);
      dataQuery = dataQuery.eq('content_type', type);
    }
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

  // Transform data (tags will be empty for now)
  const transformedData = data.map((item: any) => ({
    ...item,
    tags: [],
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
    .select('*')
    .eq('site_id', siteId)
    .eq('id', contentId)
    .single();

  const data = await handleSingleResponse(response);
  
  // Transform tags (empty for now)
  return {
    ...data,
    tags: [],
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
  // First try to get the most recent published version
  let response = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let data = response.data;

  // If no published version found, get the most recent version regardless of publish status
  if (!data && !response.error) {
    response = await supabase
      .from('content')
      .select('*')
      .eq('site_id', siteId)
      .eq('slug', slug)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    data = response.data;
  }

  // Handle the response
  if (response.error) {
    throw new SupabaseError(response.error.message, response.error.code);
  }

  if (!data) {
    return null as any; // Return null when content is not found instead of throwing error
  }

  // Transform tags and author (no author join for now, can be added later if needed)
  return {
    ...data,
    tags: [],
    author: null,
  } as ContentWithTags;
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
  contentType: ContentType
): Promise<ContentWithTags[]> {
  const query = supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('content_type', contentType)
    .order('created_at', { ascending: false });

  const data = await handleQueryResponse(await query);
  return data.map((item: any) => ({
    ...item,
    tags: [],
    author: null,
  }));
}

/**
 * Get published content
 */
export async function getPublishedContent(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentType?: ContentType
): Promise<ContentWithTags[]> {
  let query = supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const data = await handleQueryResponse(await query);
  return data.map((item: any) => ({
    ...item,
    tags: [],
    author: null,
  }));
}

/**
 * Check if a site has any published blog posts
 * Optimized query that only checks for existence (limit 1)
 */
export async function hasPublishedBlogPosts(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('content_type', 'blog_post')
    .eq('is_published', true);

  if (error) {
    console.error('Error checking for published blog posts:', error);
    return false;
  }

  return (count ?? 0) > 0;
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
    .select('*')
    .eq('site_id', siteId)
    .ilike('title', `%${searchQuery}%`)
    .order('created_at', { ascending: false });

  const data = await handleQueryResponse(await query);
  return data.map((item: any) => ({
    ...item,
    tags: [],
    author: null,
  }));
}

/**
 * Enhanced search result interface for full-text search
 */
export interface EnhancedSearchResult {
  id: string;
  title: string;
  content_type: string;
  slug: string;
  excerpt: string;
  is_published: boolean;
  relevance: number;
  updated_at: string;
}

/**
 * Enhanced search content with full-text search and ranking
 * Falls back to basic search if RPC function fails
 */
export async function searchContentEnhanced(
  supabase: SupabaseClient<Database>,
  siteId: string,
  searchQuery: string,
  limit: number = 10
): Promise<EnhancedSearchResult[]> {
  try {
    // Attempt to use the enhanced RPC function
    const { data, error } = await supabase
      .rpc('search_content_global' as any, {
        search_query: searchQuery,
        site_id_param: siteId,
        result_limit: limit
      });

    if (error) {
      throw error;
    }

    // Type assertion for the RPC result since it's not in generated types yet
    const typedData = data as EnhancedSearchResult[];
    return typedData || [];
  } catch (error: unknown) {
    // Fall back to the existing searchContent function
    
    const fallbackResults = await searchContent(supabase, siteId, searchQuery);
    
    // Transform to match the enhanced interface
    return fallbackResults.slice(0, limit).map((item) => ({
      id: item.id,
      title: item.title,
      content_type: item.content_type,
      slug: item.slug,
      excerpt: (item.meta_data as any)?.description || (item.content as any)?.text?.substring(0, 150) || '',
      is_published: item.is_published || false,
      relevance: 0.5, // Default relevance for fallback results
      updated_at: item.updated_at,
    }));
  }
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
      .in('content_type', ['landing', 'about', 'contact', 'other']),
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

/**
 * Generate a unique slug for content within a site
 * Automatically appends -1, -2, etc. if the base slug is taken
 */
export async function generateUniqueContentSlug(
  supabase: SupabaseClient<Database>,
  title: string,
  siteId: string,
  excludeId?: string
): Promise<string> {
  // Generate base slug from title
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length

  // If empty after processing, use a fallback
  if (!baseSlug) {
    return `page-${Date.now()}`;
  }

  // Build query to find existing slugs with this base
  let query = supabase
    .from('content')
    .select('slug')
    .eq('site_id', siteId)
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  // Exclude current content if editing
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking slug uniqueness:', error);
    // In case of error, append timestamp to ensure uniqueness
    return `${baseSlug}-${Date.now()}`;
  }

  // If no conflicts, return the base slug
  if (!data || data.length === 0) {
    return baseSlug;
  }

  // Create a Set for O(1) conflict checking
  const existingSlugs = new Set(data.map(item => item.slug));

  // If base slug doesn't exist, use it
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Find the next available number suffix
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;

    // Safety check to prevent infinite loops
    if (counter > 1000) {
      // Fallback to timestamp if too many iterations
      return `${baseSlug}-${Date.now()}`;
    }
  }

  return uniqueSlug;
}

/**
 * Handle publishing a special page (home, about, contact)
 * - Finds any existing published page with the canonical slug
 * - Renames and unpublishes the existing page
 * - Sets the new page's slug to canonical and publishes it
 */
export async function handleSpecialPagePublish(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string,
  pageType: 'home' | 'about' | 'contact'
): Promise<Content> {
  const canonicalSlug = pageType

  // Find any existing content with the canonical slug
  const existingResponse = await supabase
    .from('content')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', canonicalSlug)
    .neq('id', contentId)
    .maybeSingle()

  // If there's an existing page with this slug, rename it and unpublish it
  if (existingResponse.data) {
    const timestamp = Date.now()
    const archivedSlug = `${canonicalSlug}-archived-${timestamp}`

    await supabase
      .from('content')
      .update({
        slug: archivedSlug,
        is_published: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingResponse.data.id)
  }

  // Update the new page: set canonical slug and publish
  const updateData: UpdateContent = {
    slug: canonicalSlug,
    is_published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const response = await supabase
    .from('content')
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', contentId)
    .select()
    .single()

  return handleSingleResponse(response)
}

/**
 * Handle unpublishing a special page (about, contact)
 * - If the page has a canonical slug (about/contact), rename it to free up the slug
 * - Unpublish the page
 */
export async function handleSpecialPageUnpublish(
  supabase: SupabaseClient<Database>,
  siteId: string,
  contentId: string,
  currentSlug: string
): Promise<Content> {
  const specialSlugs = ['about', 'contact']
  let newSlug = currentSlug

  // If current slug is a special/canonical slug, rename it
  if (specialSlugs.includes(currentSlug)) {
    const timestamp = Date.now()
    newSlug = `${currentSlug}-draft-${timestamp}`
  }

  const updateData: UpdateContent = {
    slug: newSlug,
    is_published: false,
    updated_at: new Date().toISOString()
  }

  const response = await supabase
    .from('content')
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', contentId)
    .select()
    .single()

  return handleSingleResponse(response)
}