import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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

interface ContactServicesPreviewProps {
  title: string
  subtitle?: string
}

export function ContactServicesPreview({ title, subtitle }: ContactServicesPreviewProps) {
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Get in Touch</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="Your first name" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Your last name" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="your@email.com" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input type="tel" placeholder="+1 (555) 123-4567" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Service Needed</label>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="cursor-pointer">Wedding</Badge>
                <Badge variant="outline" className="cursor-pointer">Event</Badge>
                <Badge variant="outline" className="cursor-pointer">Delivery</Badge>
                <Badge variant="outline" className="cursor-pointer">Consultation</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                placeholder="Tell us about your floral needs..." 
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
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">123 Flower Street, Garden City, CA 90210</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">hello@blooms.cc</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-sm text-muted-foreground">Mon-Sat: 9AM-6PM, Sun: 10AM-4PM</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Services */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Our Services</h2>
            <div className="space-y-4">
              {[
                { icon: Heart, title: 'Wedding Florals', desc: 'Complete wedding flower packages' },
                { icon: Gift, title: 'Event Design', desc: 'Corporate and private events' },
                { icon: Flower, title: 'Daily Arrangements', desc: 'Fresh flowers for any occasion' }
              ].map((service, i) => {
                const Icon = service.icon
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">{service.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Map Placeholder */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Find Us</h2>
            <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <span className="text-muted-foreground">Interactive Map</span>
              </div>
            </div>
          </Card>

          {/* Social Media */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Follow Us</h2>
            <div className="flex gap-3">
              <Button variant="outline" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}