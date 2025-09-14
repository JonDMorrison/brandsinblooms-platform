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
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?p>/g, '')
    .trim()
}