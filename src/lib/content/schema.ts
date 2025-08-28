/**
 * JSONB content schema definitions for the enhanced content editor
 * Supports versioned content structure with layout-specific sections
 */

import { Json } from '@/lib/database/types'

/**
 * Layout types supported by the content system
 */
export type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'

/**
 * Content section types for different layout components
 */
export type ContentSectionType = 
  | 'text' 
  | 'richText' 
  | 'image' 
  | 'icon' 
  | 'gallery' 
  | 'features'
  | 'hero'
  | 'cta'
  | 'testimonials'
  | 'form'
  | 'pricing'
  | 'team'
  | 'mission'
  | 'values'
  | 'specifications'

/**
 * Base content section interface
 */
export interface ContentSection {
  type: ContentSectionType
  data: ContentSectionData
  visible: boolean
  order?: number
  settings?: {
    [key: string]: Json
  }
}

/**
 * Data structure for content sections
 */
export interface ContentSectionData {
  // Text content
  content?: string // HTML for richText, plain text for text
  json?: Json      // Tiptap JSON format for richText
  
  // Media content
  url?: string     // For images/videos
  alt?: string     // For images
  caption?: string // For media captions
  
  // Icon content
  icon?: string    // Lucide icon name
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  iconColor?: string
  
  // Repeatable content (features, testimonials, team members, etc.)
  items?: Json // ContentItem[] typed as Json for database compatibility
  
  // Form-specific data
  fields?: Json // FormField[] typed as Json for database compatibility
  
  // Layout-specific settings
  columns?: number
  spacing?: 'tight' | 'normal' | 'loose'
  alignment?: 'left' | 'center' | 'right'
  
  // Additional custom data
  [key: string]: Json | undefined
}

/**
 * Individual content item for repeatable sections
 */
export interface ContentItem {
  id: string
  title?: string
  subtitle?: string
  content?: string
  image?: string
  icon?: string
  url?: string
  order?: number
  metadata?: {
    [key: string]: Json
  }
}

/**
 * Form field definition for contact/form layouts
 */
export interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select, checkbox, radio
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    message?: string
  }
  order?: number
}

/**
 * Main page content structure
 */
export interface PageContent {
  version: '1.0' // For future migrations
  layout: LayoutType
  sections: {
    [sectionKey: string]: ContentSection
  }
  settings?: {
    seo?: {
      title?: string
      description?: string
      keywords?: string[]
      ogImage?: string
    }
    layout?: {
      containerWidth?: 'narrow' | 'normal' | 'wide' | 'full'
      spacing?: 'tight' | 'normal' | 'loose'
      theme?: string
    }
    [key: string]: Json | undefined
  }
}

/**
 * Layout-specific section definitions
 * Maps each layout type to its required and optional sections
 */
