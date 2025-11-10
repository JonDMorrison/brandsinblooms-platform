/**
 * Image utility functions for the Brands in Blooms platform
 * Provides URL validation, retry logic, and loading state management
 */

import { handleError } from '@/src/lib/types/error-handling';

/**
 * Image loading states
 */
export type ImageLoadingState = 'loading' | 'loaded' | 'error';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 500,
  backoffMultiplier: 2,
};

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an image URL
 */
export function validateImageUrl(url: string): ImageValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL must be a non-empty string',
    };
  }

  // Check if it's a data URL (base64 encoded image)
  if (url.startsWith('data:image/')) {
    return { isValid: true };
  }

  // Check if it's a blob URL
  if (url.startsWith('blob:')) {
    return { isValid: true };
  }

  // Check if it's a relative path for static assets
  if (url.startsWith('/')) {
    return { isValid: true };
  }

  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'URL must use HTTP or HTTPS protocol',
      };
    }
    return { isValid: true };
  } catch (error: unknown) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Creates a placeholder URL for the given dimensions and type
 */
export function createPlaceholderUrl(
  width: number,
  height: number,
  type: 'gradient' | 'pattern' | 'icon' = 'gradient',
  config?: Record<string, unknown>
): string {
  const configParam = config ? `/${encodeURIComponent(JSON.stringify(config))}` : '';
  return `/api/placeholder/${width}/${height}/${type}${configParam}`;
}

/**
 * Creates a static placeholder URL from the public assets
 */
export function createStaticPlaceholderUrl(type: 'product' | 'image' | 'user'): string {
  const placeholderMap = {
    product: '/images/placeholders/product-default.svg',
    image: '/images/placeholders/image-default.svg',
    user: '/images/placeholders/user-avatar.svg',
  };
  return placeholderMap[type] || placeholderMap.image;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates the delay for a retry attempt with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  return config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying
      const delay = calculateRetryDelay(attempt, config);
      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Preloads an image and returns a promise that resolves when loaded
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    
    img.src = src;
  });
}

/**
 * Preloads an image with retry logic
 */
export async function preloadImageWithRetry(
  src: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<HTMLImageElement> {
  const validation = validateImageUrl(src);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return retryWithBackoff(
    () => preloadImage(src),
    config,
    onRetry
  );
}

/**
 * Creates a blur data URL for use as a placeholder
 */
export function createBlurDataUrl(
  width: number = 10,
  height: number = 10,
  color: string = '#f3f4f6'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  
  // Use btoa for browser compatibility or Buffer for Node.js
  if (typeof window !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } else {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

/**
 * Gets the appropriate placeholder based on image state and theme
 */
export function getPlaceholderForState(
  state: ImageLoadingState,
  placeholderType: 'gradient' | 'pattern' | 'icon' = 'gradient',
  width: number = 400,
  height: number = 400,
  isDark: boolean = false
): string {
  switch (state) {
    case 'loading':
      return createBlurDataUrl(width, height, isDark ? '#374151' : '#f3f4f6');
    case 'error':
      return createStaticPlaceholderUrl('product');
    case 'loaded':
      // This shouldn't be called when loaded, but return a safe fallback
      return createStaticPlaceholderUrl('product');
    default:
      return createPlaceholderUrl(width, height, placeholderType);
  }
}

/**
 * Image loading state manager class
 */
export class ImageLoadingManager {
  private state: ImageLoadingState = 'loading';
  private retryCount = 0;
  private readonly retryConfig: RetryConfig;
  private readonly onStateChange?: (state: ImageLoadingState) => void;

  constructor(
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
    onStateChange?: (state: ImageLoadingState) => void
  ) {
    this.retryConfig = retryConfig;
    this.onStateChange = onStateChange;
  }

  getState(): ImageLoadingState {
    return this.state;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  canRetry(): boolean {
    return this.retryCount < this.retryConfig.maxRetries;
  }

  setState(newState: ImageLoadingState): void {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  markLoading(): void {
    this.setState('loading');
  }

  markLoaded(): void {
    this.setState('loaded');
    this.retryCount = 0; // Reset retry count on successful load
  }

  markError(): void {
    this.setState('error');
  }

  incrementRetry(): void {
    this.retryCount++;
  }

  reset(): void {
    this.state = 'loading';
    this.retryCount = 0;
  }

  async loadImageWithRetry(src: string): Promise<HTMLImageElement> {
    this.markLoading();

    try {
      const img = await preloadImageWithRetry(
        src,
        this.retryConfig,
        (attempt, error) => {
          this.incrementRetry();
          console.warn(`Image load retry ${attempt} for ${src}:`, handleError(error));
        }
      );
      
      this.markLoaded();
      return img;
    } catch (error: unknown) {
      this.markError();
      throw error;
    }
  }
}

/**
 * Generates responsive image sizes string for Next.js Image component
 */
export function generateImageSizes(
  breakpoints: Record<string, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  }
): string {
  const sizes = [
    `(max-width: ${breakpoints.sm}px) 100vw`,
    `(max-width: ${breakpoints.md}px) 50vw`,
    `(max-width: ${breakpoints.lg}px) 33vw`,
    '25vw',
  ];
  
  return sizes.join(', ');
}