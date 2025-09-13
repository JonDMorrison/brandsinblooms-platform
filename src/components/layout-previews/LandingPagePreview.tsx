'use client'

import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Star, ArrowRight } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'
import { SiteThemeProvider, ThemeWrapper, useSiteThemeContext } from '@/src/components/theme/ThemeProvider'

interface LandingPagePreviewProps {
  content?: PageContent | LegacyContent
  onContentUpdate?: (sectionKey: string, fieldPath: string, content: string) => void
  onFeatureUpdate?: (sectionKey: string, featureIndex: number, newContent: string) => void
}

function LandingPagePreviewContent({ content, onContentUpdate, onFeatureUpdate }: LandingPagePreviewProps) {
  const { theme } = useSiteThemeContext()
  
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'landing')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div 
        className={`w-full h-full ${spacingClass}`}
        style={{
          backgroundColor: 'var(--theme-background, #FFFFFF)'
        }}>
          {sections.map(({ key, section }) => (
            <DynamicSection
              key={key}
              section={section}
              sectionKey={key}
              className=""
              onContentUpdate={onContentUpdate}
              onFeatureUpdate={onFeatureUpdate}
            />
          ))}
      </div>
    )
  }
  
  // Empty state
  return (
    <div 
      className="w-full min-h-full flex items-center justify-center"
      style={{
        backgroundColor: 'var(--theme-background, #FFFFFF)'
      }}>
        <div className="text-center text-gray-500">
          <h3 className="text-xl font-semibold mb-2">Landing Page Preview</h3>
          <p>Add content to see your landing page design</p>
        </div>
    </div>
  )
}

export function LandingPagePreview(props: LandingPagePreviewProps) {
  return (
    <SiteThemeProvider>
      <ThemeWrapper className="w-full min-h-full">
        <LandingPagePreviewContent {...props} />
      </ThemeWrapper>
    </SiteThemeProvider>
  )
}