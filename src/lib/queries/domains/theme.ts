import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import { Site } from '@/lib/database/aliases';
// No longer need executeQuery imports - using direct Supabase queries

// Navigation item interface - compatible with Json type
export interface NavigationItem {
  [key: string]: string | NavigationItem[] | undefined;
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
}

// Footer column interface - compatible with Json type
export interface FooterColumn {
  [key: string]: string | Array<{ [key: string]: string }> | undefined;
  title: string;
  links: Array<{
    [key: string]: string;
    label: string;
    href: string;
  }>;
}

// Social link interface - compatible with Json type
export interface SocialLink {
  [key: string]: string | undefined;
  platform: string;
  url: string;
  icon?: string;
}

// Theme settings interface
export interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: 'small' | 'medium' | 'large';
    headingWeight?: string;
    bodyWeight?: string;
  };
  layout: {
    headerStyle: 'modern' | 'classic' | 'minimal';
    footerStyle: 'minimal' | 'comprehensive' | 'centered' | 'newsletter';
    menuStyle: 'horizontal' | 'sidebar' | 'hamburger' | 'mega';
    headerHeight?: 'compact' | 'normal' | 'tall';
    stickyHeader?: boolean;
    transparentHeader?: boolean;
    ctaButton?: {
      text?: string;
      href?: string;
      variant?: string;
    };
  };
  logo: {
    url: string | null;
    text?: string;
    position: 'left' | 'center' | 'right';
    size: 'small' | 'medium' | 'large';
    displayType?: 'text' | 'logo' | 'both';
    pixelSize?: number;
  };
  navigation?: {
    items: NavigationItem[];
    style: 'horizontal' | 'sidebar' | 'hamburger' | 'mega';
  };
  footer?: {
    style: 'minimal' | 'comprehensive' | 'centered' | 'newsletter';
    columns: FooterColumn[];
    newsletter: boolean;
    socialLinks: SocialLink[];
    copyright: string;
    paymentBadges: string[];
    trustBadges?: {
      secure?: boolean;
      shipping?: boolean;
    };
  };
}

