'use client'

// Preload critical components and chunks for better performance
export class ComponentPreloader {
  private static instance: ComponentPreloader
  private preloadedComponents: Set<string> = new Set()
  private preloadPromises: Map<string, Promise<any>> = new Map()

  private constructor() {}

  static getInstance(): ComponentPreloader {
    if (!ComponentPreloader.instance) {
      ComponentPreloader.instance = new ComponentPreloader()
    }
    return ComponentPreloader.instance
  }

  // Preload dashboard components when user hovers over navigation
  async preloadDashboardComponents() {
    const components = [
      () => import('@/src/components/ProductCard'),
      () => import('@/src/components/orders/OrderFilters'),
      () => import('@/src/components/OrderStats'),
      () => import('@/src/components/DashboardStats'),
    ]

    const promises = components.map(importFn => 
      this.safeImport('dashboard-components', importFn)
    )

    return Promise.allSettled(promises)
  }

  // Preload product-related components
  async preloadProductComponents() {
    const components = [
      () => import('@/src/components/products/BulkActionsToolbar'),
      () => import('@/src/components/products/ImportExportDialog'), 
      () => import('@/src/components/products/ProductEditModal'),
    ]

    const promises = components.map(importFn => 
      this.safeImport('product-components', importFn)
    )

    return Promise.allSettled(promises)
  }

  // Preload design components when user navigates to design tab
  async preloadDesignComponents() {
    const components = [
      () => import('@/src/components/design/ColorCustomization'),
      () => import('@/src/components/design/TypographyCustomization'),
      () => import('@/src/components/design/LogoCustomization'),
    ]

    const promises = components.map(importFn => 
      this.safeImport('design-components', importFn)
    )

    return Promise.allSettled(promises)
  }

  // Preload order-related components
  async preloadOrderComponents() {
    const components = [
      () => import('@/src/components/orders/OrderEmptyState'),
    ]

    const promises = components.map(importFn =>
      this.safeImport('order-components', importFn)
    )

    return Promise.allSettled(promises)
  }

  private async safeImport(key: string, importFn: () => Promise<any>): Promise<any> {
    if (this.preloadedComponents.has(key)) {
      return this.preloadPromises.get(key)
    }

    const promise = importFn().catch(error => {
      console.warn(`Failed to preload ${key}:`, error)
      return null
    })

    this.preloadedComponents.add(key)
    this.preloadPromises.set(key, promise)

    return promise
  }

  // Check if components are already preloaded
  isPreloaded(key: string): boolean {
    return this.preloadedComponents.has(key)
  }

  // Clear preload cache (useful for testing)
  clearCache() {
    this.preloadedComponents.clear()
    this.preloadPromises.clear()
  }
}

// Utility functions for easy use
export const preloader = ComponentPreloader.getInstance()

// Preload on navigation hover
export const preloadOnHover = {
  dashboard: () => preloader.preloadDashboardComponents(),
  products: () => preloader.preloadProductComponents(), 
  design: () => preloader.preloadDesignComponents(),
  orders: () => preloader.preloadOrderComponents(),
}

// Preload critical chunks on app start
export const preloadCriticalChunks = async () => {
  if (typeof window === 'undefined') return

  // Preload the most commonly used components
  const criticalComponents = [
    () => import('@/src/components/ui/card'),
    () => import('@/src/components/ui/button'),  
    () => import('@/src/components/ui/input'),
    () => import('@/src/components/ui/skeleton'),
  ]

  const promises = criticalComponents.map(importFn => 
    importFn().catch(error => {
      console.warn('Failed to preload critical component:', error)
      return null
    })
  )

  return Promise.allSettled(promises)
}

// Resource hints for better loading performance
export const addResourceHints = () => {
  if (typeof document === 'undefined') return

  const head = document.head

  // DNS prefetch for external resources
  const dnsPrefetchUrls = [
    '//fonts.googleapis.com',
    '//fonts.gstatic.com', 
  ]

  dnsPrefetchUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = url
    head.appendChild(link)
  })

  // Preconnect to critical origins
  const preconnectUrls = [
    '//fonts.googleapis.com',
    '//fonts.gstatic.com',
  ]

  preconnectUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = url
    link.crossOrigin = 'anonymous'
    head.appendChild(link)
  })
}