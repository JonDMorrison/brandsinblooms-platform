import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Star, ArrowRight } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'

interface LandingPagePreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

export function LandingPagePreview({ title, subtitle, content }: LandingPagePreviewProps) {
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'landing')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 ${spacingClass}`}>
        {sections.map(({ key, section }) => (
          <DynamicSection
            key={key}
            section={section}
            sectionKey={key}
            className=""
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
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 space-y-8">
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
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Default call to action for legacy content */}
        <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-4">Join thousands of satisfied customers</p>
          <Button>
            Start Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Landing Page Preview</h3>
        <p>Add content to see your landing page design</p>
      </div>
    </div>
  )
}