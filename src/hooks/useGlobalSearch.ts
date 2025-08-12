'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useSiteId } from '@/contexts/SiteContext';
import { useDebounce } from '@/hooks/useDebounce';
import { searchContentEnhanced, EnhancedSearchResult } from '@/lib/queries/domains/content';
import { handleError } from '@/lib/types/error-handling';

// Re-export the search result interface for consumers
export type { EnhancedSearchResult as SearchResult };

export interface UseGlobalSearchResult {
  data: EnhancedSearchResult[];
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  hasMinLength: boolean;
}

/**
 * Hook for global search functionality with debouncing
 * Only searches when query has more than 2 characters
 * Uses site context for multi-tenancy
 */
export function useGlobalSearch(query: string, limit: number = 10): UseGlobalSearchResult {
  const contextSiteId = useSiteId();
  // Use default site ID as fallback if context doesn't provide one
  const siteId = contextSiteId || '00000000-0000-0000-0000-000000000001';
  const debouncedQuery = useDebounce(query.trim(), 300);
  
  
  // Only search if we have a site ID and query has minimum length (3+ characters)
  const hasMinLength = query.trim().length >= 3;
  const shouldSearch = debouncedQuery.length >= 3 && siteId !== null;

  const {
    data = [],
    isLoading,
    error
  } = useQuery<EnhancedSearchResult[]>({
    queryKey: ['globalSearch', siteId, debouncedQuery, limit] as const,
    queryFn: async () => {
      if (!siteId) {
        throw new Error('No site ID available');
      }
      
      try {
        const results = await searchContentEnhanced(supabase, siteId, debouncedQuery, limit);
        return results;
      } catch (err: unknown) {
        const errorInfo = handleError(err);
        throw new Error(errorInfo.message);
      }
    },
    enabled: shouldSearch,
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // Keep data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    data: data || [],
    isLoading,
    error: error as Error | null,
    isEmpty: shouldSearch && !isLoading && (data || []).length === 0,
    hasMinLength,
  };
}

export interface UseSearchKeyboardResult {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: KeyboardEvent) => boolean;
  selectNext: () => void;
  selectPrevious: () => void;
  selectFirst: () => void;
  selectLast: () => void;
  clearSelection: () => void;
}

/**
 * Hook for keyboard navigation in search results
 * Handles arrow keys, enter, escape, and circular navigation
 */
export function useSearchKeyboard(
  resultsLength: number,
  onSelect?: (index: number) => void,
  onEscape?: () => void
): UseSearchKeyboardResult {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [resultsLength]);

  const selectNext = useCallback(() => {
    if (resultsLength === 0) return;
    setSelectedIndex(prev => (prev + 1) % resultsLength);
  }, [resultsLength]);

  const selectPrevious = useCallback(() => {
    if (resultsLength === 0) return;
    setSelectedIndex(prev => prev <= 0 ? resultsLength - 1 : prev - 1);
  }, [resultsLength]);

  const selectFirst = useCallback(() => {
    if (resultsLength > 0) {
      setSelectedIndex(0);
    }
  }, [resultsLength]);

  const selectLast = useCallback(() => {
    if (resultsLength > 0) {
      setSelectedIndex(resultsLength - 1);
    }
  }, [resultsLength]);

  const clearSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent): boolean => {
    if (resultsLength === 0) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectNext();
        return true;

      case 'ArrowUp':
        e.preventDefault();
        selectPrevious();
        return true;

      case 'Home':
        e.preventDefault();
        selectFirst();
        return true;

      case 'End':
        e.preventDefault();
        selectLast();
        return true;

      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < resultsLength) {
          e.preventDefault();
          onSelect?.(selectedIndex);
          return true;
        }
        return false;

      case 'Escape':
        e.preventDefault();
        clearSelection();
        onEscape?.();
        return true;

      default:
        return false;
    }
  }, [resultsLength, selectedIndex, selectNext, selectPrevious, selectFirst, selectLast, clearSelection, onSelect, onEscape]);

  // Set up global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    clearSelection,
  };
}

/**
 * Combined hook that provides both search and keyboard navigation
 * Convenient for components that need both functionalities
 */
export function useGlobalSearchWithKeyboard(
  query: string,
  limit: number = 10,
  onSelect?: (result: EnhancedSearchResult, index: number) => void,
  onEscape?: () => void
) {
  const searchResult = useGlobalSearch(query, limit);
  const keyboardResult = useSearchKeyboard(
    searchResult.data.length,
    (index) => {
      const result = searchResult.data[index];
      if (result) {
        onSelect?.(result, index);
      }
    },
    onEscape
  );

  return {
    ...searchResult,
    ...keyboardResult,
    selectedResult: keyboardResult.selectedIndex >= 0 
      ? searchResult.data[keyboardResult.selectedIndex] 
      : null,
  };
}