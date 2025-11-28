/**
 * Default content helpers for blog posts
 */

import { PageContent } from '@/src/lib/content/schema'
import { createDefaultSection } from '@/src/lib/content/sections'

/**
 * Create default blog post content with initial sections
 */
export function createDefaultBlogContent(title: string = ''): PageContent {
    return {
        version: '2.0',
        layout: 'blog',
        sections: [
            {
                ...createDefaultSection('blogHeader'),
                data: {
                    title: title || 'Untitled Post',
                    subtitle: '',
                    alignment: 'left'
                }
            },
            {
                ...createDefaultSection('text'),
                data: {
                    content: '<p>Start writing your blog post...</p>'
                }
            }
        ],
        settings: {}
    }
}

/**
 * Create minimal blog content (just text section)
 */
export function createMinimalBlogContent(): PageContent {
    return {
        version: '2.0',
        layout: 'blog',
        sections: [
            {
                ...createDefaultSection('text'),
                data: {
                    content: '<p>Start writing...</p>'
                }
            }
        ],
        settings: {}
    }
}

/**
 * Ensure blog content has valid structure
 */
export function ensureValidBlogContent(content: any): PageContent {
    // If content is null or invalid, return default
    if (!content || typeof content !== 'object') {
        return createDefaultBlogContent()
    }

    // If content doesn't have sections array, create it
    if (!Array.isArray(content.sections)) {
        return {
            version: '2.0',
            layout: content.layout || 'blog',
            sections: [],
            settings: content.settings || {}
        }
    }

    // Content is valid
    return content as PageContent
}
