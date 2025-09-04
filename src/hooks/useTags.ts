'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queries/keys';
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
} from '@/lib/queries/domains/tags';
import { useSiteId } from '@/src/contexts/SiteContext';
import { Tag, TagInsert, TagUpdate } from '@/lib/database/aliases';
import { supabase } from '@/lib/supabase/client';

// Get all tags for the site
export function useTags() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.tags.all(siteId!),
    queryFn: () => getTags(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get popular tags
export function usePopularTags(limit: number = 10) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.tags.all(siteId!), 'popular', limit],
    queryFn: () => getPopularTags(supabase, siteId!, limit),
    enabled: !!siteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get tags for a specific resource
export function useResourceTags(resourceType: 'content' | 'product', resourceId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: resourceType === 'content' 
      ? queryKeys.tags.byContent(siteId!, resourceId)
      : queryKeys.tags.byProduct(siteId!, resourceId),
    queryFn: () => resourceType === 'content' 
      ? getTagsForContent(supabase, resourceId)
      : getTagsForProduct(supabase, resourceId),
    enabled: !!siteId && !!resourceId,
  });
}

// Create tag mutation
export function useCreateTag() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<TagInsert, 'site_id'>) => 
      createTag(supabase, { ...data, site_id: siteId! }),
    onSuccess: () => {
      toast.success('Tag created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all(siteId!) });
    },
    onError: () => {
      toast.error('Failed to create tag');
    },
  });
}

// Update tag mutation
export function useUpdateTag() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: TagUpdate & { id: string }) => 
      updateTag(supabase, siteId!, id, data),
    onSuccess: () => {
      toast.success('Tag updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all(siteId!) });
    },
    onError: () => {
      toast.error('Failed to update tag');
    },
  });
}

// Delete tag mutation
export function useDeleteTag() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteTag(supabase, siteId!, id),
    onSuccess: () => {
      toast.success('Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all(siteId!) });
    },
    onError: () => {
      toast.error('Failed to delete tag');
    },
  });
}

// Add tag to resource
export function useAddTag() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      tagId, 
      resourceType, 
      resourceId 
    }: { 
      tagId: string; 
      resourceType: 'content' | 'product'; 
      resourceId: string;
    }) => resourceType === 'content' 
      ? addTagsToContent(supabase, resourceId, [tagId])
      : addTagsToProduct(supabase, resourceId, [tagId]),
    onSuccess: (_, variables) => {
      toast.success('Tag added successfully');
      // Invalidate both tag queries and resource queries
      queryClient.invalidateQueries({ 
        queryKey: variables.resourceType === 'content'
          ? queryKeys.tags.byContent(siteId!, variables.resourceId)
          : queryKeys.tags.byProduct(siteId!, variables.resourceId)
      });
      if (variables.resourceType === 'content') {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.content.detail(siteId!, variables.resourceId) 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.products.detail(siteId!, variables.resourceId) 
        });
      }
    },
    onError: () => {
      toast.error('Failed to add tag');
    },
  });
}

// Remove tag from resource
export function useRemoveTag() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      tagId, 
      resourceType, 
      resourceId 
    }: { 
      tagId: string; 
      resourceType: 'content' | 'product'; 
      resourceId: string;
    }) => resourceType === 'content' 
      ? removeTagsFromContent(supabase, resourceId, [tagId])
      : removeTagsFromProduct(supabase, resourceId, [tagId]),
    onSuccess: (_, variables) => {
      toast.success('Tag removed successfully');
      // Invalidate both tag queries and resource queries
      queryClient.invalidateQueries({ 
        queryKey: variables.resourceType === 'content'
          ? queryKeys.tags.byContent(siteId!, variables.resourceId)
          : queryKeys.tags.byProduct(siteId!, variables.resourceId)
      });
      if (variables.resourceType === 'content') {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.content.detail(siteId!, variables.resourceId) 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.products.detail(siteId!, variables.resourceId) 
        });
      }
    },
    onError: () => {
      toast.error('Failed to remove tag');
    },
  });
}

// Hook for tag autocomplete/search
export function useTagSearch(query: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.tags.list(siteId!, { search: query }),
    queryFn: async () => {
      return await getTags(supabase, siteId!, { search: query });
    },
    enabled: !!siteId && query.length > 1,
    staleTime: 30 * 1000,
  });
}