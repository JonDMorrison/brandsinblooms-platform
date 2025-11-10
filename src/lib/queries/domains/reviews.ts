/**
 * Product reviews query functions
 * Handles all database operations for product reviews and ratings
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate } from '@/src/lib/database/types';
import { 
  handleQueryResponse, 
  handleSingleResponse,
  handleCountResponse,
  buildPaginatedResponse,
  calculateOffset,
  filterUndefined,
  buildOrderBy,
  PaginatedResponse,
  QueryParams
} from '../base';
import { SupabaseError } from '../errors';

type ProductReview = Tables<'product_reviews'>;
type InsertProductReview = TablesInsert<'product_reviews'>;
type UpdateProductReview = TablesUpdate<'product_reviews'>;

export interface ReviewFilters extends QueryParams<ProductReview> {
  rating?: number;
  verified?: boolean;
  approved?: boolean;
}

export interface ReviewWithProfile extends ProductReview {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface ProductRatingAggregation {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * Type guard to validate review data from database
 */
function isValidReviewData(item: unknown): item is ProductReview & { profile?: unknown } {
  if (!item || typeof item !== 'object') {
    return false
  }
  
  const review = item as Record<string, unknown>
  
  // Check required ProductReview fields (basic validation)
  return (
    typeof review.id === 'string' &&
    typeof review.site_id === 'string' &&
    typeof review.product_id === 'string'
  )
}

/**
 * Get paginated reviews for a product
 */
export async function getProductReviews(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  filters: ReviewFilters = {}
): Promise<PaginatedResponse<ReviewWithProfile>> {
  const {
    page = 1,
    limit = 10,
    rating,
    verified,
    approved = true,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Build base query with profile join
  let countQuery = supabase
    .from('product_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('product_id', productId);

  let dataQuery = supabase
    .from('product_reviews')
    .select(`
      *,
      profile:profiles!product_reviews_profile_id_fkey (
        full_name,
        avatar_url,
        username
      )
    `)
    .eq('site_id', siteId)
    .eq('product_id', productId);

  // Apply filters
  if (approved !== undefined) {
    countQuery = countQuery.eq('is_approved', approved);
    dataQuery = dataQuery.eq('is_approved', approved);
  }

  if (rating !== undefined) {
    countQuery = countQuery.eq('rating', rating);
    dataQuery = dataQuery.eq('rating', rating);
  }

  if (verified !== undefined) {
    countQuery = countQuery.eq('verified_purchase', verified);
    dataQuery = dataQuery.eq('verified_purchase', verified);
  }

  // Get count
  const count = await handleCountResponse(await countQuery);

  // Apply pagination and sorting
  const offset = calculateOffset(page, limit);
  const orderBy = buildOrderBy<ProductReview>(sortBy, sortOrder);
  
  if (orderBy) {
    dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending });
  }
  
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute query
  const data = await handleQueryResponse(await dataQuery);

  // Transform data to match our interface
  const transformedData: ReviewWithProfile[] = data.map((item: unknown) => {
    if (!isValidReviewData(item)) {
      throw new Error('Invalid review data received from database')
    }
    
    return {
      ...item,
      profile: item.profile && typeof item.profile === 'object' ? item.profile as { full_name: string | null; avatar_url: string | null; username: string | null; } : undefined
    }
  });

  return buildPaginatedResponse(transformedData, count, page, limit);
}

/**
 * Get a single review by ID
 */
export async function getReviewById(
  supabase: SupabaseClient<Database>,
  siteId: string,
  reviewId: string
): Promise<ReviewWithProfile> {
  const response = await supabase
    .from('product_reviews')
    .select(`
      *,
      profile:profiles!product_reviews_profile_id_fkey (
        full_name,
        avatar_url,
        username
      )
    `)
    .eq('site_id', siteId)
    .eq('id', reviewId)
    .single();

  const data = await handleSingleResponse(response);
  
  return {
    ...data,
    profile: data.profile || undefined
  };
}

/**
 * Create new product review
 */
