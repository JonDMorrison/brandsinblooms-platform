/**
 * Mock Data Generation System
 * 
 * Comprehensive mock data infrastructure for content templates providing:
 * - Realistic, professional content generation
 * - Configurable business contexts and tones
 * - Type-safe generator functions
 * - Preset configurations for common use cases
 * - Helper utilities for template enhancement
 */

// Core Types
export type {
  MockDataConfig,
  MockDataPreferences,
  MockDataOptions,
  TemplateWithMockData,
  TestimonialItem,
  PricingTierItem,
  FeatureItem,
  TeamMemberItem,
  GalleryItem,
  MockDataGenerator,
  MockDataPresets,
  ContentQualityMetrics,
  MockDataResult
} from './types'

// Generator Functions
export {
  generateTestimonial,
  generatePricingTier,
  generateFeature,
  generateTeamMember,
  generateGalleryImage,
  generateTestimonials,
  generatePricingTiers,
  generateFeatures,
  generateTeamMembers,
  generateGalleryItems,
  generateContentItems
} from './generators'

// Re-export core schema types for convenience
export type { ContentItem, PageContent, LayoutType } from '../schema'

import { MockDataConfig, MockDataPresets } from './types'
import { 
  generateTestimonials, 
  generateFeatures, 
  generateTeamMembers, 
  generatePricingTiers,
  generateGalleryItems 
} from './generators'

/**
 * Preset configurations for different business types
 */
export const MOCK_DATA_PRESETS: MockDataPresets = {
  technology: {
    businessType: 'technology',
    tone: 'professional',
    audience: 'b2b',
    companySize: 'medium',
    personality: ['innovative', 'efficient', 'trusted'],
    keywords: ['innovation', 'scalable', 'cutting-edge', 'digital transformation', 'automation']
  },

  consulting: {
    businessType: 'consulting',
    tone: 'authoritative',
    audience: 'b2b',
    companySize: 'small',
    personality: ['trusted', 'efficient', 'premium'],
    keywords: ['strategy', 'expertise', 'results', 'transformation', 'advisory']
  },

  healthcare: {
    businessType: 'healthcare',
    tone: 'professional',
    audience: 'mixed',
    companySize: 'enterprise',
    personality: ['trusted', 'personal', 'accessible'],
    keywords: ['patient care', 'wellness', 'quality', 'compassion', 'excellence']
  },

  finance: {
    businessType: 'finance',
    tone: 'authoritative',
    audience: 'b2b',
    companySize: 'enterprise',
    personality: ['trusted', 'premium', 'efficient'],
    keywords: ['security', 'compliance', 'growth', 'investment', 'financial planning']
  },

  creative: {
    businessType: 'creative',
    tone: 'friendly',
    audience: 'mixed',
    companySize: 'small',
    personality: ['innovative', 'premium', 'personal'],
    keywords: ['creativity', 'design', 'branding', 'storytelling', 'visual identity']
  },

  retail: {
    businessType: 'retail',
    tone: 'friendly',
    audience: 'b2c',
    companySize: 'medium',
    personality: ['accessible', 'personal', 'trusted'],
    keywords: ['quality', 'customer service', 'value', 'satisfaction', 'shopping experience']
  },

  education: {
    businessType: 'education',
    tone: 'friendly',
    audience: 'mixed',
    companySize: 'medium',
    personality: ['accessible', 'trusted', 'personal'],
    keywords: ['learning', 'growth', 'knowledge', 'development', 'achievement']
  },

  nonprofit: {
    businessType: 'nonprofit',
    tone: 'friendly',
    audience: 'mixed',
    companySize: 'small',
    personality: ['personal', 'trusted', 'accessible'],
    keywords: ['impact', 'community', 'mission', 'support', 'change']
  }
}

/**
 * Default mock data configuration
 */
export const DEFAULT_MOCK_CONFIG: MockDataConfig = {
  businessType: 'technology',
  tone: 'professional',
  audience: 'b2b',
  region: 'global',
  companySize: 'medium',
  personality: ['innovative', 'trusted', 'efficient']
}

/**
 * Quick generation functions with sensible defaults
 */
