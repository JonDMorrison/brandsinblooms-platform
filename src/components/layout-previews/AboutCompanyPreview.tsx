import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Award, Heart } from 'lucide-react'

interface AboutCompanyPreviewProps {
  title: string
  subtitle?: string
}

export function AboutCompanyPreview({ title, subtitle }: AboutCompanyPreviewProps) {
  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      {/* Company Story */}
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Founded in 2010, we've been bringing beauty and joy to our community through 
            exceptional floral arrangements. Our passion for flowers drives everything we do.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">14</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
          </div>
        </div>
        <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Company Image</span>
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Heart, title: 'Passion', desc: 'Love for what we do' },
            { icon: Award, title: 'Quality', desc: 'Excellence in every arrangement' },
            { icon: Users, title: 'Community', desc: 'Supporting local connections' }
          ].map((value, i) => {
            const Icon = value.icon
            return (
              <Card key={i} className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Team Section */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {['Sarah Johnson', 'Mike Chen', 'Emily Davis'].map((name, i) => (
            <Card key={i} className="p-4 text-center">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarFallback className="text-lg">
                  {name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold mb-1">{name}</h3>
              <Badge variant="outline" className="mb-2">
                {i === 0 ? 'Lead Florist' : i === 1 ? 'Designer' : 'Manager'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {i === 0 ? 'Expert in wedding arrangements' : 
                 i === 1 ? 'Creative design specialist' : 
                 'Operations and customer care'}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Visit Our Studio</h3>
        </div>
        <p className="text-muted-foreground">123 Flower Street, Garden City, CA 90210</p>
        <p className="text-sm text-muted-foreground mt-1">Open Monday - Saturday, 9AM - 6PM</p>
      </div>
    </div>
  )
}