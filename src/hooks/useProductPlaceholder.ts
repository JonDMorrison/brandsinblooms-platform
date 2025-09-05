'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useTheme } from 'next-themes';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';
import { handleError } from '@/lib/types/error-handling';
import {
  type PlaceholderParams,
  type PlaceholderConfig,
  type PlaceholderType,
  DEFAULT_CONFIGS,
  COLOR_PALETTES,
  PLACEHOLDER_CONSTRAINTS,
  validateDimensions,
} from '@/lib/types/placeholder';
import {
  generatePlaceholderSVG,
  createCacheKey,
} from '@/lib/utils/placeholder-generator';

type Product = Tables<'products'>;

/**
 * Site-specific placeholder settings stored in site theme_settings
 */
export interface SitePlaceholderSettings {
  enabled?: boolean;
  defaultType?: PlaceholderType;
  gradientConfig?: {
    colors?: [string, string];
    direction?: 'horizontal' | 'vertical' | 'diagonal';
  };
  patternConfig?: {
    pattern?: 'dots' | 'grid' | 'waves' | 'stripes';
    primaryColor?: string;
    secondaryColor?: string;
    scale?: number;
  };
  iconConfig?: {
    icon?: 'image' | 'product' | 'user' | 'box' | 'photo';
    backgroundColor?: string;
    iconColor?: string;
    size?: number;
  };
  cacheStrategy?: 'memory' | 'persistent' | 'hybrid';
  preloadStrategy?: 'none' | 'critical' | 'all';
}

/**
 * Product-specific placeholder parameters
 */
export interface ProductPlaceholderParams {
  productId?: string;
  productName?: string;
  category?: string;
  width?: number;
  height?: number;
  type?: PlaceholderType;
  customConfig?: Partial<PlaceholderConfig>;
}

/**
 * Generated placeholder data
 */
export interface GeneratedPlaceholder {
  id: string;
  svg: string;
  dataUrl: string;
  params: PlaceholderParams;
  createdAt: string;
  cacheKey: string;
}

/**
 * Get site-specific placeholder settings from theme_settings
 */
export function useSitePlaceholderSettings() {
  const siteId = useSiteId();

  return useSupabaseQuery<SitePlaceholderSettings>(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');

      const { data, error } = await supabase
        .from('sites')
        .select('theme_settings')
        .eq('id', siteId)
        .single();

      if (error) throw error;

      const themeSettings = data?.theme_settings as Record<string, unknown> | null;
      const placeholderSettings = themeSettings?.placeholders as SitePlaceholderSettings | undefined;

      return placeholderSettings || {
        enabled: true,
        defaultType: 'gradient' as PlaceholderType,
        cacheStrategy: 'hybrid' as const,
        preloadStrategy: 'critical' as const,
      };
    },
    {
      enabled: !!siteId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      persistKey: siteId ? `placeholder-settings-${siteId}` : undefined,
    }
  );
}

/**
 * Generate dynamic placeholder based on product data and site settings
 */
