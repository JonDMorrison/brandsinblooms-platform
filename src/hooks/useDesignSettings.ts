'use client';

import { useEffect } from 'react';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import {
  getSiteTheme,
  updateSiteTheme,
  ThemeSettings,
  getDefaultTheme
} from '@/src/lib/queries/domains/theme';
import { handleError } from '@/src/lib/types/error-handling';

export function useDesignSettings() {
  const supabase = useSupabase();
  const siteId = useSiteId();

  const result = useSupabaseQuery(
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
      persistKey: `site-theme-${siteId}`,
    },
    [siteId] // Re-fetch when siteId changes
  );

  // Listen for design settings updates from modals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDesignSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ siteId: string }>;
      if (customEvent.detail?.siteId === siteId) {
        result.refresh(); // Refresh this instance when settings update
      }
    };

    window.addEventListener('designSettingsUpdated', handleDesignSettingsUpdate);
    return () => {
      window.removeEventListener('designSettingsUpdated', handleDesignSettingsUpdate);
    };
  }, [siteId, result.refresh]);

  return result;
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
        // Clear localStorage cache for theme settings (shared with useSiteTheme)
        if (typeof window !== 'undefined' && siteId) {
          localStorage.removeItem(`site-theme-${siteId}`);
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