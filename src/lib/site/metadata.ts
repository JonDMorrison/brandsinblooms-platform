import type { Metadata } from 'next'
import { Site } from '../database/types'

/**
 * Default metadata fallback values
 */
const DEFAULT_METADATA = {
  title: 'Brands in Blooms - Premium Floral Design Platform',
  description: 'Create stunning floral arrangements and manage your flower business with our comprehensive platform. Design, order, and track - all in one place.',
  keywords: ['floral design', 'flower arrangements', 'bouquet creator', 'flower business', 'florist platform'],
  creator: 'Brands in Blooms',
  publisher: 'Brands in Blooms',
  twitter: '@brandsandblooms'
}

/**
 * Generates site-specific metadata based on the current site context
 */
export function generateSiteMetadata(hostname: string, site: Site | null): Metadata {
  // If no site found, use default metadata
  if (!site) {
    return generateDefaultMetadata(hostname)
  }

  // Generate site-specific metadata
  const siteTitle = site.name || site.subdomain
  const siteDescription = site.description || `Welcome to ${siteTitle}, powered by Brands in Blooms platform.`
  
  const title = {
    default: `${siteTitle} - Powered by Brands in Blooms`,
    template: `%s | ${siteTitle}`
  }

  // Use site custom domain if available, otherwise use the hostname
  const baseUrl = site.custom_domain 
    ? `https://${site.custom_domain}` 
    : `https://${hostname}`

  return {
    title,
    description: siteDescription,
    keywords: [
      'floral design', 
      'flower arrangements', 
      'florist', 
      site.name?.toLowerCase() || site.subdomain,
      ...DEFAULT_METADATA.keywords
    ],
    authors: [{ name: siteTitle }],
    creator: siteTitle,
    publisher: 'Brands in Blooms',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: `${siteTitle} - Powered by Brands in Blooms`,
      description: siteDescription,
      url: '/',
      siteName: siteTitle,
      images: [
        {
          url: site.logo_url || '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${siteTitle} - Powered by Brands in Blooms`,
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteTitle} - Powered by Brands in Blooms`,
      description: siteDescription,
      images: [site.logo_url || '/twitter-image.png'],
      creator: DEFAULT_METADATA.twitter,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png' },
        { url: '/apple-icon-180x180.png', sizes: '180x180' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/safari-pinned-tab.svg',
        },
      ],
    },
    manifest: '/manifest.json',
    alternates: {
      canonical: '/',
    },
  }
}

/**
 * Generates default metadata when no site is found
 */
function generateDefaultMetadata(hostname: string): Metadata {
  const baseUrl = `https://${hostname}`
  
  return {
    title: {
      default: DEFAULT_METADATA.title,
      template: '%s | Brands in Blooms'
    },
    description: DEFAULT_METADATA.description,
    keywords: DEFAULT_METADATA.keywords,
    authors: [{ name: DEFAULT_METADATA.creator }],
    creator: DEFAULT_METADATA.creator,
    publisher: DEFAULT_METADATA.publisher,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: DEFAULT_METADATA.title,
      description: DEFAULT_METADATA.description,
      url: '/',
      siteName: DEFAULT_METADATA.creator,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: DEFAULT_METADATA.title,
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_METADATA.title,
      description: DEFAULT_METADATA.description,
      images: ['/twitter-image.png'],
      creator: DEFAULT_METADATA.twitter,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png' },
        { url: '/apple-icon-180x180.png', sizes: '180x180' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/safari-pinned-tab.svg',
        },
      ],
    },
    manifest: '/manifest.json',
    alternates: {
      canonical: '/',
    },
  }
}

/**
 * Generates page-specific metadata that inherits from site metadata
 */
export function generatePageMetadata(
  title: string,
  description?: string,
  site?: Site | null
): Partial<Metadata> {
  const pageTitle = site?.name 
    ? `${title} | ${site.name}` 
    : `${title} | Brands in Blooms`

  return {
    title: pageTitle,
    description: description || (site?.description || DEFAULT_METADATA.description),
    openGraph: {
      title: pageTitle,
      description: description || (site?.description || DEFAULT_METADATA.description),
    },
    twitter: {
      title: pageTitle,
      description: description || (site?.description || DEFAULT_METADATA.description),
    },
  }
}