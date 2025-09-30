/**
 * Zod Validation Schemas for LLM-Generated Site Content
 *
 * This module provides comprehensive runtime validation using Zod schemas.
 * These schemas add an additional layer of type safety beyond TypeScript's
 * compile-time checking, ensuring LLM-generated content matches our expected
 * structures with proper constraints on string lengths, formats, and arrays.
 *
 * Key features:
 * - String length validation with .min()/.max()
 * - Format validation (hex colors, URLs, emails)
 * - Array length constraints
 * - Detailed error messages via .describe()
 * - Type inference for TypeScript integration
 *
 * @example
 * ```typescript
 * import { HeroSectionSchema } from './site-generation-schemas';
 *
 * const result = HeroSectionSchema.safeParse(data);
 * if (result.success) {
 *   console.log('Valid hero:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error);
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Hex color validation regex
 * Matches format: #RRGGBB (e.g., #FF5733)
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Hex color schema with validation
 */
export const HexColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, 'Must be a valid hex color code (e.g., #FF5733)')
  .describe('Hex color code in format #RRGGBB');

/**
 * Hero section validation schema
 *
 * Validates the main hero/banner section at the top of the site.
 * Includes headline, subheadline, CTA, and optional background image.
 */
export const HeroSectionSchema = z
  .object({
    headline: z
      .string()
      .min(3, 'Headline must be at least 3 characters')
      .max(100, 'Headline must not exceed 100 characters')
      .describe('Main headline displayed in hero section'),
    subheadline: z
      .string()
      .min(3, 'Subheadline must be at least 3 characters')
      .max(200, 'Subheadline must not exceed 200 characters')
      .describe('Supporting text below headline'),
    cta_text: z
      .string()
      .min(2, 'CTA text must be at least 2 characters')
      .max(30, 'CTA text must not exceed 30 characters')
      .describe('Call-to-action button text'),
    background_image: z
      .string()
      .max(500, 'Background image description too long')
      .optional()
      .describe('Description or URL of background image')
  })
  .strict()
  .describe('Hero section at top of page');

export type HeroSection = z.infer<typeof HeroSectionSchema>;

/**
 * About section validation schema
 *
 * Validates the about/company information section.
 * Includes title, content paragraphs, and optional mission/vision.
 */
export const AboutSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    content: z
      .array(
        z
          .string()
          .min(10, 'Content paragraph must be at least 10 characters')
          .max(1000, 'Content paragraph must not exceed 1000 characters')
      )
      .min(1, 'Must include at least one content paragraph')
      .max(10, 'Cannot exceed 10 content paragraphs')
      .describe('Array of content paragraphs'),
    mission: z
      .string()
      .min(10, 'Mission must be at least 10 characters')
      .max(500, 'Mission must not exceed 500 characters')
      .optional()
      .describe('Company mission statement'),
    vision: z
      .string()
      .min(10, 'Vision must be at least 10 characters')
      .max(500, 'Vision must not exceed 500 characters')
      .optional()
      .describe('Company vision statement')
  })
  .strict()
  .describe('About section with company information');

export type AboutSection = z.infer<typeof AboutSectionSchema>;

/**
 * Value item validation schema
 *
 * Validates a single value/principle item.
 */
export const ValueItemSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Value title must be at least 2 characters')
      .max(50, 'Value title must not exceed 50 characters')
      .describe('Value title'),
    description: z
      .string()
      .min(10, 'Value description must be at least 10 characters')
      .max(10000, 'Value description must not exceed 10,000 characters')
      .describe('Value description'),
    icon: z
      .string()
      .min(2, 'Icon name must be at least 2 characters')
      .max(50, 'Icon name must not exceed 50 characters')
      .describe('Lucide icon name for the value')
  })
  .strict()
  .describe('Single value/principle item');

export type ValueItem = z.infer<typeof ValueItemSchema>;

/**
 * Values section validation schema
 *
 * Validates company values/principles section.
 */
export const ValuesSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    subtitle: z
      .string()
      .min(3, 'Subtitle must be at least 3 characters')
      .max(200, 'Subtitle must not exceed 200 characters')
      .optional()
      .describe('Section subtitle'),
    values: z
      .array(ValueItemSchema)
      .min(2, 'Must include at least 2 values')
      .max(8, 'Cannot exceed 8 values')
      .describe('Array of company values')
  })
  .strict()
  .describe('Values section with company principles');

export type ValuesSection = z.infer<typeof ValuesSectionSchema>;

/**
 * Feature item validation schema
 *
 * Validates a single feature/capability item.
 */
export const FeatureItemSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Feature title must be at least 2 characters')
      .max(50, 'Feature title must not exceed 50 characters')
      .describe('Feature title'),
    description: z
      .string()
      .min(10, 'Feature description must be at least 10 characters')
      .max(300, 'Feature description must not exceed 300 characters')
      .describe('Feature description'),
    icon: z
      .string()
      .min(2, 'Icon name must be at least 2 characters')
      .max(50, 'Icon name must not exceed 50 characters')
      .describe('Lucide icon name for the feature')
  })
  .strict()
  .describe('Single feature item');

