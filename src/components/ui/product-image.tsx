'use client'

import React, { useState, useEffect, useCallback, forwardRef, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useLazyLoad } from '@/hooks/useLazyLoad'
import { useImagePreloader } from '@/lib/utils/image-preloader'
import { ImageSkeleton } from '@/components/ui/skeleton'
import { Package, ImageIcon, User } from 'lucide-react'
import {
  ImageLoadingManager,
  validateImageUrl,
  createBlurDataUrl,
  createStaticPlaceholderUrl,
  createPlaceholderUrl,
  generateImageSizes,
  DEFAULT_RETRY_CONFIG,
  type ImageLoadingState,
  type RetryConfig,
} from '@/lib/utils/image-helpers'
import {
  generatePlaceholderSVGCached,
  type PlaceholderMetrics,
} from '@/lib/utils/placeholder-generator'
import { handleError } from '@/lib/types/error-handling'

/**
 * Placeholder configuration for ProductImage
 */
export interface PlaceholderConfig {
  type: 'gradient' | 'pattern' | 'icon'
  config?: Record<string, unknown>
  staticFallback?: 'product' | 'image' | 'user'
}

/**
 * Enhanced ProductImage component props with performance optimizations
 */
export interface ProductImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: PlaceholderConfig
  retryConfig?: Partial<RetryConfig>
  priority?: boolean
  loading?: 'lazy' | 'eager'
  sizes?: string
  quality?: number
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void
  onError?: (error: unknown, retryCount: number) => void
  onRetry?: (attempt: number, error: unknown) => void
  showLoadingState?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  // Enhanced props
  productName?: string
  category?: string
  featured?: boolean
  enableLazyLoad?: boolean
  enablePreload?: boolean
  lazyLoadOptions?: {
    rootMargin?: string
    threshold?: number
  }
  enableSkeletonTransition?: boolean
  optimizePlaceholder?: boolean
  performanceMode?: 'auto' | 'aggressive' | 'conservative'
  onLazyLoadTrigger?: () => void
  onPerformanceMetrics?: (metrics: {
    loadTime: number
    fromCache: boolean
    placeholderGenTime?: number
  }) => void
}

/**
 * ProductImage component with progressive loading, error handling, and retry logic
 */