// Get site theme settings
export async function getSiteTheme(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<ThemeSettings> {
  const { data, error } = await client
    .from('sites')
    .select('theme_settings, logo_url, primary_color')
    .eq('id', siteId)
    .single();
  
  if (error) {
    throw new Error(`Failed to get site theme: ${error.message}`);
  }
  
  // Return theme_settings if it exists, otherwise default
  if (data?.theme_settings) {
    const theme = data.theme_settings as unknown as ThemeSettings;
    
    // Merge logo_url from site if not in theme_settings
    if (data.logo_url && !theme.logo?.url) {
      theme.logo = {
        ...(theme.logo || {}),
        url: data.logo_url,
      };
    }
    
    // Use primary_color if theme doesn't have it
    if (data.primary_color && !theme.colors?.primary) {
      theme.colors = {
        ...getDefaultTheme().colors,
        ...theme.colors,
        primary: data.primary_color,
      };
    }
    
    return theme;
  }
  
  return getDefaultTheme();
}

// Update site theme settings
export async function updateSiteTheme(
  client: SupabaseClient<Database>,
  siteId: string,
  theme: Partial<ThemeSettings>
): Promise<Site> {
  // Get current theme to merge with updates
  const currentTheme = await getSiteTheme(client, siteId);
  const updatedTheme = {
    ...currentTheme,
    ...theme,
    colors: { ...currentTheme.colors, ...theme.colors },
    typography: { ...currentTheme.typography, ...theme.typography },
    layout: { ...currentTheme.layout, ...theme.layout },
    logo: { ...currentTheme.logo, ...theme.logo },
    navigation: theme.navigation ? { ...currentTheme.navigation, ...theme.navigation } : currentTheme.navigation,
    footer: theme.footer ? { ...currentTheme.footer, ...theme.footer } : currentTheme.footer,
  };
  
  const { data, error } = await client
    .from('sites')
    .update({
      theme_settings: updatedTheme,
      // Also update individual fields for backwards compatibility
      logo_url: updatedTheme.logo?.url || null,
      primary_color: updatedTheme.colors?.primary || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update site theme: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('No data returned from theme update');
  }
  
  return data as Site;
}

// Get default theme settings
export function getDefaultTheme(): ThemeSettings {
  return {
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 'medium',
    },
    layout: {
      headerStyle: 'modern',
      footerStyle: 'minimal',
      menuStyle: 'horizontal',
    },
    logo: {
      url: null,
      position: 'left',
      size: 'medium',
    },
  };
}

// Apply theme to DOM (for immediate visual feedback)
export function applyThemeToDOM(theme: ThemeSettings) {
  const root = document.documentElement;
  
  // Apply color variables
  if (theme.colors) {
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--background', theme.colors.background);
  }
  
  // Apply typography
  if (theme.typography) {
    root.style.setProperty('--font-heading', theme.typography.headingFont);
    root.style.setProperty('--font-body', theme.typography.bodyFont);
    
    // Apply font size scale
    const fontSizeScale = {
      small: 0.875,
      medium: 1,
      large: 1.125,
    };
    const scale = fontSizeScale[theme.typography.fontSize] || 1;
    root.style.setProperty('--font-size-scale', scale.toString());
  }
  
  // Add theme classes to body for layout styles
  if (theme.layout) {
    document.body.setAttribute('data-header-style', theme.layout.headerStyle);
    document.body.setAttribute('data-footer-style', theme.layout.footerStyle);
    document.body.setAttribute('data-menu-style', theme.layout.menuStyle);
  }
  
  // Add logo attributes
  if (theme.logo) {
    document.body.setAttribute('data-logo-position', theme.logo.position);
    document.body.setAttribute('data-logo-size', theme.logo.size);
  }
}

// Reset theme to defaults
export async function resetTheme(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<Site> {
  const defaultTheme = getDefaultTheme();
  return updateSiteTheme(client, siteId, defaultTheme);
}

// Export theme as JSON
export function exportTheme(theme: ThemeSettings): string {
  return JSON.stringify(theme, null, 2);
}

// Import theme from JSON
export function importTheme(jsonString: string): ThemeSettings {
  try {
    const parsed = JSON.parse(jsonString);
    return validateTheme(parsed);
  } catch (error) {
    throw new Error('Invalid theme JSON format');
  }
}

// Validate theme structure
function validateTheme(theme: any): ThemeSettings {
  if (!theme || typeof theme !== 'object') {
    throw new Error('Theme must be an object');
  }
  
  // Validate required sections
  const requiredSections = ['colors', 'typography', 'layout'];
  for (const section of requiredSections) {
    if (!theme[section] || typeof theme[section] !== 'object') {
      throw new Error(`Theme must include ${section} section`);
    }
  }
  
  // Validate colors
  const requiredColors = ['primary', 'secondary', 'accent', 'background'];
  for (const color of requiredColors) {
    if (!theme.colors[color] || typeof theme.colors[color] !== 'string') {
      throw new Error(`Theme colors must include ${color}`);
    }
  }
  
  // Validate typography
  if (!theme.typography.headingFont || !theme.typography.bodyFont || !theme.typography.fontSize) {
    throw new Error('Theme typography must include headingFont, bodyFont, and fontSize');
  }
  
  // Validate layout
  if (!theme.layout.headerStyle || !theme.layout.footerStyle || !theme.layout.menuStyle) {
    throw new Error('Theme layout must include headerStyle, footerStyle, and menuStyle');
  }
  
  return theme as ThemeSettings;
}

// Get theme preview CSS
export function getThemePreviewCSS(theme: ThemeSettings): string {
  return `
    :root {
      --primary: ${theme.colors.primary};
      --secondary: ${theme.colors.secondary};
      --accent: ${theme.colors.accent};
      --background: ${theme.colors.background};
      --font-heading: ${theme.typography.headingFont};
      --font-body: ${theme.typography.bodyFont};
      --font-size-scale: ${theme.typography.fontSize === 'small' ? '0.875' : theme.typography.fontSize === 'large' ? '1.125' : '1'};
    }
    
    body {
      background-color: var(--background);
      font-family: var(--font-body), system-ui, sans-serif;
      font-size: calc(1rem * var(--font-size-scale));
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading), system-ui, sans-serif;
    }
    
    a {
      color: var(--primary);
    }
    
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    
    .btn-secondary {
      background-color: var(--secondary);
      color: white;
    }
    
    .accent {
      color: var(--accent);
    }
  `;
}

// Generate theme from brand colors
export function generateThemeFromBrandColor(brandColor: string): ThemeSettings {
  // Simple color harmony generation
  // In a real app, you'd use a proper color theory library
  
  const theme = getDefaultTheme();
  theme.colors.primary = brandColor;
  
  // Generate complementary colors (simplified)
  // This is a placeholder - use a proper color library in production
  theme.colors.secondary = adjustColor(brandColor, 180); // Complementary
  theme.colors.accent = adjustColor(brandColor, 60); // Analogous
  
  return theme;
}

// Helper function to adjust color (placeholder)
function adjustColor(color: string, degrees: number): string {
  // This is a simplified placeholder
  // In production, use a proper color manipulation library like chroma-js
  return color;
}

// Theme presets
export const themePresets: Record<string, ThemeSettings> = {
  default: getDefaultTheme(),
  
  dark: {
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#0F172A',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 'medium',
    },
    layout: {
      headerStyle: 'modern',
      footerStyle: 'minimal',
      menuStyle: 'horizontal',
    },
    logo: {
      url: null,
      position: 'left',
      size: 'medium',
    },
  },
  
  professional: {
    colors: {
      primary: '#1E40AF',
      secondary: '#047857',
      accent: '#DC2626',
      background: '#F9FAFB',
    },
    typography: {
      headingFont: 'Roboto',
      bodyFont: 'Open Sans',
      fontSize: 'medium',
    },
    layout: {
      headerStyle: 'classic',
      footerStyle: 'comprehensive',
      menuStyle: 'horizontal',
    },
    logo: {
      url: null,
      position: 'left',
      size: 'medium',
    },
  },
  
  creative: {
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FEF3C7',
    },
    typography: {
      headingFont: 'Poppins',
      bodyFont: 'Nunito',
      fontSize: 'large',
    },
    layout: {
      headerStyle: 'modern',
      footerStyle: 'minimal',
      menuStyle: 'sidebar',
    },
    logo: {
      url: null,
      position: 'center',
      size: 'large',
    },
  },
};