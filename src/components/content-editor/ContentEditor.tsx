'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Separator } from '@/src/components/ui/separator'
import { 
  Plus, 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

// Import existing components
import { RichTextEditor, ImageInput, IconPicker, SimpleTextInput } from '@/src/components/content-editor'

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

interface ContentEditorProps {
  contentId: string
  siteId: string
  layout: LayoutType
  initialContent?: PageContent
  onSave?: (content: PageContent) => Promise<void>
  onContentChange?: (content: PageContent, hasChanges: boolean) => void
}

interface SectionEditorProps {
  sectionKey: string
  section: ContentSection
  isRequired: boolean
  onUpdate: (sectionKey: string, section: ContentSection) => void
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp?: (sectionKey: string) => void
  onMoveDown?: (sectionKey: string) => void
}

function SectionEditor({ 
  sectionKey, 
  section, 
  isRequired, 
  onUpdate, 
  onToggleVisibility,
  onMoveUp,
  onMoveDown 
}: SectionEditorProps) {
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
    console.log('Rendering section:', sectionKey, section)
    switch (section.type) {
      case 'richText':
      case 'hero':
      case 'cta':
      case 'mission':
        return (
          <RichTextEditor
            content={section.data.content || ''}
            onChange={(content) => handleDataChange({ content })}
            placeholder={`Enter ${section.type} content...`}
          />
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
            <IconPicker
              value={section.data.icon || ''}
              onChange={(icon) => handleDataChange({ icon })}
            />
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
              {section.visible === false && (
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

        <div className="flex items-center gap-1">
          {/* Move buttons */}
          {onMoveUp && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onMoveUp(sectionKey)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onMoveDown(sectionKey)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}

          {/* Visibility toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onToggleVisibility(sectionKey)}
            disabled={isRequired}
          >
            {section.visible !== false ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Section Content */}
      {section.visible !== false && (
        <div className="p-3">
          {renderSectionContent()}
        </div>
      )}
      
      {/* Show message if section is explicitly hidden */}
      {section.visible === false && (
        <div className="p-3 text-xs text-muted-foreground">
          Section is hidden. Click the eye icon to show it.
        </div>
      )}
    </div>
  )
}

export function ContentEditor({
  contentId,
  siteId,
  layout,
  initialContent,
  onSave,
  onContentChange
}: ContentEditorProps) {
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
    isLoading
  } = useContentEditor({
    contentId,
    siteId,
    layout,
    initialContent,
    onSave,
    onContentChange
  })

  const layoutConfig = LAYOUT_SECTIONS[layout]
  
  const sortedSections = useMemo(() => {
    const sections = Object.entries(content.sections || {})
    return sections.sort((a, b) => {
      const orderA = a[1].order || 0
      const orderB = b[1].order || 0
      return orderA - orderB
    })
  }, [content.sections])

  const handleSave = async () => {
    try {
      await saveContent()
      toast.success('Content saved successfully!')
    } catch (error) {
      console.error('Failed to save content:', error)
      toast.error('Failed to save content. Please try again.')
    }
  }

  const canMoveUp = (index: number) => index > 0
  const canMoveDown = (index: number) => index < sortedSections.length - 1

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading content editor...</p>
        </div>
      </div>
    )
  }

  return (
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
          {!isValid && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Validation errors</span>
            </div>
          )}
          
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved
            </Badge>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || !isValid}
            className="h-7"
          >
            <Save className="h-3 w-3 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
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
              <SectionEditor
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
}

export default ContentEditor