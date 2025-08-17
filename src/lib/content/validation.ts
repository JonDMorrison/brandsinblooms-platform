/**
 * Zod validation schemas for content data structures
 * Provides runtime validation for content creation and updates
 */

import { z } from 'zod'
import { LayoutType, ContentSectionType } from './schema'

/**
 * Layout type validation
 */
export const LayoutTypeSchema = z.enum(['landing', 'blog', 'portfolio', 'about', 'product', 'contact'])

/**
 * Content section type validation
 */
export const ContentSectionTypeSchema = z.enum([
  'text',
  'richText', 
  'image',
  'icon',
  'gallery',
  'features',
  'hero',
  'cta',
  'testimonials',
  'form',
  'pricing',
  'team',
  'mission',
  'values',
  'specifications'
])

/**
 * Form field validation schema
 */
export const FormFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio']),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    message: z.string().optional()
  }).optional(),
  order: z.number().optional()
})

/**
 * Content item validation schema for repeatable sections
 */
export const ContentItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  url: z.string().url().optional(),
  order: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

/**
 * Content section data validation schema
 */
export const ContentSectionDataSchema = z.object({
  // Text content
  content: z.string().optional(),
  json: z.unknown().optional(), // Tiptap JSON format
  
  // Media content
  url: z.string().url().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  
  // Icon content
  icon: z.string().optional(),
  iconSize: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  iconColor: z.string().optional(),
  
  // Repeatable content
  items: z.array(ContentItemSchema).optional(),
  
  // Form-specific data
  fields: z.array(FormFieldSchema).optional(),
  
  // Layout settings
  columns: z.number().min(1).max(6).optional(),
  spacing: z.enum(['tight', 'normal', 'loose']).optional(),
  alignment: z.enum(['left', 'center', 'right']).optional()
}).catchall(z.unknown()) // Allow additional properties

/**
 * Content section validation schema
 */
export const ContentSectionSchema = z.object({
  type: ContentSectionTypeSchema,
  data: ContentSectionDataSchema,
  visible: z.boolean(),
  order: z.number().optional(),
  settings: z.record(z.string(), z.unknown()).optional()
})

/**
 * SEO settings validation schema
 */
export const SEOSettingsSchema = z.object({
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().url().optional()
})

/**
 * Layout settings validation schema
 */
export const LayoutSettingsSchema = z.object({
  containerWidth: z.enum(['narrow', 'normal', 'wide', 'full']).optional(),
  spacing: z.enum(['tight', 'normal', 'loose']).optional(),
  theme: z.string().optional()
})

/**
 * Page content validation schema
 */
export const PageContentSchema = z.object({
  version: z.literal('1.0'),
  layout: LayoutTypeSchema,
  sections: z.record(z.string(), ContentSectionSchema),
  settings: z.object({
    seo: SEOSettingsSchema.optional(),
    layout: LayoutSettingsSchema.optional()
  }).catchall(z.unknown()).optional()
})

/**
 * Legacy content validation schema for backward compatibility
 */
export const LegacyContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional()
}).catchall(z.unknown())

/**
 * Content validation schema that accepts both new and legacy formats
 */
export const ContentSchema = z.union([
  PageContentSchema,
  LegacyContentSchema
])

/**
 * Content creation input validation
 */
export const CreateContentInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  layout: LayoutTypeSchema,
  content: PageContentSchema.optional(),
  meta_data: z.object({
    layout: LayoutTypeSchema,
    settings: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  content_type: z.enum(['page', 'blog_post', 'event']).default('page'),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false)
})

/**
 * Content update input validation
 */
export const UpdateContentInputSchema = CreateContentInputSchema.partial()

/**
 * Content section update validation
 */
export const UpdateContentSectionSchema = z.object({
  sectionKey: z.string().min(1),
  section: ContentSectionSchema.partial(),
  action: z.enum(['update', 'delete']).default('update')
})

