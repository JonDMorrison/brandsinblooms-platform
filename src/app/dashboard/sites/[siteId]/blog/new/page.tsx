'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getBlogPostById, createBlogPost, isSlugUnique } from '@/src/lib/blog/queries'
import { generateSlug, isValidSlug } from '@/src/lib/blog/types'
import { getDefaultSEO } from '@/src/lib/seo/types'
import { PageContent } from '@/src/lib/content/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SEOEditor } from '@/src/components/dashboard/blog/SEOEditor'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { VisualEditor } from '@/src/components/content-editor/visual/VisualEditor'
import { createDefaultBlogContent } from '@/src/lib/blog/defaults'

export default function NewBlogPostPage() {
    const params = useParams()
    const router = useRouter()
    const siteId = params.siteId as string

    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [slugEdited, setSlugEdited] = useState(false)
    const [content, setContent] = useState<PageContent>(createDefaultBlogContent())
    const [seo, setSeo] = useState(getDefaultSEO())

    function handleTitleChange(newTitle: string) {
        setTitle(newTitle)
        if (!slugEdited && newTitle) {
            setSlug(generateSlug(newTitle))
        }

        // Update blog header section title
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

            const slugUnique = await isSlugUnique(supabase, siteId, slug)
            if (!slugUnique) {
                toast.error('A post with this slug already exists')
                setSaving(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()

            const newPost = await createBlogPost(supabase, {
                site_id: siteId,
                title,
                slug,
                content,
                author_id: user?.id,
                status: publish ? 'published' : 'draft',
                meta_data: { seo, excerpt: seo.description }
            })

            toast.success(publish ? 'Post published!' : 'Draft saved!')
            router.push(`/dashboard/sites/${siteId}/blog/${newPost.id}`)
        } catch (error) {
            console.error('Error saving post:', error)
            toast.error('Failed to save post')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="container max-w-4xl py-8 space-y-6">
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
                    <h1 className="text-2xl font-bold">New Blog Post</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Draft
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Publish
                    </Button>
                </div>
            </div>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                    <CardDescription>Basic information about your blog post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
            </Card>

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

            <SEOEditor seo={seo} onChange={setSeo} title={title} />
        </div>
    )
}
