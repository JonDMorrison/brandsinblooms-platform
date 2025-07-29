import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { WebVitals } from '@/components/WebVitals'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Brands and Blooms - Premium Floral Design Platform',
    template: '%s | Brands and Blooms'
  },
  description: 'Create stunning floral arrangements and manage your flower business with our comprehensive platform. Design, order, and track - all in one place.',
  keywords: ['floral design', 'flower arrangements', 'bouquet creator', 'flower business', 'florist platform'],
  authors: [{ name: 'Brands and Blooms' }],
  creator: 'Brands and Blooms',
  publisher: 'Brands and Blooms',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://brandsandblooms.com'),
  openGraph: {
    title: 'Brands and Blooms - Premium Floral Design Platform',
    description: 'Create stunning floral arrangements and manage your flower business with our comprehensive platform.',
    url: '/',
    siteName: 'Brands and Blooms',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Brands and Blooms - Premium Floral Design Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brands and Blooms - Premium Floral Design Platform',
    description: 'Create stunning floral arrangements and manage your flower business with our comprehensive platform.',
    images: ['/twitter-image.png'],
    creator: '@brandsandblooms',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}