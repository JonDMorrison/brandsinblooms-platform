import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/lib/database/types';
import { Site } from '@/src/lib/database/aliases';
import { executeQuery } from '@/src/lib/queries/utils/execute-query';

// Theme settings interface
export interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  layout: {
    headerStyle: 'modern' | 'classic' | 'minimal';
    footerStyle: 'minimal' | 'detailed' | 'hidden';
    menuStyle: 'horizontal' | 'vertical' | 'sidebar';
  };
  logo: {
    url: string | null;
    position: 'left' | 'center' | 'right';
    size: 'small' | 'medium' | 'large';
  };
}

// Get site theme settings
export async function getSiteTheme(
  client: SupabaseClient<Database>,
  siteId: string
): Promise<ThemeSettings> {
  const query = client
    .from('sites')
    .select('theme_settings')
    .eq('id', siteId)
    .single();
  
  const result = await executeQuery(query);
  
  // Return theme settings or default if not set
  return (result.theme_settings as ThemeSettings) || getDefaultTheme();
}

// Update site theme settings
export async function updateSiteTheme(
  client: SupabaseClient<Database>,
  siteId: string,
  theme: ThemeSettings
): Promise<Site> {
  const query = client
    .from('sites')
    .update({ theme_settings: theme })
    .eq('id', siteId)
    .select()
    .single();
  
  return await executeQuery(query);
}

// Get default theme settings
export function getDefaultTheme(): ThemeSettings {
  return {
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#FFFFFF',
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
      footerStyle: 'detailed',
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
      headerStyle: 'bold',
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