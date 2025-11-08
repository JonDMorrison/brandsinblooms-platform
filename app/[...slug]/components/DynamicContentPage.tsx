import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { createClient } from '@/src/lib/supabase/server'
import { getContentBySlug, getPublishedContent, type ContentWithTags } from '@/src/lib/queries/domains/content'
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
    // Fetch all blog posts for the sidebar
    const supabase = await createClient()
    const allBlogPosts = await getPublishedContent(supabase, siteId, 'blog_post')

    // Filter out the current post from past posts
    const pastPosts = allBlogPosts.filter(post => post.id !== contentResult.id)

    // Extract blog header data from JSONB structure
    // Structure: { sections: { blogHeader: { data: { title, subtitle, author, publishedDate, image } } } }
    type BlogHeaderSections = {
      sections?: {
        blogHeader?: {
          data?: {
            title?: string
            subtitle?: string
            author?: string
            publishedDate?: string
            image?: string
          }
        }
      }
    }

    const contentData = contentResult.content
    const blogHeaderData = (contentData as BlogHeaderSections)?.sections?.blogHeader?.data || {}

    // Extract metadata from blogHeader section (preferred) or fallback to meta_data
    const meta = (contentResult.meta_data as BlogPostMeta) || {}
    const title = blogHeaderData.title || contentResult.title
    const subtitle = blogHeaderData.subtitle || meta.subtitle
    const author = blogHeaderData.author || meta.author || 'Anonymous'
    const featuredImage = blogHeaderData.image || meta.featured_image

    // Format published date from blogHeader or published_at
    const publishedDate = blogHeaderData.publishedDate
      ? new Date(blogHeaderData.publishedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : contentResult.published_at
      ? new Date(contentResult.published_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Recently'

    // Extract HTML content from JSONB structure
    // Structure: { sections: { content: { data: { content: "<html>" } } } }
    let htmlContent = ''

    if (typeof contentData === 'string') {
      // If content is already a string, use it directly
      htmlContent = contentData
    } else if (contentData && typeof contentData === 'object') {
      // Extract from JSONB structure: sections.content.data.content
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
          <div className="max-w-6xl mx-auto">
            {/* Blog Post Layout with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Current Blog Post - 2/3 width */}
              <div className="lg:col-span-2">
                <article className="flex flex-col">
                  {/* Featured Image - only if exists */}
                  {featuredImage && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg relative mb-6">
                      <Image
                        src={featuredImage}
                        alt={title}
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
                      {title}
                    </h1>
                    {subtitle && (
                      <p
                        className="text-xl mb-4"
                        style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)' }}
                      >
                        {subtitle}
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
                        className="blog-article-content prose prose-lg max-w-none"
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
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .blog-article-content h1 {
                          margin-top: 3rem !important;
                        }
                        .blog-article-content h2 {
                          margin-top: 1rem !important;
                        }
                        .blog-article-content p {
                          margin-bottom: 1rem !important;
                        }
                      `
                    }} />
                  </div>
                </article>
              </div>

              {/* Past Posts Sidebar - 1/3 width */}
              <aside className="lg:col-span-1">
                <div
                  className="h-full p-6 rounded-lg"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                  }}
                >
                  <header className="mb-6">
                    <h2
                      className="text-xl font-bold"
                      style={{ color: 'var(--theme-background)', fontFamily: 'var(--theme-font-heading)' }}
                    >
                      Past Posts
                    </h2>
                  </header>
                  <div>
                    {pastPosts.length > 0 ? (
                      <nav className="space-y-6">
                        {pastPosts.map((post: ContentWithTags) => {
                          // Extract blog header data for each past post
                          const postContentData = post.content
                          const postBlogHeaderData = (postContentData as BlogHeaderSections)?.sections?.blogHeader?.data || {}
                          const postMeta = (post.meta_data as BlogPostMeta) || {}

                          const postSubtitle = postBlogHeaderData.subtitle || postMeta.subtitle
                          const postAuthor = postBlogHeaderData.author || postMeta.author

                          const postPublishedDate = postBlogHeaderData.publishedDate
                            ? new Date(postBlogHeaderData.publishedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : post.published_at
                            ? new Date(post.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recently'

                          return (
                            <div
                              key={post.id}
                              className="pb-6 last:pb-0"
                              style={{
                                borderBottom: pastPosts.indexOf(post) === pastPosts.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              <Link
                                href={`/${post.slug}`}
                                className="group block"
                              >
                                <h3
                                  className="font-semibold mb-2 group-hover:opacity-70 transition-opacity line-clamp-2"
                                  style={{ color: 'var(--theme-background)', fontFamily: 'var(--theme-font-heading)' }}
                                >
                                  {post.title}
                                </h3>
                                {postSubtitle && (
                                  <p
                                    className="text-sm mb-2 line-clamp-2"
                                    style={{ color: 'var(--theme-background)', opacity: 0.9, fontFamily: 'var(--theme-font-body)' }}
                                  >
                                    {postSubtitle}
                                  </p>
                                )}
                                <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--theme-background)', opacity: 0.8 }}>
                                  {postAuthor && (
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span>{postAuthor}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{postPublishedDate}</span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )
                        })}
                      </nav>
                    ) : (
                      <p
                        className="text-sm"
                        style={{ color: 'var(--theme-background)', opacity: 0.9, fontFamily: 'var(--theme-font-body)' }}
                      >
                        No other posts yet.
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
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