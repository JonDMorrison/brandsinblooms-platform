import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import { debug } from '@/src/lib/utils/debug';
import {
  getSiteTheme,
  updateSiteTheme,
  resetTheme,
  exportTheme,
  importTheme,
  generateThemeFromBrandColor,
  themePresets,
} from '@/src/lib/queries/domains/theme';
import { ThemeSettings } from '@/src/lib/queries/domains/theme';
import { toast } from 'sonner';

// Hook for site theme
export function useSiteTheme() {
  const client = useSupabase();
  const siteId = useSiteId();

  // Debug logging for theme loading
  debug.theme('useSiteTheme - siteId:', siteId);
  debug.theme('useSiteTheme - client available:', !!client);

  const query = useSupabaseQuery<ThemeSettings>(
    async (signal) => {
      debug.theme('useSiteTheme - Starting theme query for siteId:', siteId);
      if (!siteId) {
        debug.theme('useSiteTheme - No siteId provided');
        throw new Error('Site ID is required');
      }

      try {
        const theme = await getSiteTheme(client, siteId);
        debug.theme('useSiteTheme - Theme loaded successfully:', theme);
        debug.theme('useSiteTheme - Theme colors:', theme?.colors);
        return theme;
      } catch (error) {
        debug.theme('useSiteTheme - Theme loading error:', error);
        throw error;
      }
    },
    {
      enabled: !!siteId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      persistKey: siteId ? `site-theme-${siteId}` : undefined,
    }
  );

  // Log query state changes
  debug.theme('useSiteTheme - Query state:', {
    loading: query.loading,
    error: query.error,
    hasData: !!query.data,
    data: query.data
  });
  
  // Theme is now applied via SiteThemeProvider's useApplyTheme hook
  // Removed duplicate DOM application to prevent flickering
  
  const mutation = useSupabaseMutation<any, ThemeSettings>(
    async (theme: ThemeSettings, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');
      return updateSiteTheme(client, siteId, theme);
    },
    {
      onSuccess: () => {
        // Theme application is handled by SiteThemeProvider
        query.refresh(); // Refresh the query data
      },
      showSuccessToast: 'Theme settings saved',
      showErrorToast: true
    }
  );
  
  return {
    theme: query.data,
    isLoading: query.loading,
    error: query.error,
    saveTheme: mutation.mutate,
    isSaving: mutation.loading,
  };
}

// Hook for resetting theme to defaults
export function useResetTheme() {
  const client = useSupabase();
  const siteId = useSiteId();
  
  return useSupabaseMutation<any, void>(
    async (_, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');
      return resetTheme(client, siteId);
    },
    {
      onSuccess: (site) => {
        // Theme application is handled by SiteThemeProvider
        // No need to manually apply theme here
      },
      showSuccessToast: 'Theme reset to defaults',
      showErrorToast: true
    }
  );
}

// Hook for applying theme presets
export function useApplyThemePreset() {
  const { saveTheme } = useSiteTheme();
  
  return useSupabaseMutation<ThemeSettings, keyof typeof themePresets>(
    async (presetName: keyof typeof themePresets, signal: AbortSignal) => {
      const preset = themePresets[presetName];
      if (!preset) {
        throw new Error(`Theme preset "${presetName}" not found`);
      }
      return preset;
    },
    {
      onSuccess: (preset) => {
        saveTheme(preset);
      },
      showSuccessToast: false,
      showErrorToast: true
    }
  );
}

// Hook for importing theme from JSON
export function useImportTheme() {
  const { saveTheme } = useSiteTheme();
  
  return useSupabaseMutation<ThemeSettings, string>(
    async (jsonString: string, signal: AbortSignal) => {
      const theme = importTheme(jsonString);
      return theme;
    },
    {
      onSuccess: (theme) => {
        saveTheme(theme);
      },
      showSuccessToast: 'Theme imported successfully',
      showErrorToast: true
    }
  );
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
  
  return useSupabaseMutation<ThemeSettings, string>(
    async (brandColor: string, signal: AbortSignal) => {
      const theme = generateThemeFromBrandColor(brandColor);
      return theme;
    },
    {
      onSuccess: (theme) => {
        saveTheme(theme);
      },
      showSuccessToast: 'Theme generated from brand color',
      showErrorToast: true
    }
  );
}

// Hook for live theme preview (without saving)
export function useThemePreview() {
  const { theme: currentTheme } = useSiteTheme();
  
  const previewTheme = (theme: ThemeSettings) => {
    // Theme preview application is handled by SiteThemeProvider
    // For now, we'll need to implement preview via context
    console.warn('Theme preview requires SiteThemeProvider context');
  };
  
  const resetPreview = () => {
    // Theme reset is handled by SiteThemeProvider
    // For now, we'll need to implement preview via context
    console.warn('Theme preview reset requires SiteThemeProvider context');
  };
  
  return {
    previewTheme,
    resetPreview,
  };
}