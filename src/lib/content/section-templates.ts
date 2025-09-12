/**
 * Section templates for the component library
 * Provides default configurations for inserting new sections
 */

import { ContentSection, ContentSectionType } from './schema'
import { ContentItem, FormField } from './schema'

// Memoized cache for template objects to prevent memory leaks
const templateCache = new Map<string, SectionTemplate>()
const categoryCache = new Map<SectionCategory, SectionTemplate[]>()
let allCategoriesCache: SectionCategory[] | null = null

/**
 * Section template interface for the component library
 */
export interface SectionTemplate {
  id: string
  name: string
  description: string
  category: SectionCategory
  icon: string // Lucide icon name
  section: ContentSection
  preview?: {
    thumbnail?: string
    description?: string
  }
}

/**
 * Categories for organizing section templates
 */
export type SectionCategory = 
  | 'content'     // Text, rich text, images
  | 'layout'      // Hero, CTA, features  
  | 'media'       // Gallery, images, videos
  | 'interactive' // Forms, testimonials
  | 'commerce'    // Pricing, specifications
  | 'social'      // Team, testimonials
  | 'plant'       // Plant-specific sections

/**
 * Generate unique section key with timestamp
 */
function generateSectionKey(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Memoized default objects to prevent recreating on every call
const defaultFormFieldsCache: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'Enter your name',
    required: true,
    order: 1
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: true,
    order: 2
  },
  {
    id: 'message',
    type: 'textarea',
    label: 'Message',
    placeholder: 'Enter your message',
    required: true,
    order: 3
  }
]

const defaultItemsCache = new Map<number, ContentItem[]>()

/**
 * Create default content items for repeatable sections (memoized)
 */
function createDefaultItems(count: number = 3): ContentItem[] {
  if (defaultItemsCache.has(count)) {
    // Return deep copy to prevent mutations
    return JSON.parse(JSON.stringify(defaultItemsCache.get(count)))
  }
  
  const items = Array.from({ length: count }, (_, index) => ({
    id: `item_template_${index}`,
    title: 'Sample Title',
    subtitle: 'Sample Subtitle',
    content: 'Add your content here...',
    order: index + 1
  }))
  
  defaultItemsCache.set(count, items)
  return JSON.parse(JSON.stringify(items))
}

/**
 * Create default form fields (memoized)
 */
function createDefaultFormFields(): FormField[] {
  // Return deep copy to prevent mutations
  return JSON.parse(JSON.stringify(defaultFormFieldsCache))
}

/**
 * All available section templates
 */
