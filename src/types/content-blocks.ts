/**
 * Block-based content architecture for plant shop pages
 * Extends existing DynamicSection patterns with plant-specific content types
 * Compatible with theme CSS custom properties and designed for future CMS integration
 */

import { Json } from '@/lib/database/types'
import { ContentSection, ContentItem, FormField } from '@/src/lib/content/schema'
import { ThemeSettings } from '@/lib/queries/domains/theme'

// ==========================================
// PLANT-SPECIFIC DATA TYPES
// ==========================================

/**
 * Plant item data structure for featured plants and product displays
 */
export interface PlantItem {
  id: string
  name: string
  scientificName?: string
  description?: string
  price?: number
  salePrice?: number
  image?: string
  images?: string[] // Multiple images for gallery
  category?: string
  difficulty?: 'easy' | 'moderate' | 'challenging'
  lightRequirement?: 'low' | 'medium' | 'bright' | 'direct'
  waterRequirement?: 'low' | 'medium' | 'high'
  size?: 'small' | 'medium' | 'large' | 'extra-large'
  stock?: number
  inStock?: boolean
  featured?: boolean
  tags?: string[]
  careInstructions?: string
  benefits?: string[]
  url?: string // Product page link
  order?: number
  metadata?: {
    [key: string]: Json
  }
}

/**
 * Team member data structure for plant experts and staff
 */
export interface TeamMember {
  id: string
  name: string
  title: string
  bio?: string
  image?: string
  expertise?: string[] // Plant specialties
  experience?: string // Years of experience
  certifications?: string[]
  socialLinks?: {
    linkedin?: string
    instagram?: string
    twitter?: string
    website?: string
  }
  order?: number
  metadata?: {
    [key: string]: Json
  }
}

/**
 * Contact form configuration with plant shop specific fields
 */
export interface PlantFormConfig {
  id: string
  title?: string
  description?: string
  fields: PlantFormField[]
  submitText?: string
  successMessage?: string
  emailRecipient?: string
  enableFileUpload?: boolean
  maxFileSize?: number
  allowedFileTypes?: string[]
}

/**
 * Extended form field with plant-specific options
 */
export interface PlantFormField extends FormField {
  plantSpecific?: {
    careAdvice?: boolean // For plant care questions
    plantSelection?: boolean // For plant recommendation
    deliveryOptions?: boolean // For delivery preferences
  }
}

// ==========================================
// STYLING AND THEME INTERFACES
// ==========================================

/**
 * Layout options for content blocks
 */
export type BlockLayout = 'grid' | 'masonry' | 'carousel' | 'list' | 'featured' | 'timeline'

/**
 * Spacing variants that map to theme CSS custom properties
 */
export type BlockSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Background variants compatible with theme system
 */
export type BackgroundVariant = 
  | 'transparent'
  | 'primary'
  | 'secondary' 
  | 'accent'
  | 'muted'
  | 'gradient-primary'
  | 'gradient-secondary'
  | 'image'

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify'

/**
 * Animation options for blocks
 */
export type BlockAnimation = 'none' | 'fade-in' | 'slide-up' | 'slide-left' | 'scale' | 'bounce'

/**
 * Block styling configuration that integrates with theme CSS custom properties
 */
export interface BlockStyling {
  // Layout & positioning
  layout?: BlockLayout
  columns?: {
    mobile?: number // 1-2
    tablet?: number // 1-4  
    desktop?: number // 1-6
  }
  
  // Spacing (maps to CSS custom properties)
  padding?: {
    top?: BlockSpacing
    bottom?: BlockSpacing
    left?: BlockSpacing
    right?: BlockSpacing
  }
  margin?: {
    top?: BlockSpacing
    bottom?: BlockSpacing
  }
  gap?: BlockSpacing // Grid/flex gap
  
  // Background & colors
  background?: {
    variant?: BackgroundVariant
    color?: string // Custom hex color
    image?: string
    opacity?: number // 0-1
    overlay?: boolean
  }
  
