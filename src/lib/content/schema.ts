/**
 * JSONB content schema definitions for the enhanced content editor
 * Supports versioned content structure with layout-specific sections
 */

import { Json } from '@/lib/database/types'

/**
 * Layout types supported by the content system
 */
export type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other' | 'plant_shop' | 'plant_care' | 'plant_catalog'

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
  | 'featured'
  | 'categories'
  | 'hero'
  | 'header' // Simplified hero - title + subtitle only
  | 'cta'
  | 'testimonials'
  | 'form'
  | 'pricing'
  | 'team'
  | 'mission'
  | 'values'
  | 'specifications'
  | 'businessInfo' // Business information section
  | 'faq' // FAQ section
  // Plant shop specific section types
  | 'plant_showcase'
  | 'plant_grid'
  | 'plant_care_guide'
  | 'seasonal_tips'
  | 'plant_categories'
  | 'growing_conditions'
  | 'plant_comparison'
  | 'care_calendar'
  | 'plant_benefits'
  | 'soil_guide'

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
  version: '1.0' // For future migrations
  layout: LayoutType
  sections: {
    [sectionKey: string]: ContentSection
  }
  settings?: {
    seo?: SEOSettings
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
    optional: ['featured', 'categories', 'features', 'richText', 'cta'],
    defaultSections: {
      hero: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true,
        order: 1
      },
      featured: {
        type: 'featured',
        data: {
          headline: 'Featured Plants This Season',
          subheadline: 'Handpicked selections from our master horticulturists',
          viewAllText: 'View All Plants',
          viewAllLink: '/plants',
          featuredItems: DEFAULT_FEATURED_ITEMS
        },
        visible: false,
        order: 2
      },
      categories: {
        type: 'categories',
        data: {
          headline: 'Shop By Category',
          description: 'Find Your Perfect Plant Match',
          categories: [
            {
              id: 'beginner-friendly',
              name: 'Beginner-Friendly',
              image: '/images/golden-pothos.jpg',
              link: '/plants?care-level=beginner',
              plantCount: 12,
              description: 'Perfect for new plant parents - low maintenance, forgiving varieties'
            },
            {
              id: 'houseplants',
              name: 'Houseplants',
              image: '/images/snake-plant.jpg',
              link: '/plants?category=houseplants',
              plantCount: 25,
              description: 'Transform indoor spaces with air-purifying and decorative plants'
            },
            {
              id: 'outdoor',
              name: 'Outdoor Specimens',
              image: '/images/japanese-maple.jpg',
              link: '/plants?category=outdoor',
              plantCount: 18,
              description: 'Hardy outdoor plants for landscaping and garden design'
            },
            {
              id: 'succulents',
              name: 'Succulents & Cacti',
              image: '/images/fiddle-leaf-fig.jpg',
              link: '/plants?category=succulents',
              plantCount: 15,
              description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping'
            }
          ]
        },
        visible: false,
        order: 3
      },
      features: {
        type: 'features',
        data: {
          headline: 'Essential Plant Care Features',
          description: 'Master these key practices for healthy, thriving plants year-round',
          features: [
            'Reduce watering frequency as growth slows',
            'Move tender plants indoors before first frost',
            'Apply winter protection to marginally hardy plants'
          ]
        },
        visible: true,
        order: 4,
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        data: {
          headline: 'Growing Together, Sustainably',
          description: 'Our mission is to help you create thriving plant sanctuaries while protecting our planet. Every plant comes with expert care guidance, sustainable growing practices, and our commitment to your plant parenthood success.',
          ctaText: 'Shop Plants',
          ctaLink: '/',
          secondaryCtaText: 'Browse Plants',
          secondaryCtaLink: '/'
        },
        visible: true,
        order: 5,
        settings: {
          backgroundColor: 'primary'
        }
      },
      richText: {
        type: 'richText',
        data: {
          headline: 'Welcome to Your Plant Paradise',
          content: 'Discover the joy of growing with our carefully curated selection of premium plants and expert guidance. Whether you\'re just starting your plant journey or expanding your green sanctuary, we\'re here to help you create a thriving indoor oasis that brings nature into your everyday life.'
        },
        visible: true,
        order: 6
      }
    }
  },
  blog: {
    required: ['header', 'content'],
    optional: ['related'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'left'
        },
        settings: {
          backgroundColor: 'gradient'
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
        settings: {
          backgroundColor: 'gradient'
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
    required: [],
    optional: ['header', 'values', 'features', 'richText', 'cta'],
    defaultSections: {
      header: {
        type: 'header',
        data: {
          headline: 'About Our Plant Experts',
          subheadline: 'Years of horticultural expertise helping plant lovers grow their green sanctuaries'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true,
        order: 1
      },
      values: {
        type: 'values',
        data: {
          headline: 'Our Core Values',
          description: 'The principles that guide everything we do',
          items: [
            {
              id: 'sustainability',
              title: 'Environmental Sustainability',
              description: 'We prioritize eco-friendly practices in all aspects of our business, from sourcing to packaging.',
              icon: 'Leaf'
            },
            {
              id: 'expertise',
              title: 'Horticultural Expertise',
              description: 'Our team of certified professionals brings decades of plant care knowledge to every interaction.',
              icon: 'Award'
            },
            {
              id: 'quality',
              title: 'Premium Quality',
              description: 'We source only the healthiest plants and provide ongoing support for long-term success.',
              icon: 'Star'
            },
            {
              id: 'education',
              title: 'Plant Education',
              description: 'We empower customers with knowledge to become confident, successful plant parents.',
              icon: 'BookOpen'
            }
          ],
          columns: 2
        },
        visible: false,
        order: 3
      },
      features: {
        type: 'features',
        data: {
          headline: 'Professional Certifications',
          description: 'Our credentials and expertise you can trust',
          features: [
            'Certified Master Gardener',
            'ISA Certified Arborist',
            'Sustainable Agriculture Specialist',
            'Plant Pathology Expert',
            'Greenhouse Management Professional'
          ]
        },
        visible: false,
        order: 5,
        settings: {
          backgroundColor: 'alternate'
        }
      },
      richText: {
        type: 'richText',
        data: {
          headline: 'Our Story',
          content: 'Founded with a passion for plants and a commitment to sustainability, we have grown from a small local nursery into a trusted source for premium plants and expert care guidance. Our journey began with the simple belief that everyone deserves to experience the joy and benefits of thriving plants in their space.'
        },
        visible: true,
        order: 6
      },
      cta: {
        type: 'cta',
        data: {
          headline: 'Ready to Start Your Plant Journey?',
          description: 'Let our experts help you create the perfect green sanctuary for your space.',
          ctaText: 'Schedule Consultation',
          ctaLink: '/consultation',
          secondaryCtaText: 'Browse Plants',
          secondaryCtaLink: '/plants'
        },
        visible: false,
        order: 7,
        settings: {
          backgroundColor: 'primary'
        }
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
        settings: {
          backgroundColor: 'gradient'
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
    required: [],
    optional: ['header', 'businessInfo', 'richText', 'faq'],
    defaultSections: {
      header: {
        type: 'header',
        data: {
          headline: 'Get Expert Plant Care Help',
          subheadline: 'Connect with our certified horticulturists for personalized plant care guidance'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true,
        order: 1
      },
      businessInfo: {
        type: 'businessInfo',
        data: {
          headline: 'Contact Information',
          phone: '(555) 123-4567',
          email: 'hello@yourcompany.com',
          address: {
            street: '123 Plant Avenue',
            city: 'Green City',
            state: 'CA',
            zip: '94105'
          },
          hours: [
            { days: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
            { days: 'Saturday', time: '10:00 AM - 4:00 PM' },
            { days: 'Sunday', time: 'Closed' }
          ],
          socials: {
            facebook: 'https://facebook.com/yourcompany',
            instagram: 'https://instagram.com/yourcompany',
            twitter: '',
            linkedin: ''
          }
        },
        visible: false,
        order: 2
      },
      richText: {
        type: 'richText',
        data: {
          headline: '',
          content: ''
        },
        visible: false,
        order: 3
      },
      faq: {
        type: 'faq',
        data: {
          headline: 'Frequently Asked Questions',
          description: '',
          faqs: [
            {
              id: 'faq-1',
              question: 'How can I reach customer support?',
              answer: 'You can reach us by phone at (555) 123-4567, by email at hello@yourcompany.com, or visit our location during business hours. We typically respond to all inquiries within 24 hours.',
              order: 0
            },
            {
              id: 'faq-2',
              question: 'What are your business hours?',
              answer: 'We\'re open Monday through Friday from 9:00 AM to 6:00 PM, Saturday from 10:00 AM to 4:00 PM, and closed on Sundays.',
              order: 1
            },
            {
              id: 'faq-3',
              question: 'Do you offer consultations?',
              answer: 'Yes! We offer free consultations to help you with your needs. Contact us to schedule an appointment at a time that works for you.',
              order: 2
            },
            {
              id: 'faq-4',
              question: 'Where are you located?',
              answer: 'We\'re located at 123 Plant Avenue in Green City, CA 94105. Parking is available on-site for your convenience.',
              order: 3
            }
          ]
        },
        settings: {
          backgroundColor: 'alternate'
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
      'features', 'featured', 'categories', 'cta', 'testimonials', 'form', 'pricing',
      'values', 'specifications'
    ],
    defaultSections: {
      hero: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
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
        visible: true,
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
        settings: {
          backgroundColor: 'primary'
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
  },
  plant_shop: {
    required: ['hero', 'featured_plants'],
    optional: ['plant_categories', 'seasonal_tips', 'care_guide', 'testimonials'],
    defaultSections: {
      hero: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true,
        order: 1
      },
      featured_plants: {
        type: 'plant_showcase',
        data: {
          items: [],
          columns: 3,
          careLevel: 'easy'
        },
        visible: true,
        order: 2
      },
      plant_categories: {
        type: 'plant_categories',
        data: {
          plantCategories: [],
          columns: 4
        },
        visible: false,
        order: 3
      },
      seasonal_tips: {
        type: 'seasonal_tips',
        data: {
          seasonalTips: [],
          columns: 2
        },
        visible: false,
        order: 4
      },
      care_guide: {
        type: 'plant_care_guide',
        data: {
          content: '',
          careLevel: 'easy'
        },
        visible: false,
        order: 5
      },
      testimonials: {
        type: 'testimonials',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 6
      }
    }
  },
  plant_care: {
    required: ['header', 'care_instructions'],
    optional: ['growing_conditions', 'seasonal_calendar', 'troubleshooting'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'left'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true,
        order: 1
      },
      care_instructions: {
        type: 'plant_care_guide',
        data: {
          content: '',
          careLevel: 'medium',
          lightRequirement: 'medium',
          wateringFrequency: 'weekly'
        },
        visible: true,
        order: 2
      },
      growing_conditions: {
        type: 'growing_conditions',
        data: {
          growingConditions: [],
          columns: 2
        },
        visible: false,
        order: 3
      },
      seasonal_calendar: {
        type: 'care_calendar',
        data: {
          seasonalTips: []
        },
        visible: false,
        order: 4
      },
      troubleshooting: {
        type: 'features',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 5
      }
    }
  },
  plant_catalog: {
    required: ['header', 'plant_grid'],
    optional: ['filters', 'plant_comparison', 'care_benefits'],
    defaultSections: {
      header: {
        type: 'hero',
        data: {
          content: '',
          alignment: 'center'
        },
        settings: {
          backgroundColor: 'gradient'
        },
        visible: true,
        order: 1
      },
      plant_grid: {
        type: 'plant_grid',
        data: {
          items: [],
          columns: 3
        },
        visible: true,
        order: 2
      },
      filters: {
        type: 'plant_categories',
        data: {
          plantCategories: [],
          columns: 4
        },
        visible: false,
        order: 3
      },
      plant_comparison: {
        type: 'plant_comparison',
        data: {
          items: [],
          columns: 3
        },
        visible: false,
        order: 4
      },
      care_benefits: {
        type: 'plant_benefits',
        data: {
          items: [],
          columns: 2
        },
        visible: false,
        order: 5
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