'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queries/keys';
import { 
  getContent, 
  getContentById, 
  createContent, 
  updateContent, 
  deleteContent,
  getContentByType,
  getPublishedContent,
  searchContent,
  getContentStats,
  ContentFilters,
  ContentSortOptions
} from '@/lib/queries/domains/content';
import { useSiteId } from '@/contexts/SiteContext';
import { Content, InsertContent, UpdateContent } from '@/lib/database/types';

// Main content query hook
export function useContent(filters?: ContentFilters, sort?: ContentSortOptions) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.content.list(siteId!, filters),
    queryFn: () => getContent(supabase, siteId!, filters, sort),
    enabled: !!siteId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single content item
export function useContentItem(contentId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.content.detail(siteId!, contentId),
    queryFn: () => getContentById(supabase, contentId),
    enabled: !!siteId && !!contentId,
  });
}

// Get content by type
export function useContentByType(contentType: 'page' | 'blog_post' | 'event') {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.contentByType(siteId!, contentType),
    queryFn: () => getContentByType(supabase, siteId!, contentType),
    enabled: !!siteId,
    staleTime: 30 * 1000,
  });
}

// Get published content
export function usePublishedContent(contentType?: 'page' | 'blog_post' | 'event') {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.content.all(siteId!), 'published', contentType],
    queryFn: () => getPublishedContent(supabase, siteId!, contentType),
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute for published content
  });
}

// Search content
export function useSearchContent(searchQuery: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.content.all(siteId!), 'search', searchQuery],
    queryFn: () => searchContent(supabase, siteId!, searchQuery),
    enabled: !!siteId && searchQuery.length > 2,
    staleTime: 10 * 1000,
  });
}

// Content statistics
export function useContentStats() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: [...queryKeys.content.all(siteId!), 'stats'],
    queryFn: () => getContentStats(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 60 * 1000,
  });
}

// Create content mutation
export function useCreateContent() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<InsertContent, 'site_id' | 'author_id'>) => 
      createContent(supabase, { ...data, site_id: siteId! }),
    onMutate: async (newContent) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all(siteId!) });
      
      // Snapshot previous value
      const previousContent = queryClient.getQueryData(queryKeys.content.all(siteId!));
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.content.all(siteId!), (old: Content[] = []) => [
        {
          ...newContent,
          id: crypto.randomUUID(),
          site_id: siteId!,
          author_id: '', // Will be set by server
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Content,
        ...old,
      ]);
      
      return { previousContent };
    },
    onError: (err, newContent, context) => {
      // Revert on error
      if (context?.previousContent) {
        queryClient.setQueryData(queryKeys.content.all(siteId!), context.previousContent);
      }
      toast.error('Failed to create content');
    },
    onSuccess: (data) => {
      toast.success('Content created successfully');
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all(siteId!) });
    },
  });
}

// Update content mutation
export function useUpdateContent() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateContent & { id: string }) => 
      updateContent(supabase, id, data),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.detail(siteId!, id) });
      
      const previousContent = queryClient.getQueryData(queryKeys.content.detail(siteId!, id));
      
      queryClient.setQueryData(queryKeys.content.detail(siteId!, id), (old: Content) => ({
        ...old,
        ...updates,
        updated_at: new Date().toISOString(),
      }));
      
      return { previousContent };
    },
    onError: (err, variables, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(
          queryKeys.content.detail(siteId!, variables.id), 
          context.previousContent
        );
      }
      toast.error('Failed to update content');
    },
    onSuccess: () => {
      toast.success('Content updated successfully');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all(siteId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.content.detail(siteId!, variables.id) });
    },
  });
}

// Delete content mutation
export function useDeleteContent() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteContent(supabase, id),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all(siteId!) });
      
      const previousContent = queryClient.getQueryData(queryKeys.content.all(siteId!));
      
      queryClient.setQueryData(queryKeys.content.all(siteId!), (old: Content[] = []) => 
        old.filter(content => content.id !== contentId)
      );
      
      return { previousContent };
    },
    onError: (err, contentId, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(queryKeys.content.all(siteId!), context.previousContent);
      }
      toast.error('Failed to delete content');
    },
    onSuccess: () => {
      toast.success('Content deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.content.all(siteId!) });
    },
  });
}

// Real-time subscription hook
export function useContentRealtime() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!siteId) return;
    
    const channel = supabase
      .channel(`content-${siteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `site_id=eq.${siteId}`,
        },
        (payload) => {
          // Invalidate queries when data changes
          queryClient.invalidateQueries({ queryKey: queryKeys.content.all(siteId) });
          
          // Handle specific events if needed
          if (payload.eventType === 'INSERT') {
            toast.info('New content added');
          } else if (payload.eventType === 'UPDATE') {
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.content.detail(siteId, payload.new.id) 
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId, queryClient]);
}