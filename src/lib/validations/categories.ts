import { z } from 'zod';

/**
 * Base category validation schema
 */
export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim(),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .nullable()
    .optional(),
  
  parent_id: z.string()
    .uuid('Invalid parent category ID')
    .nullable()
    .optional(),
  
  is_active: z.boolean()
    .default(true),
  
  sort_order: z.number()
    .int('Sort order must be an integer')
    .min(0, 'Sort order must be non-negative')
    .max(9999, 'Sort order must be less than 10000')
    .nullable()
    .optional(),
  
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF0000)')
    .nullable()
    .optional(),
  
  icon: z.string()
    .max(50, 'Icon must be less than 50 characters')
    .nullable()
    .optional(),
  
  image_url: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL must be less than 500 characters')
    .nullable()
    .optional(),
  
  meta_title: z.string()
    .max(60, 'Meta title should be less than 60 characters for SEO')
    .nullable()
    .optional(),
  
  meta_description: z.string()
    .max(160, 'Meta description should be less than 160 characters for SEO')
    .nullable()
    .optional(),
});

/**
 * Schema for creating a new category
 */
export const createCategorySchema = categorySchema.extend({
  site_id: z.string()
    .uuid('Invalid site ID'),
}).strict();

/**
 * Schema for updating an existing category
 */
export const updateCategorySchema = categorySchema.partial().strict();

/**
 * Schema for reordering categories (drag-drop)
 */
export const reorderCategorySchema = z.object({
  reorderData: z.array(
    z.object({
      id: z.string()
        .uuid('Invalid category ID'),
      sort_order: z.number()
        .int('Sort order must be an integer')
        .min(0, 'Sort order must be non-negative')
        .max(9999, 'Sort order must be less than 10000'),
      parent_id: z.string()
        .uuid('Invalid parent category ID')
        .nullable()
        .optional(),
    })
  ).min(1, 'At least one category is required for reordering'),
}).strict();

/**
 * Schema for bulk product assignment to categories
 */
export const bulkAssignSchema = z.object({
  product_ids: z.array(
    z.string().uuid('Invalid product ID')
  ).min(1, 'At least one product ID is required')
    .max(100, 'Cannot assign more than 100 products at once'),
  
  category_id: z.string()
    .uuid('Invalid category ID'),
  
  is_primary: z.boolean()
    .default(false),
  
  replace_existing: z.boolean()
    .default(false),
}).strict();

/**
 * Schema for category deletion with reassignment
 */
export const deleteCategorySchema = z.object({
  reassign_to_category_id: z.string()
    .uuid('Invalid reassignment category ID')
    .nullable()
    .optional(),
}).strict();

/**
 * Schema for category filters
 */
export const categoryFiltersSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .optional(),
  
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional(),
  
  active: z.boolean()
    .optional(),
  
  parent_id: z.string()
    .uuid('Invalid parent category ID')
    .nullable()
    .optional(),
  
  level: z.number()
    .int('Level must be an integer')
    .min(0, 'Level must be non-negative')
    .max(10, 'Level cannot exceed 10')
    .optional(),
  
  include_inactive: z.boolean()
    .default(false),
  
  search: z.string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
  
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'sort_order'])
    .default('sort_order'),
  
  sort_order: z.enum(['asc', 'desc'])
    .default('asc'),
}).strict();

/**
 * Schema for category products filters
 */
export const categoryProductsFiltersSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .default(1),
  
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(12),
  
  include_inactive: z.boolean()
    .default(false),
  
  primary_only: z.boolean()
    .default(false),
}).strict();

// Type exports
export type CategoryData = z.infer<typeof categorySchema>;
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type ReorderCategoryData = z.infer<typeof reorderCategorySchema>;
export type BulkAssignData = z.infer<typeof bulkAssignSchema>;
export type DeleteCategoryData = z.infer<typeof deleteCategorySchema>;
export type CategoryFiltersData = z.infer<typeof categoryFiltersSchema>;
export type CategoryProductsFiltersData = z.infer<typeof categoryProductsFiltersSchema>;