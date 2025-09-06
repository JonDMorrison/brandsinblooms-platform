import { Flower, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'

export default function Contact() {

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="relative z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <nav className="brand-container py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex-shrink-0">
                <Flower className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-brand-heading text-gradient-primary">
                  Brands in Blooms
                </h1>
              </div>
            </Link>
            
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="brand-container py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-brand-heading text-gradient-primary mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-500">
              Have a question or need assistance? We're here to help!
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                    <p className="text-gray-500">support@brandsinblooms.com</p>
                    <p className="text-sm text-gray-500 mt-2">
                      We'll respond within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 bg-muted/30 rounded-lg mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Common Topics</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Account and billing questions</li>
                <li>• Technical support and troubleshooting</li>
                <li>• Feature requests and feedback</li>
                <li>• Partnership opportunities</li>
                <li>• Security and compliance inquiries</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-20">
        <div className="brand-container">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
                <Flower className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-500">
                © 2025 Brands in Blooms. All rights reserved.
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/platform/privacy" className="text-sm text-gray-500 hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/platform/terms" className="text-sm text-gray-500 hover:text-primary">
                Terms of Service
              </Link>
              <Link href="/platform/contact" className="text-sm text-primary font-medium">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}