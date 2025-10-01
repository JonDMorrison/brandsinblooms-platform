/**
 * Debug logging utility with environment variable control
 *
 * All debug logging is disabled by default for clean console output.
 * Enable specific categories by setting environment variables to 'true':
 * - DEBUG_SITE=true        Site context and resolution
 * - DEBUG_CACHE=true       Data caching and persistence
 * - DEBUG_LOADING=true     Loading states and data fetching
 * - DEBUG_THEME=true       Theme loading and CSS generation
 * - DEBUG_CONTENT=true     Content management and rendering
 * - DEBUG_DASHBOARD=true   Dashboard page and components
 * - DEBUG_MIDDLEWARE=true  Middleware and request routing
 * - DEBUG_SECURITY=true    Security and authentication
 * - DEBUG_GENERAL=true     General purpose debugging
 * - DEBUG_ALL=true         Enables all categories
 */

type DebugCategory = 'site' | 'cache' | 'loading' | 'theme' | 'general' | 'content' | 'dashboard' | 'middleware' | 'security';

/**
 * Check if debug logging is enabled for a specific category
 * Returns false by default if environment variable is not set or not 'true'
 */
const isDebugEnabled = (category: DebugCategory): boolean => {
  // Check if all debug categories are enabled
  if (process.env.DEBUG_ALL === 'true') {
    return true;
  }

  // Check specific category - only enable if explicitly set to 'true'
  const envVar = `DEBUG_${category.toUpperCase()}`;
  return process.env[envVar] === 'true';
};

/**
 * Debug logging functions that respect environment variable settings
 */
export const debug = {
  /**
   * Site context and resolution debugging
   * Controlled by DEBUG_SITE environment variable
   */
  site: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('site')) {
      console.log(`[SITE_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Data caching and persistence debugging
   * Controlled by DEBUG_CACHE environment variable
   */
  cache: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('cache')) {
      console.log(`[CACHE_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Loading state and data fetching debugging
   * Controlled by DEBUG_LOADING environment variable
   */
  loading: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('loading')) {
      console.log(`[LOADING_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Theme loading, CSS generation, and styling debugging
   * Controlled by DEBUG_THEME environment variable
   */
  theme: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('theme')) {
      console.log(`[THEME_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Utility function to check if any debug category is enabled
   * Useful for expensive debug operations that should only run when needed
   */
  isEnabled: (category: DebugCategory): boolean => {
    return isDebugEnabled(category);
  },

  /**
   * General purpose debugging for miscellaneous logs
   * Controlled by DEBUG_GENERAL environment variable
   */
  general: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('general')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Content management and rendering debugging
   * Controlled by DEBUG_CONTENT environment variable
   */
  content: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('content')) {
      console.log(`[CONTENT_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Dashboard page and component debugging
   * Controlled by DEBUG_DASHBOARD environment variable
   */
  dashboard: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('dashboard')) {
      console.log(`[DASHBOARD_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Middleware and request routing debugging
   * Controlled by DEBUG_MIDDLEWARE environment variable
   */
  middleware: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('middleware')) {
      console.log(`[MIDDLEWARE_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Security and authentication debugging
   * Controlled by DEBUG_SECURITY environment variable
   */
  security: (message: string, ...args: unknown[]): void => {
    if (isDebugEnabled('security')) {
      console.log(`[SECURITY_DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Get current debug configuration for troubleshooting
   * Only logs if at least one debug category is enabled
   */
  showConfig: (): void => {
    const categories: DebugCategory[] = ['site', 'cache', 'loading', 'theme', 'general', 'content', 'dashboard', 'middleware', 'security'];
    const enabled = categories.filter(cat => isDebugEnabled(cat));

    if (enabled.length > 0 || process.env.DEBUG_ALL === 'true') {
      console.log('[DEBUG_CONFIG] Enabled categories:', {
        all: process.env.DEBUG_ALL === 'true',
        enabled,
        env: {
          DEBUG_ALL: process.env.DEBUG_ALL,
          DEBUG_SITE: process.env.DEBUG_SITE,
          DEBUG_CACHE: process.env.DEBUG_CACHE,
          DEBUG_LOADING: process.env.DEBUG_LOADING,
          DEBUG_THEME: process.env.DEBUG_THEME,
          DEBUG_GENERAL: process.env.DEBUG_GENERAL,
          DEBUG_CONTENT: process.env.DEBUG_CONTENT,
          DEBUG_DASHBOARD: process.env.DEBUG_DASHBOARD,
          DEBUG_MIDDLEWARE: process.env.DEBUG_MIDDLEWARE,
          DEBUG_SECURITY: process.env.DEBUG_SECURITY,
        }
      });
    }
  }
};

// Export type for use in other files
export type { DebugCategory };