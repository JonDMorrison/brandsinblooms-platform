/**
 * Content migration utilities for upgrading existing content to new format
 * Handles backward compatibility and data structure migrations
 */

import { Json } from '@/src/lib/database/types'
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
import { handleError } from '@/src/lib/types/error-handling'

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
      const pageContent = content as PageContent
      // Check version
      if (pageContent.version === '1.0') {
        // Migrate v1 to v2
        const v2Content = migrateV1ToV2(pageContent)
        const validation = await validateExistingContent(v2Content, !!opts.strictValidation)
        return {
          success: validation.success,
          data: validation.data,
          errors: validation.errors,
          warnings: [...warnings, 'Migrated from v1.0 to v2.0'],
          migrated: true
        }
      }

      const validation = await validateExistingContent(pageContent, !!opts.strictValidation)
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
 * Migrate v1 content (object sections) to v2 content (array sections)
 */
function migrateV1ToV2(content: any): PageContent {
  const sectionsArray: ContentSection[] = []

  if (content.sections && typeof content.sections === 'object' && !Array.isArray(content.sections)) {
    Object.entries(content.sections).forEach(([key, section]: [string, any]) => {
      sectionsArray.push({
        id: key, // Use key as ID
        type: section.type,
        data: section.data || {},
        visible: section.visible ?? true,
        settings: section.settings || {}
      })
    })

    // Sort by order if available, otherwise keep object iteration order
    sectionsArray.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  } else if (Array.isArray(content.sections)) {
    // Already an array, just cast
    return content as PageContent
  }

  return {
    ...content,
    version: '2.0',
    sections: sectionsArray
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
    const heroSection = newContent.sections.find((s: ContentSection) => s.type === 'hero' || s.type === 'header')

    if (heroSection) {
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
      let contentSection = newContent.sections.find((s: ContentSection) =>
        s.type === 'text' || s.id === 'content' || s.id === 'description'
      )

      if (!contentSection) {
        // Create a new content section if none exists
        contentSection = {
          id: 'migrated-content',
          type: 'text',
          data: { content: legacyContent.content },
          visible: true,
          settings: {}
        }
        // Insert after hero if possible, otherwise at start
        const heroIndex = newContent.sections.findIndex((s: ContentSection) => s.type === 'hero' || s.type === 'header')
        if (heroIndex >= 0) {
          newContent.sections.splice(heroIndex + 1, 0, contentSection)
        } else {
          newContent.sections.unshift(contentSection)
        }
      } else {
        contentSection.data.content = legacyContent.content
        contentSection.visible = true
      }
    }

    // Auto-fix section visibility if enabled
    if (options.autoFixVisibility === true) {
      newContent.sections.forEach((section: ContentSection) => {
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
    // Note: ValidationHelpers.validateLayoutSections expects v1 object sections
    // In v2, we don't strictly enforce required sections by key since sections are an array
    // TODO: Update ValidationHelpers for v2 or implement array-based validation
    /*
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
    */

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
    version: '2.0',
    layout,
    sections: [],
    settings: {}
  }

  // Properly copy default sections to ensure type compatibility
  if (layoutConfig.initialSections) {
    content.sections = layoutConfig.initialSections.map(section => ({
      id: crypto.randomUUID(),
      type: section.type!,
      data: JSON.parse(JSON.stringify(section.data || {})), // Deep copy
      visible: Boolean(section.visible ?? true),
      settings: section.settings || {}
    })) as ContentSection[]
  }

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
    const textSection = content.sections.find((s: ContentSection) =>
      s.type === 'text' || s.type === 'hero'
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
  content.sections.forEach((section: ContentSection) => {
    // Example: Check for old field names or structures
    if ('old_field' in section.data) {
      warnings.push(`Section ${section.id} contains deprecated field 'old_field'`)
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
 * Plant-specific batch migration utilities
 */
export class PlantShopBatchMigration extends BatchMigration {
  private plantContentResults: Array<{
    pageId: string;
    contentType: string;
    siteId?: string;
    result: MigrationResult
  }> = []

  /**
   * Add plant shop page to migration batch
   */
  async addPlantPage(
    pageId: string,
    pageData: unknown,
    siteId?: string,
    contentType?: string
  ): Promise<void> {
    // Import transformer dynamically to avoid circular dependencies
    const { transformPlantShopPage, getContentTypeForPage, LAYOUT_TYPE_MAPPING } =
      await import('./plant-shop-transformer')

    try {
      const layout = LAYOUT_TYPE_MAPPING[pageId as keyof typeof LAYOUT_TYPE_MAPPING] || 'other'
      const result = await transformPlantShopPage(pageId, pageData as any)

      this.plantContentResults.push({
        pageId,
        contentType: contentType || getContentTypeForPage(pageId),
        siteId,
        result
      })
    } catch (error: unknown) {
      const errorDetails = handleError(error)
      this.plantContentResults.push({
        pageId,
        contentType: contentType || 'page',
        siteId,
        result: {
          success: false,
          errors: [errorDetails.message],
          warnings: [],
          migrated: false,
          originalSize: 0,
          transformedSize: 0
        }
      })
    }
  }

  /**
   * Add all plant shop content to migration batch
   */
  async addAllPlantContent(siteId?: string): Promise<void> {
    const { plantShopContent } = await import('@/data/plant-shop-content')

    for (const [pageId, pageData] of Object.entries(plantShopContent)) {
      await this.addPlantPage(pageId, pageData, siteId)
    }
  }

  /**
   * Get plant-specific migration results
   */
  getPlantResults() {
    const successful = this.plantContentResults.filter(r => r.result.success)
    const failed = this.plantContentResults.filter(r => !r.result.success)
    const withWarnings = this.plantContentResults.filter(r =>
      r.result.warnings && r.result.warnings.length > 0
    )

    const totalOriginalSize = this.plantContentResults.reduce(
      (sum, r) => sum + (r.result.originalSize || 0), 0
    )
    const totalTransformedSize = this.plantContentResults.reduce(
      (sum, r) => sum + (r.result.transformedSize || 0), 0
    )

    return {
      total: this.plantContentResults.length,
      successful: successful.length,
      failed: failed.length,
      warnings: withWarnings.length,
      totalOriginalSize,
      totalTransformedSize,
      compressionRatio: totalOriginalSize > 0 ?
        (totalTransformedSize / totalOriginalSize) : 0,
      results: this.plantContentResults,
      readyForDatabase: successful
        .filter(r => r.result.data)
        .map(r => ({
          pageId: r.pageId,
          contentType: r.contentType,
          siteId: r.siteId,
          content: r.result.data!,
          originalSize: r.result.originalSize,
          transformedSize: r.result.transformedSize
        }))
    }
  }

  /**
   * Generate database insertion records
   */
  async generateDatabaseRecords(siteId: string, authorId?: string) {
    const { generateContentRecord } = await import('./plant-shop-transformer')

    return this.plantContentResults
      .filter(r => r.result.success && r.result.data)
      .map(r => generateContentRecord(
        r.pageId,
        r.result.data!,
        siteId,
        authorId
      ))
  }

  /**
   * Validate all transformed content against schema
   */
  async validateTransformedContent(): Promise<{
    allValid: boolean;
    validationResults: Array<{
      pageId: string;
      isValid: boolean;
      errors: string[];
    }>;
  }> {
    const { validatePageContent } = await import('./migration')

    const validationResults = this.plantContentResults
      .filter(r => r.result.success && r.result.data)
      .map(r => {
        const validation = validatePageContent(r.result.data!, r.result.data!.layout)
        return {
          pageId: r.pageId,
          isValid: validation.isValid,
          errors: validation.errors
        }
      })

    return {
      allValid: validationResults.every(v => v.isValid),
      validationResults
    }
  }

  /**
   * Get content size statistics
   */
  getContentSizeStats() {
    const sizes = this.plantContentResults
      .filter(r => r.result.success)
      .map(r => ({
        pageId: r.pageId,
        originalSize: r.result.originalSize || 0,
        transformedSize: r.result.transformedSize || 0,
        reduction: (r.result.originalSize || 0) - (r.result.transformedSize || 0),
        reductionPercent: (r.result.originalSize || 0) > 0 ?
          (((r.result.originalSize || 0) - (r.result.transformedSize || 0)) / (r.result.originalSize || 0)) * 100 : 0
      }))

    const totalOriginal = sizes.reduce((sum, s) => sum + s.originalSize, 0)
    const totalTransformed = sizes.reduce((sum, s) => sum + s.transformedSize, 0)

    return {
      byPage: sizes,
      totals: {
        originalSize: totalOriginal,
        transformedSize: totalTransformed,
        totalReduction: totalOriginal - totalTransformed,
        averageReductionPercent: totalOriginal > 0 ?
          ((totalOriginal - totalTransformed) / totalOriginal) * 100 : 0
      }
    }
  }

  /**
   * Export migration report
   */
  async exportMigrationReport() {
    const results = this.getPlantResults()
    const validation = await this.validateTransformedContent()
    const sizeStats = this.getContentSizeStats()

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: results.total,
        successful: results.successful,
        failed: results.failed,
        warnings: results.warnings
      },
      contentSizes: sizeStats,
      validation,
      failures: results.results
        .filter(r => !r.result.success)
        .map(r => ({
          pageId: r.pageId,
          errors: r.result.errors || [],
          warnings: r.result.warnings || []
        })),
      warnings: results.results
        .filter(r => r.result.warnings && r.result.warnings.length > 0)
        .map(r => ({
          pageId: r.pageId,
          warnings: r.result.warnings || []
        }))
    }
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
 * Get default sections for a layout type
 */
function getDefaultSections(layout: LayoutType): ContentSection[] {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  if (!layoutConfig || !layoutConfig.initialSections) {
    return []
  }

  return layoutConfig.initialSections.map((section: Partial<ContentSection>) => ({
    id: crypto.randomUUID(),
    type: section.type!,
    data: JSON.parse(JSON.stringify(section.data || {})),
    visible: Boolean(section.visible ?? true),
    settings: section.settings || {}
  })) as ContentSection[]
}

/**
 * Initialize default content for a layout
 */
export function initializeDefaultContent(layout: LayoutType): PageContent {
  const defaultSections = getDefaultSections(layout)
  return {
    version: '2.0' as const,
    layout,
    sections: defaultSections,
    settings: {}
  }
}

/**
 * Validate page content structure with detailed errors
 */
export function validatePageContent(content: unknown, layout?: LayoutType): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    if (!content || typeof content !== 'object') {
      errors.push('Content must be an object')
      return { isValid: false, errors }
    }

    const obj = content as any

    if (obj.version !== '2.0') {
      errors.push('Invalid content version')
    }

    if (typeof obj.layout !== 'string') {
      errors.push('Layout must be a string')
    }

    if (!Array.isArray(obj.sections)) {
      errors.push('Sections must be an array')
    }

    // Check layout-specific requirements if layout is provided
    if (layout && obj.layout !== layout) {
      errors.push(`Content layout "${obj.layout}" does not match expected layout "${layout}"`)
    }

    if (layout && LAYOUT_SECTIONS[layout]) {
      // Note: In v2, we don't strictly enforce required sections by key existence
      // because sections are an array. We could check if required section types exist.
      // For now, we'll skip strict required section checks or implement a type-based check if needed.
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    errors.push('Validation error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    return { isValid: false, errors }
  }
}

/**
 * Type guard for PageContent
 */
export function isValidPageContent(content: unknown): content is PageContent {
  const validation = validatePageContent(content)
  return validation.isValid
}