import Link from 'next/link'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ProductCatalog } from '@/src/components/site/ProductCatalog'
import { generateStructuredData } from '@/src/data/seo-data'
import { getSiteHeaders } from '../utils/routing'
import { ProductDetailPageClient } from './ProductDetailPage'
import { CategoryPageClient } from './CategoryPage'
import { CartPageClient } from './CartPage'
import { ProductsPageClient } from './ProductsPageComponent'
import { createClient } from '@/src/lib/supabase/server'

// Simple page wrapper component
interface SimplePageProps {
  title: string
  children: React.ReactNode
  siteId: string
  structuredDataKey?: string
}

function SimplePage({ title, children, siteId, structuredDataKey }: SimplePageProps) {
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      {structuredDataKey && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData(structuredDataKey as any))
          }}
        />
      )}
      <div className="brand-container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
            {title}
          </h1>
          {children}
        </div>
      </div>
    </SiteRenderer>
  )
}

export async function PrivacyPage() {
  const { siteId } = await getSiteHeaders()
  
  return (
    <SimplePage title="Privacy Policy" siteId={siteId} structuredDataKey="privacy">
      <div className="prose max-w-none" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
        <p className="text-lg mb-6">
          Effective Date: January 1, 2025
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Information We Collect
        </h2>
        <p className="mb-4">
          We collect information you provide directly to us, such as when you create an account, make a purchase, 
          sign up for plant care consultations, subscribe to our newsletter, or contact us for plant care advice.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Personal Information
        </h3>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Contact information (name, email address, phone number, shipping address)</li>
          <li>Payment information (processed securely through our payment processors)</li>
          <li>Plant care preferences and consultation history</li>
          <li>Photos of your plants (when submitted for care consultations)</li>
          <li>Account credentials and profile information</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          How We Use Your Information
        </h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Process orders and deliver plant care products and services</li>
          <li>Provide personalized plant care consultations and advice</li>
          <li>Send you plant care tips, seasonal reminders, and product recommendations</li>
          <li>Improve our services and develop new plant care resources</li>
          <li>Communicate with you about your orders, consultations, and account</li>
          <li>Protect against fraud and unauthorized activities</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Information Sharing and Disclosure
        </h2>
        <p className="mb-4">
          We do not sell, trade, or otherwise transfer your personal information to third parties except as described below:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Service providers who help us operate our business (shipping, payment processing, email services)</li>
          <li>Professional partners for specialized plant care services (with your consent)</li>
          <li>Legal requirements or to protect our rights and safety</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Data Security
        </h2>
        <p className="mb-4">
          We implement appropriate technical and organizational measures to protect your personal information 
          against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
          over the internet is 100% secure.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Your Rights
        </h2>
        <p className="mb-4">You have the right to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Access and update your personal information</li>
          <li>Delete your account and personal data</li>
          <li>Opt out of marketing communications</li>
          <li>Request a copy of your data</li>
          <li>Correct inaccurate information</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Contact Us
        </h2>
        <p className="mb-4">
          If you have questions about this Privacy Policy or our data practices, please contact us at 
          privacy@plantshop.com or call us at (555) 123-PLANT.
        </p>
      </div>
    </SimplePage>
  )
}

