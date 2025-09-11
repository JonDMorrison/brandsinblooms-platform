/**
 * Plant Shop Content Transformer
 * Converts hardcoded plant shop content to database-compatible block-based structure
 * Milestone 2: Content Transformation Scripts
 */

import { Json } from '@/lib/database/types'
import { 
  PageContent, 
  ContentSection, 
  ContentItem,
  PlantItem,
  SeasonalTip,
  GrowingCondition,
  PlantCategory,
  FormField,
  LayoutType
} from './schema'
import { handleError } from '@/lib/types/error-handling'
import { 
  plantShopContent, 
  plantsData, 
  careGuidesData, 
  teamData,
  PlantData,
  TeamMember,
  CareGuide,
  PageData as LegacyPageData,
  ContentBlock as LegacyContentBlock
} from '@/data/plant-shop-content'

/**
 * Content transformation result
 */
export interface TransformationResult {
  success: boolean
  data?: PageContent
  errors?: string[]
  warnings?: string[]
  originalSize: number
  transformedSize: number
}

/**
 * Batch transformation result
 */
export interface BatchTransformationResult {
  success: boolean
  results: Array<{
    pageId: string
    result: TransformationResult
  }>
  totalOriginalSize: number
  totalTransformedSize: number
  summary: {
    successful: number
    failed: number
    warnings: number
  }
}

/**
 * Content type mapping for database compatibility
 */
export const CONTENT_TYPE_MAPPING = {
  home: 'home_page',
  about: 'page', 
  contact: 'page',
  'privacy-policy': 'page',
  'terms-of-service': 'page'
} as const

/**
 * Layout type mapping for plant shop pages
 */
export const LAYOUT_TYPE_MAPPING = {
  home: 'plant_shop',
  about: 'about',
  contact: 'contact',
  'privacy-policy': 'other',
  'terms-of-service': 'other'
} as const

/**
 * Main transformer class
 */
export class PlantShopTransformer {
  private errors: string[] = []
  private warnings: string[] = []

  /**
   * Transform all plant shop content to database format
   */
  async transformAllContent(): Promise<BatchTransformationResult> {
    const results: Array<{ pageId: string; result: TransformationResult }> = []
    let totalOriginalSize = 0
    let totalTransformedSize = 0

    try {
      // Transform each page in the plant shop content
      for (const [pageId, pageData] of Object.entries(plantShopContent)) {
        const result = await this.transformPage(pageId, pageData)
        results.push({ pageId, result })
        
        totalOriginalSize += result.originalSize
        totalTransformedSize += result.transformedSize
      }

      const summary = {
        successful: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length,
        warnings: results.filter(r => r.result.warnings && r.result.warnings.length > 0).length
      }

      return {
        success: summary.failed === 0,
        results,
        totalOriginalSize,
        totalTransformedSize,
        summary
      }
    } catch (error: unknown) {
      const errorDetails = handleError(error)
      return {
        success: false,
        results,
        totalOriginalSize,
        totalTransformedSize,
        summary: {
          successful: 0,
          failed: results.length,
          warnings: 0
        }
      }
    }
  }