  // Typography alignment
  textAlign?: TextAlignment
  
  // Visual effects
  border?: {
    width?: number
    style?: 'solid' | 'dashed' | 'dotted'
    color?: string
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  }
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Animations & interactions
  animation?: BlockAnimation
  hover?: {
    transform?: 'none' | 'scale' | 'lift'
    transition?: 'fast' | 'normal' | 'slow'
  }
  
  // Responsive behavior
  responsive?: {
    hideOnMobile?: boolean
    hideOnTablet?: boolean
    hideOnDesktop?: boolean
  }
}

// ==========================================
// CONTENT BLOCK INTERFACES
// ==========================================

/**
 * Base content block interface extending existing ContentSection pattern
 */
export interface ContentBlock {
  id: string
  type: ContentBlockType
  title?: string
  order: number
  visible: boolean
  content: BlockContent
  styling?: BlockStyling
  settings?: {
    [key: string]: Json
  }
  // CMS integration fields
  publishedAt?: string
  updatedAt?: string
  author?: string
  version?: number
}

/**
 * Content block types supporting plant shop features
 */
export type ContentBlockType = 
  // Existing types from DynamicSection
  | 'hero'
  | 'featured_plants' // Renamed from 'features' for plant context
  | 'mission'
  | 'team' 
  | 'contact_form' // Renamed from 'form'
  | 'rich_text' // Renamed from 'richText'
  | 'cta'
  // Additional plant-specific types
  | 'plant_gallery'
  | 'care_guide'
  | 'testimonials'
  | 'plant_categories'
  | 'seasonal_collection'
  | 'plant_finder'
  | 'delivery_info'
  | 'sustainability'

/**
 * Union type for all possible block content structures
 */
export type BlockContent = 
  | HeroBlockContent
  | FeaturedPlantsBlockContent
  | MissionBlockContent
  | TeamBlockContent
  | ContactFormBlockContent
  | RichTextBlockContent
  | CtaBlockContent
  | PlantGalleryBlockContent
  | CareGuideBlockContent
  | TestimonialsBlockContent
  | PlantCategoriesBlockContent
  | SeasonalCollectionBlockContent
  | PlantFinderBlockContent
  | DeliveryInfoBlockContent
  | SustainabilityBlockContent

// ==========================================
// SPECIFIC BLOCK CONTENT TYPES
// ==========================================

/**
 * Hero block content for landing pages and featured content
 */
export interface HeroBlockContent {
  headline?: string
  subheading?: string
  description?: string
  backgroundImage?: string
  backgroundVideo?: string
  ctaButtons?: Array<{
    id: string
    text: string
    href: string
    variant: 'primary' | 'secondary' | 'outline'
    icon?: string
  }>
  badges?: Array<{
    id: string
    text: string
    icon?: string
    color?: string
  }>
}

/**
 * Featured plants block for showcasing products
 */
export interface FeaturedPlantsBlockContent {
  title?: string
  description?: string
  plants: PlantItem[]
  showPricing?: boolean
  showCareInfo?: boolean
  filterOptions?: {
    byCategory?: boolean
    byDifficulty?: boolean
    byLight?: boolean
    bySize?: boolean
  }
}

/**
 * Mission block for company values and story
 */
export interface MissionBlockContent {
  title?: string
  statement: string
  image?: string
  values?: Array<{
    id: string
    title: string
    description: string
    icon?: string
  }>
  stats?: Array<{
    id: string
    value: string
    label: string
    description?: string
  }>
}

/**
 * Team block for plant experts and staff
 */
export interface TeamBlockContent {
  title?: string
  description?: string
  members: TeamMember[]
  showExpertise?: boolean
  showSocialLinks?: boolean
}

/**
 * Contact form block with plant-specific fields
 */
