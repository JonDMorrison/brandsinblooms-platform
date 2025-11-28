/**
 * SEO metadata types
 * Used for search engine optimization and social media sharing
 */

export interface SEOMetadata {
    // Basic SEO
    title?: string          // Page title (max 60 chars recommended)
    description?: string    // Meta description (max 160 chars recommended)
    keywords?: string[]     // SEO keywords
    image?: string          // Default OG image

    // OpenGraph (Facebook, LinkedIn, etc.)
    ogTitle?: string        // Defaults to title
    ogDescription?: string  // Defaults to description
    ogImage?: string        // Defaults to image
    ogType?: 'website' | 'article' | 'product'

    // Twitter Card
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
    twitterTitle?: string   // Defaults to title
    twitterDescription?: string  // Defaults to description
    twitterImage?: string   // Defaults to image

    // Article-specific (for blog posts)
    publishedTime?: string
    modifiedTime?: string
    author?: string
    section?: string        // Article section/category
    tags?: string[]
}

/**
 * Content metadata stored in content.meta_data JSONB
 */
export interface ContentMetaData {
    seo?: SEOMetadata
    excerpt?: string        // Short excerpt for listings
    featuredImage?: string  // Featured image URL
    category?: string       // Content category
    tags?: string[]         // Content tags
    [key: string]: any      // Allow additional metadata
}

/**
 * Get default SEO metadata
 */
export function getDefaultSEO(): SEOMetadata {
    return {
        ogType: 'website',
        twitterCard: 'summary_large_image'
    }
}

/**
 * Merge SEO metadata with defaults
 */
export function mergeSEOWithDefaults(seo?: SEOMetadata): SEOMetadata {
    return {
        ...getDefaultSEO(),
        ...seo
    }
}

/**
 * Validate SEO metadata
 */
export function validateSEO(seo: SEOMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (seo.title && seo.title.length > 60) {
        errors.push('SEO title should be 60 characters or less')
    }

    if (seo.description && seo.description.length > 160) {
        errors.push('SEO description should be 160 characters or less')
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

/**
 * Extract text from HTML content for SEO description
 */
export function extractTextForSEO(html: string, maxLength: number = 160): string {
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, ' ')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim()

    // Truncate to max length
    if (text.length <= maxLength) {
        return text
    }

    // Truncate at word boundary
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    return lastSpace > 0
        ? truncated.substring(0, lastSpace) + '...'
        : truncated + '...'
}
