import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ProductCatalog } from '@/src/components/site/ProductCatalog'
import { ShoppingCart } from '@/src/components/site/ShoppingCart'
import { SiteLayout } from '@/src/components/layout/SiteLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse our products',
}

interface SitePageProps {
  params: Promise<{ 
    slug?: string[] 
  }>
}

export default async function SitePage({ params }: SitePageProps) {
  const { slug } = await params
  const path = slug?.join('/') || ''
  
  // Check if we're on the platform domain
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'blooms.cc'
  
  // Determine if this is the main platform domain
  // In staging, APP_DOMAIN is already 'staging.blooms.cc'
  const isMainPlatform = 
    hostname === 'localhost:3001' || 
    hostname === 'localhost' ||
    hostname === APP_DOMAIN || // This handles both blooms.cc and staging.blooms.cc
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.railway.app')
  
  // If on platform domain, return 404 for site-specific routes
  // This prevents customer site content from appearing on the main platform
  if (isMainPlatform) {
    return notFound()
  }
  
  // Route to appropriate component based on path
  switch (path) {
    case '':
    case 'home':
      return <HomePage />
      
    case 'products':
      return <ProductsPage />
      
    case 'cart':
      return <CartPage />
      
    case 'checkout':
      return <CheckoutPage />
      
    case 'account':
      return <AccountPage />
      
    case 'account/orders':
      return <OrdersPage />
      
    case 'about':
      return <AboutPage />
      
    case 'contact':
      return <ContactPage />
      
    default:
      // Check if it's a product page (products/[slug])
      if (path.startsWith('products/')) {
        const productSlug = path.replace('products/', '')
        return <ProductDetailPage slug={productSlug} />
      }
      
      // Check if it's a category page (category/[slug])
      if (path.startsWith('category/')) {
        const categorySlug = path.replace('category/', '')
        return <CategoryPage slug={categorySlug} />
      }
      
      return notFound()
  }
}

function HomePage() {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">Welcome to Our Store</h1>
        
        {/* Featured Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
          <ProductCatalog featured={true} limit={8} />
        </section>
        
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category cards would go here */}
          </div>
        </section>
      </div>
    </SiteLayout>
  )
}

function ProductsPage() {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">All Products</h1>
        <ProductCatalog />
      </div>
    </SiteLayout>
  )
}

function CartPage() {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Cart items would be displayed here */}
            <p className="text-muted-foreground">Your cart items will appear here</p>
          </div>
          <div>
            {/* Order summary */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              {/* Summary details */}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}

function CheckoutPage() {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
            {/* Checkout form */}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {/* Order details */}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}

function AccountPage() {
  return (
    <SiteLayout requireAuth={true}>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">My Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {/* Account navigation */}
            <nav className="space-y-2">
              <a href="/account" className="block p-3 rounded-md bg-accent">Profile</a>
              <a href="/account/orders" className="block p-3 rounded-md hover:bg-accent">Orders</a>
              <a href="/account/addresses" className="block p-3 rounded-md hover:bg-accent">Addresses</a>
              <a href="/account/settings" className="block p-3 rounded-md hover:bg-accent">Settings</a>
            </nav>
          </div>
          <div className="md:col-span-2">
            {/* Account content */}
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            {/* Profile details */}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}

function OrdersPage() {
  return (
    <SiteLayout requireAuth={true}>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>
        {/* Orders list */}
        <p className="text-muted-foreground">Your order history will appear here</p>
      </div>
    </SiteLayout>
  )
}

function ProductDetailPage({ slug }: { slug: string }) {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        {/* Product details would be fetched based on slug */}
        <h1 className="text-4xl font-bold mb-8">Product: {slug}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {/* Product images */}
          </div>
          <div>
            {/* Product info and add to cart */}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}

function CategoryPage({ slug }: { slug: string }) {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">Category: {slug}</h1>
        <ProductCatalog categoryId={slug} />
      </div>
    </SiteLayout>
  )
}

function AboutPage() {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">About Us</h1>
        <div className="prose max-w-none">
          <p>Learn more about our company and mission.</p>
        </div>
      </div>
    </SiteLayout>
  )
}

function ContactPage() {
  return (
    <SiteLayout>
      <div className="brand-container py-12">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            {/* Contact form */}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            {/* Contact details */}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}