export async function createReview(
  supabase: SupabaseClient<Database>,
  data: InsertProductReview
): Promise<ProductReview> {
  const response = await supabase
    .from('product_reviews')
    .insert(data)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Update product review
 */
export async function updateReview(
  supabase: SupabaseClient<Database>,
  siteId: string,
  reviewId: string,
  data: UpdateProductReview
): Promise<ProductReview> {
  const filteredData = filterUndefined(data);
  
  const response = await supabase
    .from('product_reviews')
    .update({
      ...filteredData,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', reviewId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Delete product review
 */
export async function deleteReview(
  supabase: SupabaseClient<Database>,
  siteId: string,
  reviewId: string
): Promise<void> {
  const response = await supabase
    .from('product_reviews')
    .delete()
    .eq('site_id', siteId)
    .eq('id', reviewId);

  if (response.error) {
    throw SupabaseError.fromPostgrestError(response.error);
  }
}

/**
 * Mark review as helpful (increment helpful count)
 */
export async function markReviewHelpful(
  supabase: SupabaseClient<Database>,
  siteId: string,
  reviewId: string
): Promise<ProductReview> {
  // First get current helpful count
  const currentReview = await supabase
    .from('product_reviews')
    .select('helpful_count')
    .eq('site_id', siteId)
    .eq('id', reviewId)
    .single();

  if (currentReview.error) {
    throw SupabaseError.fromPostgrestError(currentReview.error);
  }

  const newCount = (currentReview.data.helpful_count || 0) + 1;

  const response = await supabase
    .from('product_reviews')
    .update({
      helpful_count: newCount,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', reviewId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Get product rating aggregation data
 */
export async function getProductRatingAggregation(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string
): Promise<ProductRatingAggregation> {
  const response = await supabase
    .from('product_reviews')
    .select('rating')
    .eq('site_id', siteId)
    .eq('product_id', productId)
    .eq('is_approved', true);

  const reviews = await handleQueryResponse(response);
  
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  // Calculate distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  reviews.forEach((review) => {
    const rating = review.rating as keyof typeof distribution;
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
      totalRating += rating;
    }
  });

  const averageRating = totalRating / reviews.length;

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
    ratingDistribution: distribution
  };
}

/**
 * Check if user has already reviewed this product
 */
export async function getUserProductReview(
  supabase: SupabaseClient<Database>,
  siteId: string,
  productId: string,
  profileId: string
): Promise<ProductReview | null> {
  const response = await supabase
    .from('product_reviews')
    .select('*')
    .eq('site_id', siteId)
    .eq('product_id', productId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (response.error && response.error.code !== 'PGRST116') {
    throw SupabaseError.fromPostgrestError(response.error);
  }

  return response.data;
}

/**
 * Get reviews by profile (user's reviews)
 */
export async function getReviewsByProfile(
  supabase: SupabaseClient<Database>,
  siteId: string,
  profileId: string,
  filters: Omit<ReviewFilters, 'profileId'> = {}
): Promise<PaginatedResponse<ReviewWithProfile>> {
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Build base query
  const countQuery = supabase
    .from('product_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('profile_id', profileId);

  let dataQuery = supabase
    .from('product_reviews')
    .select(`
      *,
      profile:profiles!product_reviews_profile_id_fkey (
        full_name,
        avatar_url,
        username
      )
    `)
    .eq('site_id', siteId)
    .eq('profile_id', profileId);

  // Get count
  const count = await handleCountResponse(await countQuery);

  // Apply pagination and sorting
  const offset = calculateOffset(page, limit);
  const orderBy = buildOrderBy<ProductReview>(sortBy, sortOrder);
  
  if (orderBy) {
    dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending });
  }
  
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute query
  const data = await handleQueryResponse(await dataQuery);

  // Transform data
  const transformedData: ReviewWithProfile[] = data.map((item: unknown) => {
    if (!isValidReviewData(item)) {
      throw new Error('Invalid review data received from database')
    }
    
    return {
      ...item,
      profile: item.profile && typeof item.profile === 'object' ? item.profile as { full_name: string | null; avatar_url: string | null; username: string | null; } : undefined
    }
  });

  return buildPaginatedResponse(transformedData, count, page, limit);
}

/**
 * Approve/reject review (admin function)
 */
export async function moderateReview(
  supabase: SupabaseClient<Database>,
  siteId: string,
  reviewId: string,
  approved: boolean
): Promise<ProductReview> {
  const response = await supabase
    .from('product_reviews')
    .update({
      is_approved: approved,
      updated_at: new Date().toISOString(),
    })
    .eq('site_id', siteId)
    .eq('id', reviewId)
    .select()
    .single();

  return handleSingleResponse(response);
}

/**
 * Get review statistics for site admin
 */
export async function getReviewStats(
  supabase: SupabaseClient<Database>,
  siteId: string
): Promise<{
  total: number;
  approved: number;
  pending: number;
  averageRating: number;
  verifiedPurchases: number;
}> {
  const [
    totalResponse,
    approvedResponse,
    pendingResponse,
    ratingsResponse,
    verifiedResponse
  ] = await Promise.all([
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId),
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_approved', true),
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_approved', false),
    supabase
      .from('product_reviews')
      .select('rating')
      .eq('site_id', siteId)
      .eq('is_approved', true),
    supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('verified_purchase', true)
  ]);

  const total = totalResponse.count || 0;
  const approved = approvedResponse.count || 0;
  const pending = pendingResponse.count || 0;
  const verified = verifiedResponse.count || 0;

  // Calculate average rating
  const ratings = ratingsResponse.data || [];
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, review) => sum + (review.rating || 0), 0) / ratings.length 
    : 0;

  return {
    total,
    approved,
    pending,
    averageRating: Math.round(averageRating * 10) / 10,
    verifiedPurchases: verified
  };
}