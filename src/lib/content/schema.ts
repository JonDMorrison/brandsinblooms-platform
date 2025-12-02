/**
 * JSONB content schema definitions for the enhanced content editor
 * Supports versioned content structure with layout-specific sections
 */

import { Json } from '@/src/lib/database/types'

/**
 * Layout types supported by the content system
 */
export type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other' | 'plant_shop' | 'plant_care' | 'plant_catalog'

/**
 * Content section types for different layout components
 */
import { ContentSection, SectionType, ButtonStyleVariant } from './sections'

export type { ContentSection, SectionType }

/**
 * Data structure for content sections
 */
export interface ContentSectionData {
  // Text content
  content?: string // HTML for richText, plain text for text
  json?: Json      // Tiptap JSON format for richText
  headline?: string     // Main heading text (hero, header)
  subheadline?: string  // Secondary heading text (hero, header)
  title?: string        // Title text (features, blog, etc.)
  subtitle?: string     // Subtitle text
  description?: string  // Description text

  /**
   * Text color customization (hex format like "#FF5733")
   * If undefined, component uses theme's default text color
   */
  headlineColor?: string
  subheadlineColor?: string
  titleColor?: string
  subtitleColor?: string
  descriptionColor?: string
  textColor?: string  // For generic text content
  ctaTextColor?: string  // For CTA button text specifically

  // Media content
  url?: string     // For images/videos
  alt?: string     // For images
  caption?: string // For media captions

  // Icon content
  icon?: string    // Lucide icon name
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  iconColor?: string

  // Button/CTA styling
  ctaStyle?: ButtonStyleVariant       // Primary button style variant
  secondaryCtaStyle?: ButtonStyleVariant  // Secondary button style variant

  // Repeatable content (features, testimonials, team members, etc.)
  items?: Json // ContentItem[] typed as Json for database compatibility

  // Form-specific data
  fields?: Json // FormField[] typed as Json for database compatibility

  // Layout-specific settings
  columns?: number
  spacing?: 'tight' | 'normal' | 'loose'
  alignment?: 'left' | 'center' | 'right'

  // Plant-specific data
  careLevel?: 'easy' | 'medium' | 'challenging'
  lightRequirement?: 'low' | 'medium' | 'bright' | 'direct'
  wateringFrequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'seasonal'
  seasonalTips?: Json // SeasonalTip[] typed as Json
  growingConditions?: Json // GrowingCondition[] typed as Json
  plantCategories?: Json // PlantCategory[] typed as Json

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
 * Plant-specific data structures
 */
export interface PlantItem extends ContentItem {
  scientificName?: string
  commonName?: string
  careLevel?: 'easy' | 'medium' | 'challenging'
  lightRequirement?: 'low' | 'medium' | 'bright' | 'direct'
  wateringFrequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'seasonal'
  soilType?: string
  maxHeight?: string
  bloomTime?: string
  plantType?: 'houseplant' | 'outdoor' | 'succulent' | 'herb' | 'tree' | 'shrub'
  toxicity?: 'pet-safe' | 'toxic-pets' | 'toxic-humans' | 'non-toxic'
}

export interface SeasonalTip {
  id: string
  season: 'spring' | 'summer' | 'fall' | 'winter'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

export interface GrowingCondition {
  id: string
  condition: string
  value: string
  description?: string
  icon?: string
}

export interface PlantCategory {
  id: string
  name: string
  description?: string
  icon?: string
  plantCount?: number
}

/**
 * Featured item for featured sections
 */
export interface FeaturedItem {
  id: string
  title: string
  tag: string
  image: string
  link: string
  s3Key?: string
}

/**
 * Featured section data structure
 * Supports both manual featured items and dynamic products from database
 */
export interface FeaturedData {
  headline: string
  subheadline: string
  viewAllText: string
  viewAllLink: string
  featuredItems: FeaturedItem[]

  // Database product integration
  useProductDatabase?: boolean  // If true, pull featured products from database
  productLimit?: number          // Number of products to display (1-4, default: 4)
}

/**
 * Default featured items for new featured sections
 * Used as fallback when no featured items exist in database
 */
export const DEFAULT_FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: 'featured-1',
    title: 'Golden Pothos',
    tag: 'houseplants',
    image: '/images/golden-pothos.jpg',
    link: '/plants/golden-pothos'
  },
  {
    id: 'featured-2',
    title: 'Snake Plant',
    tag: 'easy care',
    image: '/images/snake-plant.jpg',
    link: '/plants/snake-plant'
  },
  {
    id: 'featured-3',
    title: 'Monstera Deliciosa',
    tag: 'trending',
    image: '/images/fiddle-leaf-fig.jpg',
    link: '/plants/monstera'
  },
  {
    id: 'featured-4',
    title: 'Japanese Maple',
    tag: 'outdoor',
    image: '/images/japanese-maple.jpg',
    link: '/plants/japanese-maple'
  }
]

/**
 * Simplified SEO metadata for pages
 */
export interface SEOSettings {
  title?: string
  description?: string
  keywords?: string[]
}

/**
 * Main page content structure
 */
export interface PageContent {
  version: string
  layout: LayoutType
  sections: Record<string, ContentSection>
  settings?: {
    seo?: SEOSettings
    layout?: {
      containerWidth?: 'narrow' | 'normal' | 'wide' | 'full'
      spacing?: 'tight' | 'normal' | 'loose'
      theme?: string
    }
    [key: string]: any
  }
}

