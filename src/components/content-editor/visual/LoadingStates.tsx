'use client';

import React from 'react';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Card } from '@/src/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Loading skeleton for the visual editor toolbar
 */
export function VisualEditorToolbarSkeleton() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for content sections
 */
export function ContentSectionSkeleton({ 
  variant = 'default' 
}: { 
  variant?: 'default' | 'hero' | 'text' | 'image' | 'grid' 
}) {
  const skeletonContent = {
    default: (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    ),
    hero: (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    ),
    text: (
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ),
    image: (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    ),
    grid: (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    ),
  };

  return (
    <Card className="p-6 animate-pulse">
      {skeletonContent[variant]}
    </Card>
  );
}

/**
 * Loading skeleton for the entire visual editor
 */
export function VisualEditorSkeleton() {
  return (
    <div className="visual-editor-container">
      <VisualEditorToolbarSkeleton />
      <div className="p-4 space-y-6">
        <ContentSectionSkeleton variant="hero" />
        <ContentSectionSkeleton variant="text" />
        <ContentSectionSkeleton variant="image" />
        <ContentSectionSkeleton variant="grid" />
        <ContentSectionSkeleton variant="text" />
      </div>
    </div>
  );
}

/**
 * Loading spinner overlay for operations
 */
export function LoadingOverlay({ 
  message = "Loading...",
  transparent = false
}: { 
  message?: string;
  transparent?: boolean;
}) {
  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      ${transparent ? 'bg-black/20' : 'bg-background/80'}
      backdrop-blur-sm
    `}>
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </Card>
    </div>
  );
}

/**
 * Inline loading spinner for specific operations
 */
export function InlineLoader({ 
  size = "sm",
  message
}: { 
  size?: "xs" | "sm" | "md" | "lg";
  message?: string;
}) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4", 
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

/**
 * Loading state for drag and drop operations
 */
export function DragDropLoadingSkeleton() {
  return (
    <div className="space-y-2 p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/**
 * Loading state for component library
 */
export function ComponentLibrarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-lg">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Auto-save status indicator with loading state
 */
export function AutoSaveStatusLoader({ status }: { status: 'saving' | 'saved' | 'error' }) {
  const statusConfig = {
    saving: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      text: "Saving...",
      className: "text-orange-600"
    },
    saved: {
      icon: <div className="h-3 w-3 rounded-full bg-green-500" />,
      text: "Saved",
      className: "text-green-600"
    },
    error: {
      icon: <div className="h-3 w-3 rounded-full bg-red-500" />,
      text: "Error",
      className: "text-red-600"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-1 text-xs ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

/**
 * Hook to manage loading states
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingMessage, setLoadingMessage] = React.useState<string>('');

  const startLoading = React.useCallback((message = 'Loading...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading
  };
}

/**
 * Provider for managing global loading states
 */
interface LoadingContextValue {
  globalLoading: boolean;
  globalMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = React.createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [globalLoading, setGlobalLoadingState] = React.useState(false);
  const [globalMessage, setGlobalMessage] = React.useState('');

  const setGlobalLoading = React.useCallback((loading: boolean, message = 'Loading...') => {
    setGlobalLoadingState(loading);
    setGlobalMessage(loading ? message : '');
  }, []);

  return (
    <LoadingContext.Provider value={{ globalLoading, globalMessage, setGlobalLoading }}>
      {children}
      {globalLoading && (
        <LoadingOverlay message={globalMessage} />
      )}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}