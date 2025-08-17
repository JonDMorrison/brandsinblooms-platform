/**
 * Content migration utilities for upgrading existing content to new format
 * Handles backward compatibility and data structure migrations
 */

import { Json } from '@/lib/database/types'
import { 
  PageContent, 
  LegacyContent, 
  LayoutType, 
  ContentSection,
  LAYOUT_SECTIONS,
  isPageContent,
  isLegacyContent
} from './schema'
import { 
  PageContentSchema,
  LegacyContentSchema,
  ValidationHelpers
} from './validation'
import { handleError } from '@/lib/types/error-handling'

/**
 * Migration result type
 */
export interface MigrationResult<T = PageContent> {
  success: boolean
  data?: T
  errors?: string[]
  warnings?: string[]
  migrated: boolean
}

/**
 * Migration options
 */
export interface MigrationOptions {
  preserveOriginal?: boolean
  strictValidation?: boolean
  autoFixVisibility?: boolean
  defaultLayout?: LayoutType
}

/**
 * Default migration options
 */
const DEFAULT_MIGRATION_OPTIONS: MigrationOptions = {
  preserveOriginal: true,
  strictValidation: false,
  autoFixVisibility: true,
  defaultLayout: 'landing'
}

/**
 * Main migration function - upgrades any content to v1.0 format
 */
export async function migrateContent(
  content: unknown,
  layout: LayoutType,
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options }
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Check if content is already in new format
    if (isPageContent(content)) {
      const validation = await validateExistingContent(content, opts.strictValidation)
      return {
        success: validation.success,
        data: validation.data,
        errors: validation.errors,
        warnings: validation.warnings,
        migrated: false
      }
    }
    
    // Handle legacy content migration
    if (isLegacyContent(content)) {
      const migrated = await migrateLegacyContent(content, layout, opts)
      return {
        success: migrated.success,
        data: migrated.data,
        errors: migrated.errors,
        warnings: migrated.warnings,
        migrated: true
      }
    }
    
    // Handle null/empty content
    if (!content || (typeof content === 'object' && Object.keys(content).length === 0)) {
      const newContent = createDefaultContent(layout)
      return {
        success: true,
        data: newContent,
        errors: [],
        warnings: ['Content was empty, created default structure'],
        migrated: true
      }
    }
    
    // Handle unknown content format
    warnings.push('Unknown content format, attempting to extract usable data')
    const fallbackContent = await createFallbackContent(content, layout)
    
    return {
      success: true,
      data: fallbackContent,
      errors: [],
      warnings,
      migrated: true
    }
    
  } catch (error: unknown) {
    const errorDetails = handleError(error)
    return {
      success: false,
      errors: [errorDetails.message],
      warnings,
      migrated: false
    }
  }
}

/**
 * Migrate legacy content to new format
 */
async function migrateLegacyContent(
  legacyContent: LegacyContent,
  layout: LayoutType,
  options: MigrationOptions
): Promise<MigrationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Validate legacy content
    const validation = LegacyContentSchema.safeParse(legacyContent)
    if (!validation.success) {
      errors.push('Invalid legacy content format')
      return { success: false, errors, warnings, migrated: false }
    }
    
    // Create new content structure with default sections
    const newContent: PageContent = createDefaultContent(layout)
    
    // Migrate title and subtitle to hero section if it exists
    if (newContent.sections.hero || newContent.sections.header) {
      const heroSection = newContent.sections.hero || newContent.sections.header
      
      let heroContent = ''
      if (legacyContent.title) {
        heroContent += `<h1>${escapeHtml(legacyContent.title)}</h1>`
      }
      if (legacyContent.subtitle) {
        heroContent += `<p class="subtitle">${escapeHtml(legacyContent.subtitle)}</p>`
      }
      
      if (heroContent) {
        heroSection.data.content = heroContent
        heroSection.visible = true
      }
    }
    
    // Migrate main content
    if (legacyContent.content) {
      // Try to find the main content section
      let contentSection = newContent.sections.content || 
                          newContent.sections.description ||
                          Object.values(newContent.sections).find(s => s.type === 'richText')
      
      if (!contentSection) {
        // Create a new content section if none exists
        contentSection = {
          type: 'richText',
          data: { content: legacyContent.content },
          visible: true,
          order: 2
        }
        newContent.sections.content = contentSection
      } else {
        contentSection.data.content = legacyContent.content
        contentSection.visible = true
      }
    }
    
    // Auto-fix section visibility if enabled
    if (options.autoFixVisibility === true) {
      Object.keys(newContent.sections).forEach(key => {
        const section = newContent.sections[key]
        section.visible = ValidationHelpers.validateSectionVisibility(section)
      })
    }
    
    // Add migration metadata
    if (!newContent.settings) {
      newContent.settings = {}
    }
    newContent.settings.migration = {
      migratedAt: new Date().toISOString(),
      fromFormat: 'legacy',
      originalData: options.preserveOriginal ? legacyContent : undefined
    }
    
    // Validate final result
    const finalValidation = PageContentSchema.safeParse(newContent)
    if (!finalValidation.success) {
      errors.push('Migration produced invalid content structure')
      finalValidation.error.issues.forEach(issue => {
        errors.push(`${issue.path.join('.')}: ${issue.message}`)
      })
      return { success: false, errors, warnings, migrated: true }
    }
    
    return {
      success: true,
      data: newContent,
      errors: [],
      warnings,
      migrated: true
    }
    
  } catch (error: unknown) {
    const errorDetails = handleError(error)
    errors.push(`Migration failed: ${errorDetails.message}`)
    return { success: false, errors, warnings, migrated: true }
  }
}

/**
 * Validate existing v1.0 content
 */
