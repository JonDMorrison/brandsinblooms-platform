'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getBlogPostById, createBlogPost, updateBlogPost, isSlugUnique } from '@/src/lib/blog/queries'
import { BlogPost, generateSlug, isValidSlug } from '@/src/lib/blog/types'
import { getDefaultTheme } from '@/src/lib/queries/domains/theme'
import { getDefaultSEO } from '@/src/lib/seo/types'
import { PageContent } from '@/src/lib/content/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SEOEditor } from '@/src/components/dashboard/blog/SEOEditor'
import { Loader2, Save, Eye, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { VisualEditor } from '@/src/components/content-editor/visual/VisualEditor'
import { createDefaultBlogContent, ensureValidBlogContent } from '@/src/lib/blog/defaults'

export default function BlogEditorPage() {
    const params = useParams()
    const router = useRouter()
    const siteId = params.siteId as string
    const postId = params.contentId as string | undefined
    const isNew = !postId

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [post, setPost] = useState<Partial<BlogPost> | null>(null)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [slugEdited, setSlugEdited] = useState(false)
    const [isPublished, setIsPublished] = useState(false)
    const [content, setContent] = useState<PageContent>(createDefaultBlogContent())
    const [seo, setSeo] = useState(getDefaultSEO())

    // Load existing post
    useEffect(() => {
        if (!isNew && postId) {
            loadPost()
        }
    }, [postId, isNew])

    async function loadPost() {
        try {
            const supabase = createClient()
            const postData = await getBlogPostById(supabase, postId!)

            if (!postData) {
                toast.error('Post not found')
                router.push(`/dashboard/sites/${siteId}/blog`)
                return
            }

            setPost(postData)
            setTitle(postData.title)
            setSlug(postData.slug)
            setSlugEdited(true)
            setIsPublished(postData.status === 'published')
            setContent(ensureValidBlogContent(postData.content))
            setSeo(postData.meta_data?.seo || getDefaultSEO())
        } catch (error) {
            console.error('Error loading post:', error)
            toast.error('Failed to load post')
        } finally {
            setLoading(false)
        }
    }

    // Auto-generate slug from title
    function handleTitleChange(newTitle: string) {
        setTitle(newTitle)

        if (!slugEdited && newTitle) {
            setSlug(generateSlug(newTitle))
        }

        // Update hero section title
        setContent(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.type === 'blogHeader' || s.type === 'hero'
                    ? { ...s, data: { ...s.data, title: newTitle } }
                    : s
            )
        }))
    }

    function handleSlugChange(newSlug: string) {
        setSlug(newSlug)
        setSlugEdited(true)
    }

    async function handleSave(publish: boolean = false) {
        // Validation
        if (!title.trim()) {
            toast.error('Title is required')
            return
        }

        if (!slug.trim()) {
            toast.error('Slug is required')
            return
        }

        if (!isValidSlug(slug)) {
            toast.error('Slug can only contain lowercase letters, numbers, and hyphens')
            return
        }

        setSaving(true)

        try {
            const supabase = createClient()

            // Check slug uniqueness
            const slugUnique = await isSlugUnique(supabase, siteId, slug, postId)
            if (!slugUnique) {
                toast.error('A post with this slug already exists')
                setSaving(false)
                return
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            const metaData = {
                seo,
                excerpt: seo.description
            }

            if (isNew) {
                // Create new post
                const newPost = await createBlogPost(supabase, {
                    site_id: siteId,
                    title,
                    slug,
                    content,
                    author_id: user?.id,
                    status: publish ? 'published' : 'draft',
                    meta_data: metaData
                })

                toast.success(publish ? 'Post published!' : 'Draft saved!')
                router.push(`/dashboard/sites/${siteId}/blog/${newPost.id}`)
            } else {
                // Update existing post
                await updateBlogPost(supabase, postId!, {
                    title,
                    slug,
                    content,
                    status: publish ? 'published' : 'draft',
                    meta_data: metaData
                })

                setIsPublished(publish)
                toast.success(publish ? 'Post published!' : 'Changes saved!')
            }
        } catch (error) {
            console.error('Error saving post:', error)
            toast.error('Failed to save post')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/sites/${siteId}/blog`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isNew ? 'New Blog Post' : 'Edit Post'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Eye className="h-4 w-4 mr-2" />
                        )}
                        {isPublished ? 'Update' : 'Publish'}
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Post Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                    <CardDescription>Basic information about your blog post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Enter post title"
                            className="text-lg"
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug *</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">/blog/</span>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                placeholder="post-url-slug"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Lowercase letters, numbers, and hyphens only
                        </p>
                    </div>

                    {/* Published Status */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Published</Label>
                            <p className="text-sm text-muted-foreground">
                                Make this post visible on your public site
                            </p>
                        </div>
                        <Switch
                            checked={isPublished}
                            onCheckedChange={setIsPublished}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SEO Settings */}
            <SEOEditor seo={seo} onChange={setSeo} title={title} />

            {/* Content Editor */}
            <Card>
                <CardHeader>
                    <CardTitle>Content</CardTitle>
                    <CardDescription>
                        Edit your blog post content using the visual editor
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VisualEditor
                        content={content}
                        layout="blog"
                        title={title}
                        onContentChange={setContent}
                        viewport="desktop"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