export type FeatureItem = z.infer<typeof FeatureItemSchema>;

/**
 * Features section validation schema
 *
 * Validates product/service features section.
 */
export const FeaturesSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    subtitle: z
      .string()
      .min(3, 'Subtitle must be at least 3 characters')
      .max(200, 'Subtitle must not exceed 200 characters')
      .optional()
      .describe('Section subtitle'),
    features: z
      .array(FeatureItemSchema)
      .min(2, 'Must include at least 2 features')
      .max(12, 'Cannot exceed 12 features')
      .describe('Array of product/service features')
  })
  .strict()
  .describe('Features section with product capabilities');

export type FeaturesSection = z.infer<typeof FeaturesSectionSchema>;

/**
 * Service item validation schema
 *
 * Validates a single service offering.
 */
export const ServiceItemSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Service name must be at least 2 characters')
      .max(100, 'Service name must not exceed 100 characters')
      .describe('Service name'),
    description: z
      .string()
      .min(10, 'Service description must be at least 10 characters')
      .max(500, 'Service description must not exceed 500 characters')
      .describe('Service description'),
    price: z
      .string()
      .max(50, 'Price text must not exceed 50 characters')
      .optional()
      .describe('Service price or pricing information'),
    duration: z
      .string()
      .max(50, 'Duration text must not exceed 50 characters')
      .optional()
      .describe('Service duration')
  })
  .strict()
  .describe('Single service offering');

export type ServiceItem = z.infer<typeof ServiceItemSchema>;

/**
 * Services section validation schema
 *
 * Validates services/offerings section.
 */
export const ServicesSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    subtitle: z
      .string()
      .min(3, 'Subtitle must be at least 3 characters')
      .max(200, 'Subtitle must not exceed 200 characters')
      .optional()
      .describe('Section subtitle'),
    services: z
      .array(ServiceItemSchema)
      .min(1, 'Must include at least 1 service')
      .max(20, 'Cannot exceed 20 services')
      .describe('Array of services offered')
  })
  .strict()
  .describe('Services section with offerings');

export type ServicesSection = z.infer<typeof ServicesSectionSchema>;

/**
 * Team member validation schema
 *
 * Validates a single team member profile.
 */
export const TeamMemberSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .describe('Team member name'),
    role: z
      .string()
      .min(2, 'Role must be at least 2 characters')
      .max(100, 'Role must not exceed 100 characters')
      .describe('Job title or role'),
    bio: z
      .string()
      .min(10, 'Bio must be at least 10 characters')
      .max(500, 'Bio must not exceed 500 characters')
      .describe('Team member biography'),
    image: z
      .string()
      .max(500, 'Image description too long')
      .optional()
      .describe('Profile image description or URL')
  })
  .strict()
  .describe('Single team member profile');

export type TeamMember = z.infer<typeof TeamMemberSchema>;

/**
 * Team section validation schema
 *
 * Validates team/staff section.
 */
export const TeamSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    subtitle: z
      .string()
      .min(3, 'Subtitle must be at least 3 characters')
      .max(200, 'Subtitle must not exceed 200 characters')
      .optional()
      .describe('Section subtitle'),
    members: z
      .array(TeamMemberSchema)
      .min(1, 'Must include at least 1 team member')
      .max(50, 'Cannot exceed 50 team members')
      .describe('Array of team members')
  })
  .strict()
  .describe('Team section with staff profiles');

export type TeamSection = z.infer<typeof TeamSectionSchema>;

/**
 * Testimonial validation schema
 *
 * Validates a single customer testimonial.
 */
export const TestimonialSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .describe('Customer name'),
    role: z
      .string()
      .max(100, 'Role must not exceed 100 characters')
      .optional()
      .describe('Customer role or company'),
    content: z
      .string()
      .min(10, 'Testimonial content must be at least 10 characters')
      .max(1000, 'Testimonial content must not exceed 1000 characters')
      .describe('Testimonial content'),
    rating: z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must not exceed 5')
      .optional()
      .describe('Rating from 1 to 5 stars')
  })
  .strict()
  .describe('Single customer testimonial');

export type Testimonial = z.infer<typeof TestimonialSchema>;

/**
 * Testimonials section validation schema
 *
 * Validates customer testimonials section.
 */
export const TestimonialsSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    subtitle: z
      .string()
      .min(3, 'Subtitle must be at least 3 characters')
      .max(200, 'Subtitle must not exceed 200 characters')
      .optional()
      .describe('Section subtitle'),
    testimonials: z
      .array(TestimonialSchema)
      .min(1, 'Must include at least 1 testimonial')
      .max(20, 'Cannot exceed 20 testimonials')
      .describe('Array of customer testimonials')
  })
  .strict()
  .describe('Testimonials section with customer reviews');

export type TestimonialsSection = z.infer<typeof TestimonialsSectionSchema>;

