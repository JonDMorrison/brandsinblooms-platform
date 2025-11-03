/**
 * Clipboard utility with fallback support for non-secure contexts
 *
 * The Clipboard API requires a secure context (HTTPS or localhost).
 * This utility provides a fallback using the legacy execCommand API
 * for development environments using custom local domains over HTTP.
 */

interface ClipboardResult {
  success: boolean
  error?: string
}

/**
 * Copies text to clipboard with automatic fallback
 *
 * @param text - The text to copy to clipboard
 * @returns Promise resolving to success/error status
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  // Try modern Clipboard API first (requires secure context)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy'
      console.error('Clipboard API failed:', errorMessage)
      // Fall through to legacy method
    }
  }

  // Fallback to legacy execCommand method
  return copyToClipboardLegacy(text)
}

/**
 * Legacy clipboard copy using document.execCommand
 * Works in non-secure contexts (HTTP)
 *
 * @param text - The text to copy to clipboard
 * @returns Success/error status
 */
function copyToClipboardLegacy(text: string): ClipboardResult {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea')

  // Configure textarea to be invisible and non-interactive
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.width = '1px'
  textarea.style.height = '1px'
  textarea.style.padding = '0'
  textarea.style.border = 'none'
  textarea.style.outline = 'none'
  textarea.style.boxShadow = 'none'
  textarea.style.background = 'transparent'
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')

  try {
    // Add to DOM, select, and copy
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)

    const success = document.execCommand('copy')

    if (success) {
      return { success: true }
    } else {
      return {
        success: false,
        error: 'Copy command failed. Please copy manually.'
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Failed to copy: ${errorMessage}`
    }
  } finally {
    // Always clean up the temporary element
    document.body.removeChild(textarea)
  }
}

/**
 * Checks if the Clipboard API is available in the current context
 *
 * @returns True if modern Clipboard API is available
 */
export function isClipboardApiAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}
