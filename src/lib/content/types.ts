/**
 * Content-specific TypeScript types for the enhanced content editor
 * Extends base database types with content-specific functionality
 */

import { Tables, TablesInsert, TablesUpdate } from '@/src/lib/database/types'
import {
  PageContent,
  ContentSection,
  ContentItem,
  FormField,
  LayoutType,
  SectionType
} from './schema'

/**
 * Database content row type with enhanced typing
 */
export type ContentRow = Tables<'content'>
export type ContentInsert = TablesInsert<'content'>
export type ContentUpdate = TablesUpdate<'content'>

/**
 * Enhanced content type with typed content field
 */
export interface TypedContent extends Omit<ContentRow, 'content' | 'meta_data'> {
  content: PageContent
  meta_data: ContentMetadata | null
}

/**
 * Content metadata type for the meta_data column
 */
export interface ContentMetadata {
  layout: LayoutType
  settings?: {
    seo?: SEOMetadata
    layout?: LayoutMetadata
    social?: SocialMetadata
    analytics?: AnalyticsMetadata
  }
  version?: string
  migrated?: boolean
  lastModified?: string
  [key: string]: any
}

/**
 * SEO metadata
 */
export interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  twitterCreator?: string
  robots?: string
  structuredData?: Record<string, unknown>
}

/**
 * Layout metadata
 */
export interface LayoutMetadata {
  theme?: string
  containerWidth?: 'narrow' | 'normal' | 'wide' | 'full'
  spacing?: 'tight' | 'normal' | 'loose'
  headerStyle?: string
  footerStyle?: string
  menuStyle?: string
  animations?: boolean
  transitions?: boolean
  customCSS?: string
}

/**
 * Social sharing metadata
 */
export interface SocialMetadata {
  shareTitle?: string
  shareDescription?: string
  shareImage?: string
  platforms?: Array<'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'email'>
  hashtags?: string[]
}

/**
 * Analytics metadata
 */
export interface AnalyticsMetadata {
  tracking?: {
    googleAnalytics?: string
    facebookPixel?: string
    customEvents?: Record<string, unknown>
  }
  performance?: {
    loadTime?: number
    interactionTime?: number
    bounceRate?: number
  }
  lastAnalyzed?: string
}

/**
 * Content with relationships (includes tags, site info, etc.)
 */
export interface ContentWithRelations extends TypedContent {
  site?: {
    id: string
    name: string
    domain: string
  }
  author?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  tags?: Array<{
    id: string
    name: string
    color?: string
  }>
  metrics?: {
    views: number
    shares: number
    engagement: number
    lastViewed?: string
  }
}

/**
 * Content creation input type
 */
export interface CreateContentInput {
  title: string
  slug: string
  layout: LayoutType
  content?: PageContent
  meta_data?: ContentMetadata
  content_type: 'landing' | 'about' | 'contact' | 'other' | 'blog_post' | 'event'
  is_published?: boolean
  is_featured?: boolean
  author_id?: string
  published_at?: string
}

/**
 * Content update input type
 */
export interface UpdateContentInput {
  title?: string
  slug?: string
  content?: PageContent
  meta_data?: ContentMetadata
  content_type?: 'landing' | 'about' | 'contact' | 'other' | 'blog_post' | 'event'
  is_published?: boolean
  is_featured?: boolean
  published_at?: string
}

/**
 * Content section operation types
 */
export type SectionOperation = 'create' | 'update' | 'delete' | 'reorder'

/**
 * Content section change record
 */
export interface ContentSectionChange {
  operation: SectionOperation
  sectionKey: string
  section?: Partial<ContentSection>
  previousSection?: ContentSection
  newOrder?: number
  timestamp: string
}

/**
 * Content revision tracking
 */
export interface ContentRevision {
  id: string
  contentId: string
  version: number
  content: PageContent
  changes: ContentSectionChange[]
  createdBy: string
  createdAt: string
  comment?: string
  isAutoSave: boolean
}

/**
 * Content template type
 */
export interface ContentTemplate {
  id: string
  name: string
  description?: string
  layout: LayoutType
  previewImage?: string
  content: PageContent
  category: 'default' | 'business' | 'portfolio' | 'blog' | 'ecommerce' | 'custom'
  tags?: string[]
  isPublic: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  usageCount?: number
}