export const ProductImage = forwardRef<HTMLImageElement, ProductImageProps>(
  (
    {
      src,
      alt,
      width = 400,
      height = 400,
      className,
      placeholder = { type: 'gradient', staticFallback: 'product' },
      retryConfig: userRetryConfig,
      priority = false,
      loading = 'lazy',
      sizes,
      quality = 75,
      onLoad,
      onError,
      onRetry,
      showLoadingState = true,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      // Enhanced props
      productName = '',
      category,
      featured = false,
      enableLazyLoad = true,
      enablePreload = false,
      lazyLoadOptions = {},
      enableSkeletonTransition = true,
      optimizePlaceholder = true,
      performanceMode = 'auto',
      onLazyLoadTrigger,
      onPerformanceMetrics,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const { preload } = useImagePreloader()
    
    // Merge user retry config with defaults
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...userRetryConfig }
    
    // State management
    const [loadingState, setLoadingState] = useState<ImageLoadingState>('loading')
    const [currentSrc, setCurrentSrc] = useState<string>(src)
    const [retryCount, setRetryCount] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [showSkeleton, setShowSkeleton] = useState(enableSkeletonTransition)
    const [performanceMetrics, setPerformanceMetrics] = useState<{
      loadTime: number
      fromCache: boolean
      placeholderGenTime?: number
    } | null>(null)
    
    const imageManager = useMemo(() => 
      new ImageLoadingManager(retryConfig, setLoadingState),
      [] // Only create once, don't recreate on retryConfig changes
    )
    
    // Performance mode configuration
    const performanceConfig = useMemo(() => {
      const configs = {
        conservative: {
          lazyLoad: enableLazyLoad && !priority,
          preload: false,
          skeletonDelay: 300,
          optimizePlaceholder: false,
        },
        auto: {
          lazyLoad: enableLazyLoad && !priority,
          preload: enablePreload || featured,
          skeletonDelay: enableSkeletonTransition ? 150 : 0,
          optimizePlaceholder,
        },
        aggressive: {
          lazyLoad: enableLazyLoad && !priority && !featured,
          preload: enablePreload || featured || priority,
          skeletonDelay: 0,
          optimizePlaceholder: true,
        },
      }
      return configs[performanceMode]
    }, [performanceMode, enableLazyLoad, enablePreload, featured, priority, enableSkeletonTransition, optimizePlaceholder])

    // Validate the provided image URL
    const validation = validateImageUrl(src)
    const isValidSrc = validation.isValid

    // Generate optimized placeholder
    const optimizedPlaceholder = useMemo(() => {
      if (!optimizePlaceholder || !isValidSrc) {
        return createBlurDataUrl(10, 10, isDark ? '#374151' : '#f3f4f6')
      }

      // Generate dynamic placeholder based on product data
      const placeholderParams = {
        width,
        height,
        type: placeholder.type,
        config: {
          ...placeholder.config,
          // Category-based colors
          colors: category === 'flowers' ? ['#fce7f3', '#fbbf24'] :
                 category === 'plants' ? ['#d9f99d', '#84cc16'] :
                 isDark ? ['#374151', '#6b7280'] : ['#f3f4f6', '#d1d5db'],
        },
      }

      const result = generatePlaceholderSVGCached(placeholderParams)
      return result.dataUrl
    }, [optimizePlaceholder, isValidSrc, isDark, width, height, placeholder, category])

    // Generate blur placeholder
    const blurDataUrl = optimizedPlaceholder

    // Get appropriate placeholder based on state
    const getPlaceholderSrc = useCallback(() => {
      if (!isValidSrc || loadingState === 'error') {
        return placeholder.staticFallback
          ? createStaticPlaceholderUrl(placeholder.staticFallback)
          : createPlaceholderUrl(width, height, placeholder.type, placeholder.config)
      }
      
      if (loadingState === 'loading' && showLoadingState) {
        return blurDataUrl
      }

      return currentSrc
    }, [
      isValidSrc,
      loadingState,
      placeholder,
      width,
      height,
      showLoadingState,
      blurDataUrl,
      currentSrc
    ])

    // Handle image load success
    const handleLoad = useCallback(
      (event: React.SyntheticEvent<HTMLImageElement>) => {
        imageManager.markLoaded()
        setRetryCount(0)
        setImageLoaded(true)
        setLoadingState('loaded')
        onLoad?.(event)
      },
      [onLoad] // Remove imageManager from dependencies
    )

    // Handle image load error with retry logic
    const handleError = useCallback(
      async (event: React.SyntheticEvent<HTMLImageElement>) => {
        const error = new Error(`Failed to load image: ${currentSrc}`)
        
        try {
          if (imageManager.canRetry()) {
            const attempt = imageManager.getRetryCount() + 1
            imageManager.incrementRetry()
            setRetryCount(attempt)
            
            // Call retry callback
            onRetry?.(attempt, error)
            
            // Attempt to reload the image after delay
            const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1)
            
            setTimeout(() => {
              // Force re-render by updating src with cache buster
              const cacheBuster = `?retry=${attempt}&t=${Date.now()}`
              const newSrc = src.includes('?') 
                ? `${src}&${cacheBuster.slice(1)}` 
                : `${src}${cacheBuster}`
              setCurrentSrc(newSrc)
              imageManager.markLoading()
            }, delay)
          } else {
            // Max retries reached, mark as error
            imageManager.markError()
            onError?.(error, retryCount)
          }
        } catch (retryError: unknown) {
          imageManager.markError()
          onError?.(retryError, retryCount)
        }
      },
      [currentSrc, imageManager, retryConfig, onRetry, onError, retryCount, src]
    )

    // Lazy loading implementation
    const lazyLoad = useLazyLoad(
      performanceConfig.lazyLoad
        ? {
            rootMargin: '50px',
            threshold: 0.1,
            unobserveOnLoad: true,
            debug: false,
            ...lazyLoadOptions,
          }
        : { rootMargin: '0px', threshold: 1 }, // Immediate loading if lazy load disabled
      async () => {
        onLazyLoadTrigger?.()
        
        // Preload if configured
        if (performanceConfig.preload && isValidSrc) {
          try {
            await preload({
              url: src,
              priority: featured ? 'high' : 'normal',
              sizes,
            })
          } catch (error: unknown) {
            console.warn('Preload failed:', handleError(error))
          }
        }
        
        // Start loading the actual image
        const startTime = performance.now()
        setLoadingState('loading')
        
        // Delay skeleton hiding for smooth transition
        if (enableSkeletonTransition) {
          setTimeout(() => {
            setShowSkeleton(false)
          }, performanceConfig.skeletonDelay)
        }
        
        return new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            const loadTime = performance.now() - startTime
            setImageLoaded(true)
            setPerformanceMetrics({
              loadTime,
              fromCache: loadTime < 10, // Assume cached if very fast
            })
            resolve()
          }
          img.onerror = reject
          img.src = src
        })
      }
    )

    // Reset state when src changes
    useEffect(() => {
      // Only reset if src actually changed
      if (currentSrc !== src) {
        setCurrentSrc(src)
        imageManager.reset()
        setRetryCount(0)
        setImageLoaded(false)
        setShowSkeleton(enableSkeletonTransition)
      }
    }, [src]) // Remove imageManager and enableSkeletonTransition from dependencies

    // Preload image if not valid src
    useEffect(() => {
      if (!isValidSrc) {
        imageManager.markError()
      }
    }, [isValidSrc, imageManager])

    // Report performance metrics
    useEffect(() => {
      if (performanceMetrics && onPerformanceMetrics) {
        onPerformanceMetrics(performanceMetrics)
      }
    }, [performanceMetrics, onPerformanceMetrics])

    // Trigger loading immediately if lazy load is disabled
    useEffect(() => {
      if (!performanceConfig.lazyLoad || priority) {
        // Only trigger if not already loaded
        if (!imageLoaded) {
          lazyLoad.triggerLoad()
        }
      }
    }, [performanceConfig.lazyLoad, priority]) // Remove lazyLoad from dependencies

    // Generate responsive sizes if not provided
    const responsiveSizes = sizes || generateImageSizes()

    // Determine if we should show the placeholder
    const shouldShowPlaceholder = !isValidSrc || (loadingState === 'error')
    const placeholderSrc = getPlaceholderSrc()
    const imageSrc = shouldShowPlaceholder ? placeholderSrc : currentSrc
    
    // Check if the image is an SVG
    const isSvg = imageSrc?.endsWith('.svg')

    // Create comprehensive alt text
    const imageAlt = alt || 'Product image'
    const fullAlt = loadingState === 'loading' && showLoadingState 
      ? `Loading ${imageAlt}` 
      : loadingState === 'error' 
        ? `Failed to load ${imageAlt}` 
        : imageAlt

    // Accessibility props
    const accessibilityProps = {
      'aria-label': ariaLabel || fullAlt,
      'aria-describedby': ariaDescribedBy,
      'aria-busy': loadingState === 'loading' ? 'true' : undefined,
      'role': loadingState === 'error' ? 'img' : undefined,
    }

    return (
      <div 
        ref={lazyLoad.ref}
        className={cn(
          'relative overflow-hidden bg-muted',
          'smooth-transition',
          {
            'content-visibility-auto': performanceConfig.lazyLoad,
            'opacity-75': loadingState === 'loading',
            'opacity-60': loadingState === 'error',
          },
          className
        )}
        {...accessibilityProps}
      >
        {/* Enhanced skeleton with smooth transitions */}
        {showSkeleton && enableSkeletonTransition && !imageLoaded && (
          <ImageSkeleton
            width="100%"
            height="100%"
            animation="shimmer"
            rounded="none"
            className="absolute inset-0 z-10"
          />
        )}
        {/* Show placeholder icon when no valid image or loading */}
        {(shouldShowPlaceholder || isSvg) && (
          <>
            {/* Gradient background with 20% opacity */}
            <div
              className="absolute inset-0"
              style={{
                background: placeholder.type === 'gradient' && placeholder.config?.colors
                  ? `linear-gradient(135deg, ${(placeholder.config.colors as string[])[0]} 0%, ${(placeholder.config.colors as string[])[1]} 100%)`
                  : undefined,
                backgroundColor: !placeholder.config?.colors ? 'hsl(var(--muted))' : undefined,
                opacity: placeholder.type === 'gradient' && placeholder.config?.colors ? 0.2 : 1
              }}
            />
            {/* Icon at full opacity */}
            <div className="absolute inset-0 flex items-center justify-center">
              {placeholder.staticFallback === 'user' ? (
                <User className="h-12 w-12 text-gray-500/60 drop-shadow-sm" />
              ) : placeholder.staticFallback === 'image' ? (
                <ImageIcon className="h-12 w-12 text-gray-500/60 drop-shadow-sm" />
              ) : (
                <Package className="h-12 w-12 text-gray-500/60 drop-shadow-sm" />
              )}
            </div>
          </>
        )}
        
        {/* Show actual image when we have a valid source */}
        {isValidSrc && (
          <Image
            ref={ref}
            src={currentSrc}
            alt={fullAlt}
            width={width}
            height={height}
            priority={priority}
            {...(!priority && { loading: performanceConfig.lazyLoad ? 'lazy' : loading })}
            sizes={responsiveSizes}
            quality={quality}
            placeholder="blur"
            blurDataURL={blurDataUrl}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'object-cover',
              {
                'opacity-0': !imageLoaded && showLoadingState,
                'opacity-100 image-fade-in': imageLoaded,
                'opacity-60': loadingState === 'error',
                'skeleton-to-content': imageLoaded && enableSkeletonTransition,
              }
            )}
            style={{
              width: '100%',
              height: '100%',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            {...props}
          />
        )}

        {/* Loading overlay - only show when actually loading a real image, not for placeholders */}
        {loadingState === 'loading' && showLoadingState && isValidSrc && !imageLoaded && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-muted/50"
            aria-hidden="true"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          </div>
        )}

        {/* Error overlay - only show if not already showing placeholder */}
        {loadingState === 'error' && !shouldShowPlaceholder && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-muted/50"
            aria-hidden="true"
          >
            <div className="flex flex-col items-center gap-2 text-center p-4">
              <Package className="h-8 w-8 text-gray-500" />
              <span className="text-xs text-gray-500">
                Failed to load image
              </span>
              {retryCount > 0 && (
                <span className="text-xs text-gray-500">
                  Retried {retryCount} time{retryCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Retry indicator */}
        {retryCount > 0 && loadingState === 'loading' && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-md"
            aria-hidden="true"
          >
            Retry {retryCount}
          </div>
        )}
      </div>
    )
  }
)

ProductImage.displayName = 'ProductImage'

/**
 * ProductImageSkeleton component for loading states
 */
export const ProductImageSkeleton: React.FC<{
  width?: number
  height?: number
  className?: string
}> = ({ width = 400, height = 400, className }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted rounded-md',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-center h-full">
        <svg
          className="h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  )
}

ProductImageSkeleton.displayName = 'ProductImageSkeleton'

export default ProductImage