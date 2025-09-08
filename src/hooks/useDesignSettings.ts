'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import { 
  getSiteTheme, 
  updateSiteTheme, 
  ThemeSettings,
  getDefaultTheme 
} from '@/lib/queries/domains/theme';
import { handleError } from '@/lib/types/error-handling';

export function useDesignSettings() {
  const supabase = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseQuery(
    async (signal: AbortSignal) => {
      if (!siteId) {
        return getDefaultTheme();
      }
      
      try {
        return await getSiteTheme(supabase, siteId);
      } catch (error) {
        handleError(error);
        return getDefaultTheme();
      }
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: `design-settings-${siteId}`,
    },
    [siteId] // Re-fetch when siteId changes
  );
}

export function useUpdateDesignSettings() {
  const supabase = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (settings: Partial<ThemeSettings>, signal: AbortSignal) => {
      if (!siteId) {
        throw new Error('No site ID available');
      }
      
      return await updateSiteTheme(supabase, siteId, settings);
    },
    {
      onSuccess: () => {
        // Clear localStorage cache for design settings
        if (typeof window !== 'undefined' && siteId) {
          localStorage.removeItem(`design-settings-${siteId}`);
        }
      }
    }
  );
}

// Hook for resetting design to defaults
export function useResetDesignSettings() {
  const { mutate: updateSettings } = useUpdateDesignSettings();
  
  return () => {
    const defaultTheme = getDefaultTheme();
    updateSettings(defaultTheme);
  };
}