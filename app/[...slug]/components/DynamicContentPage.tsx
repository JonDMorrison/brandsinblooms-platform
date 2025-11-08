import { notFound } from 'next/navigation'
import Image from 'next/image'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug, type ContentWithTags } from '@/src/lib/queries/domains/content'
import { deserializePageContent } from '@/src/lib/content/serialization'
import { getLayoutSections } from '@/src/lib/preview/section-renderers'
import { CustomerSiteSection } from '@/src/components/customer-site/CustomerSiteSection'
import { EditableCustomerSiteSection } from '@/src/components/site-editor/EditableCustomerSiteSection'
import { ContentSection } from '@/src/lib/content/schema'
import { Calendar, User } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'

interface BlogPostMeta {
  excerpt?: string
  author?: string
  subtitle?: string
  featured_image?: string
  reading_time?: string
}

interface DynamicContentPageProps {
  slug: string
  isEditMode?: boolean
}

export async function DynamicContentPage({ slug, isEditMode = false }: DynamicContentPageProps) {
  const { siteId } = await getSiteHeaders()
  
  // Query database for content with this slug
  let contentResult = null
  let pageContent = null
  let orderedSections: Array<{ key: string; section: ContentSection }> = []
  
  try {
    const supabase = await createClient()
    contentResult = await getContentBySlug(supabase, siteId, slug)

    // Content must exist
    if (!contentResult) {
      return notFound()
    }

    // Reject unpublished pages for public visitors (not in edit mode)
    // Allow unpublished pages when logged-in editor is viewing
    if (!isEditMode && !contentResult.is_published) {
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
  
  // Check if this is a blog post
  const isBlogPost = contentResult.content_type === 'blog_post'

  // Special rendering for blog posts
  if (isBlogPost) {
    const meta = (contentResult.meta_data as BlogPostMeta) || {}

    // Get author from relation or meta_data (content may include author via join)
    const contentWithAuthor = contentResult as ContentWithTags
    const author = contentWithAuthor.author?.full_name || meta.author || 'Anonymous'

    // Format published date
    const publishedDate = contentResult.published_at
      ? new Date(contentResult.published_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Recently'

    // Extract HTML content from JSONB structure
    // Structure: { sections: { content: { data: { content: "<html>" } } } }
    const contentData = contentResult.content
    let htmlContent = ''

    if (typeof contentData === 'string') {
      // If content is already a string, use it directly
      htmlContent = contentData
    } else if (contentData && typeof contentData === 'object') {
      // Extract from JSONB structure: sections.content.data.content
      // Using type guard to safely access nested properties
      type ContentSections = {
        sections?: {
          content?: {
            data?: {
              content?: string
            }
          }
        }
      }
      const sectionsData = contentData as ContentSections
      if (sectionsData.sections?.content?.data?.content) {
        htmlContent = sectionsData.sections.content.data.content
      }
    }

    return (
      <SiteRenderer
        siteId={siteId}
        mode="live"
        showNavigation={true}
      >
        <div className="brand-container py-12">
          <div className="max-w-4xl mx-auto">
            <article className="flex flex-col">
              {/* Featured Image - only if exists */}
              {meta.featured_image && (
                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg relative mb-6">
                  <Image
                    src={meta.featured_image}
                    alt={contentResult.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <header className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {contentResult.is_featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  {meta.reading_time && (
                    <span className="text-xs text-gray-500">
                      {meta.reading_time}
                    </span>
                  )}
                </div>
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
                >
                  {contentResult.title}
                </h1>
                {meta.subtitle && (
                  <p
                    className="text-xl mb-4"
                    style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)' }}
                  >
                    {meta.subtitle}
                  </p>
                )}

                {/* Author and Date */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{publishedDate}</span>
                  </div>
                </div>
              </header>

              {/* Full Content */}
              <div className="flex-1">
                {htmlContent ? (
                  <div
                    className="prose prose-lg max-w-none prose-headings:mt-8 prose-headings:mb-4 prose-h1:mt-10 prose-h2:mt-8 prose-h3:mt-6"
                    style={{
                      fontFamily: 'var(--theme-font-body)',
                      color: 'var(--theme-text)'
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                ) : (
                  <div
                    className="text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    No content available
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </SiteRenderer>
    )
  }

  // Default rendering for non-blog content
  // Create section data mapping
  type SectionDataInfo = {
    data: Record<string, unknown>
    status: 'available'
    backgroundSetting: string
  }
  const sectionDataMap: Record<string, SectionDataInfo> = {}

  // Populate section data from database content
  if (pageContent?.sections) {
    Object.entries(pageContent.sections).forEach(([key, section]) => {
      // Type guard: section should have data, visible, and settings properties
      if (
        section &&
        typeof section === 'object' &&
        'data' in section &&
        'visible' in section &&
        section.data &&
        section.visible
      ) {
        const backgroundColor =
          section &&
          typeof section === 'object' &&
          'settings' in section &&
          section.settings &&
          typeof section.settings === 'object' &&
          'backgroundColor' in section.settings
            ? String(section.settings.backgroundColor)
            : 'default'

        sectionDataMap[key] = {
          data: section.data as Record<string, unknown>,
          status: 'available',
          backgroundSetting: backgroundColor
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
          <EditableCustomerSiteSection
            key={key}
            sectionKey={key}
            section={section}
            sectionData={sectionInfo.data}
          >
            <CustomerSiteSection
              section={section}
              sectionKey={key}
              sectionData={sectionInfo.data}
              backgroundSetting={sectionInfo.backgroundSetting}
            />
          </EditableCustomerSiteSection>
        )
      })}
    </SiteRenderer>
  )
}