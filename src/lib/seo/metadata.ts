/**
 * SEO metadata helpers for Next.js
 */

import { Metadata } from 'next'
import { SEOMetadata, ContentMetaData } from './types'
import { PageContent } from '@/src/lib/content/schema'

/**
 * Generate Next.js Metadata from SEO data
 */
export function generateMetadata(
    title: string,
    seo?: SEOMetadata,
    baseUrl?: string
): Metadata {
    const seoTitle = seo?.title || title
    const seoDescription = seo?.description
    const seoImage = seo?.image

    const metadata: Metadata = {
        title: seoTitle,
        description: seoDescription,
    }

    // OpenGraph
    if (seoTitle || seoDescription || seoImage) {
        metadata.openGraph = {
            title: seo?.ogTitle || seoTitle,
            description: seo?.ogDescription || seoDescription,
            type: seo?.ogType || 'website',
            images: seo?.ogImage || seoImage ? [{
                url: seo?.ogImage || seoImage || '',
                width: 1200,
                height: 630,
                alt: seo?.ogTitle || seoTitle
            }] : undefined
        }

        if (seo?.publishedTime) {
            metadata.openGraph.publishedTime = seo.publishedTime
        }

        if (seo?.modifiedTime) {
            metadata.openGraph.modifiedTime = seo.modifiedTime
        }

        if (seo?.author) {
            metadata.openGraph.authors = [seo.author]
        }

        if (seo?.section) {
            metadata.openGraph.section = seo.section
        }

        if (seo?.tags) {
            metadata.openGraph.tags = seo.tags
        }
    }

    // Twitter Card
    if (seoTitle || seoDescription || seoImage) {
        metadata.twitter = {
            card: seo?.twitterCard || 'summary_large_image',
            title: seo?.twitterTitle || seoTitle,
            description: seo?.twitterDescription || seoDescription,
            images: seo?.twitterImage || seoImage ? [seo?.twitterImage || seoImage || ''] : undefined
        }
    }

    // Keywords
    if (seo?.keywords && seo.keywords.length > 0) {
        metadata.keywords = seo.keywords
    }

    return metadata
}

/**
 * Generate blog post metadata
 */
export function generateBlogPostMetadata(
    post: {
        title: string
        content: PageContent
        published_at: string | null
        updated_at: string
        author_id: string | null
        meta_data: ContentMetaData | null
    },
    baseUrl?: string
): Metadata {
    const seo = post.meta_data?.seo
    const excerpt = post.meta_data?.excerpt
    const featuredImage = post.meta_data?.featuredImage

    // Use excerpt or extract from content for description
    const description = seo?.description || excerpt || extractExcerpt(post.content)

    const metadata = generateMetadata(post.title, {
        ...seo,
        description,
        image: seo?.image || featuredImage,
        ogType: 'article',
        publishedTime: post.published_at || undefined,
        modifiedTime: post.updated_at
    }, baseUrl)

    return metadata
}

/**
 * Extract excerpt from PageContent
 */
function extractExcerpt(content: PageContent, maxLength: number = 160): string {
    // Find first text section
    const textSection = content.sections?.find(s =>
        s.type === 'text' || s.type === 'richText' || s.type === 'hero'
    )

    if (!textSection?.data?.content) {
        return ''
    }

    // Remove HTML tags
    const text = textSection.data.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    // Truncate
    if (text.length <= maxLength) {
        return text
    }

    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    return lastSpace > 0
        ? truncated.substring(0, lastSpace) + '...'
        : truncated + '...'
}

/**
 * Generate blog index metadata
 */
export function generateBlogIndexMetadata(
    siteName: string,
    seo?: SEOMetadata,
    baseUrl?: string
): Metadata {
    const defaultTitle = `Blog - ${siteName}`
    const defaultDescription = `Read the latest posts from ${siteName}`

    return generateMetadata(defaultTitle, {
        title: seo?.title || defaultTitle,
        description: seo?.description || defaultDescription,
        ...seo
    }, baseUrl)
}