  /**
   * Transform a single page to new content format
   */
  async transformPage(pageId: string, legacyPageData: LegacyPageData): Promise<TransformationResult> {
    this.resetState()
    const originalSize = this.calculateContentSize(legacyPageData)

    try {
      // Determine layout type
      const layout = this.getLayoutForPage(pageId)
      
      // Create base page content structure
      const pageContent: PageContent = {
        version: '1.0',
        layout,
        sections: {},
        settings: {
          seo: this.transformSEOData(legacyPageData.seo),
          layout: {
            containerWidth: 'normal',
            spacing: 'normal'
          }
        }
      }

      // Transform content blocks to sections
      pageContent.sections = await this.transformContentBlocks(legacyPageData.blocks, layout)
      
      // Add required form section for contact layout
      if (layout === 'contact' && !pageContent.sections.form) {
        pageContent.sections.form = {
          type: 'form',
          data: {
            fields: this.createDefaultContactForm()
          },
          visible: true,
          order: 99
        }
      }

      const transformedSize = this.calculateContentSize(pageContent)

      return {
        success: true,
        data: pageContent,
        errors: this.errors,
        warnings: this.warnings,
        originalSize,
        transformedSize
      }
    } catch (error: unknown) {
      const errorDetails = handleError(error)
      this.errors.push(`Page transformation failed: ${errorDetails.message}`)
      
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        originalSize,
        transformedSize: 0
      }
    }
  }

  /**
   * Transform legacy content blocks to new section format
   */
  private async transformContentBlocks(
    blocks: LegacyContentBlock[], 
    layout: LayoutType
  ): Promise<Record<string, ContentSection>> {
    const sections: Record<string, ContentSection> = {}

    for (const block of blocks) {
      try {
        const section = await this.transformContentBlock(block, layout)
        if (section) {
          const mappedId = this.mapSectionIdForLayout(block.id, layout)
          sections[mappedId] = section
        }
      } catch (error: unknown) {
        const errorDetails = handleError(error)
        this.warnings.push(`Failed to transform block ${block.id}: ${errorDetails.message}`)
      }
    }

    return sections
  }

  /**
   * Transform a single content block to a content section
   */
  private async transformContentBlock(
    block: LegacyContentBlock, 
    layout: LayoutType
  ): Promise<ContentSection | null> {
    if (!block.isVisible) {
      this.warnings.push(`Skipping invisible block: ${block.id}`)
      return null
    }

    const sectionType = this.mapBlockTypeToSectionType(block.type)
    
    if (!sectionType) {
      this.warnings.push(`Unknown block type: ${block.type}`)
      return null
    }

    const section: ContentSection = {
      type: sectionType,
      data: await this.transformBlockContent(block, sectionType),
      visible: block.isVisible,
      order: block.order
    }

    return section
  }

  /**
   * Transform block content based on type
   */
  private async transformBlockContent(
    block: LegacyContentBlock,
    sectionType: string
  ): Promise<Json> {
    const content = block.content as any

    switch (block.type) {
      case 'hero':
        return this.transformHeroContent(content)
      
      case 'featured_plants':
        return this.transformFeaturedPlantsContent(content)
      
      case 'categories':
        return this.transformCategoriesContent(content)
      
      case 'seasonal':
        return this.transformSeasonalContent(content)
      
      case 'care_guides':
        return this.transformCareGuidesContent(content)
      
      case 'mission':
        return this.transformMissionContent(content)
      
      case 'team':
        return this.transformTeamContent(content)
      
      case 'testimonials':
        return this.transformTestimonialsContent(content)
      
      case 'contact':
        return this.transformContactContent(content)
      
      case 'legal':
        return this.transformLegalContent(content)
      
      default:
        this.warnings.push(`Unhandled block type: ${block.type}`)
        return {}
    }
  }

  /**
   * Transform hero content
   */
  private transformHeroContent(content: any): Json {
    return {
      content: this.buildHeroHTML(content),
      alignment: 'center',
      backgroundImage: content.backgroundImage,
      features: content.features || []
    }
  }

  /**
   * Build hero HTML content
   */
  private buildHeroHTML(content: any): string {
    let html = ''
    
    if (content.headline) {
      html += `<h1>${this.escapeHtml(content.headline)}</h1>`
    }
    
    if (content.subheadline) {
      html += `<p class="subtitle">${this.escapeHtml(content.subheadline)}</p>`
    }
    
    if (content.ctaText && content.ctaLink) {
      html += `<div class="cta-buttons">`
      html += `<a href="${content.ctaLink}" class="btn-primary">${this.escapeHtml(content.ctaText)}</a>`
      
      if (content.secondaryCtaText && content.secondaryCtaLink) {
        html += `<a href="${content.secondaryCtaLink}" class="btn-secondary">${this.escapeHtml(content.secondaryCtaText)}</a>`
      }
      
      html += `</div>`
    }
    
    return html
  }

  /**
   * Transform featured plants content
   */
  private transformFeaturedPlantsContent(content: any): Json {
    const plants = content.plants || []
    
    return {
      content: content.headline ? `<h2>${this.escapeHtml(content.headline)}</h2><p>${this.escapeHtml(content.description || '')}</p>` : '',
      items: plants.map((plant: PlantData) => this.transformPlantToContentItem(plant)),
      columns: 3,
      careLevel: 'easy'
    }
  }

  /**
   * Transform plant data to content item
   */
  private transformPlantToContentItem(plant: PlantData): any {
    return {
      id: plant.id,
      title: plant.name,
      subtitle: plant.scientificName,
      content: plant.description,
      image: plant.image,
      url: `/plants/${plant.id}`,
      order: 0,
      metadata: {
        price: plant.price,
        originalPrice: plant.originalPrice,
        careLevel: plant.careLevel,
        category: plant.category,
        features: plant.features,
        inStock: plant.inStock,
        featured: plant.featured,
        careRequirements: plant.careRequirements,
        seasonalNotes: plant.seasonalNotes,
        scientificName: plant.scientificName,
        commonName: plant.name,
        plantCareLevel: this.mapCareLevel(plant.careLevel),
        lightRequirement: this.mapLightRequirement(plant.careRequirements.light),
        wateringFrequency: this.mapWateringFrequency(plant.careRequirements.water),
        plantType: this.mapPlantType(plant.category)
      }
    }
  }

  /**
   * Transform categories content
   */
  private transformCategoriesContent(content: any): Json {
    const categories = content.categories || []
    
    return {
      content: content.headline ? `<h2>${this.escapeHtml(content.headline)}</h2><p>${this.escapeHtml(content.description || '')}</p>` : '',
      plantCategories: categories.map((cat: any, index: number) => ({
        id: `category-${index}`,
        name: cat.name,
        description: cat.description,
        icon: this.getCategoryIcon(cat.name),
        plantCount: cat.plantCount
      })),
      columns: 4
    }
  }

  /**
   * Transform seasonal content
   */
  private transformSeasonalContent(content: any): Json {
    const tips = content.tips || []
    
    return {
      content: content.headline ? `<h2>${this.escapeHtml(content.headline)}</h2><p>${this.escapeHtml(content.description || '')}</p>` : '',
      seasonalTips: tips.map((tip: string, index: number) => ({
        id: `tip-${index}`,
        season: content.currentSeason || 'fall',
        title: `${content.currentSeason || 'Fall'} Tip ${index + 1}`,
        description: tip,
        priority: 'medium'
      } as SeasonalTip)),
      columns: 2
    }
  }

  /**
   * Transform care guides content
   */
  private transformCareGuidesContent(content: any): Json {
    const guides = content.guides || []
    
    return {
      content: content.headline ? `<h2>${this.escapeHtml(content.headline)}</h2><p>${this.escapeHtml(content.description || '')}</p>` : '',
      items: guides.map((guide: CareGuide, index: number) => ({
        id: guide.id,
        title: guide.title,
        content: guide.description,
        url: guide.downloadUrl,
        order: index,
        metadata: {
          category: guide.category,
          plantTypes: guide.plantTypes
        }
      })),
      columns: 3
    }
  }

  /**
   * Transform mission content
   */
  private transformMissionContent(content: any): Json {
    let html = ''
    
    if (content.headline) {
      html += `<h2>${this.escapeHtml(content.headline)}</h2>`
    }
    
    if (content.description) {
      html += `<p>${this.escapeHtml(content.description)}</p>`
    }
    
    if (content.mission) {
      html += `<blockquote><p>${this.escapeHtml(content.mission)}</p></blockquote>`
    }
    
    if (content.values && Array.isArray(content.values)) {
      html += '<div class="values-grid">'
      content.values.forEach((value: any) => {
        html += `<div class="value-item">`
        html += `<h3>${this.escapeHtml(value.title)}</h3>`
        html += `<p>${this.escapeHtml(value.description)}</p>`
        html += `</div>`
      })
      html += '</div>'
    }
    
    return {
      content: html,
      image: content.image
    }
  }

  /**
   * Transform team content
   */
  private transformTeamContent(content: any): Json {
    const team = content.team || []
    
    return {
      content: content.headline ? `<h2>${this.escapeHtml(content.headline)}</h2><p>${this.escapeHtml(content.description || '')}</p>` : '',
      items: team.map((member: TeamMember, index: number) => ({
        id: this.slugify(member.name),
        title: member.name,
        subtitle: member.role,
        content: member.bio,
        image: member.image,
        order: index,
        metadata: {
          expertise: member.expertise,
          credentials: member.credentials
        }
      })),
      columns: 3
    }
  }

  /**
   * Transform testimonials content
   */
  private transformTestimonialsContent(content: any): Json {
    const testimonials = content.testimonials || []
    
    return {
      content: content.headline ? `<h2>${this.escapeHtml(content.headline)}</h2>` : '',
      items: testimonials.map((testimonial: any, index: number) => ({
        id: `testimonial-${index}`,
        content: testimonial.quote,
        title: testimonial.author,
        subtitle: testimonial.location,
        metadata: {
          rating: testimonial.rating
        }
      })),
      columns: 2
    }
  }

  /**
   * Transform contact content
   */
  private transformContactContent(content: any): Json {
    const contactMethods = content.contactMethods || []
    const services = content.services || []
    
    let html = ''
    
    if (content.headline) {
      html += `<h2>${this.escapeHtml(content.headline)}</h2>`
    }
    
    if (content.description) {
      html += `<p>${this.escapeHtml(content.description)}</p>`
    }
    
    // Add contact methods
    if (contactMethods.length > 0) {
      html += '<div class="contact-methods">'
      contactMethods.forEach((method: any) => {
        html += `<div class="contact-method">`
        html += `<h3>${this.escapeHtml(method.label)}</h3>`
        html += `<p><strong>${this.escapeHtml(method.value)}</strong></p>`
        html += `<p>${this.escapeHtml(method.description)}</p>`
        html += `</div>`
      })
      html += '</div>'
    }
    
    // Add services
    if (services.length > 0) {
      html += '<div class="services">'
      html += '<h3>Our Services</h3>'
      services.forEach((service: any) => {
        html += `<div class="service-item">`
        html += `<h4>${this.escapeHtml(service.name)}</h4>`
        html += `<p>${this.escapeHtml(service.description)}</p>`
        html += `<p><strong>Duration:</strong> ${this.escapeHtml(service.duration)} | <strong>Price:</strong> ${this.escapeHtml(service.price)}</p>`
        html += `</div>`
      })
      html += '</div>'
    }
    
    return {
      content: html,
      fields: this.createDefaultContactForm()
    }
  }

  /**
   * Transform legal content
   */
  private transformLegalContent(content: any): Json {
    let html = ''
    
    if (content.headline) {
      html += `<h1>${this.escapeHtml(content.headline)}</h1>`
    }
    
    if (content.lastUpdated) {
      html += `<p><em>Last updated: ${content.lastUpdated}</em></p>`
    }
    
    if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach((section: any) => {
        html += `<h2>${this.escapeHtml(section.title)}</h2>`
        html += `<p>${this.escapeHtml(section.content)}</p>`
      })
    }
    
    return {
      content: html
    }
  }

  /**
   * Transform SEO data
   */
  private transformSEOData(seo: any): Json {
    return {
      title: this.truncateText(seo.title || '', 60),
      description: this.truncateText(seo.description || '', 160),
      keywords: seo.keywords || []
    }
  }

  /**
   * Map legacy block types to new section types
   */
  private mapBlockTypeToSectionType(blockType: string): string | null {
    const mapping: Record<string, string> = {
      'hero': 'hero',
      'featured_plants': 'plant_showcase',
      'categories': 'plant_categories',
      'seasonal': 'seasonal_tips',
      'care_guides': 'features',
      'mission': 'mission',
      'team': 'team',
      'testimonials': 'testimonials',
      'contact': 'form',
      'legal': 'text'
    }
    
    return mapping[blockType] || null
  }

  /**
   * Map section IDs to match required section names
   */
  private mapSectionIdForLayout(sectionId: string, layout: LayoutType): string {
    const layoutMappings: Record<LayoutType, Record<string, string>> = {
      'plant_shop': {
        'hero-section': 'hero',
        'featured-plants': 'featured_plants'
      },
      'about': {
        'our-mission': 'hero'
      },
      'contact': {
        'contact-info': 'header',
        'contact-form': 'form'
      },
      'other': {},
      'landing': {},
      'blog': {},
      'portfolio': {},
      'product': {},
      'plant_care': {},
      'plant_catalog': {}
    }
    
    return layoutMappings[layout]?.[sectionId] || sectionId
  }

  /**
   * Get layout type for page
   */
  private getLayoutForPage(pageId: string): LayoutType {
    return LAYOUT_TYPE_MAPPING[pageId as keyof typeof LAYOUT_TYPE_MAPPING] || 'other'
  }

  /**
   * Map care levels
   */
  private mapCareLevel(careLevel: string): 'easy' | 'medium' | 'challenging' {
    const mapping: Record<string, 'easy' | 'medium' | 'challenging'> = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'expert': 'challenging'
    }
    return mapping[careLevel] || 'medium'
  }

  /**
   * Map light requirements
   */
  private mapLightRequirement(light: string): 'low' | 'medium' | 'bright' | 'direct' {
    const mapping: Record<string, 'low' | 'medium' | 'bright' | 'direct'> = {
      'full shade': 'low',
      'partial shade': 'medium',
      'partial sun': 'bright',
      'full sun': 'direct'
    }
    return mapping[light] || 'medium'
  }

  /**
   * Map watering frequency
   */
  private mapWateringFrequency(water: string): 'weekly' | 'bi-weekly' | 'monthly' | 'seasonal' {
    const mapping: Record<string, 'weekly' | 'bi-weekly' | 'monthly' | 'seasonal'> = {
      'high': 'weekly',
      'moderate': 'bi-weekly',
      'low': 'monthly'
    }
    return mapping[water] || 'bi-weekly'
  }

  /**
   * Map plant types
   */
  private mapPlantType(category: string): 'houseplant' | 'outdoor' | 'succulent' | 'herb' | 'tree' | 'shrub' {
    const mapping: Record<string, 'houseplant' | 'outdoor' | 'succulent' | 'herb' | 'tree' | 'shrub'> = {
      'houseplants': 'houseplant',
      'outdoor': 'outdoor',
      'succulents': 'succulent',
      'herbs': 'herb',
      'flowering': 'shrub'
    }
    return mapping[category] || 'houseplant'
  }

  /**
   * Get category icon
   */
  private getCategoryIcon(categoryName: string): string {
    const icons: Record<string, string> = {
      'Beginner-Friendly': 'Sprout',
      'Houseplants': 'Home',
      'Outdoor Specimens': 'Trees',
      'Succulents & Cacti': 'Sun'
    }
    return icons[categoryName] || 'Leaf'
  }

  /**
   * Create default contact form fields
   */
  private createDefaultContactForm(): FormField[] {
    return [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        order: 1
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        order: 2
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Phone Number',
        required: false,
        order: 3
      },
      {
        id: 'inquiry_type',
        type: 'select',
        label: 'Type of Inquiry',
        options: ['Plant Care Question', 'Garden Consultation', 'Plant Health Issue', 'General Question'],
        required: true,
        order: 4
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        placeholder: 'Please describe your plant care question or consultation needs...',
        required: true,
        order: 5
      }
    ]
  }

  /**
   * Helper utilities
   */
  private resetState(): void {
    this.errors = []
    this.warnings = []
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private calculateContentSize(content: unknown): number {
    return JSON.stringify(content).length
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }
}

