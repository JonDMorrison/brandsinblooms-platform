import Link from 'next/link'
import Image from 'next/image'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { getPublishedContent } from '@/src/lib/queries/domains/content'
import { createClient } from '@/src/lib/supabase/server'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import type { ContentWithTags } from '@/src/lib/queries/domains/content'

interface BlogPostMeta {
  excerpt?: string
  author?: string
  subtitle?: string
  featured_image?: string
  reading_time?: string
}

export async function BlogIndexPage() {
  const { siteId } = await getSiteHeaders()
  const supabase = await createClient()

  // Fetch all published blog posts
  const blogPosts = await getPublishedContent(supabase, siteId, 'blog_post')

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Blog Posts Layout */}
          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p
                className="text-lg text-gray-500"
                style={{ fontFamily: 'var(--theme-font-body)' }}
              >
                No blog posts published yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Latest Post - 2/3 width */}
              <div className="lg:col-span-2">
                {(() => {
                  const latestPost = blogPosts[0]
                  const meta = (latestPost.meta_data as BlogPostMeta) || {}

                  // Extract blog header data from JSONB structure
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
                  const contentData = latestPost.content
                  const blogHeaderData = (contentData as BlogHeaderSections)?.sections?.blogHeader?.data || {}

                  // Extract metadata from blogHeader section (preferred) or fallback to meta_data
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
                    : latestPost.published_at
                    ? new Date(latestPost.published_at).toLocaleDateString('en-US', {
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
                    const sections = (contentData as any).sections
                    if (sections && sections.content && sections.content.data) {
                      htmlContent = sections.content.data.content || ''
                    }
                  }

                  return (
                    <article className="flex flex-col">
                      {/* Featured Image - only if exists */}
                      {featuredImage && (
                        <div className="aspect-[16/9] w-full overflow-hidden rounded-lg relative mb-6">
                          <Image
                            src={featuredImage}
                            alt={latestPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <header className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          {latestPost.is_featured && (
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
                          {latestPost.title}
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
                  )
                })()}
              </div>

              {/* Past Posts List - 1/3 width */}
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
                    {blogPosts.length > 1 ? (
                      <nav className="space-y-6">
                        {blogPosts.slice(1).map((post: ContentWithTags) => {
                          // Extract blog header data for each past post
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
                          const postContentData = post.content
                          const postBlogHeaderData = (postContentData as BlogHeaderSections)?.sections?.blogHeader?.data || {}
                          const postMeta = (post.meta_data as BlogPostMeta) || {}

                          const postSubtitle = postBlogHeaderData.subtitle || postMeta.subtitle
                          const postAuthor = postBlogHeaderData.author || postMeta.author

                          const publishedDate = postBlogHeaderData.publishedDate
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
                                borderBottom: blogPosts.slice(1).indexOf(post) === blogPosts.slice(1).length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
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
                                    <span>{publishedDate}</span>
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
          )}

          {/* Pagination placeholder - can be added later if needed */}
          {blogPosts.length > 12 && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                Showing {Math.min(blogPosts.length, 12)} of {blogPosts.length} posts
              </p>
            </div>
          )}
        </div>
      </div>
    </SiteRenderer>
  )
}
