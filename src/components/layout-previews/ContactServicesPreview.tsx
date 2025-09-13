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
import { LocationImage, PlantProductImage } from '@/src/components/ui/plant-shop-image'

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
      <div className="w-full min-h-full bg-gray-50 p-6 space-y-8">
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

            {/* Store Location */}
            <Card className="p-6 bg-white border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Find Us</h2>
              <div className="aspect-video overflow-hidden rounded-lg mb-4">
                <LocationImage
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
                  alt="Plant shop storefront with outdoor plant displays and green awning"
                  locationName="Plant Shop Storefront"
                  width={600}
                  height={338}
                  className="w-full min-h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  Visit us at our beautiful storefront location
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">123 Garden Street, Plant City</span>
                </div>
              </div>
            </Card>
            
            {/* Plant Services */}
            <Card className="p-6 bg-white border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Our Services</h2>
              <div className="space-y-4">
                {[
                  {
                    service: 'Plant Care Consultation',
                    desc: 'Expert advice for keeping your plants healthy',
                    icon: <Flower className="h-5 w-5 text-pink-500" />,
                    imageSrc: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=100&q=80'
                  },
                  {
                    service: 'Plant Delivery',
                    desc: 'We deliver plants straight to your door',
                    icon: <Gift className="h-5 w-5 text-green-500" />,
                    imageSrc: 'https://images.unsplash.com/photo-1545484331-0b8cfee2f5b8?auto=format&fit=crop&w=100&q=80'
                  },
                  {
                    service: 'Garden Design',
                    desc: 'Custom outdoor and indoor garden planning',
                    icon: <Heart className="h-5 w-5 text-red-500" />,
                    imageSrc: 'https://images.unsplash.com/photo-1593482892540-3b8a94b2e019?auto=format&fit=crop&w=100&q=80'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <PlantProductImage
                        src={item.imageSrc}
                        alt={`${item.service} illustration`}
                        plantType="plant"
                        width={48}
                        height={48}
                        className="w-full min-h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon}
                        <h3 className="font-semibold text-gray-900">{item.service}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  // Empty state
  return (
    <div className="w-full min-h-full bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">Contact Page Preview</h3>
        <p>Add content to see your contact page design</p>
      </div>
    </div>
  )
}