/**
 * Viewport-specific CSS overrides for visual editor preview modes
 * Extracted from VisualEditor.tsx for better organization and reusability
 */

export type ViewportMode = 'mobile' | 'tablet' | 'desktop'

/**
 * Generate viewport-specific CSS styles as a string for use in styled-jsx
 */
export function getViewportStyles(mode: ViewportMode): string {
  const baseStyles = `
    .visual-editor-container {
      position: relative;
      overflow: hidden;
      height: 100%;
      width: 100%;
    }
    
    .visual-editor-preview {
      position: relative;
      overflow-y: auto;
      height: 100%;
      width: 100%;
    }
  `

  switch (mode) {
    case 'mobile':
      return baseStyles + getMobileViewportStyles()
    case 'tablet':
      return baseStyles + getTabletViewportStyles()
    default:
      return baseStyles + getDesktopViewportStyles()
  }
}

/**
 * Mobile viewport specific overrides
 */
function getMobileViewportStyles(): string {
  return `
    /* Mobile Typography Overrides */
    .visual-editor-preview.preview-mobile-viewport :global(.text-4xl) {
      font-size: 2.25rem !important;
    }

    .visual-editor-preview.preview-mobile-viewport :global(.md\\:text-6xl) {
      font-size: 2.25rem !important;
    }

    .visual-editor-preview.preview-mobile-viewport :global(.text-xl) {
      font-size: 1rem !important;
    }

    .visual-editor-preview.preview-mobile-viewport :global(.md\\:text-2xl) {
      font-size: 1rem !important;
    }
    
    /* Mobile Grid Overrides */
    .visual-editor-preview.preview-mobile-viewport :global(.grid-cols-2) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    .visual-editor-preview.preview-mobile-viewport :global(.md\\:grid-cols-4) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    /* Featured section grid overrides for mobile */
    .visual-editor-preview.preview-mobile-viewport :global(.md\\:grid-cols-2) {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
    }
    
    .visual-editor-preview.preview-mobile-viewport :global(.lg\\:grid-cols-4) {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
    }
    
    /* Override all grid layouts in mobile viewport */
    .visual-editor-preview.preview-mobile-viewport :global(.grid[class*="grid-cols"]) {
      grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
    }
    
    /* Mobile Flexbox Overrides */
    .visual-editor-preview.preview-mobile-viewport :global(.flex-col) {
      flex-direction: column !important;
    }
    
    .visual-editor-preview.preview-mobile-viewport :global(.sm\\:flex-row) {
      flex-direction: column !important;
    }
    
    /* Mobile Spacing Overrides */
    .visual-editor-preview.preview-mobile-viewport :global(.py-20) {
      padding-top: 3rem !important;
      padding-bottom: 3rem !important;
    }
    
    .visual-editor-preview.preview-mobile-viewport :global(.lg\\:py-32) {
      padding-top: 3rem !important;
      padding-bottom: 3rem !important;
    }
  `
}

/**
 * Tablet viewport specific overrides
 */
function getTabletViewportStyles(): string {
  return `
    /* Tablet Typography Overrides */
    .visual-editor-preview.preview-tablet-viewport :global(.text-4xl) {
      font-size: 2.25rem !important;
    }

    .visual-editor-preview.preview-tablet-viewport :global(.md\\:text-6xl) {
      font-size: 3rem !important;
    }

    .visual-editor-preview.preview-tablet-viewport :global(.text-xl) {
      font-size: 1.125rem !important;
    }

    .visual-editor-preview.preview-tablet-viewport :global(.md\\:text-2xl) {
      font-size: 1.5rem !important;
    }
    
    /* Tablet Grid Overrides */
    .visual-editor-preview.preview-tablet-viewport :global(.grid-cols-2) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    .visual-editor-preview.preview-tablet-viewport :global(.md\\:grid-cols-4) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    /* Featured section grid overrides for tablet */
    .visual-editor-preview.preview-tablet-viewport :global(.md\\:grid-cols-2) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    .visual-editor-preview.preview-tablet-viewport :global(.lg\\:grid-cols-4) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    /* Override all responsive grid layouts in tablet viewport */
    .visual-editor-preview.preview-tablet-viewport :global(.grid[class*="lg:grid-cols"]) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    /* Tablet Flexbox Overrides */
    .visual-editor-preview.preview-tablet-viewport :global(.flex-col) {
      flex-direction: column !important;
    }
    
    .visual-editor-preview.preview-tablet-viewport :global(.sm\\:flex-row) {
      flex-direction: row !important;
    }
    
    /* Tablet Spacing Overrides */
    .visual-editor-preview.preview-tablet-viewport :global(.py-20) {
      padding-top: 5rem !important;
      padding-bottom: 5rem !important;
    }
    
    .visual-editor-preview.preview-tablet-viewport :global(.lg\\:py-32) {
      padding-top: 5rem !important;
      padding-bottom: 5rem !important;
    }
  `
}

/**
 * Desktop viewport specific overrides (minimal)
 */
function getDesktopViewportStyles(): string {
  return `
    /* Desktop viewport uses default responsive behavior */
  `
}

/**
 * Get viewport-specific CSS class names
 */
export function getViewportClassName(mode: ViewportMode): string {
  switch (mode) {
    case 'mobile':
      return 'preview-mobile-viewport'
    case 'tablet':
      return 'preview-tablet-viewport'
    default:
      return 'preview-desktop-viewport'
  }
}