'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabase } from '@/hooks/useSupabase';
import { hasPublishedEvents } from '@/src/lib/queries/domains/events';

/**
 * Hook to check if the current site has any published events
 * Used to conditionally show/hide events navigation
 */
export function useHasEvents(siteId: string | undefined) {
  const supabase = useSupabase();

  return useSupabaseQuery(
    async (signal: AbortSignal) => {
      if (!siteId) {
        return false;
      }

      return await hasPublishedEvents(supabase, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      persistKey: siteId ? `has-events-${siteId}` : undefined,
    },
    [siteId]
  );
}
