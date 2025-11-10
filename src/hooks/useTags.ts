'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { toast } from 'sonner';
import { 
  getTags, 
  getPopularTags, 
  createTag, 
  updateTag, 
  deleteTag,
  addTagsToContent,
  addTagsToProduct,
  removeTagsFromContent,
  removeTagsFromProduct,
  getTagsForContent,
  getTagsForProduct
} from '@/src/lib/queries/domains/tags';
import { useSiteId } from '@/src/contexts/SiteContext';
import { Tag, TagInsert, TagUpdate } from '@/src/lib/database/aliases';
import { supabase } from '@/src/lib/supabase/client';

// Get all tags for the site
export function useTags() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => getTags(supabase, siteId!),
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Get popular tags
export function usePopularTags(limit: number = 10) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => getPopularTags(supabase, siteId!, limit),
    {
      enabled: !!siteId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

// Get tags for a specific resource
export function useResourceTags(resourceType: 'content' | 'product', resourceId: string) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => resourceType === 'content' 
      ? getTagsForContent(supabase, resourceId)
      : getTagsForProduct(supabase, resourceId),
    {
      enabled: !!siteId && !!resourceId,
    }
  );
}

// Create tag mutation
export function useCreateTag() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    (data: Omit<TagInsert, 'site_id'>, signal) => 
      createTag(supabase, { ...data, site_id: siteId! }),
    {
      showSuccessToast: 'Tag created successfully',
    }
  );
}

// Update tag mutation
export function useUpdateTag() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    ({ id, ...data }: TagUpdate & { id: string }, signal) => 
      updateTag(supabase, siteId!, id, data),
    {
      showSuccessToast: 'Tag updated successfully',
    }
  );
}

// Delete tag mutation
export function useDeleteTag() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    (id: string, signal) => deleteTag(supabase, siteId!, id),
    {
      showSuccessToast: 'Tag deleted successfully',
    }
  );
}

// Add tag to resource
export function useAddTag() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    ({ 
      tagId, 
      resourceType, 
      resourceId 
    }: { 
      tagId: string; 
      resourceType: 'content' | 'product'; 
      resourceId: string;
    }, signal) => resourceType === 'content' 
      ? addTagsToContent(supabase, resourceId, [tagId])
      : addTagsToProduct(supabase, resourceId, [tagId]),
    {
      showSuccessToast: 'Tag added successfully',
    }
  );
}

// Remove tag from resource
export function useRemoveTag() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    ({ 
      tagId, 
      resourceType, 
      resourceId 
    }: { 
      tagId: string; 
      resourceType: 'content' | 'product'; 
      resourceId: string;
    }, signal) => resourceType === 'content' 
      ? removeTagsFromContent(supabase, resourceId, [tagId])
      : removeTagsFromProduct(supabase, resourceId, [tagId]),
    {
      showSuccessToast: 'Tag removed successfully',
    }
  );
}

// Hook for tag autocomplete/search
export function useTagSearch(query: string) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal) => {
      return await getTags(supabase, siteId!, { search: query });
    },
    {
      enabled: !!siteId && query.length > 1,
      staleTime: 30 * 1000,
    }
  );
}