async function validateExistingContent(
  content: PageContent,
  strictValidation: boolean
): Promise<MigrationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Validate against schema
    const validation = PageContentSchema.safeParse(content)
    if (!validation.success) {
      if (strictValidation) {
        errors.push('Content validation failed')
        validation.error.issues.forEach(issue => {
          errors.push(`${issue.path.join('.')}: ${issue.message}`)
        })
        return { success: false, errors, warnings, migrated: false }
      } else {
        warnings.push('Content has validation issues but proceeding')
      }
    }
    
    // Check layout-specific requirements
    try {
      ValidationHelpers.validateLayoutSections(content.layout, content.sections)
    } catch (error: unknown) {
      const errorDetails = handleError(error)
      if (strictValidation) {
        errors.push(errorDetails.message)
        return { success: false, errors, warnings, migrated: false }
      } else {
        warnings.push(errorDetails.message)
      }
    }
    
    // Check for deprecated fields or structures
    const deprecated = findDeprecatedFields(content)
    warnings.push(...deprecated)
    
    return {
      success: true,
      data: content,
      errors: [],
      warnings,
      migrated: false
    }
    
  } catch (error: unknown) {
    const errorDetails = handleError(error)
    return {
      success: false,
      errors: [errorDetails.message],
      warnings,
      migrated: false
    }
  }
}

/**
 * Create default content structure for a layout
 */
export function createDefaultContent(layout: LayoutType): PageContent {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  
  if (!layoutConfig) {
    throw new Error(`Unknown layout type: ${layout}`)
  }
  
  const content: PageContent = {
    version: '1.0',
    layout,
    sections: {}
  }
  
  // Properly copy default sections to ensure type compatibility
  Object.entries(layoutConfig.defaultSections).forEach(([key, section]) => {
    content.sections[key] = {
      type: section.type!,
      data: section.data || {},
      visible: Boolean(section.visible ?? false),
      order: section.order
    }
  })
  
  return content
}

/**
 * Create fallback content from unknown format
 */
async function createFallbackContent(
  unknownContent: unknown,
  layout: LayoutType
): Promise<PageContent> {
  const content = createDefaultContent(layout)
  
  // Try to extract any usable text content
  const extractedText = extractTextContent(unknownContent)
  if (extractedText) {
    // Put extracted text in the first text/richText section
    const textSection = Object.values(content.sections).find(s => 
      s.type === 'text' || s.type === 'richText' || s.type === 'hero'
    )
    
    if (textSection) {
      textSection.data.content = extractedText
      textSection.visible = true
    }
  }
  
  return content
}

/**
 * Extract text content from unknown data structure
 */
function extractTextContent(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }
  
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    
    // Look for common text fields
    const textFields = ['content', 'text', 'body', 'description', 'title', 'subtitle']
    for (const field of textFields) {
      if (field in obj && typeof obj[field] === 'string') {
        return obj[field] as string
      }
    }
    
    // Try to concatenate all string values
    const strings = Object.values(obj)
      .filter(value => typeof value === 'string')
      .join('\n\n')
    
    return strings || ''
  }
  
  return ''
}

/**
 * Find deprecated fields in content structure
 */
function findDeprecatedFields(content: PageContent): string[] {
  const warnings: string[] = []
  
  // Check for any deprecated section types or data structures
  Object.entries(content.sections).forEach(([key, section]) => {
    // Example: Check for old field names or structures
    if ('old_field' in section.data) {
      warnings.push(`Section ${key} contains deprecated field 'old_field'`)
    }
  })
  
  return warnings
}

/**
 * HTML escape utility
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Batch migration utilities
 */
export class BatchMigration {
  private results: Array<{ id: string; result: MigrationResult }> = []
  private options: MigrationOptions
  
  constructor(options: MigrationOptions = {}) {
    this.options = { ...DEFAULT_MIGRATION_OPTIONS, ...options }
  }
  
  /**
   * Add content item to migration batch
   */
  async addItem(id: string, content: unknown, layout: LayoutType): Promise<void> {
    const result = await migrateContent(content, layout, this.options)
    this.results.push({ id, result })
  }
  
  /**
   * Get migration results
   */
  getResults() {
    return {
      total: this.results.length,
      successful: this.results.filter(r => r.result.success).length,
      failed: this.results.filter(r => !r.result.success).length,
      migrated: this.results.filter(r => r.result.migrated).length,
      results: this.results
    }
  }
  
  /**
   * Get failed migrations
   */
  getFailures() {
    return this.results.filter(r => !r.result.success)
  }
  
  /**
   * Get migration warnings
   */
  getWarnings() {
    return this.results.filter(r => r.result.warnings && r.result.warnings.length > 0)
  }
}

/**
 * Utility to check if content needs migration
 */
export function needsMigration(content: unknown): boolean {
  return !isPageContent(content)
}

/**
 * Get content version
 */
export function getContentVersion(content: unknown): string {
  if (isPageContent(content)) {
    return content.version
  }
  
  if (isLegacyContent(content)) {
    return 'legacy'
  }
  
  return 'unknown'
}

/**
 * Initialize default content for a layout
 */
export function initializeDefaultContent(layout: LayoutType): PageContent {
  const defaultSections = getDefaultSections(layout)
  return {
    version: '1.0' as const,
    layout,
    sections: defaultSections,
    settings: {}
  }
}

/**
 * Validate page content structure
 */
export function validatePageContent(content: unknown): content is PageContent {
  try {
    if (!content || typeof content !== 'object') return false
    const obj = content as any
    return (
      obj.version === '1.0' &&
      typeof obj.layout === 'string' &&
      typeof obj.sections === 'object'
    )
  } catch {
    return false
  }
}