'use client'

import React, { Suspense, lazy } from 'react'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

// Loading fallbacks for different component types
export function RichTextEditorSkeleton() {
  return (
    <div className="border border-border rounded-md">
      <div className="border-b border-border p-2">
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function IconPickerSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <div className="border rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export function SectionEditorSkeleton() {
  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-7" />
        </div>
      </div>
      <div className="p-3">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

export function PreviewSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Error fallback for lazy loaded components
function LazyComponentError({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" className="m-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Failed to load component. Please refresh the page and try again.
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs">Error details</summary>
            <pre className="text-xs mt-1 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Lazy loaded components with proper error boundaries and loading states
export const LazyRichTextEditor = lazy(() => 
  import('./RichTextEditor').then(module => ({
    default: module.RichTextEditor
  })).catch(error => {
    console.error('Failed to load RichTextEditor:', error)
    throw error
  })
)

export const LazyIconPicker = lazy(() => 
  import('./inputs/IconPicker').then(module => ({
    default: module.IconPicker
  })).catch(error => {
    console.error('Failed to load IconPicker:', error)
    throw error
  })
)

export const LazyDynamicSection = lazy(() => 
  import('../preview/DynamicSection').then(module => ({
    default: module.DynamicSection
  })).catch(error => {
    console.error('Failed to load DynamicSection:', error)
    throw error
  })
)

export const LazyContentEditor = lazy(() => 
  import('./ContentEditor').then(module => ({
    default: module.ContentEditor
  })).catch(error => {
    console.error('Failed to load ContentEditor:', error)
    throw error
  })
)

// Wrapper components with suspense and error handling
export function SuspensefulRichTextEditor(props: any) {
  return (
    <Suspense fallback={<RichTextEditorSkeleton />}>
      <LazyRichTextEditor {...props} />
    </Suspense>
  )
}

export function SuspensefulIconPicker(props: any) {
  return (
    <Suspense fallback={<IconPickerSkeleton />}>
      <LazyIconPicker {...props} />
    </Suspense>
  )
}

export function SuspensefulDynamicSection(props: any) {
  return (
    <Suspense fallback={<PreviewSkeleton />}>
      <LazyDynamicSection {...props} />
    </Suspense>
  )
}

export function SuspensefulContentEditor(props: any) {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SectionEditorSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <LazyContentEditor {...props} />
    </Suspense>
  )
}

// Preloader utility for critical components
export function preloadEditorComponents() {
  // Preload critical editor components
  const preloadPromises = [
    import('./RichTextEditor'),
    import('./inputs/IconPicker'),
    import('../preview/DynamicSection'),
    import('./ContentEditor')
  ]

  return Promise.allSettled(preloadPromises)
}

// Hook for preloading components on demand
export function usePreloadComponents() {
  const [isPreloading, setIsPreloading] = React.useState(false)
  const [isPreloaded, setIsPreloaded] = React.useState(false)

  const preload = React.useCallback(async () => {
    if (isPreloaded || isPreloading) return

    setIsPreloading(true)
    try {
      await preloadEditorComponents()
      setIsPreloaded(true)
    } catch (error) {
      console.warn('Some components failed to preload:', error)
    } finally {
      setIsPreloading(false)
    }
  }, [isPreloaded, isPreloading])

  return {
    preload,
    isPreloading,
    isPreloaded
  }
}

// Component registry for dynamic imports
export const ComponentRegistry = {
  RichTextEditor: LazyRichTextEditor,
  IconPicker: LazyIconPicker,
  DynamicSection: LazyDynamicSection,
  ContentEditor: LazyContentEditor
} as const

export type ComponentName = keyof typeof ComponentRegistry

// Dynamic component loader with caching
const componentCache = new Map<ComponentName, React.ComponentType<any>>()

export async function loadComponent(name: ComponentName): Promise<React.ComponentType<any>> {
  if (componentCache.has(name)) {
    return componentCache.get(name)!
  }

  const component = ComponentRegistry[name]
  componentCache.set(name, component)
  return component
}

export default {
  SuspensefulRichTextEditor,
  SuspensefulIconPicker,
  SuspensefulDynamicSection,
  SuspensefulContentEditor,
  preloadEditorComponents,
  usePreloadComponents,
  loadComponent
}