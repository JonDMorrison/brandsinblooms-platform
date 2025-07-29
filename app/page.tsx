import Link from 'next/link'
import { 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Flower,
  Check,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/auth/server'

const features = [
  {
    title: 'AI-Powered Content',
    description: 'Generate stunning content with our advanced AI technology that understands your brand.',
    icon: Sparkles,
    color: 'text-purple-500'
  },
  {
    title: 'Easy Management',
    description: 'Intuitive dashboard to manage all your content, products, and orders in one place.',
    icon: Zap,
    color: 'text-blue-500'
  },
  {
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with 99.9% uptime guarantee and automated backups.',
    icon: Shield,
    color: 'text-green-500'
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'BloomTech',
    content: 'Brands & Blooms transformed our content strategy. The AI-powered tools are incredible!',
    rating: 5
  },
  {
    name: 'Mike Chen',
    role: 'E-commerce Manager',
    company: 'Green Gardens',
    content: 'Managing our product catalog has never been easier. Highly recommend!',
    rating: 5
  }
]

export default async function HomePage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="relative z-10">
        <nav className="brand-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
                <Flower className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-brand-heading text-gradient-primary">
                  Brands & Blooms
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button asChild className="btn-gradient-primary">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button asChild className="btn-gradient-primary">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="brand-section">
        <div className="brand-container text-center">
          <div className="max-w-4xl mx-auto fade-in">
            <Badge className="brand-badge-primary mb-6">
              ✨ New: AI Content Generator
            </Badge>
            <h1 className="text-display-large font-brand-heading mb-6 text-gradient-primary">
              Transform Your Brand with AI-Powered Content
            </h1>
            <p className="text-subtitle text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create stunning websites, manage products, and grow your business with our 
              all-in-one platform designed for modern brands.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button size="lg" asChild className="btn-gradient-primary interactive">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="btn-gradient-primary interactive">
                    <Link href="/signup">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="interactive">
                    <Link href="/signin">
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="brand-section bg-gradient-subtle-light">
        <div className="brand-container">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-display font-brand-heading mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-subtitle text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and features designed to help your brand thrive in the digital world.
            </p>
          </div>
          <div className="brand-grid-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="brand-card-elevated interactive stagger-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary-soft">
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-title">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="brand-section">
        <div className="brand-container">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-display font-brand-heading mb-4">
              Loved by thousands of brands
            </h2>
            <p className="text-subtitle text-muted-foreground">
              See what our customers are saying about us.
            </p>
          </div>
          <div className="brand-grid-2 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.name}
                className="brand-card-elevated interactive stagger-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="brand-section bg-gradient-primary text-white">
        <div className="brand-container text-center">
          <div className="max-w-3xl mx-auto fade-in-up">
            <h2 className="text-display font-brand-heading mb-4">
              Ready to transform your brand?
            </h2>
            <p className="text-subtitle opacity-90 mb-8">
              Join thousands of successful brands using our platform to grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button size="lg" variant="secondary" asChild className="interactive">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="secondary" asChild className="interactive">
                    <Link href="/signup">
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="text-white border-white hover:bg-white hover:text-primary interactive">
                    <Link href="/signin">
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center justify-center space-x-6 mt-8 text-sm opacity-80">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-card border-t">
        <div className="brand-container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
                  <Flower className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-brand-heading text-gradient-primary">
                    Brands & Blooms
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                The all-in-one platform for modern brands to create, manage, and grow their digital presence.
              </p>
              <p className="text-sm text-muted-foreground">
                © 2024 Brands & Blooms. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/templates" className="hover:text-primary transition-colors">Templates</Link></li>
                <li><Link href="/integrations" className="hover:text-primary transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}