export const LAYOUT_SECTIONS: Record<LayoutType, {
  required: string[]
  optional: string[]
  defaultSections: Record<string, Partial<ContentSection>>
}> = {
  landing: {
    required: ['hero'],
    optional: ['features', 'cta', 'testimonials'],
    defaultSections: {
      hero: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: true,
        order: 1
      },
      features: {
        type: 'features',
        data: {
          items: [],
          columns: 3
        },
        visible: true,
        order: 2
      },
      cta: {
        type: 'cta',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: true,
        order: 3
      },
      testimonials: {
        type: 'testimonials',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 4
      }
    }
  },
  blog: {
    required: ['header', 'content'],
    optional: ['author', 'related'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'left'
        },
        visible: true,
        order: 1
      },
      content: {
        type: 'richText',
        data: {
          content: '',
          json: null
        },
        visible: true,
        order: 2
      },
      author: {
        type: 'team',
        data: {
          items: []
        },
        visible: false,
        order: 3
      },
      related: {
        type: 'features',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 4
      }
    }
  },
  portfolio: {
    required: ['header', 'gallery'],
    optional: ['description', 'details'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: true,
        order: 1
      },
      gallery: {
        type: 'gallery',
        data: {
          items: [],
          columns: 3
        },
        visible: true,
        order: 2
      },
      description: {
        type: 'richText',
        data: {
          content: ''
        },
        visible: false,
        order: 3
      },
      details: {
        type: 'features',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 4
      }
    }
  },
  about: {
    required: ['hero'],
    optional: ['mission', 'team', 'values'],
    defaultSections: {
      hero: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: true,
        order: 1
      },
      mission: {
        type: 'mission',
        data: {
          content: ''
        },
        visible: false,
        order: 2
      },
      team: {
        type: 'team',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 3
      },
      values: {
        type: 'values',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 4
      }
    }
  },
  product: {
    required: ['header', 'features'],
    optional: ['pricing', 'specifications'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: true,
        order: 1
      },
      features: {
        type: 'features',
        data: {
          items: [],
          columns: 3
        },
        visible: true,
        order: 2
      },
      pricing: {
        type: 'pricing',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 3
      },
      specifications: {
        type: 'specifications',
        data: {
          items: []
        },
        visible: false,
        order: 4
      }
    }
  },
  contact: {
    required: ['header', 'form'],
    optional: ['info', 'map'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: true,
        order: 1
      },
      form: {
        type: 'form',
        data: {
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Name',
              required: true,
              order: 1
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email',
              required: true,
              order: 2
            },
            {
              id: 'message',
              type: 'textarea',
              label: 'Message',
              required: true,
              order: 3
            }
          ]
        },
        visible: true,
        order: 2
      },
      info: {
        type: 'text',
        data: {
          content: ''
        },
        visible: false,
        order: 3
      },
      map: {
        type: 'text', // Will be enhanced with map component later
        data: {
          content: ''
        },
        visible: false,
        order: 4
      }
    }
  },
  other: {
    required: [], // No required sections - complete flexibility
    optional: [
      'hero', 'text', 'richText', 'image', 'icon', 'gallery', 
      'features', 'cta', 'testimonials', 'form', 'pricing', 
      'team', 'mission', 'values', 'specifications'
    ],
    defaultSections: {
      hero: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: false,
        order: 1
      },
      text: {
        type: 'text',
        data: {
          content: ''
        },
        visible: false,
        order: 2
      },
      richText: {
        type: 'richText',
        data: {
          content: '',
          json: null
        },
        visible: false,
        order: 3
      },
      image: {
        type: 'image',
        data: {
          url: '',
          alt: '',
          caption: ''
        },
        visible: false,
        order: 4
      },
      icon: {
        type: 'icon',
        data: {
          icon: 'Star',
          iconSize: 'md'
        },
        visible: false,
        order: 5
      },
      gallery: {
        type: 'gallery',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 6
      },
      features: {
        type: 'features',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 7
      },
      cta: {
        type: 'cta',
        data: {
          content: '',
          alignment: 'center'
        },
        visible: false,
        order: 8
      },
      testimonials: {
        type: 'testimonials',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 9
      },
      form: {
        type: 'form',
        data: {
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Name',
              required: true,
              order: 1
            },
            {
              id: 'email',
              type: 'email',
              label: 'Email',
              required: true,
              order: 2
            },
            {
              id: 'message',
              type: 'textarea',
              label: 'Message',
              required: true,
              order: 3
            }
          ]
        },
        visible: false,
        order: 10
      },
      pricing: {
        type: 'pricing',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 11
      },
      team: {
        type: 'team',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 12
      },
      mission: {
        type: 'mission',
        data: {
          content: ''
        },
        visible: false,
        order: 13
      },
      values: {
        type: 'values',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 14
      },
      specifications: {
        type: 'specifications',
        data: {
          items: []
        },
        visible: false,
        order: 15
      }
    }
  }
}

/**
 * Legacy content structure for backward compatibility
 */
export interface LegacyContent {
  title?: string
  subtitle?: string
  content?: string
  [key: string]: Json | undefined
}

/**
 * Type guard to check if content is in new format
 */
export function isPageContent(content: unknown): content is PageContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'version' in content &&
    'layout' in content &&
    'sections' in content
  )
}

/**
 * Type guard to check if content is in legacy format
 */
export function isLegacyContent(content: unknown): content is LegacyContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    !('version' in content) &&
    ('title' in content || 'subtitle' in content || 'content' in content)
  )
}