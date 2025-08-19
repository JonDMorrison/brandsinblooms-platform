/**
 * Placeholder image types and configuration for the Brands in Blooms platform
 */

/**
 * Supported placeholder types
 */
export type PlaceholderType = 'gradient' | 'pattern' | 'icon';

/**
 * Configuration for gradient placeholders
 */
export interface GradientConfig {
  type: 'gradient';
  colors: [string, string]; // Start and end colors
  direction?: 'horizontal' | 'vertical' | 'diagonal'; // Default: diagonal
}

/**
 * Configuration for pattern placeholders
 */
export interface PatternConfig {
  type: 'pattern';
  pattern: 'dots' | 'grid' | 'waves' | 'stripes';
  primaryColor: string;
  secondaryColor: string;
  scale?: number; // Default: 1
}

/**
 * Configuration for icon placeholders
 */
export interface IconConfig {
  type: 'icon';
  icon: 'image' | 'product' | 'user' | 'box' | 'photo';
  backgroundColor: string;
  iconColor: string;
  size?: number; // Icon size as percentage of container, default: 50
}

/**
 * Union type for all placeholder configurations
 */
export type PlaceholderConfig = GradientConfig | PatternConfig | IconConfig;

/**
 * Placeholder generation parameters
 */
export interface PlaceholderParams {
  width: number;
  height: number;
  type: PlaceholderType;
  config?: Partial<PlaceholderConfig>;
}

/**
 * Validation constraints
 */
export const PLACEHOLDER_CONSTRAINTS = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  MIN_WIDTH: 1,
  MIN_HEIGHT: 1,
  DEFAULT_WIDTH: 400,
  DEFAULT_HEIGHT: 400,
} as const;

/**
 * Default configurations for each placeholder type
 */
export const DEFAULT_CONFIGS: Record<PlaceholderType, PlaceholderConfig> = {
  gradient: {
    type: 'gradient',
    colors: ['#e0e7ff', '#c7d2fe'],
    direction: 'diagonal',
  },
  pattern: {
    type: 'pattern',
    pattern: 'dots',
    primaryColor: '#f3f4f6',
    secondaryColor: '#d1d5db',
    scale: 1,
  },
  icon: {
    type: 'icon',
    icon: 'image',
    backgroundColor: '#f9fafb',
    iconColor: '#9ca3af',
    size: 50,
  },
} as const;

/**
 * Color palettes for different contexts
 */
export const COLOR_PALETTES = {
  neutral: {
    light: '#f9fafb',
    medium: '#d1d5db',
    dark: '#6b7280',
  },
  brand: {
    light: '#e0e7ff',
    medium: '#a5b4fc',
    dark: '#6366f1',
  },
  product: {
    light: '#fef3c7',
    medium: '#fcd34d',
    dark: '#f59e0b',
  },
  success: {
    light: '#d1fae5',
    medium: '#86efac',
    dark: '#22c55e',
  },
} as const;

/**
 * SVG icon definitions
 */
export const SVG_ICONS = {
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  product: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  photo: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
} as const;

/**
 * Type guard to check if a value is a valid placeholder type
 */
export function isValidPlaceholderType(type: string): type is PlaceholderType {
  return ['gradient', 'pattern', 'icon'].includes(type);
}

/**
 * Validates placeholder dimensions
 */
export function validateDimensions(width: number, height: number): {
  isValid: boolean;
  error?: string;
} {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return {
      isValid: false,
      error: 'Width and height must be integers',
    };
  }

  if (width < PLACEHOLDER_CONSTRAINTS.MIN_WIDTH || height < PLACEHOLDER_CONSTRAINTS.MIN_HEIGHT) {
    return {
      isValid: false,
      error: `Dimensions must be at least ${PLACEHOLDER_CONSTRAINTS.MIN_WIDTH}x${PLACEHOLDER_CONSTRAINTS.MIN_HEIGHT}`,
    };
  }

  if (width > PLACEHOLDER_CONSTRAINTS.MAX_WIDTH || height > PLACEHOLDER_CONSTRAINTS.MAX_HEIGHT) {
    return {
      isValid: false,
      error: `Dimensions must not exceed ${PLACEHOLDER_CONSTRAINTS.MAX_WIDTH}x${PLACEHOLDER_CONSTRAINTS.MAX_HEIGHT}`,
    };
  }

  return { isValid: true };
}