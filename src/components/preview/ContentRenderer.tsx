import React from 'react'

interface ContentRendererProps {
  content: string
  className?: string
}

/**
 * ContentRenderer safely renders HTML content from the rich text editor
 * - Basic sanitization to prevent XSS attacks
 * - Supports basic formatting (bold, italic, lists, links, headings)
 * - Handles empty content gracefully
 */
export function ContentRenderer({ content, className = '' }: ContentRendererProps) {
  // Return null for empty content
  if (!content || content.trim() === '') {
    return null
  }

  // Check if content is HTML (contains tags) or plain text
  const isHTML = /<[^>]*>/g.test(content)

  if (!isHTML) {
    // Plain text content - render as-is
    return <span className={className}>{content}</span>
  }

  // For HTML content, apply basic sanitization
  let sanitizedContent: string
  
  try {
    // Basic sanitization - remove dangerous tags and attributes
    sanitizedContent = content
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove dangerous event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: links
      .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
      // Remove style attributes that could contain expressions
      .replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '')
      // Remove object, embed, iframe tags
      .replace(/<(object|embed|iframe|form|input|select|textarea|button)\b[^>]*>.*?<\/\1>/gi, '')
      // Remove standalone dangerous tags
      .replace(/<(object|embed|iframe|form|input|select|textarea|button)\b[^>]*\/?>/gi, '')
  } catch (error) {
    console.error('Content sanitization failed:', error)
    // Fallback to plain text if sanitization fails
    sanitizedContent = content.replace(/<[^>]*>/g, '')
  }

  // Don't render if sanitization removed everything
  if (!sanitizedContent || sanitizedContent.trim() === '') {
    return null
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}

/**
 * Helper function to extract plain text from HTML content
 * Useful for previews, meta descriptions, etc.
 */
export function extractPlainText(htmlContent: string, maxLength?: number): string {
  if (!htmlContent) return ''
  
  // Remove HTML tags
  const plainText = htmlContent.replace(/<[^>]*>/g, '').trim()
  
  if (maxLength && plainText.length > maxLength) {
    return plainText.substring(0, maxLength).trim() + '...'
  }
  
  return plainText
}

/**
 * Helper function to check if content has meaningful text
 * Excludes empty HTML tags and whitespace-only content
 */
export function hasContent(content: string): boolean {
  if (!content) return false
  
  // Remove HTML tags and check if there's meaningful text
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  return plainText.length > 0
}