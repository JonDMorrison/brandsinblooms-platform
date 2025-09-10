'use client'

import React, { Suspense, useState, useEffect, useRef } from 'react'

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasIntersected, options])

  return [elementRef, hasIntersected]
}

// Lazy loading wrapper component
interface LazyLoadWrapperProps {
  children: React.ReactNode
  fallback: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function LazyLoadWrapper({
  children,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  once = true,
}: LazyLoadWrapperProps) {
  const [ref, hasIntersected] = useIntersectionObserver({
    threshold,
    rootMargin,
  })

  return (
    <div ref={ref} className={className}>
      {hasIntersected ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

// Lazy loading component factory
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  fallback: React.ReactNode
) {
  const LazyComponent = React.lazy(importFunction)
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Viewport-based lazy loading component
interface ViewportLazyLoadProps {
  children: React.ReactNode
  fallback: React.ReactNode
  className?: string
  delay?: number
  minHeight?: string
}

export function ViewportLazyLoad({
  children,
  fallback,
  className = '',
  delay = 0,
  minHeight,
}: ViewportLazyLoadProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const [ref, hasIntersected] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (hasIntersected) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldLoad(true), delay)
        return () => clearTimeout(timer)
      } else {
        setShouldLoad(true)
      }
    }
  }, [hasIntersected, delay])

  return (
    <div 
      ref={ref} 
      className={className}
      style={minHeight ? { minHeight } : undefined}
    >
      {shouldLoad ? children : fallback}
    </div>
  )
}

// Preload component for critical resources
interface PreloadProps {
  href: string
  as: 'script' | 'style' | 'font' | 'image'
  type?: string
  crossOrigin?: string
}

export function Preload({ href, as, type, crossOrigin }: PreloadProps) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    if (crossOrigin) link.crossOrigin = crossOrigin
    
    document.head.appendChild(link)
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [href, as, type, crossOrigin])

  return null
}

// Progressive image loading component
interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  blurDataURL?: string
}

export function ProgressiveImage({
  src,
  alt,
  className = '',
  placeholder,
  blurDataURL,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = src
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(img)

    return () => observer.disconnect()
  }, [src])

  const handleLoad = () => setIsLoaded(true)
  const handleError = () => setHasError(true)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <img
        ref={imgRef}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        style={blurDataURL && !isLoaded ? {
          backgroundImage: `url(${blurDataURL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
}

// Content-based lazy loading with retry logic
interface LazyContentProps {
  children: React.ReactNode
  fallback: React.ReactNode
  errorFallback?: React.ReactNode
  retryCount?: number
  className?: string
}

export function LazyContent({
  children,
  fallback,
  errorFallback,
  retryCount = 3,
  className = '',
}: LazyContentProps) {
  const [hasError, setHasError] = useState(false)
  const [retries, setRetries] = useState(0)
  const [ref, hasIntersected] = useIntersectionObserver()

  const handleRetry = () => {
    if (retries < retryCount) {
      setHasError(false)
      setRetries(prev => prev + 1)
    }
  }

  if (!hasIntersected) {
    return (
      <div ref={ref} className={className}>
        {fallback}
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={className}>
        {errorFallback || (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Failed to load content</p>
            {retries < retryCount && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry ({retries + 1}/{retryCount})
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <Suspense 
        fallback={fallback}
        onError={() => setHasError(true)}
      >
        {children}
      </Suspense>
    </div>
  )
}