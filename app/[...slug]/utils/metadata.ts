import { Metadata } from 'next'
import { generateMetaTags, PAGE_SEO_DATA } from '@/src/data/seo-data'

export async function generatePageMetadata(
  params: Promise<{ slug?: string[] }>
): Promise<Metadata> {
  const { slug } = await params
  const path = slug?.join('/') || ''
  
  // Determine page type for SEO metadata
  let pageKey: keyof typeof PAGE_SEO_DATA = 'home'
  
  switch (path) {
    case '':
    case 'home':
      pageKey = 'home'
      break
    case 'about':
      pageKey = 'about'
      break
    case 'contact':
      pageKey = 'contact'
      break
    case 'privacy':
      pageKey = 'privacy'
      break
    case 'terms':
      pageKey = 'terms'
      break
    default:
      pageKey = 'home'
  }

  return generateMetaTags(pageKey)
}