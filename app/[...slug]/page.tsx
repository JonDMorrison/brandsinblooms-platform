import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { generatePageMetadata } from './utils/metadata'
import { isProductRoute, isCategoryRoute, extractSlugFromPath } from './utils/routing'
import { SitePageProps } from './types'
import { getEditModeStatus } from '@/src/lib/site-editor/server-utils'
import { FullSiteEditorWrapper } from '@/src/components/site-editor/FullSiteEditorWrapper'
import { FullSiteEditorBar } from '@/src/components/site-editor/FullSiteEditorBar'

// Page Components
import { HomePage } from './components/HomePage'
import { AboutPage } from './components/AboutPage'
import { ContactPage } from './components/ContactPage'
import { PrivacyPage } from './components/PrivacyPage'
import { TermsPage } from './components/TermsPage'
import { DynamicContentPage } from './components/DynamicContentPage'
import {
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

  // Check if edit mode is active
  const editModeStatus = await getEditModeStatus()

  // Determine which page component to render based on path
  let pageComponent: React.ReactNode

  switch (path) {
    case '':
    case 'home':
      pageComponent = <HomePage />
      break

    case 'about':
      pageComponent = <AboutPage />
      break

    case 'contact':
      pageComponent = <ContactPage />
      break

    case 'privacy':
      pageComponent = <PrivacyPage />
      break

    case 'terms':
      pageComponent = <TermsPage />
      break

    case 'products':
      pageComponent = <ProductsPage />
      break

    case 'cart':
      pageComponent = <CartPage />
      break

    case 'checkout':
      pageComponent = <CheckoutPage />
      break

    case 'account':
      pageComponent = <AccountPage />
      break

    case 'account/orders':
      pageComponent = <OrdersPage />
      break

    default:
      // Handle dynamic routes
      if (isProductRoute(path)) {
        const productSlug = extractSlugFromPath(path, 'products')
        pageComponent = <ProductDetailPage slug={productSlug} />
      } else if (isCategoryRoute(path)) {
        const categorySlug = extractSlugFromPath(path, 'category')
        pageComponent = <CategoryPage slug={categorySlug} />
      } else {
        // Try to find content in database with this slug
        pageComponent = <DynamicContentPage slug={path} />
      }
  }

  // Wrap all pages with edit mode functionality
  return (
    <FullSiteEditorWrapper
      isEditMode={editModeStatus.isEditMode}
      permissions={editModeStatus.permissions}
      pageContent={null}
      pageId={null}
    >
      {/* Editor Bar - shows on ALL pages when in edit mode */}
      {editModeStatus.isEditMode && <FullSiteEditorBar />}

      {/* Page content */}
      {pageComponent}
    </FullSiteEditorWrapper>
  )
}