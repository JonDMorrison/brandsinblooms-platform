import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Star, ArrowRight } from 'lucide-react'

interface LandingPagePreviewProps {
  title: string
  subtitle?: string
}

export function LandingPagePreview({ title, subtitle }: LandingPagePreviewProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        <div className="flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Feature One', desc: 'Amazing capability' },
          { title: 'Feature Two', desc: 'Powerful tools' },
          { title: 'Feature Three', desc: 'Easy to use' }
        ].map((feature, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-4">Join thousands of satisfied customers</p>
        <Button>
          Start Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}