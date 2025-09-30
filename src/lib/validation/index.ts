/**
 * Validation Module Exports
 *
 * Central export point for all validation-related functionality.
 * Import from this file instead of individual modules for convenience.
 *
 * @example
 * ```typescript
 * import {
 *   HeroSectionSchema,
 *   validateFoundationData,
 *   recoverFromValidationError
 * } from '@/lib/validation';
 * ```
 */

// Re-export all schemas and their inferred types
export {
  HexColorSchema,
  HeroSectionSchema,
  AboutSectionSchema,
  ValueItemSchema,
  ValuesSectionSchema,
  FeatureItemSchema,
  FeaturesSectionSchema,
  ServiceItemSchema,
  ServicesSectionSchema,
  TeamMemberSchema,
  TeamSectionSchema,
  TestimonialSchema,
  TestimonialsSectionSchema,
  ContactSectionSchema,
  SiteBrandingSchema,
  SeoMetadataSchema,
  FoundationDataSchema,
  GeneratedSiteDataSchema,
  type HeroSection,
  type AboutSection,
  type ValueItem,
  type ValuesSection,
  type FeatureItem,
  type FeaturesSection,
  type ServiceItem,
  type ServicesSection,
  type TeamMember,
  type TeamSection,
  type Testimonial,
  type TestimonialsSection,
  type ContactSection,
  type SiteBranding,
  type SeoMetadata,
  type FoundationData,
  type GeneratedSiteData
} from './site-generation-schemas';

// Re-export validation helpers
export {
  formatZodError,
  validateSection,
  validateFoundationData,
  validateGeneratedSiteData,
  validateWithRecovery,
  batchValidate,
  isValidationSuccess,
  getValidationErrors,
  type ValidationResult
} from './validation-helpers';

// Re-export error recovery utilities
export {
  fixHexColors,
  truncateExcessiveText,
  fillMissingRequiredFields,
  sanitizeArrayLengths,
  recoverFromValidationError,
  getSmartDefault,
  logRecoveryAttempt
} from '../ai/error-recovery';