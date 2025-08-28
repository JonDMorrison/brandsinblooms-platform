/**
 * TypeScript type definitions for mock data generation
 * Supports configurable content generation for different use cases
 */

import { ContentItem, PageContent, LayoutType } from '../schema'

/**
 * Configuration options for mock data generation
 */
export interface MockDataConfig {
  /** Business focus (affects tone and content style) */
  businessType?: 'technology' | 'consulting' | 'healthcare' | 'finance' | 'creative' | 'retail' | 'education' | 'nonprofit' | 'generic'
  
  /** Content tone preference */
  tone?: 'professional' | 'friendly' | 'casual' | 'authoritative' | 'creative'
  
  /** Target audience */
  audience?: 'b2b' | 'b2c' | 'internal' | 'academic' | 'mixed'
  
  /** Geographic focus */
  region?: 'global' | 'us' | 'eu' | 'asia' | 'local'
  
  /** Company size context */
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise'
  
  /** Industry keywords to emphasize */
  keywords?: string[]
  
  /** Brand personality traits */
  personality?: Array<'innovative' | 'trusted' | 'efficient' | 'personal' | 'premium' | 'accessible'>
}

/**
 * User preferences for mock data generation
 */
export interface MockDataPreferences {
  /** Preferred number of items to generate */
  itemCount?: {
    testimonials?: number
    features?: number
    teamMembers?: number
    galleryItems?: number
    pricingTiers?: number
  }
  
  /** Content complexity level */
  complexity?: 'simple' | 'moderate' | 'detailed'
  
  /** Include placeholder images */
  includeImages?: boolean
  
  /** Use realistic vs generic content */
  realism?: 'high' | 'medium' | 'low'
  
  /** Diversity preferences */
  diversity?: {
    names?: boolean
    industries?: boolean
    locations?: boolean
  }
}

/**
 * Combined configuration interface
 */
export interface MockDataOptions extends MockDataConfig, MockDataPreferences {}

/**
 * Template structure enhanced with mock data capability
 */
export interface TemplateWithMockData extends PageContent {
  /** Mock data configuration used for generation */
  mockDataConfig?: MockDataConfig
  
  /** Timestamp when mock data was generated */
  mockDataGeneratedAt?: string
  
  /** Version of mock data generator used */
  mockDataVersion?: string
}

/**
 * Testimonial-specific content item
 */
export interface TestimonialItem extends ContentItem {
  /** Customer name */
  title: string
  
  /** Job title */
  subtitle?: string
  
  /** Testimonial content */
  content: string
  
  /** Customer photo */
  image?: string
  
  /** Additional metadata */
  metadata?: {
    /** Company name */
    company?: string
    
    /** Industry */
    industry?: string
    
    /** Rating (1-5) */
    rating?: number
    
    /** Date of testimonial */
    date?: string
    
    /** Location */
    location?: string
    
    /** Verification status */
    verified?: boolean
  }
}

/**
 * Pricing tier content item
 */
export interface PricingTierItem extends ContentItem {
  /** Plan name */
  title: string
  
  /** Price display */
  subtitle: string
  
  /** Plan description */
  content: string
  
  /** Additional pricing metadata */
  metadata?: {
    /** Numeric price for sorting */
    price?: number
    
    /** Billing period */
    period?: 'monthly' | 'yearly' | 'one-time'
    
    /** Feature list */
    features?: string[]
    
    /** Highlight this tier */
    highlighted?: boolean
    
    /** Call-to-action text */
    cta?: string
    
    /** Special offer text */
    offer?: string
    
    /** Badge text (e.g., "Most Popular") */
    badge?: string
  }
}

/**
 * Feature item with enhanced metadata
 */
export interface FeatureItem extends ContentItem {
  /** Feature name */
  title: string
  
  /** Feature description */
  content: string
  
  /** Lucide icon name */
  icon?: string
  
  /** Feature-specific metadata */
  metadata?: {
    /** Feature category */
    category?: string
    
    /** Benefit type */
    benefit?: 'efficiency' | 'cost' | 'quality' | 'security' | 'user-experience' | 'scalability'
    
    /** Technical complexity */
    complexity?: 'basic' | 'advanced' | 'enterprise'
    
    /** Associated metrics */
    metrics?: {
      improvement?: string
      savings?: string
      usage?: string
    }
  }
}

/**
 * Team member content item
 */
export interface TeamMemberItem extends ContentItem {
  /** Full name */
  title: string
  
  /** Job title */
  subtitle: string
  
  /** Bio/description */
  content: string
  
  /** Profile photo */
  image?: string
  
  /** Team member metadata */
  metadata?: {
    /** Department */
    department?: string
    
    /** Years of experience */
    experience?: number
    
    /** Education */
    education?: string
    
    /** Specializations */
    specializations?: string[]
    
    /** Contact information */
    contact?: {
      email?: string
      linkedin?: string
      twitter?: string
    }
    
    /** Fun fact or personal touch */
    funFact?: string
  }
}

/**
 * Gallery item with enhanced metadata
 */
export interface GalleryItem extends ContentItem {
  /** Image title */
  title: string
  
  /** Image description */
  content?: string
  
  /** Image URL */
  image: string
  
  /** Gallery-specific metadata */
  metadata?: {
    /** Image category */
    category?: 'product' | 'portfolio' | 'team' | 'office' | 'event' | 'process'
    
    /** Project details */
    project?: {
      client?: string
      date?: string
      duration?: string
      technologies?: string[]
    }
    
    /** Image technical details */
    imageDetails?: {
      alt?: string
      caption?: string
      photographer?: string
      location?: string
    }
  }
}

/**
 * Mock data generator function type
 */
export type MockDataGenerator<T = ContentItem> = (
  index: number,
  config?: MockDataConfig
) => T

/**
 * Preset configuration templates
 */
export interface MockDataPresets {
  /** Technology/Software company */
  technology: MockDataConfig
  
  /** Professional services/Consulting */
  consulting: MockDataConfig
  
  /** Healthcare/Medical */
  healthcare: MockDataConfig
  
  /** Financial services */
  finance: MockDataConfig
  
  /** Creative agency/Studio */
  creative: MockDataConfig
  
  /** Retail/E-commerce */
  retail: MockDataConfig
  
  /** Educational institution */
  education: MockDataConfig
  
  /** Nonprofit organization */
  nonprofit: MockDataConfig
}

/**
 * Content quality metrics
 */
export interface ContentQualityMetrics {
  /** Readability score */
  readability: number
  
  /** Professional tone score */
  professionalism: number
  
  /** Content uniqueness */
  uniqueness: number
  
  /** SEO keyword density */
  keywordDensity: number
  
  /** Content completeness */
  completeness: number
}

/**
 * Mock data generation result
 */
export interface MockDataResult<T = ContentItem> {
  /** Generated items */
  items: T[]
  
  /** Configuration used */
  config: MockDataConfig
  
  /** Generation metadata */
  metadata: {
    generatedAt: string
    generatorVersion: string
    itemCount: number
    qualityMetrics?: ContentQualityMetrics
  }
}