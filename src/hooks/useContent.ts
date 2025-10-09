'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { debug } from '@/src/lib/utils/debug';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
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
import { useSiteId } from '@/src/contexts/SiteContext';
import { Content, InsertContent, ContentUpdate } from '@/lib/database/aliases';
import { handleError } from '@/lib/types/error-handling';
import { emitContentChange } from '@/src/lib/events/content-events';

// Cache management utilities
const clearContentCaches = (siteId: string) => {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  const contentKeys = keys.filter(key =>
    key.includes(`content-`) && key.includes(`-${siteId}-`)
  );

  contentKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear cache key:', key, error);
    }
  });
};

// Validation utilities to ensure data matches current site
const validateContentData = (data: unknown, currentSiteId: string): boolean => {
  if (!data || !currentSiteId) return false;

  try {
    // Handle array of content items
    if (Array.isArray(data)) {
      return data.every(item =>
        item && typeof item === 'object' &&
        'site_id' in item &&
        item.site_id === currentSiteId
      );
    }

    // Handle single content item
    if (typeof data === 'object' && 'site_id' in data) {
      return data.site_id === currentSiteId;
    }

    // Handle API response with data property
    if (typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      return data.data.every((item: any) =>
        item && typeof item === 'object' &&
        'site_id' in item &&
        item.site_id === currentSiteId
      );
    }

    // For stats or other data without site_id, always validate as true
    // since the query itself is scoped to the site
    return true;
  } catch (error) {
    debug.content('Error validating content data:', error);
    return false;
  }
};

const logDataValidation = (queryType: string, isValid: boolean, currentSiteId: string, data: unknown) => {
  debug.content(`${queryType}:`, {
    isValid,
    currentSiteId,
    dataType: Array.isArray(data) ? 'array' : typeof data,
    dataCount: Array.isArray(data) ? data.length : 'n/a',
    firstItemSiteId: Array.isArray(data) && data.length > 0 && data[0] ? data[0].site_id : 'n/a'
  });
};

const clearSpecificContentCache = (siteId: string, contentId?: string) => {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  const keysToRemove = contentId 
    ? keys.filter(key => 
        key.includes(`content-`) && 
        key.includes(`-${siteId}-`) && 
        (key.includes(`-${contentId}`) || key.includes('list') || key.includes('stats'))
      )
    : keys.filter(key => 
        key.includes(`content-`) && key.includes(`-${siteId}-`)
      );
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear cache key:', key, error);
    }
  });
};

// Main content query hook with validation
export function useContent(filters?: ContentFilters, sort?: ContentSortOptions) {
  const siteId = useSiteId();

  const memoizedDeps = useMemo(() => [
    siteId,
    JSON.stringify(filters || {}),
    JSON.stringify(sort || {})
  ], [siteId, filters, sort]);

  const queryResult = useSupabaseQuery(
    (signal) => getContent(supabase, siteId!, filters),
    {
      enabled: !!siteId,
      staleTime: 2 * 60 * 1000, // 2 minutes for better performance
      persistKey: `content-list-${siteId}-${JSON.stringify(filters || {})}-${JSON.stringify(sort || {})}`,
      onSuccess: (data) => {
        // Validate that returned data belongs to current site
        if (siteId) {
          const isValid = validateContentData(data, siteId);
          logDataValidation('useContent', isValid, siteId, data);

          if (!isValid) {
            debug.content('Received invalid content data for site:', siteId);
            // Clear cache to force refetch with correct data
            clearContentCaches(siteId);
          }
        }
      }
    },
    memoizedDeps
  );

  // SIMPLIFIED: Don't filter data in useMemo as it can cause loading state issues
  // Just log validation but return the data as-is to avoid state confusion
  const validatedData = useMemo(() => {
    if (!queryResult.data || !siteId) {
      debug.content('No data or siteId:', { hasData: !!queryResult.data, siteId });
      return queryResult.data;
    }

    const isValid = validateContentData(queryResult.data, siteId);
    debug.content('Data validation result:', {
      isValid,
      siteId,
      dataType: typeof queryResult.data,
      loading: queryResult.loading
    });

    // Return data regardless of validation to avoid loading state issues
    // The onSuccess callback will handle cache clearing if invalid
    return queryResult.data;
  }, [queryResult.data, siteId, queryResult.loading]);

  debug.general('CONTENT_HOOK: useContent returning:', {
    hasData: !!validatedData,
    loading: queryResult.loading,
    error: !!queryResult.error,
    siteId
  });

  return {
    ...queryResult,
    data: validatedData
  };
}

// Get single content item
export function useContentItem(contentId: string) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => getContentById(supabase, siteId!, contentId),
    {
      enabled: !!siteId && !!contentId,
      persistKey: `content-detail-${siteId}-${contentId}`,
    },
    [siteId, contentId] // Re-fetch when siteId or contentId changes
  );
}

// Get content by type
export function useContentByType(contentType: 'page' | 'blog_post' | 'event') {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => getContentByType(supabase, siteId!, contentType),
    {
      enabled: !!siteId,
      staleTime: 30 * 1000,
      persistKey: `content-by-type-${siteId}-${contentType}`,
    },
    [siteId, contentType] // Re-fetch when siteId or contentType changes
  );
}