export interface ContactFormBlockContent {
  config: PlantFormConfig
  showContactInfo?: boolean
  contactInfo?: {
    address?: string
    phone?: string
    email?: string
    hours?: string
  }
  showMap?: boolean
  mapEmbedUrl?: string
}

/**
 * Rich text block for detailed content
 */
export interface RichTextBlockContent {
  content: string // HTML content
  json?: Json // Tiptap JSON format
  showTableOfContents?: boolean
  enableComments?: boolean
}

/**
 * Call-to-action block for conversions
 */
export interface CtaBlockContent {
  headline: string
  description?: string
  primaryAction: {
    text: string
    href: string
    variant?: 'primary' | 'secondary'
    icon?: string
  }
  secondaryAction?: {
    text: string
    href: string
    variant?: 'outline' | 'ghost'
    icon?: string
  }
  image?: string
  benefits?: string[]
}

/**
 * Plant gallery block for showcasing plant collections
 */
export interface PlantGalleryBlockContent {
  title?: string
  plants: PlantItem[]
  galleryType: 'grid' | 'masonry' | 'carousel'
  enableFiltering?: boolean
  enableSearch?: boolean
  showQuickView?: boolean
  showWishlist?: boolean
}

/**
 * Care guide block for plant care information
 */
export interface CareGuideBlockContent {
  title?: string
  guides: Array<{
    id: string
    plantType: string
    difficulty: 'easy' | 'moderate' | 'challenging'
    image?: string
    instructions: Array<{
      step: number
      title: string
      description: string
      image?: string
      tips?: string[]
    }>
    schedule?: {
      watering?: string
      fertilizing?: string
      repotting?: string
      pruning?: string
    }
  }>
}

/**
 * Testimonials block for customer reviews
 */
export interface TestimonialsBlockContent {
  title?: string
  reviews: Array<{
    id: string
    customerName: string
    customerImage?: string
    rating: number
    review: string
    plantPurchased?: string
    verified?: boolean
    date?: string
  }>
  showRatings?: boolean
  showPlantNames?: boolean
}

/**
 * Plant categories block for navigation
 */
export interface PlantCategoriesBlockContent {
  title?: string
  categories: Array<{
    id: string
    name: string
    description?: string
    image: string
    plantCount?: number
    href: string
    featured?: boolean
  }>
  showPlantCounts?: boolean
  showDescriptions?: boolean
}

/**
 * Seasonal collection block for timely plant promotions
 */
export interface SeasonalCollectionBlockContent {
  title: string
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday'
  description?: string
  plants: PlantItem[]
  promoCode?: string
  validUntil?: string
  backgroundTheme?: 'seasonal' | 'custom'
}

/**
 * Plant finder block for interactive plant selection
 */
export interface PlantFinderBlockContent {
  title?: string
  description?: string
  questions: Array<{
    id: string
    question: string
    type: 'single-choice' | 'multiple-choice' | 'slider'
    options: Array<{
      value: string
      label: string
      image?: string
    }>
  }>
  resultTemplate?: string
  enableEmailResults?: boolean
}

/**
 * Delivery information block
 */
export interface DeliveryInfoBlockContent {
  title?: string
  deliveryOptions: Array<{
    id: string
    name: string
    description: string
    price: number
    estimatedDays: string
    icon?: string
    available: boolean
  }>
  deliveryZones?: Array<{
    zone: string
    description: string
    additionalFee?: number
  }>
  policies?: {
    returns?: string
    guarantees?: string
    careInstructions?: boolean
  }
}

/**
 * Sustainability block for eco-friendly messaging
 */
export interface SustainabilityBlockContent {
  title?: string
  statement: string
  initiatives: Array<{
    id: string
    title: string
    description: string
    icon?: string
    impact?: string
    image?: string
  }>
  certifications?: Array<{
    name: string
    image: string
    description?: string
  }>
  stats?: Array<{
    value: string
    label: string
    description?: string
  }>
}

// ==========================================
// PAGE AND COLLECTION INTERFACES
// ==========================================