export const SECTION_TEMPLATES: SectionTemplate[] = [
  // Content Category
  {
    id: 'text',
    name: 'Text Block',
    description: 'Simple text content',
    category: 'content',
    icon: 'Type',
    section: {
      type: 'text',
      data: {
        content: 'Add your text content here...'
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'richText',
    name: 'Rich Text',
    description: 'Formatted text with styling options',
    category: 'content',
    icon: 'FileText',
    section: {
      type: 'richText',
      data: {
        content: '<p>Add your rich text content here...</p>',
        json: null
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Single image with caption',
    category: 'content',
    icon: 'Image',
    section: {
      type: 'image',
      data: {
        url: '',
        alt: 'Image description',
        caption: 'Add your image caption here...'
      },
      visible: true,
      order: 1
    }
  },

  // Layout Category
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Large banner section for page headers',
    category: 'layout',
    icon: 'Layout',
    section: {
      type: 'hero',
      data: {
        content: '<h1>Your Hero Title</h1><p>Compelling subtitle text goes here...</p>',
        alignment: 'center'
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'cta',
    name: 'Call to Action',
    description: 'Prominent action section',
    category: 'layout',
    icon: 'MousePointer',
    section: {
      type: 'cta',
      data: {
        content: '<h2>Ready to Get Started?</h2><p>Take action today!</p>',
        alignment: 'center'
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'features',
    name: 'Features Grid',
    description: 'Grid of feature items',
    category: 'layout',
    icon: 'Grid3x3',
    section: {
      type: 'features',
      data: {
        items: createDefaultItems(3),
        columns: 3,
        alignment: 'center'
      },
      visible: true,
      order: 1
    }
  },

  // Media Category
  {
    id: 'gallery',
    name: 'Image Gallery',
    description: 'Collection of images in a grid',
    category: 'media',
    icon: 'Images',
    section: {
      type: 'gallery',
      data: {
        items: createDefaultItems(6),
        columns: 3
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'icon',
    name: 'Icon Display',
    description: 'Single icon with optional text',
    category: 'media',
    icon: 'Star',
    section: {
      type: 'icon',
      data: {
        icon: 'Star',
        iconSize: 'lg',
        iconColor: '#000000',
        content: 'Icon description'
      },
      visible: true,
      order: 1
    }
  },

  // Interactive Category
  {
    id: 'form',
    name: 'Contact Form',
    description: 'Customizable contact form',
    category: 'interactive',
    icon: 'Mail',
    section: {
      type: 'form',
      data: {
        fields: createDefaultFormFields()
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Customer reviews and testimonials',
    category: 'interactive',
    icon: 'Quote',
    section: {
      type: 'testimonials',
      data: {
        items: [
          {
            id: 'testimonial_1',
            title: 'John Doe',
            subtitle: 'Customer',
            content: '"This service exceeded my expectations in every way!"',
            order: 1
          },
          {
            id: 'testimonial_2',
            title: 'Jane Smith',
            subtitle: 'Client',
            content: '"Professional, reliable, and outstanding results."',
            order: 2
          }
        ],
        columns: 2
      },
      visible: true,
      order: 1
    }
  },

  // Commerce Category
  {
    id: 'pricing',
    name: 'Pricing Table',
    description: 'Pricing plans and options',
    category: 'commerce',
    icon: 'DollarSign',
    section: {
      type: 'pricing',
      data: {
        items: [
          {
            id: 'plan_basic',
            title: 'Basic Plan',
            subtitle: '$9/month',
            content: 'Perfect for getting started',
            order: 1
          },
          {
            id: 'plan_pro',
            title: 'Pro Plan',
            subtitle: '$29/month',
            content: 'For growing businesses',
            order: 2
          },
          {
            id: 'plan_enterprise',
            title: 'Enterprise',
            subtitle: 'Custom pricing',
            content: 'For large organizations',
            order: 3
          }
        ],
        columns: 3
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'specifications',
    name: 'Specifications',
    description: 'Product or service specifications',
    category: 'commerce',
    icon: 'List',
    section: {
      type: 'specifications',
      data: {
        items: [
          {
            id: 'spec_1',
            title: 'Dimensions',
            content: '10" x 8" x 6"',
            order: 1
          },
          {
            id: 'spec_2',
            title: 'Weight',
            content: '2.5 lbs',
            order: 2
          },
          {
            id: 'spec_3',
            title: 'Material',
            content: 'Premium quality',
            order: 3
          }
        ]
      },
      visible: true,
      order: 1
    }
  },

  // Social Category
  {
    id: 'team',
    name: 'Team Members',
    description: 'Team member profiles',
    category: 'social',
    icon: 'Users',
    section: {
      type: 'team',
      data: {
        items: [
          {
            id: 'member_1',
            title: 'Alex Johnson',
            subtitle: 'CEO & Founder',
            content: 'Leading the company vision with 10+ years experience',
            order: 1
          },
          {
            id: 'member_2',
            title: 'Sarah Wilson',
            subtitle: 'Head of Design',
            content: 'Creating beautiful user experiences',
            order: 2
          }
        ],
        columns: 2
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'mission',
    name: 'Mission Statement',
    description: 'Company mission and values',
    category: 'social',
    icon: 'Target',
    section: {
      type: 'mission',
      data: {
        content: '<h2>Our Mission</h2><p>We strive to make a positive impact through innovative solutions...</p>'
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'values',
    name: 'Company Values',
    description: 'Core values and principles',
    category: 'social',
    icon: 'Heart',
    section: {
      type: 'values',
      data: {
        items: [
          {
            id: 'value_1',
            title: 'Innovation',
            content: 'Always pushing boundaries',
            order: 1
          },
          {
            id: 'value_2',
            title: 'Quality',
            content: 'Excellence in everything we do',
            order: 2
          },
          {
            id: 'value_3',
            title: 'Integrity',
            content: 'Honest and transparent',
            order: 3
          }
        ],
        columns: 3
      },
      visible: true,
      order: 1
    }
  },

  // Plant Category
  {
    id: 'plant_showcase',
    name: 'Plant Showcase',
    description: 'Featured plant collection',
    category: 'plant',
    icon: 'Flower',
    section: {
      type: 'plant_showcase',
      data: {
        items: [
          {
            id: 'plant_1',
            title: 'Monstera Deliciosa',
            subtitle: 'Swiss Cheese Plant',
            content: 'Beautiful large-leaf houseplant',
            metadata: {
              careLevel: 'easy',
              lightRequirement: 'medium',
              wateringFrequency: 'weekly'
            },
            order: 1
          }
        ],
        columns: 3,
        careLevel: 'easy'
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'plant_grid',
    name: 'Plant Catalog',
    description: 'Grid view of plants',
    category: 'plant',
    icon: 'Grid3x3',
    section: {
      type: 'plant_grid',
      data: {
        items: createDefaultItems(6),
        columns: 3
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'plant_care_guide',
    name: 'Care Guide',
    description: 'Plant care instructions',
    category: 'plant',
    icon: 'BookOpen',
    section: {
      type: 'plant_care_guide',
      data: {
        content: '<h2>Plant Care Guide</h2><p>Essential care instructions...</p>',
        careLevel: 'medium',
        lightRequirement: 'medium',
        wateringFrequency: 'weekly'
      },
      visible: true,
      order: 1
    }
  },
  {
    id: 'seasonal_tips',
    name: 'Seasonal Tips',
    description: 'Season-specific plant care tips',
    category: 'plant',
    icon: 'Calendar',
    section: {
      type: 'seasonal_tips',
      data: {
        seasonalTips: [
          {
            id: 'tip_spring',
            season: 'spring',
            title: 'Spring Care',
            description: 'Repot and fertilize your plants',
            priority: 'high'
          },
          {
            id: 'tip_summer',
            season: 'summer',
            title: 'Summer Care',
            description: 'Increase watering frequency',
            priority: 'medium'
          }
        ],
        columns: 2
      },
      visible: true,
      order: 1
    }
  }
]

/**
 * Get templates by category (memoized)
 */
export function getTemplatesByCategory(category: SectionCategory): SectionTemplate[] {
  if (categoryCache.has(category)) {
    return categoryCache.get(category)!
  }
  
  const templates = SECTION_TEMPLATES.filter(template => template.category === category)
  categoryCache.set(category, templates)
  return templates
}

/**
 * Get template by ID (memoized)
 */
export function getTemplateById(id: string): SectionTemplate | undefined {
  if (templateCache.has(id)) {
    return templateCache.get(id)
  }
  
  const template = SECTION_TEMPLATES.find(template => template.id === id)
  if (template) {
    templateCache.set(id, template)
  }
  return template
}

/**
 * Create a new section from a template
 */
export function createSectionFromTemplate(
  templateId: string,
  order?: number
): { key: string; section: ContentSection } | null {
  const template = getTemplateById(templateId)
  if (!template) {
    return null
  }

  const sectionKey = generateSectionKey(template.section.type)
  
  return {
    key: sectionKey,
    section: {
      ...template.section,
      order: order || 1
    }
  }
}

/**
 * Get all available categories (memoized)
 */
export function getAllCategories(): SectionCategory[] {
  if (allCategoriesCache) {
    return allCategoriesCache
  }
  
  const categories = new Set(SECTION_TEMPLATES.map(template => template.category))
  allCategoriesCache = Array.from(categories).sort()
  return allCategoriesCache
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): SectionTemplate[] {
  const searchTerm = query.toLowerCase()
  return SECTION_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm)
  )
}