export const mockDataHelpers = {
  /**
   * Generate a complete testimonials section
   */
  createTestimonialsSection: (config: MockDataConfig = DEFAULT_MOCK_CONFIG) => ({
    type: 'testimonials' as const,
    visible: true,
    order: 0,
    data: {
      items: generateTestimonials(6, config),
      columns: 2
    }
  }),

  /**
   * Generate a features section
   */
  createFeaturesSection: (config: MockDataConfig = DEFAULT_MOCK_CONFIG) => ({
    type: 'features' as const,
    visible: true,
    order: 0,
    data: {
      items: generateFeatures(6, config),
      columns: 3
    }
  }),

  /**
   * Generate a team section
   */
  createTeamSection: (config: MockDataConfig = DEFAULT_MOCK_CONFIG) => ({
    type: 'team' as const,
    visible: true,
    order: 0,
    data: {
      items: generateTeamMembers(6, config),
      columns: 3
    }
  }),

  /**
   * Generate a pricing section
   */
  createPricingSection: () => ({
    type: 'pricing' as const,
    visible: true,
    order: 0,
    data: {
      items: generatePricingTiers(),
      columns: 3
    }
  }),

  /**
   * Generate a gallery section
   */
  createGallerySection: (category: 'product' | 'portfolio' | 'office' | 'team' = 'portfolio') => ({
    type: 'gallery' as const,
    visible: true,
    order: 0,
    data: {
      items: generateGalleryItems(8, category),
      columns: 3
    }
  })
}

/**
 * Utility function to apply mock data configuration to existing templates
 */
export function enhanceTemplateWithMockData(
  template: any,
  config: MockDataConfig = DEFAULT_MOCK_CONFIG
) {
  const enhancedTemplate = { ...template }
  
  // Add mock data metadata
  enhancedTemplate.mockDataConfig = config
  enhancedTemplate.mockDataGeneratedAt = new Date().toISOString()
  enhancedTemplate.mockDataVersion = '1.0'
  
  // Enhance sections with mock data where applicable
  Object.keys(enhancedTemplate.sections || {}).forEach(sectionKey => {
    const section = enhancedTemplate.sections[sectionKey]
    
    switch (section.type) {
      case 'testimonials':
        if (!section.data.items || section.data.items.length === 0) {
          section.data.items = generateTestimonials(6, config)
        }
        break
      
      case 'features':
        if (!section.data.items || section.data.items.length === 0) {
          section.data.items = generateFeatures(6, config)
        }
        break
      
      case 'team':
        if (!section.data.items || section.data.items.length === 0) {
          section.data.items = generateTeamMembers(6, config)
        }
        break
      
      case 'pricing':
        if (!section.data.items || section.data.items.length === 0) {
          section.data.items = generatePricingTiers()
        }
        break
      
      case 'gallery':
        if (!section.data.items || section.data.items.length === 0) {
          section.data.items = generateGalleryItems(8, 'portfolio')
        }
        break
    }
  })
  
  return enhancedTemplate
}

/**
 * Get preset configuration by business type
 */
export function getPresetConfig(businessType: keyof MockDataPresets): MockDataConfig {
  return MOCK_DATA_PRESETS[businessType] || DEFAULT_MOCK_CONFIG
}

/**
 * Validate mock data configuration
 */
export function validateMockDataConfig(config: MockDataConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const validBusinessTypes = ['technology', 'consulting', 'healthcare', 'finance', 'creative', 'retail', 'education', 'nonprofit', 'generic']
  const validTones = ['professional', 'friendly', 'casual', 'authoritative', 'creative']
  const validAudiences = ['b2b', 'b2c', 'internal', 'academic', 'mixed']
  const validCompanySizes = ['startup', 'small', 'medium', 'enterprise']
  
  if (config.businessType && !validBusinessTypes.includes(config.businessType)) {
    errors.push(`Invalid businessType: ${config.businessType}`)
  }
  
  if (config.tone && !validTones.includes(config.tone)) {
    errors.push(`Invalid tone: ${config.tone}`)
  }
  
  if (config.audience && !validAudiences.includes(config.audience)) {
    errors.push(`Invalid audience: ${config.audience}`)
  }
  
  if (config.companySize && !validCompanySizes.includes(config.companySize)) {
    errors.push(`Invalid companySize: ${config.companySize}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate comprehensive mock data result with metadata
 */
export function generateMockDataWithMetadata<T>(
  generator: () => T[],
  config: MockDataConfig = DEFAULT_MOCK_CONFIG
) {
  const items = generator()
  
  return {
    items,
    config,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatorVersion: '1.0',
      itemCount: items.length,
      qualityMetrics: {
        readability: 85,
        professionalism: 90,
        uniqueness: 80,
        keywordDensity: 75,
        completeness: 95
      }
    }
  }
}

/**
 * Batch generate multiple content types
 */
export function batchGenerateContent(config: MockDataConfig = DEFAULT_MOCK_CONFIG) {
  return {
    testimonials: generateMockDataWithMetadata(() => generateTestimonials(6, config), config),
    features: generateMockDataWithMetadata(() => generateFeatures(6, config), config),
    team: generateMockDataWithMetadata(() => generateTeamMembers(6, config), config),
    pricing: generateMockDataWithMetadata(() => generatePricingTiers(), config),
    gallery: generateMockDataWithMetadata(() => generateGalleryItems(8), config)
  }
}