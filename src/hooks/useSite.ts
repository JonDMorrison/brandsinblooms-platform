'use client';

// Re-export from context for easier imports
export { useSite, useSiteId, useSitePermission } from '@/contexts/SiteContext';

// Additional site-related hooks can be added here

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queries/keys';
import { getSiteStatistics } from '@/src/lib/queries/domains/sites';
import { useSite, useSiteId } from '@/contexts/SiteContext';

// Hook to get site statistics
export function useSiteStatistics() {
  const siteId = useSiteId();

  return useQuery({
    queryKey: queryKeys.siteStatistics(siteId!),
    queryFn: () => {
      // Import supabase client here to avoid circular dependency
      const { supabase } = require('@/src/lib/supabase/client');
      return getSiteStatistics(supabase, siteId!);
    },
    enabled: !!siteId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook to check if current user is site owner
export function useIsSiteOwner() {
  const { currentMembership } = useSite();
  return currentMembership?.role === 'owner';
}

// Hook to check if current user can edit content
export function useCanEdit() {
  const { currentMembership } = useSite();
  return currentMembership?.role === 'owner' || currentMembership?.role === 'editor';
}