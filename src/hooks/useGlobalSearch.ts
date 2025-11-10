'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { supabase } from '@/src/lib/supabase/client';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useDebounce } from '@/hooks/useDebounce';
import { searchContentEnhanced, EnhancedSearchResult } from '@/src/lib/queries/domains/content';
import { handleError } from '@/src/lib/types/error-handling';

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
  
  // Track which query the current data belongs to
  const dataQueryRef = useRef<string>('');
  
  // Only search if we have a site ID and query has minimum length (3+ characters)
  const hasMinLength = query.trim().length >= 3;
  const shouldSearch = debouncedQuery.length >= 3 && siteId !== null;
  
  // Check if we're waiting for debounce (user is still typing)
  const isWaitingForDebounce = hasMinLength && query.trim() !== debouncedQuery;

  const {
    data = [],
    loading: isLoading,
    error
  } = useSupabaseQuery<EnhancedSearchResult[]>(
    async (signal: AbortSignal) => {
      if (!siteId) {
        throw new Error('No site ID available');
      }
      
      try {
        const results = await searchContentEnhanced(supabase, siteId, debouncedQuery, limit);
        // Mark that this data belongs to the current debounced query
        dataQueryRef.current = debouncedQuery;
        return results;
      } catch (err: unknown) {
        const errorInfo = handleError(err);
        throw new Error(errorInfo.message);
      }
    },
    {
      enabled: shouldSearch,
      staleTime: 30000, // Keep data fresh for 30 seconds
      // Add query as key to force refresh when search term changes
      key: [siteId, debouncedQuery, limit],
    }
  );

  // Only show data if:
  // 1. Not waiting for debounce (query has settled)
  // 2. Data belongs to current debounced query (prevents stale results)
  // 3. Should search (meets criteria)
  const dataMatchesCurrentQuery = dataQueryRef.current === debouncedQuery;
  const displayData = isWaitingForDebounce ? [] : (shouldSearch && dataMatchesCurrentQuery ? (data || []) : []);
  const displayLoading = isLoading || isWaitingForDebounce;

  return {
    data: displayData,
    isLoading: displayLoading,
    error: error as Error | null,
    isEmpty: shouldSearch && !displayLoading && displayData.length === 0,
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