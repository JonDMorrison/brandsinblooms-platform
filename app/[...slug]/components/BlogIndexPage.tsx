import Link from 'next/link'
import Image from 'next/image'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { getPublishedContent } from '@/src/lib/queries/domains/content'
import { createClient } from '@/src/lib/supabase/server'
import { Calendar, User, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import type { ContentWithTags } from '@/src/lib/queries/domains/content'

interface BlogPostMeta {
  excerpt?: string
  author?: string
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
          {/* Header */}
          <div className="mb-12 text-center">
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
            >
              Blog
            </h1>
            <p
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              Stories, insights, and updates from our team
            </p>
          </div>

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

                  // Extract excerpt (first 300 chars from content or use meta excerpt)
                  const getExcerpt = () => {
                    if (meta.excerpt) return meta.excerpt
                    if (latestPost.content && typeof latestPost.content === 'string') {
                      const plainText = latestPost.content.replace(/<[^>]*>/g, '').trim()
                      return plainText.length > 300
                        ? plainText.substring(0, 300) + '...'
                        : plainText
                    }
                    return 'Read more...'
                  }

                  const excerpt = getExcerpt()
                  const postWithAuthor = latestPost as ContentWithTags & { author?: { full_name?: string } }
                  const author = postWithAuthor.author?.full_name || meta.author || 'Anonymous'
                  const publishedDate = latestPost.published_at
                    ? new Date(latestPost.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Recently'

                  // Use featured image or placeholder
                  const featuredImage = meta.featured_image || `https://picsum.photos/seed/${latestPost.id}/1200/675`

                  return (
                    <Card className="flex flex-col hover:shadow-xl transition-shadow duration-300">
                      {/* Large Featured Image */}
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-lg relative">
                        <Image
                          src={featuredImage}
                          alt={latestPost.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="default">Latest Post</Badge>
                          {latestPost.is_featured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                          {meta.reading_time && (
                            <span className="text-xs text-gray-500">
                              {meta.reading_time}
                            </span>
                          )}
                        </div>
                        <h2
                          className="text-3xl font-bold hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
                        >
                          <Link href={`/${latestPost.slug}`}>
                            {latestPost.title}
                          </Link>
                        </h2>
                      </CardHeader>

                      <CardContent className="flex-1">
                        {/* Full excerpt */}
                        <p
                          className="text-gray-600 mb-6 leading-relaxed"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {excerpt}
                        </p>

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
                      </CardContent>

                      <CardFooter>
                        <Link
                          href={`/${latestPost.slug}`}
                          className="flex items-center gap-2 font-medium text-lg hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          Read More
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </CardFooter>
                    </Card>
                  )
                })()}
              </div>

              {/* Past Posts List - 1/3 width */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <h3
                      className="text-xl font-bold"
                      style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
                    >
                      Past Posts
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {blogPosts.length > 1 ? (
                      <div className="space-y-4">
                        {blogPosts.slice(1).map((post: ContentWithTags) => {
                          const publishedDate = post.published_at
                            ? new Date(post.published_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recently'

                          return (
                            <div
                              key={post.id}
                              className="pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                            >
                              <Link
                                href={`/${post.slug}`}
                                className="group block"
                              >
                                <h4
                                  className="font-semibold mb-1 group-hover:opacity-70 transition-opacity line-clamp-2"
                                  style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
                                >
                                  {post.title}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>{publishedDate}</span>
                                </div>
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p
                        className="text-sm text-gray-500"
                        style={{ fontFamily: 'var(--theme-font-body)' }}
                      >
                        No other posts yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
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
