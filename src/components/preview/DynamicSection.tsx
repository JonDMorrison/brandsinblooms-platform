'use client'

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { useSiteTheme } from '@/hooks/useSiteTheme'

// Import preview components
import { 
  HeroPreview, 
  FeaturedPreview, 
  FeaturesPreview,
  CtaPreview,
  TextPreview,
  DefaultPreview 
} from '@/src/components/content-sections/preview'

// Helper functions have been moved to shared utilities and individual preview components

interface DynamicSectionProps {
  section: ContentSection
  sectionKey: string
  className?: string
  title?: string // Page title for hero sections
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

function DynamicSectionComponent({ section, sectionKey, className = '', title, onContentUpdate, onFeatureUpdate }: DynamicSectionProps) {
  const { theme } = useSiteTheme()
  
  // Don't render if section is not visible or has no data
  if (!section.visible) {
    return null
  }

  const { type, data, settings } = section
  
  // Common props for all preview components
  const commonProps = { section, sectionKey, className, title, onContentUpdate, onFeatureUpdate }

  // Section-specific rendering logic
  switch (type) {
    case 'hero':
      return <HeroPreview {...commonProps} />

    case 'featured':
      return <FeaturedPreview {...commonProps} />

    case 'features':
      return <FeaturesPreview {...commonProps} />

    case 'cta':
      return <CtaPreview {...commonProps} />

    case 'richText':
    case 'text':
      return <TextPreview {...commonProps} />


    default:
      // Use DefaultPreview for all other section types
      return <DefaultPreview {...commonProps} />
  }
}

// Memoize DynamicSection to prevent unnecessary re-renders of complex preview components
export const DynamicSection = React.memo(DynamicSectionComponent, (prevProps, nextProps) => {
  // Deep comparison of section content to avoid unnecessary re-renders
  return (
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.className === nextProps.className &&
    prevProps.title === nextProps.title &&
    prevProps.section.visible === nextProps.section.visible &&
    prevProps.section.type === nextProps.section.type &&
    JSON.stringify(prevProps.section.data) === JSON.stringify(nextProps.section.data) &&
    JSON.stringify(prevProps.section.settings) === JSON.stringify(nextProps.section.settings)
  )
})

DynamicSection.displayName = 'DynamicSection'