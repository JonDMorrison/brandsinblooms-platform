import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/contexts/SiteContext';
import {
  getSiteTheme,
  updateSiteTheme,
  resetTheme,
  applyThemeToDOM,
  exportTheme,
  importTheme,
  generateThemeFromBrandColor,
  themePresets,
} from '@/lib/queries/domains/theme';
import { ThemeSettings } from '@/lib/queries/domains/theme';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Hook for site theme
export function useSiteTheme() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  const query = useQuery<ThemeSettings>({
    queryKey: queryKeys.theme.settings(siteId!),
    queryFn: () => getSiteTheme(client, siteId!),
    enabled: !!siteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Apply theme to DOM when it loads
  useEffect(() => {
    if (query.data) {
      applyThemeToDOM(query.data);
    }
  }, [query.data]);
  
  const mutation = useMutation({
    mutationFn: (theme: ThemeSettings) => 
      updateSiteTheme(client, siteId!, theme),
    onMutate: async (newTheme) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.theme.settings(siteId!)
      });
      
      // Snapshot the previous value
      const previousTheme = queryClient.getQueryData<ThemeSettings>(
        queryKeys.theme.settings(siteId!)
      );
      
      // Optimistically update to the new value
      queryClient.setQueryData(
        queryKeys.theme.settings(siteId!),
        newTheme
      );
      
      // Apply theme immediately for instant feedback
      applyThemeToDOM(newTheme);
      
      return { previousTheme };
    },
    onError: (err, newTheme, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTheme) {
        queryClient.setQueryData(
          queryKeys.theme.settings(siteId!),
          context.previousTheme
        );
        applyThemeToDOM(context.previousTheme);
      }
      toast.error('Failed to save theme settings');
    },
    onSuccess: () => {
      toast.success('Theme settings saved');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.theme.settings(siteId!)
      });
    },
  });
  
  return {
    theme: query.data,
    isLoading: query.isLoading,
    error: query.error,
    saveTheme: mutation.mutate,
    isSaving: mutation.isPending,
  };
}

// Hook for resetting theme to defaults
export function useResetTheme() {
  const client = useSupabase();
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => resetTheme(client, siteId!),
    onSuccess: (site) => {
      // Update cache with the reset theme
      queryClient.setQueryData(
        queryKeys.theme.settings(siteId!),
        site.theme_settings
      );
      
      // Apply the reset theme
      if (site.theme_settings) {
        applyThemeToDOM(site.theme_settings as unknown as ThemeSettings);
      }
      
      toast.success('Theme reset to defaults');
    },
    onError: (error) => {
      toast.error('Failed to reset theme');
      console.error('Reset theme error:', error);
    },
  });
}

// Hook for applying theme presets
export function useApplyThemePreset() {
  const { saveTheme } = useSiteTheme();
  
  return useMutation({
    mutationFn: (presetName: keyof typeof themePresets) => {
      const preset = themePresets[presetName];
      if (!preset) {
        throw new Error(`Theme preset "${presetName}" not found`);
      }
      return Promise.resolve(preset);
    },
    onSuccess: (preset) => {
      saveTheme(preset);
    },
  });
}

// Hook for importing theme from JSON
export function useImportTheme() {
  const { saveTheme } = useSiteTheme();
  
  return useMutation({
    mutationFn: (jsonString: string) => {
      try {
        const theme = importTheme(jsonString);
        return Promise.resolve(theme);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    onSuccess: (theme) => {
      saveTheme(theme);
      toast.success('Theme imported successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to import theme');
    },
  });
}

// Hook for exporting theme
export function useExportTheme() {
  const { theme } = useSiteTheme();
  
  const handleExport = () => {
    if (!theme) {
      toast.error('No theme to export');
      return;
    }
    
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Theme exported successfully');
  };
  
  return {
    exportTheme: handleExport,
    canExport: !!theme,
  };
}

// Hook for generating theme from brand color
export function useGenerateTheme() {
  const { saveTheme } = useSiteTheme();
  
  return useMutation({
    mutationFn: (brandColor: string) => {
      const theme = generateThemeFromBrandColor(brandColor);
      return Promise.resolve(theme);
    },
    onSuccess: (theme) => {
      saveTheme(theme);
      toast.success('Theme generated from brand color');
    },
    onError: (error) => {
      toast.error('Failed to generate theme');
      console.error('Generate theme error:', error);
    },
  });
}

// Hook for live theme preview (without saving)
export function useThemePreview() {
  const { theme: currentTheme } = useSiteTheme();
  
  const previewTheme = (theme: ThemeSettings) => {
    applyThemeToDOM(theme);
  };
  
  const resetPreview = () => {
    if (currentTheme) {
      applyThemeToDOM(currentTheme);
    }
  };
  
  return {
    previewTheme,
    resetPreview,
  };
}