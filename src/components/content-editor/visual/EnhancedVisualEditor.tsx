'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { PageContent, LayoutType } from '@/lib/content/schema';

// Import all the components we've created for Milestone 5
import { VisualEditorErrorBoundary, ContentRenderErrorBoundary } from './ErrorBoundary';
import { VisualEditorSkeleton, LoadingProvider, useGlobalLoading } from './LoadingStates';
import { VisualEditorToastProvider, useVisualEditorToast } from './VisualEditorToast';
import { 
  PerformanceProvider, 
  OptimizedSection, 
  SmartContentList, 
  usePerformance,
  useMemoryMonitor 
} from './PerformanceOptimizations';
import { EditModeContainer, FadeTransition, useReducedMotion } from './Transitions';
import { 
  useDeviceDetection, 
  MobileFloatingToolbar, 
  ViewportSwitcher,
  TouchArea 
} from './MobileOptimizations';
import { AutoVirtualizedList } from './VirtualScrolling';
import { 
  MemoryOptimized, 
  useMemoryLeakDetection, 
  useCleanup,
  useResourceManager 
} from './MemoryManagement';

// Import existing components
import { useSiteTheme } from '@/src/hooks/useSiteTheme';
import { cn } from '@/lib/utils';
import { Toaster } from '@/src/components/ui/toaster';

/**
 * Enhanced Visual Editor Props with all M5 features
 */
interface EnhancedVisualEditorProps {
  content: PageContent;
  layout: LayoutType;
  title?: string;
  subtitle?: string;
  onContentChange: (content: PageContent) => void;
  onTitleChange?: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
  className?: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  
  // Performance options
  enableVirtualization?: boolean;
  enableMemoryMonitoring?: boolean;
  maxMemoryUsage?: number;
  
  // Mobile optimizations
  enableTouchOptimizations?: boolean;
  enableResponsiveViewports?: boolean;
  
  // Error handling
  enableErrorBoundaries?: boolean;
  showErrorDetails?: boolean;
  
  // Loading states
  enableLoadingStates?: boolean;
  isLoading?: boolean;
  
  // Transition options
  enableTransitions?: boolean;
  respectReducedMotion?: boolean;
}

/**
 * Main Enhanced Visual Editor Component
 */