export function useProductPlaceholder(params: ProductPlaceholderParams = {}) {
  const siteId = useSiteId();
  const { theme } = useTheme();
  const { data: siteSettings } = useSitePlaceholderSettings();
  
  const isDark = theme === 'dark';

  // Generate placeholder parameters based on product data and site settings
  const placeholderParams = useMemo((): PlaceholderParams => {
    const {
      productName,
      category,
      width = PLACEHOLDER_CONSTRAINTS.DEFAULT_WIDTH,
      height = PLACEHOLDER_CONSTRAINTS.DEFAULT_HEIGHT,
      type,
      customConfig,
    } = params;

    // Determine placeholder type
    const finalType = type || siteSettings?.defaultType || 'gradient';

    // Generate dynamic config based on product data
    let dynamicConfig: Partial<PlaceholderConfig> = {};

    if (finalType === 'gradient') {
      // Use category-based colors for gradients
      let colors: [string, string];
      
      if (category) {
        switch (category.toLowerCase()) {
          case 'flowers':
          case 'bouquets':
            colors = isDark ? ['#86efac', '#22c55e'] : ['#fecaca', '#f87171'];
            break;
          case 'plants':
          case 'indoor':
          case 'outdoor':
            colors = isDark ? ['#86efac', '#16a34a'] : ['#d1fae5', '#10b981'];
            break;
          case 'gifts':
          case 'accessories':
            colors = isDark ? ['#c7d2fe', '#6366f1'] : ['#e0e7ff', '#8b5cf6'];
            break;
          default:
            colors = isDark 
              ? [COLOR_PALETTES.neutral.dark, COLOR_PALETTES.neutral.medium]
              : [COLOR_PALETTES.neutral.light, COLOR_PALETTES.neutral.medium];
        }
      } else {
        colors = isDark 
          ? [COLOR_PALETTES.neutral.dark, COLOR_PALETTES.neutral.medium]
          : [COLOR_PALETTES.neutral.light, COLOR_PALETTES.neutral.medium];
      }

      dynamicConfig = {
        type: 'gradient',
        colors,
        direction: siteSettings?.gradientConfig?.direction || 'diagonal',
        ...siteSettings?.gradientConfig,
      };
    } else if (finalType === 'pattern') {
      dynamicConfig = {
        type: 'pattern',
        pattern: 'dots',
        primaryColor: isDark ? COLOR_PALETTES.neutral.dark : COLOR_PALETTES.neutral.light,
        secondaryColor: isDark ? COLOR_PALETTES.neutral.medium : COLOR_PALETTES.neutral.dark,
        scale: 1,
        ...siteSettings?.patternConfig,
      };
    } else if (finalType === 'icon') {
      dynamicConfig = {
        type: 'icon',
        icon: 'product',
        backgroundColor: isDark ? COLOR_PALETTES.neutral.dark : COLOR_PALETTES.neutral.light,
        iconColor: isDark ? COLOR_PALETTES.neutral.medium : COLOR_PALETTES.neutral.dark,
        size: 50,
        ...siteSettings?.iconConfig,
      };
    }

    // Merge with custom config
    const finalConfig = { ...dynamicConfig, ...customConfig };

    return {
      width,
      height,
      type: finalType,
      config: finalConfig,
    };
  }, [params, siteSettings, isDark]);

  // Generate cache key
  const cacheKey = useMemo(() => 
    createCacheKey(placeholderParams), 
    [placeholderParams]
  );

  return useSupabaseQuery<GeneratedPlaceholder>(
    async (signal): Promise<GeneratedPlaceholder> => {
      if (!siteId) throw new Error('Site ID is required');

      // Validate dimensions
      const validation = validateDimensions(placeholderParams.width, placeholderParams.height);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate SVG
      const svg = generatePlaceholderSVG(placeholderParams);
      
      // Convert to data URL
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

      return {
        id: cacheKey,
        svg,
        dataUrl,
        params: placeholderParams,
        createdAt: new Date().toISOString(),
        cacheKey,
      };
    },
    {
      enabled: !!siteId && !!siteSettings,
      staleTime: siteSettings?.cacheStrategy === 'persistent' ? 24 * 60 * 60 * 1000 : 60 * 1000, // 24h for persistent, 1min for others
      persistKey: `product-placeholder-${cacheKey}`,
    }
  );
}

/**
 * Preload placeholders for a list of products
 */
