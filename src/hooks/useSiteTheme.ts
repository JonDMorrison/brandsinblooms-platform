import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
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
  
  const query = useSupabaseQuery<ThemeSettings>(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getSiteTheme(client, siteId);
    },
    {
      enabled: !!siteId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      persistKey: siteId ? `site-theme-${siteId}` : undefined,
    }
  );
  
  // Apply theme to DOM when it loads
  useEffect(() => {
    if (query.data) {
      applyThemeToDOM(query.data);
    }
  }, [query.data]);
  
  const mutation = useSupabaseMutation<any, ThemeSettings>(
    async (theme: ThemeSettings, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');
      return updateSiteTheme(client, siteId, theme);
    },
    {
      onSuccess: () => {
        // Apply theme immediately for instant feedback
        if (query.data) {
          applyThemeToDOM(query.data);
        }
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
        // Apply the reset theme
        if (site.theme_settings) {
          applyThemeToDOM(site.theme_settings as unknown as ThemeSettings);
        }
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