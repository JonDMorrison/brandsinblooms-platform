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

          {/* Blog Posts Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post: ContentWithTags) => {
                const meta = (post.meta_data as BlogPostMeta) || {}
                const excerpt = meta.excerpt || 'Read more...'
                const postWithAuthor = post as ContentWithTags & { author?: { full_name?: string } }
                const author = postWithAuthor.author?.full_name || meta.author || 'Anonymous'
                const publishedDate = post.published_at
                  ? new Date(post.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Recently'

                return (
                  <Card
                    key={post.id}
                    className="flex flex-col hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Featured Image */}
                    {meta.featured_image && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg relative">
                        <Image
                          src={meta.featured_image}
                          alt={post.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center gap-2 mb-3">
                        {post.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {meta.reading_time && (
                          <span className="text-xs text-gray-500">
                            {meta.reading_time}
                          </span>
                        )}
                      </div>
                      <h2
                        className="text-2xl font-bold line-clamp-2 hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
                      >
                        <Link href={`/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <p
                        className="text-gray-600 line-clamp-3 mb-4"
                        style={{ fontFamily: 'var(--theme-font-body)' }}
                      >
                        {excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{publishedDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{author}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Link
                        href={`/${post.slug}`}
                        className="flex items-center gap-2 font-medium hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--theme-primary)' }}
                      >
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
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
