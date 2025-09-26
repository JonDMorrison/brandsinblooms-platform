'use client'

import React, { useCallback } from 'react'
import { ContentSection } from '@/src/lib/content/schema'

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

interface SectionEditorRendererProps {
  sectionKey: string
  section: ContentSection
  onUpdate: (sectionKey: string, section: ContentSection) => void
  title?: string
  onTitleChange?: (value: string) => void
}

export function SectionEditorRenderer({
  sectionKey,
  section,
  onUpdate,
  title,
  onTitleChange
}: SectionEditorRendererProps) {
  const handleDataChange = useCallback((newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }, [sectionKey, section, onUpdate])

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
        return <RichTextSectionEditor section={section} sectionKey={sectionKey} onUpdate={onUpdate} />
        
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
        return <ValuesEditor section={section} sectionKey={sectionKey} onUpdate={onUpdate} />
        
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

  return renderSectionContent()
}

export default SectionEditorRenderer