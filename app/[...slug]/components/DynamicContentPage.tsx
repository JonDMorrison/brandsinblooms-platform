import { notFound } from 'next/navigation'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug } from '@/src/lib/queries/domains/content'
import { deserializePageContent } from '@/src/lib/content/serialization'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'
import { ContentSection } from '@/src/lib/content/schema'

interface DynamicContentPageProps {
  slug: string
}

export async function DynamicContentPage({ slug }: DynamicContentPageProps) {
  const { siteId } = await getSiteHeaders()
  
  // Query database for content with this slug
  let contentResult = null
  let pageContent = null
  let orderedSections: Array<{ key: string; section: ContentSection }> = []
  
  try {
    const supabase = await createClient()
    contentResult = await getContentBySlug(supabase, siteId, slug)
    
    // Only render if content exists and is published
    if (!contentResult || !contentResult.is_published) {
      return notFound()
    }
    
    // Deserialize the page content
    pageContent = deserializePageContent(contentResult.content)
    
    // Get ordered sections for rendering
    if (pageContent?.sections) {
      orderedSections = getLayoutSections(pageContent.sections, pageContent.layout || 'other')
    }
    
  } catch (error) {
    // Filter out expected 404 errors to reduce noise
    const isExpected404 =
      slug.includes('.well-known/') ||
      slug.includes('/_next/static/') ||
      slug.endsWith('.map') ||
      slug.includes('favicon.ico')

    if (!isExpected404) {
      console.error('Error fetching content for slug:', slug, error)
    }
    return notFound()
  }
  
  // If no sections to render, return not found
  if (orderedSections.length === 0) {
    return notFound()
  }
  
  // Create section data mapping
  const sectionDataMap: Record<string, any> = {}
  
  // Populate section data from database content
  if (pageContent?.sections) {
    Object.entries(pageContent.sections).forEach(([key, section]: [string, any]) => {
      if (section?.data && section?.visible) {
        sectionDataMap[key] = {
          data: section.data,
          status: 'available',
          backgroundSetting: String(section.settings?.backgroundColor || 'default')
        }
      }
    })
  }
  
  return (
    <SiteRenderer 
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      {/* Render sections in database order */}
      {orderedSections.map(({ key, section }) => {
        const sectionInfo = sectionDataMap[key]
        
        // Only render if section has data and is available
        if (!sectionInfo || sectionInfo.status !== 'available' || !sectionInfo.data) {
          return null
        }
        
        return (
          <CustomerSiteSection
            key={key}
            section={section}
            sectionKey={key}
            sectionData={sectionInfo.data}
            backgroundSetting={sectionInfo.backgroundSetting}
          />
        )
      })}
    </SiteRenderer>
  )
}