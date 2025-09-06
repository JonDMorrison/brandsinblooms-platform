import { Flower } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-brand-heading text-gradient-primary mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-gray-500">
            <p className="text-gray-900">
              Last updated: January 2, 2025
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
              <p>
                Welcome to Brands in Blooms ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website builder platform and related services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              <p>We collect personal information that you provide to us, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials</li>
                <li>Payment information</li>
                <li>Business information</li>
                <li>Content you create using our platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-4">Automatically Collected Information</h3>
              <p>When you use our services, we automatically collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative information and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Protect against fraudulent or illegal activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">4. Information Sharing</h2>
              <p>We do not sell or rent your personal information. We may share your information in the following situations:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With your consent</li>
                <li>With service providers who assist in our operations</li>
                <li>For legal reasons or to prevent harm</li>
                <li>In connection with a business transfer or merger</li>
                <li>With aggregated or anonymized data that cannot identify you</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">6. Your Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct or update your information</li>
                <li>Delete your information</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">7. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">8. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">9. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">10. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>Email: privacy@brandsinblooms.com</li>
                <li>Address: [Your Business Address]</li>
              </ul>
            </section>
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
              <Link href="/platform/privacy" className="text-sm text-primary font-medium">
                Privacy Policy
              </Link>
              <Link href="/platform/terms" className="text-sm text-gray-500 hover:text-primary">
                Terms of Service
              </Link>
              <Link href="/platform/contact" className="text-sm text-gray-500 hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}