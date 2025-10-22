/**
 * Product Type Definitions
 *
 * Centralized type definitions for products across the application.
 */

import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';
import type { ProductFormData, ProductEditData } from '../validation/schemas';

// Base product types from database
export type Product = Tables<'products'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductUpdate = TablesUpdate<'products'>;
export type ProductImage = Tables<'product_images'>;
export type ProductCategory = Tables<'product_categories'>;

// Enhanced product types
export interface ProductWithImages extends Product {
  product_images?: ProductImage[];
}

export interface ProductWithCategory extends Product {
  primary_category?: ProductCategory | null;
  product_category_assignments?: Array<{
    category: ProductCategory;
  }>;
}

export interface ProductWithSite extends Product {
  site_name?: string;
  site_subdomain?: string;
}

export interface ProductWithRelations extends Product {
  product_images?: ProductImage[];
  primary_category?: ProductCategory | null;
  product_category_assignments?: Array<{
    category: ProductCategory;
  }>;
}

// Product display types (for UI)
export interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
  featured: boolean;
  addedToSite: boolean;
}

// Form types
export type { ProductFormData, ProductEditData };

// Product image types (for uploads)
export interface TrackedImage {
  id: string;
  url: string;
  alt_text?: string;
  caption?: string;
  position: number;
  is_primary: boolean;
  file?: File;
  width?: number;
  height?: number;
  size?: number;
  tempPath?: string;
}

// Product filter types
export interface ProductFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  featured?: boolean;
  active?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Product stats types
export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  outOfStockProducts: number;
  inventoryValue: number;
  totalInventoryUnits: number;
  averageRating: number;
  totalReviews: number;
}

// Bulk operation types
export interface BulkUpdateData {
  is_active?: boolean;
  is_featured?: boolean;
  in_stock?: boolean;
  stock_status?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  sale_price?: number;
}

export interface BulkPriceUpdate {
  type: 'percentage' | 'fixed';
  value: number;
  operation: 'increase' | 'decrease';
}
