import { Card } from '@/src/components/ui/card'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { MapPin, Users, Award, Heart } from 'lucide-react'

interface AboutCompanyPreviewProps {
  title: string
  subtitle?: string
}

export function AboutCompanyPreview({ title, subtitle }: AboutCompanyPreviewProps) {
  return (
    <div className="w-full h-full bg-white p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      {/* Company Story */}
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">
            Founded in 2010, we&apos;ve been bringing beauty and joy to our community through 
            exceptional floral arrangements. Our passion for flowers drives everything we do.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">14</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
          </div>
        </div>
        <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-600">Company Image</span>
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Our Values</h2>
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
          }}
        >
          {[
            { icon: Heart, title: 'Passion', desc: 'Love for what we do' },
            { icon: Award, title: 'Quality', desc: 'Excellence in every arrangement' },
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
        <div 
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
          }}
        >
          {['Sarah Johnson', 'Mike Chen', 'Emily Davis'].map((name, i) => (
            <Card key={i} className="p-4 text-center">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarFallback className="text-lg">
                  {name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold mb-1 text-gray-900">{name}</h3>
              <Badge variant="outline" className="mb-2">
                {i === 0 ? 'Lead Florist' : i === 1 ? 'Designer' : 'Manager'}
              </Badge>
              <p className="text-sm text-gray-600">
                {i === 0 ? 'Expert in wedding arrangements' : 
                 i === 1 ? 'Creative design specialist' : 
                 'Operations and customer care'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="text-center bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Visit Our Studio</h3>
        </div>
        <p className="text-gray-600">123 Flower Street, Garden City, CA 90210</p>
        <p className="text-sm text-gray-600 mt-1">Open Monday - Saturday, 9AM - 6PM</p>
      </div>
    </div>
  )
}