/**
 * Theme settings types and utilities
 * Defines the structure for site-level theme customization
 */

export interface ThemeSettings {
    // Colors
    brandColor: string        // Primary brand color (hex)
    accentColor: string       // Secondary/highlight color (hex)
    backgroundColor: string   // Page background (hex)
    textColor: string         // Default text color (hex)

    // Typography
    fontFamily: 'system' | 'serif' | 'sans' | 'mono'

    // Layout
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

    // Component Styles
    headerStyle: 'solid' | 'transparent' | 'underlined'
    footerStyle: 'simple' | 'columns' | 'minimal'
}

/**
 * Get default theme settings
 * Used when a site has no custom theme settings
 */
export function getDefaultThemeSettings(): ThemeSettings {
    return {
        brandColor: '#10b981',      // Green-500
        accentColor: '#3b82f6',     // Blue-500
        backgroundColor: '#ffffff',  // White
        textColor: '#1f2937',       // Gray-900
        fontFamily: 'system',
        borderRadius: 'md',
        headerStyle: 'solid',
        footerStyle: 'columns'
    }
}

/**
 * CSS variable mapping for theme properties
 */
export const THEME_CSS_VARS = {
    brandColor: '--brand-color',
    accentColor: '--accent-color',
    backgroundColor: '--background-color',
    textColor: '--text-color',
    borderRadius: '--radius-base',
    fontFamily: '--font-family'
} as const

/**
 * Border radius pixel values
 */
export const BORDER_RADIUS_VALUES = {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
} as const

/**
 * Font family CSS values
 */
export const FONT_FAMILY_VALUES = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
    mono: '"Fira Code", "Courier New", Consolas, monospace'
} as const

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * Merge partial theme settings with defaults
 */
export function mergeWithDefaults(partial: Partial<ThemeSettings> | null | undefined): ThemeSettings {
    const defaults = getDefaultThemeSettings()
    if (!partial) return defaults

    return {
        ...defaults,
        ...partial
    }
}

/**
 * Convert theme settings to CSS variables object
 */
export function themeToCSSVariables(theme: ThemeSettings): Record<string, string> {
    return {
        [THEME_CSS_VARS.brandColor]: theme.brandColor,
        [THEME_CSS_VARS.accentColor]: theme.accentColor,
        [THEME_CSS_VARS.backgroundColor]: theme.backgroundColor,
        [THEME_CSS_VARS.textColor]: theme.textColor,
        [THEME_CSS_VARS.borderRadius]: BORDER_RADIUS_VALUES[theme.borderRadius],
        [THEME_CSS_VARS.fontFamily]: FONT_FAMILY_VALUES[theme.fontFamily]
    }
}
