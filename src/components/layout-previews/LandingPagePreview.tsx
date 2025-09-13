'use client'

import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Star, ArrowRight } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'
import { SiteThemeProvider, ThemeWrapper, useSiteThemeContext } from '@/src/components/theme/ThemeProvider'

interface LandingPagePreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

function LandingPagePreviewContent({ title, subtitle, content }: LandingPagePreviewProps) {
  const { theme } = useSiteThemeContext()
  
  console.log('theme', theme)
  console.log('content', content)
  console.log('title', title)
  console.log('subtitle', subtitle)
  
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
              title={key === 'hero' || key === 'header' ? title : undefined}
            />
          ))}
      </div>
    )
  }
  
  // Fallback to legacy format or convert legacy content
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    // Convert legacy content to enhanced format and render
    const convertedSections = convertLegacyContent('landing', legacyTitle, legacySubtitle)
    const sections = getLayoutSections(convertedSections, 'landing')
    
    return (
      <div 
        className="w-full min-h-full space-y-8"
        style={{
          backgroundColor: 'var(--theme-background, #FFFFFF)'
        }}>
          {sections.map(({ key, section }) => (
            <DynamicSection
              key={key}
              section={section}
              sectionKey={key}
              className=""
            />
          ))}
          
          {/* Default features for legacy content */}
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
            }}
          >
            {[
              { title: 'Feature One', desc: 'Amazing capability' },
              { title: 'Feature Two', desc: 'Powerful tools' },
              { title: 'Feature Three', desc: 'Easy to use' }
            ].map((feature, i) => (
              <Card key={i} className="p-4 text-center bg-white border-gray-200">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 theme-accent" style={{ backgroundColor: 'var(--theme-accent)' }}>
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm">{feature.desc}</p>
              </Card>
            ))}
          </div>

          {/* Default call to action for legacy content */}
          <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
            <p className="mb-4">Join thousands of satisfied customers</p>
            <Button className="btn-theme-primary">
              Start Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
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