export function usePreloadProductPlaceholders(products: Product[] = []) {
  const siteId = useSiteId();
  const { data: siteSettings } = useSitePlaceholderSettings();

  const preloadPlaceholders = useCallback(async () => {
    if (!siteId || !siteSettings || siteSettings.preloadStrategy === 'none') {
      return;
    }

    const productsToPreload = siteSettings.preloadStrategy === 'critical' 
      ? products.filter(p => p.is_featured).slice(0, 5)
      : products.slice(0, 10);

    const preloadPromises = productsToPreload.map(async (product) => {
      const params: PlaceholderParams = {
        width: 400,
        height: 400,
        type: siteSettings.defaultType || 'gradient',
        config: DEFAULT_CONFIGS[siteSettings.defaultType || 'gradient'],
      };

      const cacheKey = createCacheKey(params);

      // Check if already in localStorage
      const storageKey = `product-placeholder-${cacheKey}`;
      const existing = localStorage.getItem(storageKey);
      if (existing) return;

      // Generate and store the placeholder
      try {
        const svg = generatePlaceholderSVG(params);
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

        const placeholder: GeneratedPlaceholder = {
          id: cacheKey,
          svg,
          dataUrl,
          params,
          createdAt: new Date().toISOString(),
          cacheKey,
        };

        localStorage.setItem(storageKey, JSON.stringify({
          data: placeholder,
          timestamp: new Date().toISOString()
        }));
      } catch (error: unknown) {
        console.warn('Failed to preload placeholder:', handleError(error).message);
      }
    });

    await Promise.all(preloadPromises);
  }, [products, siteId, siteSettings]);

  return {
    preloadPlaceholders,
    canPreload: !!siteId && !!siteSettings && siteSettings.preloadStrategy !== 'none',
    strategy: siteSettings?.preloadStrategy || 'none',
  };
}

/**
 * Update site placeholder settings
 */
export function useUpdateSitePlaceholderSettings() {
  const siteId = useSiteId();
  const { refresh } = useSitePlaceholderSettings();

  return useSupabaseMutation<SitePlaceholderSettings, Partial<SitePlaceholderSettings>>(
    async (settings: Partial<SitePlaceholderSettings>, signal: AbortSignal) => {
      if (!siteId) throw new Error('Site ID is required');

      // Get current theme settings
      const { data: site, error: fetchError } = await supabase
        .from('sites')
        .select('theme_settings')
        .eq('id', siteId)
        .single();

      if (fetchError) throw fetchError;

      const currentThemeSettings = (site?.theme_settings as Record<string, unknown>) || {};
      const currentPlaceholderSettings = (currentThemeSettings.placeholders as SitePlaceholderSettings) || {};

      // Merge settings
      const updatedPlaceholderSettings = {
        ...currentPlaceholderSettings,
        ...settings,
      };

      const updatedThemeSettings = {
        ...currentThemeSettings,
        placeholders: updatedPlaceholderSettings,
      };

      // Update in database
      const { data, error } = await supabase
        .from('sites')
        .update({
          theme_settings: updatedThemeSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', siteId)
        .select('theme_settings')
        .single();

      if (error) throw error;

      return updatedPlaceholderSettings;
    },
    {
      onSuccess: (updatedSettings) => {
        // Refresh placeholder settings
        refresh();
        
        // Clear localStorage cache if settings changed significantly
        if (updatedSettings.defaultType || updatedSettings.cacheStrategy) {
          // Clear related localStorage entries
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('product-placeholder-')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      },
      showSuccessToast: 'Placeholder settings updated',
      showErrorToast: true
    }
  );
}

/**
 * Get placeholder URL for a specific product
 */
export function useProductPlaceholderUrl(params: ProductPlaceholderParams = {}) {
  const { data: placeholder, isLoading, error } = useProductPlaceholder(params);

  return useMemo(() => ({
    url: placeholder?.dataUrl,
    svg: placeholder?.svg,
    isLoading,
    error,
    cacheKey: placeholder?.cacheKey,
  }), [placeholder, isLoading, error]);
}

/**
 * Clear placeholder cache for performance optimization
 */
export function useClearPlaceholderCache() {
  const siteId = useSiteId();

  return useCallback(() => {
    if (!siteId) return;

    // Clear localStorage entries for placeholders
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('product-placeholder-') || key?.startsWith(`placeholder-settings-${siteId}`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, [siteId]);
}