const EnhancedVisualEditorCore = memo<EnhancedVisualEditorProps>(function EnhancedVisualEditorCore({
  content,
  layout,
  title,
  subtitle,
  onContentChange,
  onTitleChange,
  onSubtitleChange,
  className,
  viewport: initialViewport = 'desktop',
  enableVirtualization = true,
  enableMemoryMonitoring = true,
  maxMemoryUsage = 150,
  enableTouchOptimizations = true,
  enableResponsiveViewports = true,
  enableErrorBoundaries = true,
  showErrorDetails = false,
  enableLoadingStates = true,
  isLoading = false,
  enableTransitions = true,
  respectReducedMotion = true
}) {
  // Device detection and responsive state
  const { isMobile, isTablet, isTouchDevice, screenWidth } = useDeviceDetection();
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>(initialViewport);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Performance monitoring
  const { shouldUseLazyLoading, shouldUseVirtualization, isHighMemoryUsage } = usePerformance();
  const memoryUsage = useMemoryMonitor(maxMemoryUsage);
  
  // Memory leak detection in development
  useMemoryLeakDetection('EnhancedVisualEditor');
  
  // Cleanup management
  const { addCleanup } = useCleanup();
  const resourceManager = useResourceManager();
  
  // Toast notifications
  const { content: contentToast, editMode: editModeToast } = useVisualEditorToast();
  
  // Motion preferences
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enableTransitions && !(respectReducedMotion && prefersReducedMotion);
  
  // Theme and styling
  const { theme } = useSiteTheme();
  
  // Auto-adjust viewport based on screen size
  useEffect(() => {
    if (enableResponsiveViewports) {
      if (screenWidth < 768) {
        setViewport('mobile');
      } else if (screenWidth < 1024) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    }
  }, [screenWidth, enableResponsiveViewports]);

  // Content sections management
  const sections = useMemo(() => {
    return Object.entries(content.sections || {}).map(([key, section]) => ({
      key,
      section
    }));
  }, [content.sections]);

  // Handle content updates with performance optimization
  const handleContentUpdate = useCallback((updatedContent: PageContent) => {
    if (enableMemoryMonitoring && isHighMemoryUsage) {
      console.warn('Delaying content update due to high memory usage');
      setTimeout(() => onContentChange(updatedContent), 100);
    } else {
      onContentChange(updatedContent);
    }
    contentToast.updated();
  }, [onContentChange, enableMemoryMonitoring, isHighMemoryUsage, contentToast]);

  // Handle edit mode changes
  const handleEditModeChange = useCallback((editing: boolean) => {
    setIsEditing(editing);
    if (editing) {
      editModeToast.activated();
    } else {
      editModeToast.deactivated();
    }
  }, [editModeToast]);

  // Handle section selection
  const handleSectionSelect = useCallback((sectionKey: string | null) => {
    setActiveSection(sectionKey);
  }, []);

  // Render section with all optimizations
  const renderSection = useCallback((item: { key: string; section: any }, index: number) => {
    const sectionElement = (
      <OptimizedSection
        key={item.key}
        section={item.section}
        sectionKey={item.key}
        isEditing={isEditing && activeSection === item.key}
        onEdit={() => handleSectionSelect(item.key)}
        onDelete={() => {
          const updatedContent = { ...content };
          delete updatedContent.sections[item.key];
          handleContentUpdate(updatedContent);
        }}
      >
        <div
          className={cn(
            'section-content p-4 border rounded-lg',
            isEditing && activeSection === item.key && 'ring-2 ring-primary',
            enableTouchOptimizations && isTouchDevice && 'touch-manipulation'
          )}
          style={{ minHeight: '100px' }}
        >
          {/* Section content would be rendered here based on section type */}
          <div className="text-sm text-muted-foreground">
            Section: {item.section.type || 'Unknown'} ({item.key})
          </div>
          <div className="mt-2">
            {/* This would contain the actual section content */}
            {JSON.stringify(item.section.content || {}, null, 2).slice(0, 200)}...
          </div>
        </div>
      </OptimizedSection>
    );

    // Wrap with touch area for mobile
    if (enableTouchOptimizations && isTouchDevice) {
      return (
        <TouchArea
          key={item.key}
          onClick={() => handleSectionSelect(item.key)}
          className="block w-full"
        >
          {sectionElement}
        </TouchArea>
      );
    }

    return sectionElement;
  }, [
    isEditing,
    activeSection,
    content,
    handleSectionSelect,
    handleContentUpdate,
    enableTouchOptimizations,
    isTouchDevice
  ]);

  // Get viewport styles
  const getViewportStyles = useCallback(() => {
    const baseStyles = {
      backgroundColor: theme?.colors?.background || '#FFFFFF',
      transition: shouldAnimate ? 'all 200ms ease-out' : 'none'
    };

    switch (viewport) {
      case 'mobile':
        return {
          ...baseStyles,
          maxWidth: '390px',
          margin: '0 auto',
          minHeight: '600px'
        };
      case 'tablet':
        return {
          ...baseStyles,
          maxWidth: '768px',
          margin: '0 auto',
          minHeight: '600px'
        };
      default:
        return {
          ...baseStyles,
          width: '100%',
          minHeight: '600px'
        };
    }
  }, [theme, viewport, shouldAnimate]);

  // Loading state
  if (enableLoadingStates && isLoading) {
    return (
      <FadeTransition show={true}>
        <VisualEditorSkeleton />
      </FadeTransition>
    );
  }

  return (
    <div className={cn('enhanced-visual-editor', className)}>
      {/* Viewport Switcher */}
      {enableResponsiveViewports && (
        <div className="mb-4">
          <ViewportSwitcher
            currentViewport={viewport}
            onViewportChange={setViewport}
          />
        </div>
      )}

      {/* Editor Container with Transitions */}
      <EditModeContainer
        isEditing={isEditing}
        onTransitionComplete={handleEditModeChange}
        animationPreset={shouldAnimate ? 'medium' : 'fast'}
      >
        <div
          className="editor-content"
          style={getViewportStyles()}
        >
          {/* Content Sections */}
          {enableVirtualization && (shouldUseVirtualization || sections.length > 50) ? (
            <AutoVirtualizedList
              items={sections}
              height={600}
              renderItem={renderSection}
              loading={isLoading}
              loadingComponent={<VisualEditorSkeleton />}
              emptyComponent={
                <div className="text-center text-muted-foreground p-8">
                  No content sections to display
                </div>
              }
            />
          ) : (
            <SmartContentList
              sections={sections}
              renderSection={renderSection}
              containerHeight={600}
            />
          )}

          {/* Mobile Floating Toolbar */}
          {enableTouchOptimizations && isTouchDevice && activeSection && (
            <MobileFloatingToolbar
              isVisible={isEditing}
              position={{ x: screenWidth / 2, y: 100 }}
              onSave={() => {
                // Save logic here
                setIsEditing(false);
                setActiveSection(null);
              }}
              onCancel={() => {
                setIsEditing(false);
                setActiveSection(null);
              }}
              onDelete={() => {
                if (activeSection) {
                  const updatedContent = { ...content };
                  delete updatedContent.sections[activeSection];
                  handleContentUpdate(updatedContent);
                  setActiveSection(null);
                }
              }}
            />
          )}
        </div>
      </EditModeContainer>

      {/* Development Memory Monitor */}
      {process.env.NODE_ENV === 'development' && enableMemoryMonitoring && memoryUsage && (
        <div className="fixed bottom-20 right-4 text-xs bg-black text-white p-2 rounded opacity-75">
          <div>Memory: {memoryUsage.formattedUsage}</div>
          <div>High Usage: {memoryUsage.isHighUsage ? 'Yes' : 'No'}</div>
          <div>Sections: {sections.length}</div>
          <div>Viewport: {viewport}</div>
        </div>
      )}
    </div>
  );
});

