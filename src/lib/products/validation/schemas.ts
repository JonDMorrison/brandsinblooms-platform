/**
 * Product Validation Schemas
 *
 * Centralized validation schemas for product forms.
 * Used across create, edit, and modal flows.
 */

import { z } from 'zod';

/**
 * Main product form schema with all validation rules
 */
export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').max(100),
  primary_category_id: z.string().min(1, 'Category is required'),
  category_ids: z.array(z.string()).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  inventory_count: z.coerce.number().int().min(0, 'Inventory must be non-negative'),
  low_stock_threshold: z.coerce.number().int().min(0).default(10),
  unit_of_measure: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
      message: 'Slug cannot start or end with a hyphen',
    }),
  meta_description: z.string().optional(),
});

/**
 * Product edit schema (for modal/quick edits)
 * More lenient than create schema
 */
export const productEditSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name is too long'),
  sku: z.string().optional(),
  primary_category_id: z.string().optional().nullable(),
  category_ids: z.array(z.string()).optional(),
  price: z.string().optional().refine((val) => {
    if (!val || val === '') return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Price must be a valid positive number'),
  sale_price: z.string().optional().refine((val) => {
    if (!val || val === '') return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Sale price must be a valid positive number'),
  description: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  in_stock: z.boolean(),
  stock_status: z.string().optional(),
  admin_notes: z.string().optional(),
});

/**
 * Partial product update schema
 * For bulk operations where only some fields may be updated
 */
export const productPartialSchema = productFormSchema.partial();

/**
 * SKU validation
 */
export const skuSchema = z.string()
  .min(1, 'SKU is required')
  .max(100, 'SKU must be 100 characters or less')
  .regex(/^[A-Z0-9-_]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores');

/**
 * Slug validation
 */
export const slugSchema = z.string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be 100 characters or less')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  });

/**
 * Price validation
 */
export const priceSchema = z.coerce.number()
  .min(0, 'Price must be positive')
  .max(999999.99, 'Price is too high');

/**
 * Inventory validation
 */
export const inventorySchema = z.coerce.number()
  .int('Inventory must be a whole number')
  .min(0, 'Inventory cannot be negative')
  .max(999999, 'Inventory value is too high');

// Type exports
export type ProductFormData = z.infer<typeof productFormSchema>;
export type ProductEditData = z.infer<typeof productEditSchema>;
export type ProductPartialData = z.infer<typeof productPartialSchema>;
