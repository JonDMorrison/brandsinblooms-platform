'use client'

import React, { useCallback, useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

// Import all section editor components from centralized index
import { 
  HeroEditor,
  FeaturedEditor,
  CategoriesEditor,
  RichTextSectionEditor,
  TextSectionEditor,
  ImageSectionEditor,
  IconSectionEditor,
  FeaturesEditor,
  TestimonialsEditor,
  TeamEditor,
  ValuesEditor,
  GalleryEditor,
  PricingEditor,
  MissionEditor,
  SpecificationsEditor,
  FormBuilder,
  PlantShowcaseEditor,
  PlantGridEditor,
  PlantCareGuideEditor,
  SeasonalTipsEditor,
  PlantCategoriesEditor,
  GrowingConditionsEditor,
  PlantComparisonEditor,
  CareCalendarEditor,
  PlantBenefitsEditor,
  SoilGuideEditor
} from './editors'

// Import the CTAEditor component
import { CTAEditor } from '@/src/components/content-sections/editors/CTAEditor'

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
  title?: string
  onTitleChange?: (value: string) => void
}

interface SectionEditorProps {
  sectionKey: string
  section: ContentSection
  isRequired: boolean
  onUpdate: (sectionKey: string, section: ContentSection) => void
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp?: (sectionKey: string) => void
  onMoveDown?: (sectionKey: string) => void
  title?: string
  onTitleChange?: (value: string) => void
}

const SectionEditor = function SectionEditor({ 
  sectionKey, 
  section, 
  isRequired, 
  onUpdate, 
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  title,
  onTitleChange
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
      featured: '⭐',
      cta: '📢',
      testimonials: '💬',
      form: '📝',
      pricing: '💰',
      team: '👥',
      mission: '🎯',
      values: '💎',
      specifications: '📋',
      // Plant shop specific icons
      plant_showcase: '🌟',
      plant_grid: '🌿',
      plant_care_guide: '📚',
      seasonal_tips: '🗓️',
      plant_categories: '📂',
      growing_conditions: '🌱',
      plant_comparison: '⚖️',
      care_calendar: '📅',
      plant_benefits: '💚',
      soil_guide: '🪴'
    }
    return iconMap[type] || '📄'
  }

  const renderSectionContent = useCallback(() => {
    // Common props for all editor components
    const commonProps = { section, onUpdate: handleDataChange }
    
    // Component delegation pattern
    switch (section.type) {
      case 'hero':
        return <HeroEditor {...commonProps} />
        
      case 'featured':
        return <FeaturedEditor section={section} sectionKey={sectionKey} onUpdate={onUpdate} />
        
      case 'categories':
        return <CategoriesEditor section={section} sectionKey={sectionKey} onUpdate={onUpdate} />
        
      case 'richText':
        return <RichTextSectionEditor {...commonProps} />
        
      case 'cta':
        return <CTAEditor section={section} sectionKey={sectionKey} onUpdate={onUpdate} />
        
      case 'text':
        return <TextSectionEditor {...commonProps} />
        
      case 'image':
        return <ImageSectionEditor {...commonProps} />
        
      case 'icon':
        return <IconSectionEditor {...commonProps} />
        
      case 'features':
        return <FeaturesEditor section={section} sectionKey={sectionKey} onUpdate={onUpdate} />
        
      case 'testimonials':
        return <TestimonialsEditor {...commonProps} />
        
      case 'team':
        return <TeamEditor {...commonProps} />
        
      case 'values':
        return <ValuesEditor {...commonProps} />
        
      case 'gallery':
        return <GalleryEditor {...commonProps} />
        
      case 'pricing':
        return <PricingEditor {...commonProps} />
        
      case 'form':
        return <FormBuilder {...commonProps} />
        
      case 'specifications':
        return <SpecificationsEditor {...commonProps} />
        
      case 'mission':
        return <MissionEditor {...commonProps} />
        
      // Plant shop specific section editors
      case 'plant_showcase':
        return <PlantShowcaseEditor {...commonProps} />
        
      case 'plant_grid':
        return <PlantGridEditor {...commonProps} />
        
      case 'plant_care_guide':
        return <PlantCareGuideEditor {...commonProps} />
        
      case 'seasonal_tips':
        return <SeasonalTipsEditor {...commonProps} />
        
      case 'plant_categories':
        return <PlantCategoriesEditor {...commonProps} />
        
      case 'growing_conditions':
        return <GrowingConditionsEditor {...commonProps} />
        
      case 'plant_comparison':
        return <PlantComparisonEditor {...commonProps} />
        
      case 'care_calendar':
        return <CareCalendarEditor {...commonProps} />
        
      case 'plant_benefits':
        return <PlantBenefitsEditor {...commonProps} />
        
      case 'soil_guide':
        return <SoilGuideEditor {...commonProps} />
        
      default:
        return (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-gray-500 text-center">
              Unknown section type: {section.type}
            </p>
          </div>
        )
    }
  }, [section, handleDataChange, sectionKey, onUpdate])

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
                <Badge variant="outline" className="text-xs h-4 px-1.5 text-gray-500">
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
        <div className="p-3 text-xs text-gray-500">
          Section is hidden. Click the eye icon to show it.
        </div>
      )}
    </div>
  )
}

