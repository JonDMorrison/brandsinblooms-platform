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
  addTagToResource,
  removeTagFromResource,
  getResourceTags
} from '@/lib/queries/domains/tags';
import { useSiteId } from '@/contexts/SiteContext';
import { Tag, InsertTag, UpdateTag } from '@/lib/database/types';
import { supabase } from '@/lib/supabase/client';

// Get all tags for the site
export function useTags() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.tags(siteId!),
    queryFn: () => getTags(siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get popular tags
export function usePopularTags(limit: number = 10) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.tags(siteId!), 'popular', limit],
    queryFn: () => getPopularTags(siteId!, limit),
    enabled: !!siteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get tags for a specific resource
export function useResourceTags(resourceType: 'content' | 'product', resourceId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.tags(siteId!), resourceType, resourceId],
    queryFn: () => getResourceTags(resourceType, resourceId),
    enabled: !!siteId && !!resourceId,
  });
}

// Create tag mutation
export function useCreateTag() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<InsertTag, 'site_id'>) => 
      createTag({ ...data, site_id: siteId! }),
    onSuccess: () => {
      toast.success('Tag created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags(siteId!) });
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
    mutationFn: ({ id, ...data }: UpdateTag & { id: string }) => 
      updateTag(id, data),
    onSuccess: () => {
      toast.success('Tag updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags(siteId!) });
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
    mutationFn: deleteTag,
    onSuccess: () => {
      toast.success('Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.tags(siteId!) });
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
    }) => addTagToResource(tagId, resourceType, resourceId),
    onSuccess: (_, variables) => {
      toast.success('Tag added successfully');
      // Invalidate both tag queries and resource queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.tags(siteId!), variables.resourceType, variables.resourceId] 
      });
      if (variables.resourceType === 'content') {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.contentItem(siteId!, variables.resourceId) 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.product(siteId!, variables.resourceId) 
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
    }) => removeTagFromResource(tagId, resourceType, resourceId),
    onSuccess: (_, variables) => {
      toast.success('Tag removed successfully');
      // Invalidate both tag queries and resource queries
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.tags(siteId!), variables.resourceType, variables.resourceId] 
      });
      if (variables.resourceType === 'content') {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.contentItem(siteId!, variables.resourceId) 
        });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.product(siteId!, variables.resourceId) 
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
    queryKey: [...queryKeys.tags(siteId!), 'search', query],
    queryFn: async () => {
      const tags = await getTags(siteId!);
      return tags.filter(tag => 
        tag.name.toLowerCase().includes(query.toLowerCase())
      );
    },
    enabled: !!siteId && query.length > 1,
    staleTime: 30 * 1000,
  });
}