import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { generatePageMetadata } from './utils/metadata'
import { isProductRoute, isCategoryRoute, extractSlugFromPath } from './utils/routing'
import { SitePageProps } from './types'

// Page Components
import { HomePage } from './components/HomePage'
import { AboutPage } from './components/AboutPage'
import { ContactPage } from './components/ContactPage'
import { DynamicContentPage } from './components/DynamicContentPage'
import { 
  PrivacyPage, 
  TermsPage, 
  ProductsPage, 
  CartPage, 
  CheckoutPage, 
  AccountPage, 
  OrdersPage,
  ProductDetailPage,
  CategoryPage 
} from './components/SimplePages'

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  return generatePageMetadata(params)
}

export default async function SitePage({ params }: SitePageProps) {
  const { slug } = await params
  const path = slug?.join('/') || ''
  
  // Route to appropriate component based on path
  switch (path) {
    case '':
    case 'home':
      return <HomePage />
      
    case 'about':
      return <AboutPage />
      
    case 'contact':
      return <ContactPage />
      
    case 'privacy':
      return <PrivacyPage />
      
    case 'terms':
      return <TermsPage />
      
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
      
    default:
      // Handle dynamic routes
      if (isProductRoute(path)) {
        const productSlug = extractSlugFromPath(path, 'products')
        return <ProductDetailPage slug={productSlug} />
      }
      
      if (isCategoryRoute(path)) {
        const categorySlug = extractSlugFromPath(path, 'category')
        return <CategoryPage slug={categorySlug} />
      }
      
      // Try to find content in database with this slug
      return <DynamicContentPage slug={path} />
  }
}