export const ContentEditor = forwardRef<
  { resetDirtyState: () => void },
  ContentEditorProps
>(function ContentEditor({
  contentId,
  siteId,
  layout,
  initialContent,
  onSave,
  onContentChange,
  title,
  onTitleChange
}, ref) {
  // Track initial title to detect changes
  const [initialTitle, setInitialTitle] = useState(title)
  const [isTitleDirty, setIsTitleDirty] = useState(false)
  
  // Update title dirty state when title changes
  useEffect(() => {
    if (title !== undefined && initialTitle !== undefined) {
      setIsTitleDirty(title !== initialTitle)
    }
  }, [title, initialTitle])
  
  // Reset initial title when first loaded (only once)
  useEffect(() => {
    if (title && !initialTitle) {
      setInitialTitle(title)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  const {
    content,
    isDirty: isContentDirty,
    isValid,
    errors,
    updateSection,
    toggleSectionVisibility,
    moveSectionUp,
    moveSectionDown,
    saveContent: saveContentData,
    isLoading
  } = useContentEditor({
    contentId,
    siteId,
    layout,
    initialContent,
    onSave,
    onContentChange
  })
  
  // Combined dirty state includes both content and title changes
  const isDirty = isContentDirty || isTitleDirty
  
  // Expose resetDirtyState method to parent
  useImperativeHandle(ref, () => ({
    resetDirtyState: () => {
      setInitialTitle(title)
      setIsTitleDirty(false)
      // Note: isContentDirty is managed by useContentEditor hook
      // and will be reset when content is saved
    }
  }), [title])

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
      await saveContentData()
      // Reset title dirty state after successful save
      setInitialTitle(title)
      setIsTitleDirty(false)
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
          <p className="text-gray-500">Loading content editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <div>
          <h3 className="text-sm font-medium">Content Editor</h3>
          <p className="text-xs text-gray-500">
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
        <div className="p-4 border-b bg-destructive/5 flex-shrink-0">
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
      <div className="flex-1 overflow-auto min-h-0">
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
                title={sectionKey === 'hero' || sectionKey === 'header' ? title : undefined}
                onTitleChange={sectionKey === 'hero' || sectionKey === 'header' ? onTitleChange : undefined}
              />
            )
          })}

          {/* Add Optional Sections */}
          <div className="border-2 border-dashed border-muted rounded-lg p-4">
            <div className="text-center">
              <Plus className="h-5 w-5 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">
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
      </div>
    </div>
  )
})

export default ContentEditor