// Get published content
export function usePublishedContent(contentType?: 'page' | 'blog_post' | 'event') {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => getPublishedContent(supabase, siteId!, contentType),
    {
      enabled: !!siteId,
      staleTime: 60 * 1000, // 1 minute for published content
      persistKey: `content-published-${siteId}-${contentType || 'all'}`,
    },
    [siteId, contentType] // Re-fetch when siteId or contentType changes
  );
}

// Search content
export function useSearchContent(searchQuery: string) {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => searchContent(supabase, siteId!, searchQuery),
    {
      enabled: !!siteId && searchQuery.length > 2,
      staleTime: 10 * 1000,
      persistKey: `content-search-${siteId}-${searchQuery}`,
    },
    [siteId, searchQuery] // Re-fetch when siteId or searchQuery changes
  );
}

// Content statistics
export function useContentStats() {
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    (signal) => getContentStats(supabase, siteId!),
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes - stats change less frequently
      persistKey: `content-stats-${siteId}`,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

// Create content mutation
export function useCreateContent() {
  const siteId = useSiteId();
  const [optimisticContent, setOptimisticContent] = useState<Content | null>(null);
  
  const mutation = useSupabaseMutation<Content, Omit<InsertContent, 'site_id' | 'author_id'>>(
    (data, signal) => createContent(supabase, { ...data, site_id: siteId! }),
    {
      showSuccessToast: 'Content created successfully',
      optimisticUpdate: (newContent) => {
        // Store optimistic content for UI updates
        const optimistic = {
          ...newContent,
          id: crypto.randomUUID(),
          site_id: siteId!,
          author_id: '', // Will be set by server
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Content;
        
        setOptimisticContent(optimistic);
      },
      rollbackOnError: () => {
        setOptimisticContent(null);
      },
      onSuccess: () => {
        setOptimisticContent(null);
        clearContentCaches(siteId!);

        // Emit event to notify all components of the new content
        emitContentChange('content:created', {
          siteId: siteId!
        });
      },
      onError: () => {
        setOptimisticContent(null);
      }
    }
  );
  
  return {
    ...mutation,
    optimisticContent
  };
}

// Update content mutation
export function useUpdateContent() {
  const siteId = useSiteId();
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, Partial<Content>>>({});
  
  const mutation = useSupabaseMutation<Content, ContentUpdate & { id: string }>(
    ({ id, ...data }, signal) => updateContent(supabase, siteId!, id, data),
    {
      showSuccessToast: 'Content updated successfully',
      optimisticUpdate: ({ id, ...updates }) => {
        setOptimisticUpdates(prev => ({
          ...prev,
          [id]: {
            ...updates,
            updated_at: new Date().toISOString(),
          }
        }));
      },
      rollbackOnError: () => {
        setOptimisticUpdates({});
      },
      onSuccess: (data, variables) => {
        setOptimisticUpdates(prev => {
          const { [variables.id]: removed, ...rest } = prev;
          return rest;
        });
        clearSpecificContentCache(siteId!, variables.id);

        // Emit event to notify all components of the update
        emitContentChange('content:updated', {
          siteId: siteId!,
          contentId: variables.id
        });
      },
      onError: (error, variables) => {
        setOptimisticUpdates(prev => {
          const { [variables.id]: removed, ...rest } = prev;
          return rest;
        });
      }
    }
  );
  
  return {
    ...mutation,
    optimisticUpdates
  };
}

// Delete content mutation
export function useDeleteContent() {
  const siteId = useSiteId();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const mutation = useSupabaseMutation<void, string>(
    (id, signal) => deleteContent(supabase, siteId!, id),
    {
      showSuccessToast: 'Content deleted successfully',
      optimisticUpdate: (contentId) => {
        setDeletingIds(prev => new Set([...prev, contentId]));
      },
      rollbackOnError: () => {
        setDeletingIds(new Set());
      },
      onSuccess: (data, contentId) => {
        setDeletingIds(prev => {
          const updated = new Set(prev);
          updated.delete(contentId);
          return updated;
        });
        clearSpecificContentCache(siteId!, contentId);

        // Emit event to notify all components of the deletion
        emitContentChange('content:deleted', {
          siteId: siteId!,
          contentId
        });
      },
      onError: (error, contentId) => {
        setDeletingIds(prev => {
          const updated = new Set(prev);
          updated.delete(contentId);
          return updated;
        });
      }
    }
  );
  
  return {
    ...mutation,
    deletingIds
  };
}

// Real-time subscription hook
export function useContentRealtime() {
  const siteId = useSiteId();
  
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
          // Clear relevant caches when data changes
          if (payload.eventType === 'INSERT') {
            clearContentCaches(siteId);
            emitContentChange('content:created', { siteId });
            toast.info('New content added');
          } else if (payload.eventType === 'UPDATE') {
            clearSpecificContentCache(siteId, payload.new?.id);
            emitContentChange('content:updated', {
              siteId,
              contentId: payload.new?.id
            });
          } else if (payload.eventType === 'DELETE') {
            clearSpecificContentCache(siteId, payload.old?.id);
            emitContentChange('content:deleted', {
              siteId,
              contentId: payload.old?.id
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId]);
}