/**
 * Product categories query functions
 * Handles all database operations for dynamic product category system
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate } from '@/src/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  filterUndefined,
  PaginatedResponse,
  buildPaginatedResponse,
  calculateOffset,
  QueryParams
} from '../base';
import { SupabaseError } from '../errors';

type ProductCategory = Tables<'product_categories'>;
type InsertProductCategory = TablesInsert<'product_categories'>;
type UpdateProductCategory = TablesUpdate<'product_categories'>;
type ProductCategoryAssignment = Tables<'product_category_assignments'>;
type InsertProductCategoryAssignment = TablesInsert<'product_category_assignments'>;

export interface CategoryFilters extends QueryParams<ProductCategory> {
  active?: boolean;
  parentId?: string | null;
  level?: number;
  includeInactive?: boolean;
}

export interface CategoryWithChildren extends ProductCategory {
  children?: CategoryWithChildren[];
  product_count?: number;
  ancestors?: ProductCategory[];
}

export interface CategoryWithProducts extends ProductCategory {
  products?: Tables<'products'>[];
  product_count?: number;
}

export interface ReorderItem {
  id: string;
  sort_order: number;
  parent_id?: string | null;
}

export interface BulkAssignmentData {
  product_ids: string[];
  category_id: string;
  is_primary?: boolean;
  replace_existing?: boolean;
}

/**
 * Get complete category hierarchy for a site
 * Returns a tree structure of all categories with their children
 */
export async function getCategoriesHierarchy(
  supabase: SupabaseClient<Database>,
  siteId: string,
  filters: CategoryFilters = {}
): Promise<CategoryWithChildren[]> {
  const { 
    active = true,
    includeInactive = false,
    sortBy = 'sort_order',
    sortOrder = 'asc'
  } = filters;

  // Build base query
  let query = supabase
    .from('product_categories')
    .select('*')
    .eq('site_id', siteId);

  // Apply filters
  if (!includeInactive && active !== undefined) {
    query = query.eq('is_active', active);
  }

  // Apply sorting
  if (sortBy === 'sort_order') {
    query = query.order('sort_order', { ascending: sortOrder === 'asc', nullsFirst: false });
  } else {
    query = query.order(String(sortBy), { ascending: sortOrder === 'asc' });
  }

  const categories = await handleQueryResponse(await query);

  // Build hierarchy
  return buildCategoryHierarchy(categories);
}

/**
 * Get a single category by ID with its ancestors
 */
export async function getCategoryById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  categoryId: string,
  includeAncestors: boolean = true
): Promise<CategoryWithChildren> {
  const response = await supabase
    .from('product_categories')
    .select('*')
    .eq('site_id', siteId)
    .eq('id', categoryId)
    .single();

  const category = await handleSingleResponse(response);

  let ancestors: ProductCategory[] = [];
  
  if (includeAncestors && category.parent_id) {
    ancestors = await getCategoryAncestors(supabase, siteId, category.parent_id);
  }

  return {
    ...category,
    ancestors,
    children: [],
  };
}

/**
 * Create a new category
 */
