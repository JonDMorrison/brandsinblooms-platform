'use client'

import React, { useCallback, useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
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

// Import new section editors
import { FeaturesEditor } from '@/src/components/content-sections/editors/FeaturesEditor'
import { TestimonialsEditor } from '@/src/components/content-sections/editors/TestimonialsEditor'
import { TeamEditor } from '@/src/components/content-sections/editors/TeamEditor'
import { ValuesEditor } from '@/src/components/content-sections/editors/ValuesEditor'
import { GalleryEditor } from '@/src/components/content-sections/editors/GalleryEditor'
import { PricingEditor } from '@/src/components/content-sections/editors/PricingEditor'
import { MissionEditor } from '@/src/components/content-sections/editors/MissionEditor'
import { SpecificationsEditor } from '@/src/components/content-sections/editors/SpecificationsEditor'
import { FormBuilder } from '@/src/components/content-sections/editors/FormBuilder'

// Import plant-specific section editors
import { PlantShowcaseEditor } from '@/src/components/content-sections/editors/PlantShowcaseEditor'
import { PlantGridEditor } from '@/src/components/content-sections/editors/PlantGridEditor'
import { PlantCareGuideEditor } from '@/src/components/content-sections/editors/PlantCareGuideEditor'
import { SeasonalTipsEditor } from '@/src/components/content-sections/editors/SeasonalTipsEditor'
import { PlantCategoriesEditor } from '@/src/components/content-sections/editors/PlantCategoriesEditor'
import { GrowingConditionsEditor } from '@/src/components/content-sections/editors/GrowingConditionsEditor'
import { PlantComparisonEditor } from '@/src/components/content-sections/editors/PlantComparisonEditor'
import { CareCalendarEditor } from '@/src/components/content-sections/editors/CareCalendarEditor'
import { PlantBenefitsEditor } from '@/src/components/content-sections/editors/PlantBenefitsEditor'
import { SoilGuideEditor } from '@/src/components/content-sections/editors/SoilGuideEditor'

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
    switch (section.type) {
      case 'hero':
        return (
          <>
            {/* Hero Title and Subtitle fields */}
            <div className="space-y-3 mb-4">
              <div className="space-y-2">
                <Label htmlFor="hero-headline" className="text-xs font-medium">
                  Title
                </Label>
                <Input
                  id="hero-headline"
                  type="text"
                  value={section.data.headline || ''}
                  onChange={(e) => handleDataChange({ headline: e.target.value })}
                  className="h-8"
                  placeholder="Main hero headline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-subheadline" className="text-xs font-medium">
                  Subtitle
                </Label>
                <textarea
                  id="hero-subheadline"
                  value={section.data.subheadline || ''}
                  onChange={(e) => handleDataChange({ subheadline: e.target.value })}
                  placeholder="Supporting subtitle or description"
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[60px]"
                  rows={3}
                />
              </div>
            </div>
            
            {/* Hero Buttons Configuration */}
            <div className="space-y-3 mb-4">
              <Label className="text-xs font-medium">Action Buttons (Optional)</Label>
              <div className="space-y-3">
                {/* Primary Button */}
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <Label className="text-xs text-gray-500">Primary Button</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      value={section.data.ctaText || ''}
                      onChange={(e) => handleDataChange({ ctaText: e.target.value })}
                      className="h-8"
                      placeholder="Button text (optional)"
                    />
                    <Input
                      type="text"
                      value={section.data.ctaLink || ''}
                      onChange={(e) => handleDataChange({ ctaLink: e.target.value })}
                      className="h-8"
                      placeholder="Link/Route (e.g., /plants)"
                    />
                  </div>
                </div>
                
                {/* Secondary Button */}
                <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
                  <Label className="text-xs text-gray-500">Secondary Button</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      value={section.data.secondaryCtaText || ''}
                      onChange={(e) => handleDataChange({ secondaryCtaText: e.target.value })}
                      className="h-8"
                      placeholder="Button text (optional)"
                    />
                    <Input
                      type="text"
                      value={section.data.secondaryCtaLink || ''}
                      onChange={(e) => handleDataChange({ secondaryCtaLink: e.target.value })}
                      className="h-8"
                      placeholder="Link/Route (e.g., /care-guides)"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Management */}
            <div className="space-y-3 mb-4">
              <Label className="text-xs font-medium">Features (Optional)</Label>
              <p className="text-xs text-gray-500 mb-3">
                Highlight key features or benefits in your hero section
              </p>
              
              {/* Current Features */}
              {section.data.features && Array.isArray(section.data.features) && section.data.features.length > 0 && (
                <div className="space-y-2">
                  {section.data.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <Input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(section.data.features || [])]
                          newFeatures[index] = e.target.value
                          handleDataChange({ features: newFeatures })
                        }}
                        className="h-8 flex-1"
                        placeholder="Feature text"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFeatures = (section.data.features || []).filter((_: string, i: number) => i !== index)
                          handleDataChange({ features: newFeatures })
                        }}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Feature Button */}
              {(!section.data.features || section.data.features.length < 4) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentFeatures = section.data.features || []
                    const newFeatures = [...currentFeatures, 'New feature']
                    handleDataChange({ features: newFeatures })
                  }}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Feature {section.data.features?.length ? `(${4 - section.data.features.length} remaining)` : ''}
                </Button>
              )}
              
              {section.data.features && section.data.features.length >= 4 && (
                <div className="text-center p-2 text-xs text-gray-500 bg-muted/30 rounded-lg">
                  Maximum of 4 features reached
                </div>
              )}
              
              {(!section.data.features || section.data.features.length === 0) && (
                <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">No features added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleDataChange({ 
                        features: ['Premium Quality', 'Fast Shipping', 'Expert Support', 'Easy Returns'] 
                      })
                    }}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Default Features
                  </Button>
                </div>
              )}
            </div>
          </>
        )
      
      case 'richText':
      case 'cta':
        return (
          <RichTextEditor
            initialContent={section.data.content || ''}
            onChange={(content) => handleDataChange({ content })}
            placeholder={`Enter ${section.type} content...`}
          />
        )
      
      case 'mission':
        return (
          <MissionEditor
            section={section}
            onUpdate={handleDataChange}
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
        return (
          <FeaturesEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'testimonials':
        return (
          <TestimonialsEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'team':
        return (
          <TeamEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'values':
        return (
          <ValuesEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'gallery':
        return (
          <GalleryEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'pricing':
        return (
          <PricingEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )

      case 'form':
        return (
          <FormBuilder
            section={section}
            onUpdate={handleDataChange}
          />
        )

      case 'specifications':
        return (
          <SpecificationsEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )

      // Plant shop specific section editors
      case 'plant_showcase':
        return (
          <PlantShowcaseEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'plant_grid':
        return (
          <PlantGridEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'plant_care_guide':
        return (
          <PlantCareGuideEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'seasonal_tips':
        return (
          <SeasonalTipsEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'plant_categories':
        return (
          <PlantCategoriesEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'growing_conditions':
        return (
          <GrowingConditionsEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'plant_comparison':
        return (
          <PlantComparisonEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'care_calendar':
        return (
          <CareCalendarEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'plant_benefits':
        return (
          <PlantBenefitsEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )
        
      case 'soil_guide':
        return (
          <SoilGuideEditor
            section={section}
            onUpdate={handleDataChange}
          />
        )

      case 'featured':
        return (
          <>
            {/* Featured Section Title and Subtitle fields */}
            <div className="space-y-3 mb-4">
              <div className="space-y-2">
                <Label htmlFor="featured-headline" className="text-xs font-medium">
                  Headline
                </Label>
                <Input
                  id="featured-headline"
                  type="text"
                  value={section.data.headline || ''}
                  onChange={(e) => handleDataChange({ headline: e.target.value })}
                  className="h-8"
                  placeholder="Featured Plants This Season"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="featured-subheadline" className="text-xs font-medium">
                  Subheadline
                </Label>
                <Textarea
                  id="featured-subheadline"
                  value={section.data.subheadline || ''}
                  onChange={(e) => handleDataChange({ subheadline: e.target.value })}
                  className="min-h-[60px] resize-none"
                  placeholder="Handpicked selections from our master horticulturists..."
                />
              </div>
            </div>

            {/* View All Button Configuration */}
            <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
              <Label className="text-xs text-gray-500">View All Button</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={section.data.viewAllText || ''}
                  onChange={(e) => handleDataChange({ viewAllText: e.target.value })}
                  className="h-8"
                  placeholder="View All Plants"
                />
                <Input
                  type="text"
                  value={section.data.viewAllLink || ''}
                  onChange={(e) => handleDataChange({ viewAllLink: e.target.value })}
                  className="h-8"
                  placeholder="/plants"
                />
              </div>
            </div>
          </>
        )

      default:
        return (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-gray-500 text-center">
              Unknown section type: {section.type}
            </p>
          </div>
        )
    }
  }, [section, handleDataChange, title, onTitleChange, sectionKey])

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