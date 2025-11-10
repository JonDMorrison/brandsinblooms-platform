/**
 * Tag-related query functions
 * Handles all database operations for tags and tagging system
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  filterUndefined,
  RowType,
  InsertType,
  UpdateType
} from '../base';
import { SupabaseError } from '../errors';

type Tag = RowType<'tags'>;
type Tagging = RowType<'taggings'>;
type InsertTag = InsertType<'tags'>;
type UpdateTag = UpdateType<'tags'>;

export interface TagWithCount extends Tag {
  usageCount?: number;
}

/**
 * Get all tags for a site
 */
export async function getTags(
  supabase: SupabaseClient<Database>,
  siteId: string,
  options?: { search?: string }
): Promise<TagWithCount[]> {
  let query = supabase
    .from('tags')
    .select(`
      *,
      taggings(count)
    `)
    .eq('site_id', siteId)
    .order('name');

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,slug.ilike.%${options.search}%`);
  }

  const tags = await handleQueryResponse(await query);

  // Transform to include usage count
  return tags.map((tag: any) => ({
    ...tag,
    usageCount: tag.taggings?.[0]?.count || 0,
  }));
}

/**
 * Get a single tag by ID
 */
export async function getTagById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  tagId: string
): Promise<Tag> {
  const response = await supabase
    .from('tags')
    .select('*')
    .eq('site_id', siteId)
    .eq('id', tagId)
    .single();

  return handleSingleResponse(response);
}

/**
 * Get tag by slug
 */
export async function getTagBySlug(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string
): Promise<Tag> {
  const response = await supabase
    .from('tags')
    .select('*')
    .eq('site_id', siteId)
    .eq('slug', slug)
    .single();

  return handleSingleResponse(response);
}

/**
 * Get tags for content
 */
export async function getTagsForContent(
  supabase: SupabaseClient<Database>,
  contentId: string
): Promise<Tag[]> {
  const response = await supabase
    .from('taggings')
    .select(`
      tag:tags(*)
    `)
    .eq('taggable_id', contentId)
    .eq('taggable_type', 'content');

  const taggings = await handleQueryResponse(response);
  return taggings.map((t: any) => t.tag).filter(Boolean);
}

/**
 * Get tags for product
 */
export async function getTagsForProduct(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<Tag[]> {
  const response = await supabase
    .from('taggings')
    .select(`
      tag:tags(*)
    `)
    .eq('taggable_id', productId)
    .eq('taggable_type', 'product');

  const taggings = await handleQueryResponse(response);
  return taggings.map((t: any) => t.tag).filter(Boolean);
}

/**
 * Get content IDs by tag
 */
export async function getContentIdsByTag(
  supabase: SupabaseClient<Database>,
  tagId: string
): Promise<string[]> {
  const response = await supabase
    .from('taggings')
    .select('taggable_id')
    .eq('tag_id', tagId)
    .eq('taggable_type', 'content');

  const taggings = await handleQueryResponse(response);
  return taggings.map(t => t.taggable_id);
}

/**
 * Get product IDs by tag
 */
export async function getProductIdsByTag(
  supabase: SupabaseClient<Database>,
  tagId: string
): Promise<string[]> {
  const response = await supabase
    .from('taggings')
    .select('taggable_id')
    .eq('tag_id', tagId)
    .eq('taggable_type', 'product');

  const taggings = await handleQueryResponse(response);
  return taggings.map(t => t.taggable_id);
}

/**
 * Create a new tag
 */
export async function createTag(
  supabase: SupabaseClient<Database>,
  data: InsertTag
): Promise<Tag> {
  const response = await supabase
    .from('tags')
    .insert(data)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update a tag
 */
export async function updateTag(
  supabase: SupabaseClient<Database>,
  siteId: string,
  tagId: string,
  data: UpdateTag
): Promise<Tag> {
  const filteredData = filterUndefined(data);
  
  const response = await supabase
    .from('tags')
    .update(filteredData)
    .eq('site_id', siteId)
    .eq('id', tagId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Delete a tag
 */
export async function deleteTag(
  supabase: SupabaseClient<Database>,
  siteId: string,
  tagId: string
): Promise<void> {
  const response = await supabase
    .from('tags')
    .delete()
    .eq('site_id', siteId)
    .eq('id', tagId);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Add tags to content
 */
export async function addTagsToContent(
  supabase: SupabaseClient<Database>,
  contentId: string,
  tagIds: string[]
): Promise<void> {
  if (tagIds.length === 0) return;

  const taggings = tagIds.map(tagId => ({
    tag_id: tagId,
    taggable_id: contentId,
    taggable_type: 'content' as const,
  }));

  const response = await supabase
    .from('taggings')
    .insert(taggings);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Add tags to product
 */
export async function addTagsToProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  tagIds: string[]
): Promise<void> {
  if (tagIds.length === 0) return;

  const taggings = tagIds.map(tagId => ({
    tag_id: tagId,
    taggable_id: productId,
    taggable_type: 'product' as const,
  }));

  const response = await supabase
    .from('taggings')
    .insert(taggings);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Remove tags from content
 */
export async function removeTagsFromContent(
  supabase: SupabaseClient<Database>,
  contentId: string,
  tagIds?: string[]
): Promise<void> {
  let query = supabase
    .from('taggings')
    .delete()
    .eq('taggable_id', contentId)
    .eq('taggable_type', 'content');

  if (tagIds && tagIds.length > 0) {
    query = query.in('tag_id', tagIds);
  }

  const response = await query;

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Remove tags from product
 */
export async function removeTagsFromProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  tagIds?: string[]
): Promise<void> {
  let query = supabase
    .from('taggings')
    .delete()
    .eq('taggable_id', productId)
    .eq('taggable_type', 'product');

  if (tagIds && tagIds.length > 0) {
    query = query.in('tag_id', tagIds);
  }

  const response = await query;

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Sync tags for content (replace all)
 */
export async function syncTagsForContent(
  supabase: SupabaseClient<Database>,
  contentId: string,
  tagIds: string[]
): Promise<void> {
  // Remove all existing tags
  await removeTagsFromContent(supabase, contentId);
  
  // Add new tags
  if (tagIds.length > 0) {
    await addTagsToContent(supabase, contentId, tagIds);
  }
}

/**
 * Sync tags for product (replace all)
 */
export async function syncTagsForProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  tagIds: string[]
): Promise<void> {
  // Remove all existing tags
  await removeTagsFromProduct(supabase, productId);
  
  // Add new tags
  if (tagIds.length > 0) {
    await addTagsToProduct(supabase, productId, tagIds);
  }
}

/**
 * Check tag slug availability
 */
export async function checkTagSlugAvailability(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('tags')
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
 * Get popular tags
 */
export async function getPopularTags(
  supabase: SupabaseClient<Database>,
  siteId: string,
  limit: number = 10
): Promise<TagWithCount[]> {
  // Get all tags with their usage counts
  const response = await supabase
    .from('tags')
    .select(`
      *,
      taggings(count)
    `)
    .eq('site_id', siteId);

  const tags = await handleQueryResponse(response);

  // Transform and sort by usage count
  const tagsWithCount = tags
    .map((tag: any) => ({
      ...tag,
      usageCount: tag.taggings?.[0]?.count || 0,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);

  return tagsWithCount;
}

/**
 * Merge tags
 */
export async function mergeTags(
  supabase: SupabaseClient<Database>,
  siteId: string,
  sourceTagId: string,
  targetTagId: string
): Promise<void> {
  // Get all taggings for source tag
  const response = await supabase
    .from('taggings')
    .select('*')
    .eq('tag_id', sourceTagId);

  const sourceTaggings = await handleQueryResponse(response);

  // Update taggings to use target tag (avoiding duplicates)
  for (const tagging of sourceTaggings) {
    // Check if target tag already exists for this item
    const existing = await supabase
      .from('taggings')
      .select('id')
      .eq('tag_id', targetTagId)
      .eq('taggable_id', tagging.taggable_id)
      .eq('taggable_type', tagging.taggable_type)
      .maybeSingle();

    if (!existing.data) {
      // Update the tagging to use target tag
      await supabase
        .from('taggings')
        .update({ tag_id: targetTagId })
        .eq('id', tagging.id);
    } else {
      // Delete duplicate tagging
      await supabase
        .from('taggings')
        .delete()
        .eq('id', tagging.id);
    }
  }

  // Delete source tag
  await deleteTag(supabase, siteId, sourceTagId);
}