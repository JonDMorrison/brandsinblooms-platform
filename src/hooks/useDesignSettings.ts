'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
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
  
  return useQuery({
    queryKey: ['site', siteId, 'design'],
    queryFn: async () => {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!siteId,
  });
}

export function useUpdateDesignSettings() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const siteId = useSiteId();
  
  return useMutation({
    mutationFn: async (settings: Partial<ThemeSettings>) => {
      if (!siteId) {
        throw new Error('No site ID available');
      }
      
      return await updateSiteTheme(supabase, siteId, settings);
    },
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['site', siteId, 'design'] });
      
      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<ThemeSettings>(['site', siteId, 'design']);
      
      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<ThemeSettings>(['site', siteId, 'design'], (old) => {
          if (!old) return getDefaultTheme();
          
          return {
            ...old,
            ...newSettings,
            colors: { ...old.colors, ...newSettings.colors },
            typography: { ...old.typography, ...newSettings.typography },
            layout: { ...old.layout, ...newSettings.layout },
            logo: { ...old.logo, ...newSettings.logo },
          };
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onError: (err: unknown, _newSettings, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(['site', siteId, 'design'], context.previousSettings);
      }
      
      handleError(err);
      toast.error('Failed to save design settings');
    },
    onSuccess: () => {
      toast.success('Design settings saved');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['site', siteId, 'design'] });
    },
  });
}

// Hook for resetting design to defaults
export function useResetDesignSettings() {
  const { mutate: updateSettings } = useUpdateDesignSettings();
  
  return () => {
    const defaultTheme = getDefaultTheme();
    updateSettings(defaultTheme);
  };
}