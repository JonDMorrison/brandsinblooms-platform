'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabase } from '@/hooks/useSupabase';
import { hasPublishedBlogPosts } from '@/lib/queries/domains/content';

/**
 * Hook to check if the current site has any published blog posts
 * Used to conditionally show/hide blog navigation
 */
export function useHasBlogPosts(siteId: string | undefined) {
  const supabase = useSupabase();

  return useSupabaseQuery(
    async (signal: AbortSignal) => {
      if (!siteId) {
        return false;
      }

      return await hasPublishedBlogPosts(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      persistKey: siteId ? `has-blog-posts-${siteId}` : undefined,
    },
    [siteId]
  );
}
