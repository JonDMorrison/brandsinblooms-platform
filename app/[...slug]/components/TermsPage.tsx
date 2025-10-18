import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { ContentSection } from '@/src/lib/content/schema'
import { generateStructuredData } from '@/src/data/seo-data'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug } from '@/src/lib/queries/domains/content'
import { deserializePageContent } from '@/src/lib/content/serialization'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'
import { EditableCustomerSiteSection } from '@/src/components/site-editor/EditableCustomerSiteSection'

export async function TermsPage() {
  const { siteId } = await getSiteHeaders()

  // Fetch database content for terms page sections
  let databaseHeaderData = null
  let headerStatus = 'not_found' // 'not_found', 'unpublished', 'missing_header', 'available'
  let headerBackgroundSetting = 'default'
  let databaseRichTextSections: Record<string, unknown> = {}
  let richTextStatuses: Record<string, string> = {}
  let richTextBackgroundSettings: Record<string, string> = {}
  let contentResult = null

  try {
    const supabase = await createClient()
    contentResult = await getContentBySlug(supabase, siteId, 'terms')

    if (contentResult && contentResult.content) {
      if (!contentResult.is_published) {
        headerStatus = 'unpublished'
      } else {
        const pageContent = deserializePageContent(contentResult.content)

        // Check for header section
        if (pageContent?.sections?.header?.data) {
          databaseHeaderData = pageContent.sections.header.data
          headerStatus = 'available'
          headerBackgroundSetting = String(pageContent.sections.header.settings?.backgroundColor || 'default')
        } else {
          headerStatus = 'missing_header'
        }

        // Check for richText sections (richText, richText_1, richText_2, etc.)
        if (pageContent?.sections) {
          Object.entries(pageContent.sections).forEach(([sectionKey, section]) => {
            if (sectionKey.startsWith('richText') && section?.data) {
              databaseRichTextSections[sectionKey] = section.data
              richTextStatuses[sectionKey] = 'available'
              richTextBackgroundSettings[sectionKey] = String(section.settings?.backgroundColor || 'default')
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error fetching database content:', error)
    // statuses remain 'not_found'
  }

  // Get ordered sections from database if available
  let orderedSections: Array<{ key: string; section: unknown }> = []
  if (contentResult && contentResult.content && contentResult.is_published) {
    const pageContent = deserializePageContent(contentResult.content)
    if (pageContent?.sections) {
      orderedSections = getLayoutSections(pageContent.sections, 'other')
    }
  }

  // Create data mapping for dynamic sections
  const sectionDataMap: Record<string, { data: unknown; status: string; backgroundSetting: string }> = {
    header: {
      data: databaseHeaderData,
      status: headerStatus,
      backgroundSetting: headerBackgroundSetting
    }
  }

  // Add all found Rich Text sections to the sectionDataMap
  Object.entries(databaseRichTextSections).forEach(([sectionKey, sectionData]) => {
    sectionDataMap[sectionKey] = {
      data: sectionData,
      status: richTextStatuses[sectionKey],
      backgroundSetting: richTextBackgroundSettings[sectionKey]
    }
  })

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData('terms'))
        }}
      />

      {/* Dynamic sections based on database order */}
      {orderedSections.length > 0 ? (
        // Render sections in database order
        orderedSections.map(({ key, section }) => {
          const sectionInfo = sectionDataMap[key]

          // Only render if section has data and is available
          if (!sectionInfo || sectionInfo.status !== 'available' || !sectionInfo.data) {
            return null
          }

          return (
            <EditableCustomerSiteSection
              key={key}
              sectionKey={key}
              section={section as ContentSection}
              sectionData={sectionInfo.data}
            >
              <CustomerSiteSection
                section={section as ContentSection}
                sectionKey={key}
                sectionData={sectionInfo.data}
                backgroundSetting={sectionInfo.backgroundSetting}
              />
            </EditableCustomerSiteSection>
          )
        })
      ) : (
        // Fallback content if no database content available
        <div className="brand-container py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)'}}>
              Terms of Service
            </h1>
            <div className="prose max-w-none" style={{color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)'}}>
              <p className="text-lg mb-6">
                This terms of service page is not yet configured. Please use the content editor to set up your terms of service.
              </p>
            </div>
          </div>
        </div>
      )}
    </SiteRenderer>
  )
}