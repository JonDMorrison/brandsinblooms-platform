/**
 * Utility functions for converting between plain text and HTML
 * Used for rich text editing in content management
 */

/**
 * Convert plain text to HTML with paragraph and line break formatting
 * @param text - Plain text with newlines
 * @returns HTML string with <p> and <br> tags
 */
export const textToHtml = (text: string): string => {
  if (!text) return ''
  // Split on double newlines for paragraphs, single newlines become <br>
  return text
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/**
 * Convert HTML back to plain text with newlines
 * @param html - HTML string with <p> and <br> tags
 * @returns Plain text with newlines
 */
export const htmlToText = (html: string): string => {
  if (!html) return ''
  // Convert HTML back to plain text with newlines
  return html
    .replace(/<\/p>\s*<p[^>]*>/g, '\n\n') // Handle paragraph breaks (with attributes)
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?p[^>]*>/g, '') // Remove all paragraph tags (with or without attributes)
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .trim()
}

/**
 * Strip outer paragraph tags while keeping inline formatting (bold, italic, color, etc.)
 * Used for single-line fields like headlines and button text
 * @param html - HTML string that may contain <p> wrapper
 * @returns HTML string with outer <p> tags removed but inline formatting preserved
 */
export const stripParagraphTags = (html: string): string => {
  if (!html) return ''

  // If it's already plain text (no HTML tags), wrap in empty paragraph for consistency
  if (!html.includes('<')) {
    return html
  }

  // Remove outer <p> tags and their classes/attributes, but keep inline tags
  // Match: <p ...>content</p> and extract just the content
  const match = html.match(/^<p[^>]*>(.*)<\/p>$/s)
  if (match) {
    return match[1].trim()
  }

  // If no outer <p> found, return as-is (already inline HTML or plain text)
  return html
}