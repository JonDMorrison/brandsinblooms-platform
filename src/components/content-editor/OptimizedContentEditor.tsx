'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { 
  Plus, 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Monitor
} from 'lucide-react'
import { toast } from 'sonner'

// Import optimization components
import { AutoSave } from './AutoSave'
import { EditorErrorBoundary, RichTextEditorErrorBoundary, IconPickerErrorBoundary } from './ErrorBoundary'
import { ContentEditorSkeleton, SaveStatusIndicator } from './LoadingStates'
import { MobileEditorLayout, TouchSectionControls, useScreenSize } from './MobileOptimizations'
import { SuspensefulRichTextEditor, SuspensefulIconPicker, usePreloadComponents } from './LazyComponents'

// Import existing components with lazy loading
import { ImageInput, SimpleTextInput } from '@/src/components/content-editor'

// Import schemas and types
import { 
  PageContent, 
  ContentSection, 
  ContentSectionType,
  LayoutType,
  LAYOUT_SECTIONS 
} from '@/src/lib/content/schema'

// Import hooks
import { useContentEditor } from '@/src/hooks/useContentEditor'
import useEditorPerformance from '@/src/hooks/useEditorPerformance'

interface OptimizedContentEditorProps {
  contentId: string
  siteId: string
  layout: LayoutType
  initialContent?: PageContent
  onSave?: (content: PageContent) => Promise<void>
  onContentChange?: (content: PageContent, hasChanges: boolean) => void
  enableAutoSave?: boolean
  enablePerformanceMonitoring?: boolean
}

interface OptimizedSectionEditorProps {
  sectionKey: string
  section: ContentSection
  isRequired: boolean
  onUpdate: (sectionKey: string, section: ContentSection) => void
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp?: (sectionKey: string) => void
  onMoveDown?: (sectionKey: string) => void
}

