/**
 * Visual feedback styles for interactive elements in the visual editor
 * Handles hover states, click feedback, editable indicators, and animations
 */

/**
 * Generate visual feedback CSS styles as a string for use in styled-jsx
 */
export function getVisualFeedbackStyles(): string {
  return `
    /* Preview mode interactive elements */
    .visual-editor-preview a,
    .visual-editor-preview button {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .visual-editor-preview a:hover,
    .visual-editor-preview button:hover {
      transform: translateY(-1px);
      opacity: 0.9;
    }
    
    .visual-editor-preview .preview-clicked {
      transform: scale(0.98);
      opacity: 0.8;
    }
    
    /* Visual indicators for editable content */
    .visual-editor-preview [data-editable="true"] {
      position: relative;
      cursor: text;
      transition: all 0.2s ease;
    }
    
    .visual-editor-preview [data-editable="true"]:hover {
      background-color: rgba(139, 92, 246, 0.05) !important;
      outline: 2px solid rgba(139, 92, 246, 0.2) !important;
      outline-offset: 2px !important;
    }
    
    .visual-editor-preview [data-editable="true"][data-editing="true"] {
      background-color: rgba(139, 92, 246, 0.1) !important;
      outline: 2px solid rgba(139, 92, 246, 0.5) !important;
      outline-offset: 2px !important;
    }
    
    /* Highlight animation */
    .visual-editor-preview .visual-editor-highlight {
      animation: highlight-flash 1s ease-out;
    }
    
    @keyframes highlight-flash {
      0% {
        background-color: rgba(139, 92, 246, 0.3);
      }
      100% {
        background-color: transparent;
      }
    }
    
    /* Section boundaries in visual mode */
    .visual-editor-preview [data-section] {
      position: relative;
    }
    
    .visual-editor-preview [data-section]::before {
      content: attr(data-section-label);
      position: absolute;
      top: -24px;
      left: 0;
      font-size: 10px;
      font-weight: 500;
      color: rgba(139, 92, 246, 0.7);
      background: rgba(139, 92, 246, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 10;
    }
    
    .visual-editor-preview [data-section]:hover::before {
      opacity: 1;
    }
  `
}

/**
 * CSS custom properties for consistent visual feedback colors
 */
export const VISUAL_FEEDBACK_COLORS = {
  primary: '139, 92, 246', // Purple RGB values
  primaryHex: '#8B5CF6',
  hover: 'rgba(139, 92, 246, 0.05)',
  hoverBorder: 'rgba(139, 92, 246, 0.2)',
  editing: 'rgba(139, 92, 246, 0.1)',
  editingBorder: 'rgba(139, 92, 246, 0.5)',
  highlight: 'rgba(139, 92, 246, 0.3)',
  sectionLabel: 'rgba(139, 92, 246, 0.7)',
  sectionBackground: 'rgba(139, 92, 246, 0.1)'
} as const

/**
 * Helper function to apply visual feedback classes to editable elements
 */
export function addVisualFeedbackClass(element: HTMLElement, className: string) {
  element.classList.add(className)
  // Auto-remove temporary classes after animation
  if (className === 'preview-clicked' || className === 'visual-editor-highlight') {
    setTimeout(() => {
      element.classList.remove(className)
    }, className === 'preview-clicked' ? 200 : 1000)
  }
}

/**
 * Helper function to check if an element is currently being edited
 */
export function isElementBeingEdited(element: HTMLElement): boolean {
  return element.getAttribute('data-editing') === 'true' ||
         element.closest('[data-editing="true"]') !== null ||
         element.closest('.ProseMirror') !== null ||
         element.closest('.inline-editor-wrapper') !== null
}