export async function TermsPage() {
  const { siteId } = await getSiteHeaders()
  
  return (
    <SimplePage title="Terms of Service" siteId={siteId} structuredDataKey="terms">
      <div className="prose max-w-none" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
        <p className="text-lg mb-6">
          Effective Date: January 1, 2025
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Plant Health Guarantee
        </h2>
        <p className="mb-4">
          We guarantee that all plants will arrive healthy and as described. If your plant arrives damaged 
          or dies within 30 days of delivery due to shipping stress or our error, we'll replace it free of charge.
        </p>
        <p className="mb-4">
          This guarantee does not cover plant death due to improper care, neglect, or environmental factors 
          outside normal growing conditions.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Product Descriptions
        </h2>
        <p className="mb-4">
          Plants are living organisms and may vary slightly from photos in size, shape, and coloring. 
          We provide accurate descriptions based on mature plant characteristics, but individual plants 
          may take time to develop these features.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Shipping Policies
        </h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Live plants are shipped Monday through Wednesday to ensure weekend delivery</li>
          <li>Shipping may be delayed during extreme weather conditions for plant safety</li>
          <li>Plants are carefully packaged for protection during transit</li>
          <li>Delivery confirmation and tracking information provided</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Returns and Exchanges
        </h2>
        <p className="mb-4">
          Due to the living nature of our products, we cannot accept returns of healthy plants. 
          However, we stand behind our plant health guarantee and will work with you to resolve any issues.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Plant Care Consultations
        </h2>
        <p className="mb-4">
          Our plant care advice is provided by certified horticulturists based on general plant care principles. 
          While we strive for accuracy, plant care success depends on many factors including environment, 
          care routine, and individual plant health.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Limitation of Liability
        </h2>
        <p className="mb-4">
          Our liability is limited to the purchase price of the plants or services. We are not responsible 
          for consequential damages, including but not limited to loss of other plants, property damage, 
          or emotional distress.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          Contact Information
        </h2>
        <p className="mb-4">
          Questions about these Terms of Service? Contact us at support@plantshop.com or (555) 123-PLANT.
        </p>
      </div>
    </SimplePage>
  )
}

export async function ProductsPage() {
  const { siteId } = await getSiteHeaders()

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <ProductsPageClient />
    </SiteRenderer>
  )
}

export async function CartPage() {
  const { siteId } = await getSiteHeaders()

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <CartPageClient />
    </SiteRenderer>
  )
}

export async function CheckoutPage() {
  const { siteId } = await getSiteHeaders()
  const { CheckoutPageClient } = await import('./CheckoutPageClient')

  // Fetch site's Stripe account ID for payment processing
  const supabase = await createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('stripe_account_id')
    .eq('id', siteId)
    .single()

  const stripeAccountId = site?.stripe_account_id || ''

  // Read Stripe publishable key at runtime (server-side) to avoid build-time bundling issues
  // This ensures the env var is available even if it wasn't set during the build phase
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <CheckoutPageClient
        siteId={siteId}
        stripeAccountId={stripeAccountId}
        stripePublishableKey={stripePublishableKey}
      />
    </SiteRenderer>
  )
}

export async function AccountPage() {
  const { siteId } = await getSiteHeaders()
  
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          My Account
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <nav className="space-y-2">
              <Link href="/account" className="block p-3 rounded-md" style={{backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)'}}>
                Profile
              </Link>
              <Link href="/account/orders" className="block p-3 rounded-md hover:bg-gray-50">
                Orders
              </Link>
              <Link href="/account/addresses" className="block p-3 rounded-md hover:bg-gray-50">
                Addresses
              </Link>
              <Link href="/account/settings" className="block p-3 rounded-md hover:bg-gray-50">
                Settings
              </Link>
            </nav>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Profile Information
            </h2>
          </div>
        </div>
      </div>
    </SiteRenderer>
  )
}

export async function OrdersPage() {
  const { siteId } = await getSiteHeaders()
  
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
          My Orders
        </h1>
        <p className="text-gray-500">Your order history will appear here</p>
      </div>
    </SiteRenderer>
  )
}

export async function ProductDetailPage({ slug }: { slug: string }) {
  const { siteId } = await getSiteHeaders()

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <ProductDetailPageClient slug={slug} />
    </SiteRenderer>
  )
}

export async function CategoryPage({ slug }: { slug: string }) {
  const { siteId } = await getSiteHeaders()

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <CategoryPageClient slug={slug} />
    </SiteRenderer>
  )
}

export async function OrderConfirmationPageWrapper({ orderId }: { orderId: string }) {
  const { siteId } = await getSiteHeaders()
  const { OrderConfirmationPage } = await import('./OrderConfirmationPage')

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <OrderConfirmationPage orderId={orderId} />
    </SiteRenderer>
  )
}