/**
 * Convenience function to transform all plant shop content
 */
export async function transformPlantShopContent(): Promise<BatchTransformationResult> {
  const transformer = new PlantShopTransformer()
  return await transformer.transformAllContent()
}

/**
 * Transform individual page content
 */
export async function transformPlantShopPage(
  pageId: string, 
  pageData: LegacyPageData
): Promise<TransformationResult> {
  const transformer = new PlantShopTransformer()
  return await transformer.transformPage(pageId, pageData)
}

/**
 * Get content type for database insertion
 */
export function getContentTypeForPage(pageId: string): string {
  return CONTENT_TYPE_MAPPING[pageId as keyof typeof CONTENT_TYPE_MAPPING] || 'page'
}

/**
 * Generate database-ready content record
 */
export function generateContentRecord(
  pageId: string,
  pageContent: PageContent,
  siteId: string,
  authorId?: string
) {
  return {
    title: pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-/g, ' '),
    slug: pageId,
    content: pageContent as Json,
    content_type: getContentTypeForPage(pageId),
    site_id: siteId,
    author_id: authorId || null,
    is_published: true,
    is_featured: pageId === 'home',
    meta_data: {
      layout: pageContent.layout,
      contentSource: 'plant-shop-migration',
      migratedAt: new Date().toISOString(),
      originalContentSize: JSON.stringify(pageContent).length
    } as Json
  }
}