export async function createCategory(
  supabase: SupabaseClient<Database>,
  data: InsertProductCategory
): Promise<ProductCategory> {
  // Generate path and level based on parent
  let path = data.slug;
  let level = 0;

  if (data.parent_id) {
    const parent = await getCategoryById(supabase, data.site_id, data.parent_id, false);
    path = `${parent.path}/${data.slug}`;
    level = parent.level + 1;
  }

  const categoryData = {
    ...data,
    path,
    level,
  };

  const response = await supabase
    .from('product_categories')
    .insert(categoryData)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update an existing category
 */
export async function updateCategory(
  supabase: SupabaseClient<Database>,
  siteId: string,
  categoryId: string,
  data: UpdateProductCategory
): Promise<ProductCategory> {
  const filteredData = filterUndefined(data);

  // If slug or parent_id is being updated, recalculate path and level
  if (filteredData.slug || filteredData.parent_id !== undefined) {
    const current = await getCategoryById(supabase, siteId, categoryId, false);
    
    let path = filteredData.slug || current.slug;
    let level = 0;

    const newParentId = filteredData.parent_id !== undefined 
      ? filteredData.parent_id 
      : current.parent_id;

    if (newParentId) {
      const parent = await getCategoryById(supabase, siteId, newParentId, false);
      path = `${parent.path}/${path}`;
      level = parent.level + 1;
    }

    filteredData.path = path;
    filteredData.level = level;

    // Update all children's paths if this category's path changed
    if (path !== current.path) {
      await updateChildrenPaths(supabase, siteId, categoryId, path);
    }
  }

  const response = await supabase
    .from('product_categories')
    .update({
      ...filteredData,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', categoryId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Delete a category with optional product reassignment
 */
export async function deleteCategory(
  supabase: SupabaseClient<Database>,
  siteId: string,
  categoryId: string,
  reassignToCategoryId?: string
): Promise<{ affected_products: number }> {
  // Check if category has children
  const childrenResponse = await supabase
    .from('product_categories')
    .select('id')
    .eq('site_id', siteId)
    .eq('parent_id', categoryId);

  const children = await handleQueryResponse(childrenResponse);

  if (children.length > 0) {
    throw new SupabaseError(
      'Cannot delete category with children. Please delete or move child categories first.',
      'CATEGORY_HAS_CHILDREN',
      { children_count: children.length }
    );
  }

  // Count products that will be affected
  const countResponse = await supabase
    .from('product_category_assignments')
    .select('id', { count: 'exact', head: false })
    .eq('category_id', categoryId);

  const affectedCount = countResponse.data?.length ?? 0;

  // Handle product reassignment
  if (reassignToCategoryId) {
    const updateResponse = await supabase
      .from('product_category_assignments')
      .update({ category_id: reassignToCategoryId })
      .eq('category_id', categoryId);

    if (updateResponse.error) {
      throw SupabaseError.fromPostgrestError(updateResponse.error);
    }
  } else {
    // Remove all product assignments
    const deleteAssignmentsResponse = await supabase
      .from('product_category_assignments')
      .delete()
      .eq('category_id', categoryId);

    if (deleteAssignmentsResponse.error) {
      throw SupabaseError.fromPostgrestError(deleteAssignmentsResponse.error);
    }
  }

  // Delete the category
  const deleteResponse = await supabase
    .from('product_categories')
    .delete()
    .eq('site_id', siteId)
    .eq('id', categoryId);

  if (deleteResponse.error) {
    throw SupabaseError.fromPostgrestError(deleteResponse.error);
  }

  return { affected_products: affectedCount };
}

/**
 * Reorder categories (drag-drop support)
 */
export async function reorderCategories(
  supabase: SupabaseClient<Database>,
  siteId: string,
  reorderData: ReorderItem[]
): Promise<ProductCategory[]> {
  const updates = reorderData.map(item => ({
    id: item.id,
    sort_order: item.sort_order,
    parent_id: item.parent_id,
    updated_at: new Date().toISOString(),
  }));

  // Use upsert to update multiple categories
  const response = await supabase
    .from('product_categories')
    .upsert(updates, { onConflict: 'id' })
    .eq('site_id', siteId)
    .select();

  return handleQueryResponse(response);
}

/**
 * Assign products to a category (bulk operation)
 */
export async function assignProductsToCategory(
  supabase: SupabaseClient<Database>,
  siteId: string,
  assignmentData: BulkAssignmentData
): Promise<ProductCategoryAssignment[]> {
  const { product_ids, category_id, is_primary = false, replace_existing = false } = assignmentData;

  // Validate that all products belong to the site
  const productsResponse = await supabase
    .from('products')
    .select('id')
    .eq('site_id', siteId)
    .in('id', product_ids);

  const validProducts = await handleQueryResponse(productsResponse);
  const validProductIds = validProducts.map(p => p.id);

  if (validProductIds.length !== product_ids.length) {
    const invalidIds = product_ids.filter(id => !validProductIds.includes(id));
    throw new SupabaseError(
      'Some products do not exist or belong to a different site',
      'INVALID_PRODUCTS',
      { invalid_product_ids: invalidIds }
    );
  }

  // Remove existing assignments if replace_existing is true
  if (replace_existing) {
    const deleteResponse = await supabase
      .from('product_category_assignments')
      .delete()
      .in('product_id', product_ids);

    if (deleteResponse.error) {
      throw SupabaseError.fromPostgrestError(deleteResponse.error);
    }
  }

  // Create new assignments
  const assignments = product_ids.map(productId => ({
    product_id: productId,
    category_id,
    is_primary,
  }));

  const response = await supabase
    .from('product_category_assignments')
    .insert(assignments)
    .select();

  return handleQueryResponse(response);
}

/**
 * Get products in a category with pagination
 */
export async function getCategoryProducts(
  supabase: SupabaseClient<Database>,
  siteId: string,
  categoryId: string,
  filters: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
    primaryOnly?: boolean;
  } = {}
): Promise<PaginatedResponse<Tables<'products'>>> {
  const { 
    page = 1, 
    limit = 12, 
    includeInactive = false,
    primaryOnly = false 
  } = filters;

  // Build query with joins
  let query = supabase
    .from('product_category_assignments')
    .select(`
      product_id,
      is_primary,
      products!inner(*)
    `)
    .eq('category_id', categoryId);

  // Filter by primary assignments only
  if (primaryOnly) {
    query = query.eq('is_primary', true);
  }

  // Get count first
  const countResponse = await query;
  const allAssignments = await handleQueryResponse(countResponse);

  // Filter products by site and active status
  const validAssignments = allAssignments.filter(assignment => {
    const product = assignment.products as Tables<'products'>;
    if (product.site_id !== siteId) return false;
    if (!includeInactive && !product.is_active) return false;
    return true;
  });

  const count = validAssignments.length;

  // Apply pagination
  const offset = calculateOffset(page, limit);
  const paginatedAssignments = validAssignments.slice(offset, offset + limit);

  // Extract products
  const products = paginatedAssignments.map(assignment => 
    assignment.products as Tables<'products'>
  );

  return buildPaginatedResponse(products, count, page, limit);
}

// Helper functions

/**
 * Build category hierarchy from flat array
 */
function buildCategoryHierarchy(categories: ProductCategory[]): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>();
  const rootCategories: CategoryWithChildren[] = [];

  // Initialize all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build hierarchy
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children!.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

/**
 * Get category ancestors (breadcrumb trail)
 */
async function getCategoryAncestors(
  supabase: SupabaseClient<Database>,
  siteId: string,
  parentId: string
): Promise<ProductCategory[]> {
  const ancestors: ProductCategory[] = [];
  let currentParentId: string | null = parentId;

  while (currentParentId) {
    const response = await supabase
      .from('product_categories')
      .select('*')
      .eq('site_id', siteId)
      .eq('id', currentParentId)
      .single();

    const parent = await handleSingleResponse(response);
    ancestors.unshift(parent); // Add to beginning for correct order
    currentParentId = parent.parent_id;
  }

  return ancestors;
}

/**
 * Update children paths when parent path changes
 */
async function updateChildrenPaths(
  supabase: SupabaseClient<Database>,
  siteId: string,
  parentId: string,
  newParentPath: string
): Promise<void> {
  // Get all children recursively
  const childrenResponse = await supabase
    .from('product_categories')
    .select('*')
    .eq('site_id', siteId)
    .like('path', `${newParentPath}/%`);

  const children = await handleQueryResponse(childrenResponse);

  // Update each child's path
  for (const child of children) {
    const pathSegments = child.path.split('/');
    const childSlug = pathSegments[pathSegments.length - 1];
    const newPath = `${newParentPath}/${childSlug}`;

    await supabase
      .from('product_categories')
      .update({
        path: newPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', child.id);
  }
}

/**
 * Check if a category slug is available for a given site
 */
export async function checkCategorySlugAvailability(
  supabase: SupabaseClient<Database>,
  siteId: string,
  slug: string,
  excludeCategoryId?: string
): Promise<boolean> {
  let query = supabase
    .from('product_categories')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', slug);

  // Exclude the current category when editing
  if (excludeCategoryId) {
    query = query.neq('id', excludeCategoryId);
  }

  const response = await query.maybeSingle();

  if (response.error) {
    console.error('Error checking category slug availability:', response.error);
    return false;
  }

  // If no category found, slug is available
  return response.data === null;
}