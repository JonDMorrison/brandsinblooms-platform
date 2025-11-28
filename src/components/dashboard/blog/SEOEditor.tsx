'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SEOMetadata } from '@/src/lib/seo/types'
import { AlertCircle } from 'lucide-react'

interface SEOEditorProps {
    seo: SEOMetadata
    onChange: (seo: SEOMetadata) => void
    title?: string  // Default title to show character count against
}

export function SEOEditor({ seo, onChange, title }: SEOEditorProps) {
    const seoTitle = seo.title || title || ''
    const seoDescription = seo.description || ''

    const titleLength = seoTitle.length
    const descriptionLength = seoDescription.length

    const titleWarning = titleLength > 60
    const descriptionWarning = descriptionLength > 160

    return (
        <Card>
            <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                    Optimize how this post appears in search engines and social media
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* SEO Title */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="seo-title">SEO Title</Label>
                        <span className={`text-sm ${titleWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {titleLength}/60
                        </span>
                    </div>
                    <Input
                        id="seo-title"
                        value={seo.title || ''}
                        onChange={(e) => onChange({ ...seo, title: e.target.value })}
                        placeholder={title || 'Enter SEO title'}
                        className={titleWarning ? 'border-destructive' : ''}
                    />
                    {titleWarning && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Title should be 60 characters or less for best results
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Defaults to post title if not set
                    </p>
                </div>

                {/* SEO Description */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="seo-description">SEO Description</Label>
                        <span className={`text-sm ${descriptionWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {descriptionLength}/160
                        </span>
                    </div>
                    <Textarea
                        id="seo-description"
                        value={seo.description || ''}
                        onChange={(e) => onChange({ ...seo, description: e.target.value })}
                        placeholder="Brief description of this post"
                        rows={3}
                        className={descriptionWarning ? 'border-destructive' : ''}
                    />
                    {descriptionWarning && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Description should be 160 characters or less for best results
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        This appears in search results and social media previews
                    </p>
                </div>

                {/* SEO Image */}
                <div className="space-y-2">
                    <Label htmlFor="seo-image">SEO Image URL</Label>
                    <Input
                        id="seo-image"
                        type="url"
                        value={seo.image || ''}
                        onChange={(e) => onChange({ ...seo, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-sm text-muted-foreground">
                        Recommended size: 1200x630px for social media
                    </p>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                    <Label htmlFor="seo-keywords">Keywords (comma-separated)</Label>
                    <Input
                        id="seo-keywords"
                        value={seo.keywords?.join(', ') || ''}
                        onChange={(e) => onChange({
                            ...seo,
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        })}
                        placeholder="keyword1, keyword2, keyword3"
                    />
                    <p className="text-sm text-muted-foreground">
                        Help search engines understand your content
                    </p>
                </div>

                {/* Preview */}
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Search Preview</h4>
                    <div className="space-y-1">
                        <div className="text-sm text-blue-600 hover:underline cursor-default">
                            {seoTitle || 'Your Post Title'}
                        </div>
                        <div className="text-xs text-green-700">
                            yoursite.com/blog/post-slug
                        </div>
                        <div className="text-sm text-gray-600">
                            {seoDescription || 'Your post description will appear here...'}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
