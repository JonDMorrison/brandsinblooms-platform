'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useSiteId } from '@/contexts/SiteContext';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { generateUniqueSlug, validateSlug, sanitizeSlug } from '@/lib/utils/slug';
import { handleError } from '@/lib/types/error-handling';

interface SlugGenerationOptions {
  name: string;
  excludeId?: string;
}

interface SlugValidationOptions {
  slug: string;
  excludeId?: string;
}

/**
 * Hook for generating unique slugs with caching
 */
export function useSlugGeneration() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, excludeId }: SlugGenerationOptions) => {
      if (!siteId) {
        throw new Error('Site ID is required for slug generation');
      }
      
      if (!name || name.trim().length === 0) {
        // Return empty string for empty names
        return '';
      }
      
      // Check cache first
      const cacheKey = ['slug', siteId, name, excludeId];
      const cachedSlug = queryClient.getQueryData<string>(cacheKey);
      
      if (cachedSlug !== undefined) {
        return cachedSlug;
      }
      
      // Generate unique slug
      const slug = await generateUniqueSlug(supabase, name, siteId, excludeId);
      
      return slug;
    },
    onSuccess: (slug, variables) => {
      if (!siteId) return;
      
      // Cache the result for 30 seconds
      const cacheKey = ['slug', siteId, variables.name, variables.excludeId];
      queryClient.setQueryData(cacheKey, slug);
      // Note: Cache expiration is handled by TanStack Query's default gcTime
    },
    onError: (error: unknown) => {
      const { message } = handleError(error);
      console.error('Slug generation error:', message);
    },
  });
}

/**
 * Hook for validating slugs
 */
export function useSlugValidation() {
  const siteId = useSiteId();
  
  return useMutation({
    mutationFn: async ({ slug, excludeId }: SlugValidationOptions) => {
      if (!siteId) {
        throw new Error('Site ID is required for slug validation');
      }
      
      return await validateSlug(supabase, slug, siteId, excludeId);
    },
    onError: (error: unknown) => {
      const { message } = handleError(error);
      console.error('Slug validation error:', message);
    },
  });
}

/**
 * Hook for debounced slug generation with automatic cancellation
 */
export function useDebouncedSlugGeneration(delay: number = 500) {
  const { mutate, mutateAsync, isPending, isError, error, data, reset } = useSlugGeneration();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Cancel any pending request when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Create debounced mutation function
  const debouncedGenerateSlug = useDebounceCallback(
    useCallback(
      async (options: SlugGenerationOptions) => {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        setIsGenerating(true);
        
        try {
          await mutateAsync(options);
        } catch (error) {
          // Ignore abort errors
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          throw error;
        } finally {
          setIsGenerating(false);
        }
      },
      [mutateAsync]
    ),
    delay
  );
  
  // Non-debounced version for immediate generation
  const generateSlugImmediate = useCallback(
    async (options: SlugGenerationOptions) => {
      // Cancel any pending debounced request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      setIsGenerating(true);
      
      try {
        await mutateAsync(options);
      } finally {
        setIsGenerating(false);
      }
    },
    [mutateAsync]
  );
  
  return {
    generateSlug: debouncedGenerateSlug,
    generateSlugImmediate,
    isLoading: isPending || isGenerating,
    isError,
    error,
    slug: data,
    reset,
  };
}

/**
 * Hook for client-side slug sanitization (synchronous)
 */
export function useSlugSanitizer() {
  return useCallback((input: string) => {
    return sanitizeSlug(input);
  }, []);
}

/**
 * Combined hook for complete slug management
 */
export function useSlugField(options?: {
  delay?: number;
  excludeId?: string;
}) {
  const { delay = 500, excludeId } = options || {};
  
  const { generateSlug, generateSlugImmediate, isLoading, slug } = useDebouncedSlugGeneration(delay);
  const { mutateAsync: validateSlugAsync } = useSlugValidation();
  const sanitizer = useSlugSanitizer();
  
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [currentSlug, setCurrentSlug] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Update current slug when generation completes
  useEffect(() => {
    if (slug && !manuallyEdited) {
      setCurrentSlug(slug);
      setValidationError(null);
    }
  }, [slug, manuallyEdited]);
  
  // Handle name change (auto-generate slug)
  const handleNameChange = useCallback(
    (name: string) => {
      if (!manuallyEdited) {
        generateSlug({ name, excludeId });
      }
    },
    [generateSlug, excludeId, manuallyEdited]
  );
  
  // Handle manual slug edit
  const handleSlugChange = useCallback(
    (newSlug: string) => {
      setManuallyEdited(true);
      setCurrentSlug(newSlug);
      setValidationError(null);
    },
    []
  );
  
  // Validate slug
  const validateCurrentSlug = useCallback(
    async () => {
      if (!currentSlug) {
        setValidationError('Slug is required');
        return false;
      }
      
      const result = await validateSlugAsync({ slug: currentSlug, excludeId });
      
      if (!result.isValid) {
        setValidationError(result.error || 'Invalid slug');
        return false;
      }
      
      setValidationError(null);
      return true;
    },
    [currentSlug, excludeId, validateSlugAsync]
  );
  
  // Reset to auto-generated slug
  const resetToAutoGenerated = useCallback(
    (name: string) => {
      setManuallyEdited(false);
      setValidationError(null);
      generateSlugImmediate({ name, excludeId });
    },
    [generateSlugImmediate, excludeId]
  );
  
  return {
    currentSlug,
    isGenerating: isLoading,
    manuallyEdited,
    validationError,
    handleNameChange,
    handleSlugChange,
    validateCurrentSlug,
    resetToAutoGenerated,
    sanitizeSlug: sanitizer,
  };
}