/**
 * Content system exports
 * Centralized exports for the enhanced content editor system
 */

// Schema definitions
export * from './schema'

// Type definitions
export * from './types'

// Validation schemas
export * from './validation'

// Migration utilities
export * from './migration'

// Helper functions
export * from './helpers'

// Serialization utilities
export * from './serialization'

// Explicitly re-export to avoid conflicts
export { generateContentPreview } from './serialization'

// Re-export commonly used types for convenience
export type {
  PageContent,
  ContentSection,
  ContentItem,
  FormField,
  LayoutType,
  ContentSectionType
} from './schema'

export type {
  TypedContent,
  ContentMetadata,
  ContentWithRelations,
  CreateContentInput,
  UpdateContentInput,
  ContentEditorState
} from './types'

export type {
  CreateContentInput as ValidatedCreateContentInput,
  UpdateContentInput as ValidatedUpdateContentInput,
  ValidatedPageContent,
  ValidatedContentSection
} from './validation'