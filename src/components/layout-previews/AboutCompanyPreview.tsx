import { Card } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { MapPin, Users, Award, Heart } from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'

interface AboutCompanyPreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

export function AboutCompanyPreview({ title, subtitle, content }: AboutCompanyPreviewProps) {
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'about')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div className={`w-full h-full bg-white p-6 ${spacingClass}`}>
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
    return (
      <div className="w-full h-full bg-white p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{legacyTitle}</h1>
          {legacySubtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{legacySubtitle}</p>
          )}
        </div>

        {/* Company Story */}
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              {content && 'content' in content && content.content 
                ? content.content 
                : 'Tell your company story here. Share your journey, mission, and what makes your business unique. Use the content editor to add rich text, images, and formatting to create an engaging about page.'
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">10+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
            </div>
          </div>
          <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center w-full">
            <span className="text-gray-600">Company Image</span>
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: 'Passion', desc: 'Love for what we do' },
              { icon: Award, title: 'Quality', desc: 'Excellence in every detail' },
              { icon: Users, title: 'Community', desc: 'Supporting local connections' }
            ].map((value, i) => {
              const Icon = value.icon
              return (
                <Card key={i} className="p-4 text-center bg-white border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.desc}</p>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Team Section */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {['Team Member', 'Team Member', 'Team Member'].map((name, i) => (
              <Card key={i} className="p-4 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarFallback className="text-lg">
                    TM
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold mb-1 text-gray-900">{name} {i + 1}</h3>
                <Badge variant="outline" className="mb-2">
                  Role
                </Badge>
                <p className="text-sm text-gray-600">
                  Add team member information using the content editor to showcase your talented team.
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="text-center bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Visit Us</h3>
          </div>
          <p className="text-gray-600">Add your business address here</p>
          <p className="text-sm text-gray-600 mt-1">Include your hours of operation</p>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-white p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">About Company Preview</h3>
        <p>Add content to see your about page design</p>
      </div>
    </div>
  )
}