/**
 * Bulk content section update validation
 */
export const BulkUpdateContentSectionsSchema = z.object({
  updates: z.array(UpdateContentSectionSchema),
  settings: z.object({
    seo: SEOSettingsSchema.optional(),
    layout: LayoutSettingsSchema.optional()
  }).catchall(z.unknown()).optional()
})

/**
 * Content migration validation schema
 */
export const ContentMigrationSchema = z.object({
  fromVersion: z.string(),
  toVersion: z.literal('1.0'),
  legacyContent: LegacyContentSchema,
  layout: LayoutTypeSchema
})

/**
 * Validation helper functions
 */
export const ValidationHelpers = {
  /**
   * Validate layout-specific required sections
   */
  validateLayoutSections: (layout: LayoutType, sections: Record<string, unknown>) => {
    const requiredSections = getRequiredSectionsForLayout(layout)
    const missingSections = requiredSections.filter(section => !(section in sections))
    
    if (missingSections.length > 0) {
      throw new Error(`Missing required sections for ${layout} layout: ${missingSections.join(', ')}`)
    }
    
    return true
  },

  /**
   * Validate content section visibility based on data
   */
  validateSectionVisibility: (section: z.infer<typeof ContentSectionSchema>) => {
    // Auto-set visibility based on content
    if (section.type === 'text' || section.type === 'richText') {
      return !!(section.data.content && section.data.content.trim().length > 0)
    }
    
    if (section.type === 'image') {
      return !!(section.data.url)
    }
    
    if (section.type === 'icon') {
      return !!(section.data.icon)
    }
    
    if (section.type === 'gallery' || section.type === 'features' || section.type === 'testimonials') {
      return !!(section.data.items && section.data.items.length > 0)
    }
    
    if (section.type === 'form') {
      return !!(section.data.fields && section.data.fields.length > 0)
    }
    
    return section.visible
  },

  /**
   * Validate form field configuration
   */
  validateFormFields: (fields: z.infer<typeof FormFieldSchema>[]) => {
    const fieldIds = fields.map(field => field.id)
    const duplicateIds = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index)
    
    if (duplicateIds.length > 0) {
      throw new Error(`Duplicate form field IDs: ${duplicateIds.join(', ')}`)
    }
    
    // Validate select/radio/checkbox fields have options
    const fieldsNeedingOptions = fields.filter(field => 
      ['select', 'radio', 'checkbox'].includes(field.type) && 
      (!field.options || field.options.length === 0)
    )
    
    if (fieldsNeedingOptions.length > 0) {
      throw new Error(`Fields of type select, radio, or checkbox must have options: ${fieldsNeedingOptions.map(f => f.id).join(', ')}`)
    }
    
    return true
  }
}

/**
 * Get required sections for a layout type
 */
function getRequiredSectionsForLayout(layout: LayoutType): string[] {
  const layoutSections = {
    landing: ['hero'],
    blog: ['header', 'content'],
    portfolio: ['header', 'gallery'],
    about: ['hero'],
    product: ['header', 'features'],
    contact: ['header', 'form']
  }
  
  return layoutSections[layout] || []
}

/**
 * Type inference exports
 */
export type CreateContentInput = z.infer<typeof CreateContentInputSchema>
export type UpdateContentInput = z.infer<typeof UpdateContentInputSchema>
export type ContentSectionUpdate = z.infer<typeof UpdateContentSectionSchema>
export type BulkContentSectionUpdate = z.infer<typeof BulkUpdateContentSectionsSchema>
export type ContentMigration = z.infer<typeof ContentMigrationSchema>
export type ValidatedPageContent = z.infer<typeof PageContentSchema>
export type ValidatedContentSection = z.infer<typeof ContentSectionSchema>
export type ValidatedContentItem = z.infer<typeof ContentItemSchema>
export type ValidatedFormField = z.infer<typeof FormFieldSchema>