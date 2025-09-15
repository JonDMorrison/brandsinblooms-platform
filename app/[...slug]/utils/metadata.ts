import { Metadata } from 'next'
import { generateMetaTags, PAGE_SEO_DATA } from '@/src/data/seo-data'
import { getSiteHeaders } from './routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug } from '@/src/lib/queries/domains/content'

export async function generatePageMetadata(
  params: Promise<{ slug?: string[] }>
): Promise<Metadata> {
  const { slug } = await params
  const path = slug?.join('/') || ''
  
  // Handle hardcoded pages first
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
      // Try to get metadata from database content
      try {
        const { siteId } = await getSiteHeaders()
        const supabase = await createClient()
        const contentResult = await getContentBySlug(supabase, siteId, path)
        
        if (contentResult && contentResult.is_published && contentResult.meta_data) {
          const metaData = contentResult.meta_data as any
          const seoData = metaData?.seo
          
          if (seoData) {
            return {
              title: seoData.title || contentResult.title || 'Page',
              description: seoData.description || 'Content page',
              keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : undefined,
              openGraph: {
                title: seoData.title || contentResult.title || 'Page',
                description: seoData.description || 'Content page',
                type: 'website',
              },
              twitter: {
                card: 'summary_large_image',
                title: seoData.title || contentResult.title || 'Page',
                description: seoData.description || 'Content page',
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching metadata for path:', path, error)
      }
      
      // Fallback to home page metadata
      pageKey = 'home'
  }

  return generateMetaTags(pageKey)
}