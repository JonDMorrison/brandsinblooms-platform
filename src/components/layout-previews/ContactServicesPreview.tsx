import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Badge } from '@/src/components/ui/badge'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter,
  Flower,
  Heart,
  Gift
} from 'lucide-react'
import { PageContent, LegacyContent, isPageContent } from '@/src/lib/content/schema'
import { DynamicSection } from '@/src/components/preview/DynamicSection'
import { getLayoutSections, convertLegacyContent, getSpacingClass } from '@/src/lib/preview/section-renderers'

interface ContactServicesPreviewProps {
  title?: string
  subtitle?: string
  content?: PageContent | LegacyContent
}

export function ContactServicesPreview({ title, subtitle, content }: ContactServicesPreviewProps) {
  // Determine if we have enhanced content or need to use legacy format
  const isEnhanced = content && isPageContent(content)
  
  if (isEnhanced) {
    // Render with enhanced content structure
    const sections = getLayoutSections(content.sections, 'contact')
    const spacingClass = getSpacingClass(content.settings?.layout?.spacing)
    
    return (
      <div className={`w-full h-full bg-gray-50 p-6 ${spacingClass}`}>
        {sections.map(({ key, section }) => {
          // Special handling for contact header section
          if (key === 'header' || section.type === 'hero') {
            return (
              <div key={key} className="text-center space-y-4">
                <DynamicSection
                  section={section}
                  sectionKey={key}
                  className=""
                />
              </div>
            )
          }
          
          // Special handling for form section with layout
          if (key === 'form') {
            return (
              <div key={key} className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}>
                <DynamicSection
                  section={section}
                  sectionKey={key}
                  className=""
                />
                
                {/* Default contact info sidebar */}
                <div className="space-y-6">
                  <Card className="p-6 bg-white border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Contact Information</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Address</p>
                          <p className="text-sm text-gray-600">Add your address here</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-gray-600">Add your phone number</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">Add your email address</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-gray-900">Hours</p>
                          <p className="text-sm text-gray-600">Add your business hours</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )
          }
          
          // Default section rendering for info and map
          return (
            <DynamicSection
              key={key}
              section={section}
              sectionKey={key}
              className=""
            />
          )
        })}
      </div>
    )
  }
  
  // Fallback to legacy format or convert legacy content
  const legacyTitle = title || (content && 'title' in content ? content.title : '') || ''
  const legacySubtitle = subtitle || (content && 'subtitle' in content ? content.subtitle : '') || ''
  
  if (legacyTitle || legacySubtitle) {
    return (
      <div className="w-full h-full bg-gray-50 p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{legacyTitle}</h1>
          {legacySubtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{legacySubtitle}</p>
          )}
        </div>

        <div 
          className="grid gap-8"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))'
          }}
        >
          {/* Contact Form */}
          <Card className="p-6 bg-white border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Get in Touch</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <Input placeholder="Your first name" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <Input placeholder="Your last name" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input type="email" placeholder="your@email.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input type="tel" placeholder="+1 (555) 123-4567" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea 
                  placeholder="Tell us how we can help you..." 
                  className="mt-1 resize-none" 
                  rows={4}
                />
              </div>
              <Button className="w-full">Send Message</Button>
            </div>
          </Card>

          {/* Contact Information & Services */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="p-6 bg-white border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">Add your business address</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">Add your phone number</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">Add your email address</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Hours</p>
                    <p className="text-sm text-gray-600">Add your business hours</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Services */}
            {content && 'content' in content && content.content && (
              <Card className="p-6 bg-white border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Additional Information</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{content.content}</p>
              </Card>
            )}

            {/* Map Placeholder */}
            <Card className="p-6 bg-white border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Find Us</h2>
              <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <span className="text-gray-600">Interactive Map</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full h-full bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Contact Page Preview</h3>
        <p>Add content to see your contact page design</p>
      </div>
    </div>
  )
}