import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { getBlogPostBySlug } from '@/src/lib/blog/queries'
import { generateBlogPostMetadata } from '@/src/lib/seo/metadata'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { UnifiedPagePreview } from '@/src/components/layout-previews/UnifiedPagePreview'

interface BlogPostPageProps {
    params: {
        domain: string
        slug: string
    }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const supabase = createClient()

    // Get site
    const site = await getSiteByDomain(supabase, params.domain)
    if (!site) {
        return { title: 'Post Not Found' }
    }

    // Get post
    const post = await getBlogPostBySlug(supabase, site.id, params.slug, true)
    if (!post) {
        return { title: 'Post Not Found' }
    }

    // Generate metadata
    return generateBlogPostMetadata(post)
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const supabase = createClient()

    // Get site
    const site = await getSiteByDomain(supabase, params.domain)
    if (!site) {
        notFound()
    }

    // Get post
    const post = await getBlogPostBySlug(supabase, site.id, params.slug, true)
    if (!post) {
        notFound()
    }

    return (
        <article className="min-h-screen">
            {/* Post Header */}
            <header className="container max-w-4xl py-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    {post.title}
                </h1>
                {post.published_at && (
                    <time className="text-muted-foreground" dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                )}
            </header>

            {/* Post Content */}
            <div className="container max-w-4xl pb-12">
                <UnifiedPagePreview
                    layout={post.content.layout || 'blog'}
                    content={post.content}
                    siteId={site.id}
                />
            </div>
        </article>
    )
}