// Memoized section editor component
const OptimizedSectionEditor = React.memo(({ 
  sectionKey, 
  section, 
  isRequired, 
  onUpdate, 
  onToggleVisibility,
  onMoveUp,
  onMoveDown 
}: OptimizedSectionEditorProps) => {
  const { isMobile } = useScreenSize()
  
  const handleDataChange = useCallback((newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }, [sectionKey, section, onUpdate])

  const getSectionIcon = (type: ContentSectionType) => {
    const iconMap = {
      hero: '🦸',
      richText: '📝',
      text: '📄',
      image: '🖼️',
      icon: '⭐',
      gallery: '🖼️',
      features: '⚡',
      cta: '📢',
      testimonials: '💬',
      form: '📝',
      pricing: '💰',
      team: '👥',
      mission: '🎯',
      values: '💎',
      specifications: '📋'
    }
    return iconMap[type] || '📄'
  }

  const renderSectionContent = () => {
    switch (section.type) {
      case 'richText':
      case 'hero':
      case 'cta':
      case 'mission':
        return (
          <RichTextEditorErrorBoundary>
            <SuspensefulRichTextEditor
              content={section.data.content || ''}
              onChange={(content: string) => handleDataChange({ content })}
              placeholder={`Enter ${section.type} content...`}
            />
          </RichTextEditorErrorBoundary>
        )

      case 'text':
        return (
          <SimpleTextInput
            value={section.data.content || ''}
            onChange={(content) => handleDataChange({ content })}
            placeholder={`Enter ${section.type} content...`}
            multiline
          />
        )

      case 'image':
        return (
          <ImageInput
            value={{
              url: section.data.url || '',
              alt: section.data.alt || '',
              caption: section.data.caption || ''
            }}
            onChange={(imageData) => handleDataChange({
              url: imageData.url,
              alt: imageData.alt,
              caption: imageData.caption
            })}
          />
        )

      case 'icon':
        return (
          <div className="space-y-3">
            <IconPickerErrorBoundary>
              <SuspensefulIconPicker
                value={section.data.icon || ''}
                onChange={(icon: string) => handleDataChange({ icon })}
                label="Select Icon"
              />
            </IconPickerErrorBoundary>
            <SimpleTextInput
              value={section.data.content || ''}
              onChange={(content) => handleDataChange({ content })}
              placeholder="Icon description..."
              multiline
            />
          </div>
        )

      case 'features':
      case 'testimonials':
      case 'team':
      case 'values':
      case 'gallery':
      case 'pricing':
        return (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              {section.type.charAt(0).toUpperCase() + section.type.slice(1)} editor coming soon
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Will support adding/editing items dynamically
            </p>
          </div>
        )

      case 'form':
        return (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Form builder coming soon
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Will support drag-and-drop form fields
            </p>
          </div>
        )

      case 'specifications':
        return (
          <SimpleTextInput
            value={section.data.content || ''}
            onChange={(content) => handleDataChange({ content })}
            placeholder="Enter specifications..."
            multiline
          />
        )

      default:
        return (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Unknown section type: {section.type}
            </p>
          </div>
        )
    }
  }

  const isEmpty = !section.data.content && !section.data.url && !section.data.icon

  return (
    <div className="border rounded-lg bg-card">
      {/* Section Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getSectionIcon(section.type)}</span>
          <div>
            <h4 className="text-sm font-medium capitalize">
              {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {isRequired && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5">
                  Required
                </Badge>
              )}
              {!section.visible && (
                <Badge variant="outline" className="text-xs h-4 px-1.5">
                  Hidden
                </Badge>
              )}
              {isEmpty && (
                <Badge variant="outline" className="text-xs h-4 px-1.5 text-muted-foreground">
                  Empty
                </Badge>
              )}
            </div>
          </div>
        </div>

        <TouchSectionControls
          onMoveUp={onMoveUp ? () => onMoveUp(sectionKey) : undefined}
          onMoveDown={onMoveDown ? () => onMoveDown(sectionKey) : undefined}
          onToggleVisibility={() => onToggleVisibility(sectionKey)}
          isVisible={section.visible}
          canMoveUp={!!onMoveUp}
          canMoveDown={!!onMoveDown}
        />
      </div>

      {/* Section Content */}
      {section.visible && (
        <div className="p-3">
          {renderSectionContent()}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.isRequired === nextProps.isRequired &&
    JSON.stringify(prevProps.section) === JSON.stringify(nextProps.section)
  )
})

OptimizedSectionEditor.displayName = 'OptimizedSectionEditor'

export function OptimizedContentEditor({
  contentId,
  siteId,
  layout,
  initialContent,
  onSave,
  onContentChange,
  enableAutoSave = true,
  enablePerformanceMonitoring = true
}: OptimizedContentEditorProps) {
  const { isMobile } = useScreenSize()
  const { preload, isPreloaded } = usePreloadComponents()
  
  const {
    content,
    isDirty,
    isValid,
    errors,
    updateSection,
    toggleSectionVisibility,
    moveSectionUp,
    moveSectionDown,
    saveContent,
    isLoading,
    isSaving
  } = useContentEditor({
    contentId,
    siteId,
    layout,
    initialContent,
    onSave,
    onContentChange
  })

  // Performance monitoring
  const {
    metrics,
    warnings,
    startTiming,
    logRender
  } = useEditorPerformance({
    content,
    isEnabled: enablePerformanceMonitoring
  })

  // Log render for performance monitoring
  React.useEffect(() => {
    logRender()
  })

  // Preload components on mount
  React.useEffect(() => {
    preload()
  }, [preload])

  const layoutConfig = LAYOUT_SECTIONS[layout]
  
  const sortedSections = useMemo(() => {
    return Object.entries(content.sections).sort((a, b) => {
      const orderA = a[1].order || 0
      const orderB = b[1].order || 0
      return orderA - orderB
    })
  }, [content.sections])

  const handleSave = useCallback(async () => {
    const endTiming = startTiming('save')
    try {
      await saveContent()
      toast.success('Content saved successfully!')
    } catch (error) {
      console.error('Failed to save content:', error)
      toast.error('Failed to save content. Please try again.')
    } finally {
      endTiming()
    }
  }, [saveContent, startTiming])

  const canMoveUp = (index: number) => index > 0
  const canMoveDown = (index: number) => index < sortedSections.length - 1

  if (isLoading) {
    return <ContentEditorSkeleton />
  }

  const editorContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-sm font-medium">Content Editor</h3>
          <p className="text-xs text-muted-foreground">
            {layout.charAt(0).toUpperCase() + layout.slice(1)} Layout
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Performance warnings indicator */}
          {enablePerformanceMonitoring && warnings.length > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
            </Badge>
          )}

          {/* Validation errors */}
          {!isValid && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Validation errors</span>
            </div>
          )}

          {/* Auto-save component */}
          {enableAutoSave ? (
            <AutoSave
              onSave={saveContent}
              isDirty={isDirty}
              isValid={isValid}
            />
          ) : (
            <>
              <SaveStatusIndicator 
                status={isSaving ? 'saving' : isDirty ? 'idle' : 'saved'} 
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || !isValid || isSaving}
                className="h-7"
              >
                <Save className="h-3 w-3 mr-1.5" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 border-b bg-destructive/5">
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-destructive">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sortedSections.map(([sectionKey, section], index) => {
            const isRequired = layoutConfig.required.includes(sectionKey)
            
            return (
              <OptimizedSectionEditor
                key={sectionKey}
                sectionKey={sectionKey}
                section={section}
                isRequired={isRequired}
                onUpdate={updateSection}
                onToggleVisibility={toggleSectionVisibility}
                onMoveUp={canMoveUp(index) ? moveSectionUp : undefined}
                onMoveDown={canMoveDown(index) ? moveSectionDown : undefined}
              />
            )
          })}

          {/* Add Optional Sections */}
          <div className="border-2 border-dashed border-muted rounded-lg p-4">
            <div className="text-center">
              <Plus className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Add optional sections
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {layoutConfig.optional
                  .filter(sectionKey => !content.sections[sectionKey]?.visible)
                  .map(sectionKey => (
                    <Button
                      key={sectionKey}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSectionVisibility(sectionKey)}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )

  const sidebarContent = editorContent

  // For mobile, use the mobile-optimized layout
  if (isMobile) {
    return (
      <EditorErrorBoundary>
        <MobileEditorLayout
          sidebar={sidebarContent}
          preview={<div className="p-4 text-center text-muted-foreground">Preview coming soon</div>}
        >
          {editorContent}
        </MobileEditorLayout>
      </EditorErrorBoundary>
    )
  }

  // For desktop/tablet, return the standard layout
  return (
    <EditorErrorBoundary>
      {editorContent}
    </EditorErrorBoundary>
  )
}

export default OptimizedContentEditor