/**
 * Content editor state type
 */
export interface ContentEditorState {
  contentId?: string
  content: PageContent
  metadata: ContentMetadata
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  lastSaved?: string
  activeSection?: string
  previewMode: 'desktop' | 'tablet' | 'mobile'
  editorMode: 'visual' | 'code'
  errors: Record<string, string>
  warnings: string[]
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: string[]
  suggestions: string[]
}

/**
 * Content search filters
 */
export interface ContentSearchFilters {
  query?: string
  layout?: LayoutType[]
  contentType?: Array<'landing' | 'about' | 'contact' | 'other' | 'blog_post' | 'event'>
  status?: Array<'published' | 'draft' | 'archived'>
  featured?: boolean
  tags?: string[]
  author?: string
  dateRange?: {
    from: string
    to: string
  }
  sortBy?: 'created_at' | 'updated_at' | 'title' | 'views'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Content search result
 */
export interface ContentSearchResult {
  items: ContentWithRelations[]
  total: number
  filters: ContentSearchFilters
  aggregations?: {
    byLayout: Record<LayoutType, number>
    byType: Record<string, number>
    byStatus: Record<string, number>
    byAuthor: Record<string, number>
  }
}

/**
 * Content export/import types
 */
export interface ContentExport {
  version: string
  exportedAt: string
  content: TypedContent[]
  templates?: ContentTemplate[]
  metadata: {
    siteId: string
    siteName: string
    totalItems: number
  }
}

export interface ContentImportOptions {
  overwriteExisting?: boolean
  preserveIds?: boolean
  updateSlugs?: boolean
  importTemplates?: boolean
  validation?: 'strict' | 'loose' | 'skip'
}

export interface ContentImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{
    item: string
    error: string
  }>
  warnings: string[]
  mapping?: Record<string, string> // old ID -> new ID
}

/**
 * Content analytics types
 */
export interface ContentAnalytics {
  contentId: string
  views: number
  uniqueViews: number
  shares: number
  timeOnPage: number
  bounceRate: number
  engagementScore: number
  conversionRate?: number
  lastUpdated: string
  trends: {
    viewsTrend: number
    engagementTrend: number
    period: 'day' | 'week' | 'month'
  }
}

/**
 * Content performance metrics
 */
export interface ContentPerformance {
  loadTime: number
  seoScore: number
  accessibilityScore: number
  performanceScore: number
  mobileScore: number
  recommendations: Array<{
    type: 'seo' | 'performance' | 'accessibility' | 'mobile'
    severity: 'high' | 'medium' | 'low'
    message: string
    suggestion: string
  }>
  lastAnalyzed: string
}

/**
 * Utility type for content section with typed data based on section type
 */
export type TypedContentSection<T extends SectionType = SectionType> =
  ContentSection & {
    type: T
    data: T extends 'form'
    ? ContentSection['data'] & { fields: FormField[] }
    : T extends 'gallery' | 'features' | 'testimonials' | 'team'
    ? ContentSection['data'] & { items: ContentItem[] }
    : ContentSection['data']
  }

/**
 * Type guards for content types
 */
export function isTypedContent(content: ContentRow): content is TypedContent {
  return typeof content.content === 'object' &&
    content.content !== null &&
    'version' in content.content
}

export function isContentWithRelations(content: unknown): content is ContentWithRelations {
  return typeof content === 'object' &&
    content !== null &&
    'site' in content
}

/**
 * Helper type for partial content updates
 */
export type PartialContentUpdate = {
  [K in keyof TypedContent]?: K extends 'content'
  ? Partial<PageContent>
  : K extends 'meta_data'
  ? Partial<ContentMetadata>
  : TypedContent[K]
}

/**
 * Content event types for real-time updates
 */
export type ContentEvent =
  | { type: 'content:created'; data: TypedContent }
  | { type: 'content:updated'; data: TypedContent }
  | { type: 'content:deleted'; data: { id: string } }
  | { type: 'content:published'; data: TypedContent }
  | { type: 'content:unpublished'; data: TypedContent }
  | { type: 'section:updated'; data: { contentId: string; sectionKey: string; section: ContentSection } }
  | { type: 'section:deleted'; data: { contentId: string; sectionKey: string } }