import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { getBlogPosts } from '@/src/lib/blog/queries'
import { generateBlogIndexMetadata } from '@/src/lib/seo/metadata'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, ArrowRight } from 'lucide-react'

interface BlogIndexPageProps {
    params: {
        domain: string
    }
}

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
    const supabase = createClient()

    // Get site
    const site = await getSiteByDomain(supabase, params.domain)
    if (!site) {
        return { title: 'Blog' }
    }

    return generateBlogIndexMetadata(site.name || 'Blog')
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
    const supabase = createClient()

    // Get site
    const site = await getSiteByDomain(supabase, params.domain)
    if (!site) {
        return <div>Site not found</div>
    }

    // Get published posts
    const posts = await getBlogPosts(
        supabase,
        site.id,
        { status: 'published' },
        { limit: 20, orderBy: 'published_at', orderDirection: 'desc' }
    )

    return (
        <div className="min-h-screen">
            {/* Blog Header */}
            <header className="bg-gradient-to-b from-muted/50 to-background py-16">
                <div className="container max-w-4xl">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Blog</h1>
                    <p className="text-xl text-muted-foreground">
                        Latest posts and updates from {site.name}
                    </p>
                </div>
            </header>

            {/* Blog Posts */}
            <div className="container max-w-4xl py-12">
                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {posts.map((post) => {
                            const excerpt = post.meta_data?.excerpt || post.meta_data?.seo?.description
                            const featuredImage = post.meta_data?.featuredImage
                            const category = post.meta_data?.category

                            return (
                                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <Link href={`/blog/${post.slug}`}>
                                        {featuredImage && (
                                            <div className="aspect-video w-full overflow-hidden bg-muted">
                                                <img
                                                    src={featuredImage}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}
                                        <CardHeader>
                                            <div className="flex items-center gap-2 mb-2">
                                                {category && (
                                                    <Badge variant="secondary">{category}</Badge>
                                                )}
                                                {post.published_at && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {new Date(post.published_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <CardTitle className="text-2xl hover:text-primary transition-colors">
                                                {post.title}
                                            </CardTitle>
                                            {excerpt && (
                                                <CardDescription className="text-base line-clamp-2">
                                                    {excerpt}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center text-sm font-medium text-primary">
                                                Read more
                                                <ArrowRight className="ml-1 h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Link>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