/**
 * Layout-specific section definitions
 * Maps each layout type to its initial sections
 */
export const LAYOUT_SECTIONS: Record<LayoutType, {
  initialSections: Partial<ContentSection>[]
  required: string[]
  optional: string[]
}> = {
  landing: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: {
          headline: 'Welcome to Our Site',
          subheadline: 'We help you grow your business',
          alignment: 'center',
          ctaText: 'Get Started',
          ctaLink: '#',
          ctaStyle: 'primary'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true
      },
      {
        type: 'featured',
        data: {
          headline: 'Featured Items',
          items: []
        },
        visible: false
      },
      {
        type: 'categories',
        data: {
          headline: 'Shop By Category',
          items: []
        },
        visible: false
      },
      {
        type: 'featuresGrid',
        data: {
          headline: 'Our Features',
          items: [
            { title: 'Feature 1', description: 'Description 1', icon: 'Star' },
            { title: 'Feature 2', description: 'Description 2', icon: 'Zap' },
            { title: 'Feature 3', description: 'Description 3', icon: 'Shield' }
          ]
        },
        visible: true,
        settings: {
          backgroundColor: 'default'
        }
      },
      {
        type: 'callToAction',
        data: {
          headline: 'Ready to get started?',
          subheadline: 'Join us today',
          ctaText: 'Sign Up',
          ctaLink: '/signup',
          ctaStyle: 'primary'
        },
        visible: true,
        settings: {
          backgroundColor: 'primary'
        }
      },
      {
        type: 'text',
        data: {
          content: '<p>Welcome to our site. We provide top-notch services.</p>'
        },
        visible: true
      }
    ]
  },
  blog: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'blogHeader',
        data: {
          title: 'Blog Post Title',
          subtitle: 'Subtitle',
          author: 'Author',
          publishedDate: new Date().toISOString().split('T')[0]
        },
        settings: {
          backgroundColor: 'default'
        },
        visible: true
      },
      {
        type: 'text',
        data: {
          content: '<p>Write your blog post content here...</p>'
        },
        visible: true
      },
      {
        type: 'blogList',
        data: {
          limit: 3,
          showImage: true
        },
        visible: false
      }
    ]
  },
  portfolio: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: {
          headline: 'Our Portfolio',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true
      },
      {
        type: 'gallery',
        data: {
          images: [],
          columns: 3
        },
        visible: true
      },
      {
        type: 'text',
        data: {
          content: '<p>Description of our work.</p>'
        },
        visible: false
      }
    ]
  },
  about: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'header',
        data: {
          headline: 'About Us',
          subheadline: 'Our story and mission'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true
      },
      {
        type: 'featuresGrid',
        data: {
          headline: 'Our Values',
          items: [
            { title: 'Value 1', description: 'Description', icon: 'Heart' },
            { title: 'Value 2', description: 'Description', icon: 'Star' }
          ]
        },
        visible: false
      },
      {
        type: 'text',
        data: {
          content: '<p>Our story...</p>'
        },
        visible: true
      },
      {
        type: 'callToAction',
        data: {
          headline: 'Work With Us',
          ctaText: 'Contact',
          ctaLink: '/contact'
        },
        visible: false,
        settings: {
          backgroundColor: 'primary'
        }
      }
    ]
  },
  product: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: {
          headline: 'Product Name',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true
      },
      {
        type: 'featuresGrid',
        data: {
          headline: 'Features',
          items: []
        },
        visible: true
      },
      {
        type: 'pricing',
        data: {
          headline: 'Pricing',
          items: []
        },
        visible: false
      }
    ]
  },
  contact: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'header',
        data: {
          headline: 'Contact Us',
          subheadline: 'Get in touch'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true
      },
      {
        type: 'businessInfo',
        data: {
          headline: 'Contact Info',
          address: '123 Main St',
          phone: '(555) 123-4567',
          email: 'info@example.com'
        },
        visible: false
      },
      {
        type: 'form',
        data: {
          headline: 'Send us a message',
          fields: []
        },
        visible: true
      },
      {
        type: 'faq',
        data: {
          headline: 'FAQ',
          items: []
        },
        visible: false,
        settings: {
          backgroundColor: 'alternate'
        }
      }
    ]
  },
  other: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: {
          headline: 'Page Title',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true
      },
      {
        type: 'text',
        data: {
          content: '<p>Content goes here...</p>'
        },
        visible: true
      }
    ]
  },
  // Plant-specific layouts (mapped to generic or kept if needed)
  plant_shop: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: { headline: 'Plant Shop', alignment: 'center' },
        settings: { backgroundColor: 'gradient' },
        visible: true
      },
      {
        type: 'plant_grid',
        data: {},
        visible: true
      }
    ]
  },
  plant_care: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: { headline: 'Plant Care', alignment: 'center' },
        settings: { backgroundColor: 'gradient' },
        visible: true
      },
      {
        type: 'plant_care_guide',
        data: {},
        visible: true
      }
    ]
  },
  plant_catalog: {
    required: [],
    optional: [],
    initialSections: [
      {
        type: 'hero',
        data: { headline: 'Catalog', alignment: 'center' },
        settings: { backgroundColor: 'gradient' },
        visible: true
      },
      {
        type: 'plant_grid',
        data: {},
        visible: true
      }
    ]
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