/**
 * Contact section validation schema
 *
 * Validates contact information section.
 */
export const ContactSectionSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(100, 'Title must not exceed 100 characters')
      .describe('Section title'),
    email: z
      .string()
      .email('Must be a valid email address')
      .max(200, 'Email must not exceed 200 characters')
      .describe('Contact email address'),
    phone: z
      .string()
      .max(50, 'Phone must not exceed 50 characters')
      .optional()
      .describe('Contact phone number'),
    address: z
      .string()
      .max(300, 'Address must not exceed 300 characters')
      .optional()
      .describe('Physical address'),
    hours: z
      .string()
      .max(200, 'Hours must not exceed 200 characters')
      .optional()
      .describe('Business hours'),
    additionalInfo: z
      .record(z.string(), z.string().max(500, 'Additional info value too long'))
      .optional()
      .describe('Additional contact information as key-value pairs')
  })
  .strict()
  .describe('Contact section with business contact information');

export type ContactSection = z.infer<typeof ContactSectionSchema>;

/**
 * Site branding validation schema
 *
 * Validates brand colors, fonts, and logo information.
 */
export const SiteBrandingSchema = z
  .object({
    primary_color: HexColorSchema.describe('Primary brand color'),
    secondary_color: HexColorSchema.optional().describe('Secondary brand color'),
    accent_color: HexColorSchema.optional().describe('Accent color for highlights'),
    logo_description: z
      .string()
      .max(500, 'Logo description must not exceed 500 characters')
      .optional()
      .describe('Description or requirements for logo'),
    font_family: z
      .string()
      .max(100, 'Font family must not exceed 100 characters')
      .optional()
      .describe('Suggested font family name')
  })
  .strict()
  .describe('Site branding with colors, fonts, and logo');

export type SiteBranding = z.infer<typeof SiteBrandingSchema>;

/**
 * SEO metadata validation schema
 *
 * Validates SEO-related metadata for the site.
 */
export const SeoMetadataSchema = z
  .object({
    title: z
      .string()
      .min(10, 'SEO title must be at least 10 characters')
      .max(60, 'SEO title should not exceed 60 characters for optimal display')
      .describe('Page title for SEO'),
    description: z
      .string()
      .min(50, 'SEO description must be at least 50 characters')
      .max(160, 'SEO description should not exceed 160 characters for optimal display')
      .describe('Meta description for SEO'),
    keywords: z
      .array(
        z
          .string()
          .min(2, 'Keyword must be at least 2 characters')
          .max(50, 'Keyword must not exceed 50 characters')
      )
      .max(20, 'Cannot exceed 20 keywords')
      .optional()
      .describe('SEO keywords'),
    og_image: z
      .string()
      .max(500, 'OG image description too long')
      .optional()
      .describe('Open Graph image description or URL')
  })
  .strict()
  .describe('SEO metadata for search engines and social sharing');

export type SeoMetadata = z.infer<typeof SeoMetadataSchema>;

/**
 * Foundation data validation schema
 *
 * Validates Phase 1 output: basic site info, hero, branding, and SEO.
 * This is the initial data generated before individual sections.
 */
export const FoundationDataSchema = z.object({
  site_name: z
    .string()
    .min(2, 'Site name must be at least 2 characters')
    .max(100, 'Site name must not exceed 100 characters')
    .describe('Site/business name'),
  tagline: z
    .string()
    .min(5, 'Tagline must be at least 5 characters')
    .max(200, 'Tagline must not exceed 200 characters')
    .describe('Site tagline or slogan'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .describe('Site description'),
  hero: HeroSectionSchema,
  branding: SiteBrandingSchema,
  seo: SeoMetadataSchema
});

export type FoundationData = z.infer<typeof FoundationDataSchema>;

/**
 * Complete generated site data validation schema
 *
 * Validates the full site data structure including all sections.
 * This is the final output after all generation phases.
 */
export const GeneratedSiteDataSchema = z.object({
  site_name: z
    .string()
    .min(2, 'Site name must be at least 2 characters')
    .max(100, 'Site name must not exceed 100 characters')
    .describe('Site/business name'),
  tagline: z
    .string()
    .min(5, 'Tagline must be at least 5 characters')
    .max(200, 'Tagline must not exceed 200 characters')
    .describe('Site tagline or slogan'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .describe('Site description'),
  hero: HeroSectionSchema,
  about: AboutSectionSchema,
  values: ValuesSectionSchema.optional().describe('Optional company values section'),
  features: FeaturesSectionSchema.optional().describe('Optional features section'),
  services: ServicesSectionSchema.optional().describe('Optional services section'),
  team: TeamSectionSchema.optional().describe('Optional team section'),
  testimonials: TestimonialsSectionSchema.optional().describe('Optional testimonials section'),
  contact: ContactSectionSchema,
  branding: SiteBrandingSchema,
  seo: SeoMetadataSchema,
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Additional metadata as key-value pairs')
});

export type GeneratedSiteData = z.infer<typeof GeneratedSiteDataSchema>;