/**
 * Complete Enhanced Visual Editor with all providers and error boundaries
 */
export const EnhancedVisualEditor = memo<EnhancedVisualEditorProps>(function EnhancedVisualEditor(props) {
  const {
    content,
    enableErrorBoundaries = true,
    showErrorDetails = false,
    enableMemoryMonitoring = true,
    maxMemoryUsage = 150,
    enableLoadingStates = true
  } = props;

  const sectionCount = Object.keys(content.sections || {}).length;

  // Calculate if we should show memory warnings earlier for large content
  const adjustedMemoryLimit = sectionCount > 50 
    ? Math.max(100, maxMemoryUsage - 50)
    : maxMemoryUsage;

  const editorContent = (
    <PerformanceProvider sectionCount={sectionCount}>
      <EnhancedVisualEditorCore {...props} maxMemoryUsage={adjustedMemoryLimit} />
    </PerformanceProvider>
  );

  const wrappedContent = enableMemoryMonitoring ? (
    <MemoryOptimized
      maxMemoryUsage={adjustedMemoryLimit}
      onMemoryWarning={() => {
        console.warn('Visual Editor memory usage is high, consider reducing content complexity');
      }}
    >
      {editorContent}
    </MemoryOptimized>
  ) : (
    editorContent
  );

  const loadingWrappedContent = enableLoadingStates ? (
    <LoadingProvider>
      {wrappedContent}
    </LoadingProvider>
  ) : (
    wrappedContent
  );

  const toastWrappedContent = (
    <VisualEditorToastProvider>
      {loadingWrappedContent}
      <Toaster />
    </VisualEditorToastProvider>
  );

  // Wrap with error boundaries if enabled
  if (enableErrorBoundaries) {
    return (
      <VisualEditorErrorBoundary
        showDetails={showErrorDetails}
        context={{ 
          sectionCount,
          hasLargeContent: sectionCount > 50,
          memoryLimit: adjustedMemoryLimit
        }}
      >
        <ContentRenderErrorBoundary>
          {toastWrappedContent}
        </ContentRenderErrorBoundary>
      </VisualEditorErrorBoundary>
    );
  }

  return toastWrappedContent;
});

/**
 * Export convenience hooks and utilities
 */
export {
  // Performance hooks
  usePerformance,
  useMemoryMonitor,
  
  // Mobile hooks
  useDeviceDetection,
  
  // Toast system
  useVisualEditorToast,
  
  // Memory management
  useCleanup,
  useResourceManager,
  useMemoryLeakDetection,
  
  // Error boundaries as standalone components
  VisualEditorErrorBoundary,
  ContentRenderErrorBoundary,
  
  // Loading components
  VisualEditorSkeleton,
  LoadingProvider,
  
  // Transition components
  EditModeContainer,
  FadeTransition
};

export default EnhancedVisualEditor;