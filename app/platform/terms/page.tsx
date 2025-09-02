import { Flower } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="relative z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-foreground">
              Last updated: January 2, 2025
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Brands in Blooms ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p>
                Brands in Blooms provides a multi-tenant website builder platform that allows users to create, manage, and host multiple branded websites. Our Service includes website creation tools, hosting, domain management, and related features.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-foreground">Account Creation</h3>
              <p>To use certain features of our Service, you must create an account. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p>You agree not to use our Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Transmit malicious code, viruses, or harmful content</li>
                <li>Engage in fraudulent or deceptive activities</li>
                <li>Harass, abuse, or harm others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Create content that is illegal, offensive, or inappropriate</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Content and Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-foreground">Your Content</h3>
              <p>
                You retain ownership of content you create using our Service. By using our Service, you grant us a license to host, store, and display your content as necessary to provide the Service.
              </p>
              
              <h3 className="text-xl font-semibold text-foreground mt-4">Our Property</h3>
              <p>
                The Service, including its original content, features, and functionality, is owned by Brands in Blooms and is protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Payment Terms</h2>
              <p>Certain features of our Service require payment. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate payment information</li>
                <li>Pay all fees according to the pricing plan you select</li>
                <li>Authorize us to charge your payment method</li>
                <li>Be responsible for all applicable taxes</li>
              </ul>
              <p className="mt-4">
                Subscription fees are billed in advance and are non-refundable except as required by law or as explicitly stated in our refund policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
              <p>
                You may terminate your account at any time through your account settings or by contacting support.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <p>
                IN NO EVENT SHALL BRANDS IN BLOOMS, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless Brands in Blooms and its affiliates from any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>Email: legal@brandsinblooms.com</li>
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
              <span className="text-sm text-muted-foreground">
                © 2025 Brands in Blooms. All rights reserved.
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/platform/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/platform/terms" className="text-sm text-primary font-medium">
                Terms of Service
              </Link>
              <Link href="/platform/contact" className="text-sm text-muted-foreground hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}