/**
 * Complete page structure using content blocks
 */
export interface BlockBasedPage {
  id: string
  title: string
  slug: string
  description?: string
  blocks: ContentBlock[]
  theme?: Partial<ThemeSettings>
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
    canonicalUrl?: string
  }
  publishedAt?: string
  updatedAt?: string
  author?: string
  status: 'draft' | 'published' | 'archived'
}

/**
 * Block collection for reusable block groups
 */
export interface BlockCollection {
  id: string
  name: string
  description?: string
  blocks: ContentBlock[]
  category: 'template' | 'component' | 'section'
  tags?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Block template for quick page creation
 */
export interface BlockTemplate {
  id: string
  name: string
  description?: string
  category: 'plant-shop' | 'landing' | 'product' | 'blog' | 'about'
  thumbnail?: string
  blocks: Partial<ContentBlock>[] // Template blocks with default content
  requiredBlocks: string[] // Block types that must be included
  optionalBlocks: string[] // Block types that can be added
  defaultStyling?: BlockStyling
}

// ==========================================
// CMS INTEGRATION INTERFACES
// ==========================================

/**
 * Block metadata for CMS management
 */
export interface BlockMetadata {
  created_at: string
  updated_at: string
  created_by: string
  updated_by?: string
  version: number
  published: boolean
  scheduled_publish_at?: string
  expire_at?: string
  tags?: string[]
  category?: string
  locale?: string
}

/**
 * Block revision for version control
 */
export interface BlockRevision {
  id: string
  block_id: string
  version: number
  content: BlockContent
  styling?: BlockStyling
  created_at: string
  created_by: string
  comment?: string
}

/**
 * Complete block with CMS metadata
 */
export interface CMSContentBlock extends ContentBlock {
  metadata: BlockMetadata
  revisions?: BlockRevision[]
}

// ==========================================
// UTILITY TYPES AND TYPE GUARDS
// ==========================================

/**
 * Type guard to check if content is a plant item
 */
export function isPlantItem(item: unknown): item is PlantItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'name' in item &&
    typeof (item as PlantItem).name === 'string'
  )
}

/**
 * Type guard to check if content is a team member
 */
export function isTeamMember(item: unknown): item is TeamMember {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'name' in item &&
    'title' in item &&
    typeof (item as TeamMember).name === 'string' &&
    typeof (item as TeamMember).title === 'string'
  )
}

/**
 * Type guard for content blocks
 */
export function isContentBlock(item: unknown): item is ContentBlock {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'type' in item &&
    'content' in item &&
    'order' in item &&
    'visible' in item
  )
}

/**
 * Helper type for block content based on block type
 */
export type ContentForBlockType<T extends ContentBlockType> = 
  T extends 'hero' ? HeroBlockContent :
  T extends 'featured_plants' ? FeaturedPlantsBlockContent :
  T extends 'mission' ? MissionBlockContent :
  T extends 'team' ? TeamBlockContent :
  T extends 'contact_form' ? ContactFormBlockContent :
  T extends 'rich_text' ? RichTextBlockContent :
  T extends 'cta' ? CtaBlockContent :
  T extends 'plant_gallery' ? PlantGalleryBlockContent :
  T extends 'care_guide' ? CareGuideBlockContent :
  T extends 'testimonials' ? TestimonialsBlockContent :
  T extends 'plant_categories' ? PlantCategoriesBlockContent :
  T extends 'seasonal_collection' ? SeasonalCollectionBlockContent :
  T extends 'plant_finder' ? PlantFinderBlockContent :
  T extends 'delivery_info' ? DeliveryInfoBlockContent :
  T extends 'sustainability' ? SustainabilityBlockContent :
  BlockContent

// ==========================================
// UTILITY AND COMPUTED TYPES
// ==========================================

// All types are exported as part of their declarations above
// This file provides a comprehensive block-based content architecture
// that extends existing DynamicSection patterns with plant-specific features