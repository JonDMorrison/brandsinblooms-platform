'use client';

import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import {
  getProductReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getProductRatingAggregation,
  getUserProductReview,
  getReviewsByProfile,
  moderateReview,
  getReviewStats,
  ReviewFilters,
  ReviewWithProfile,
  ProductRatingAggregation
} from '@/lib/queries/domains/reviews';
import { useSiteId } from '@/src/contexts/SiteContext';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';

type ProductReview = Tables<'product_reviews'>;
type ReviewInsert = TablesInsert<'product_reviews'>;
type ReviewUpdate = TablesUpdate<'product_reviews'>;

// Get reviews for a specific product
export function useProductReviews(productId: string, filters?: ReviewFilters) {
  const siteId = useSiteId();
  
  const cacheKey = `product_reviews_${siteId}_${productId}_${JSON.stringify(filters || {})}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !productId) throw new Error('Site ID and Product ID are required');
      return getProductReviews(supabase, siteId, productId, filters, signal);
    },
    {
      enabled: !!siteId && !!productId,
      persistKey: cacheKey,
      staleTime: 30 * 1000, // 30 seconds
      onError: (error) => {
        console.error('Failed to fetch product reviews:', error.message);
      },
    }
  );
}

// Get single review by ID
export function useReview(reviewId: string) {
  const siteId = useSiteId();
  
  const cacheKey = `review_${siteId}_${reviewId}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !reviewId) throw new Error('Site ID and Review ID are required');
      return getReviewById(supabase, siteId, reviewId, signal);
    },
    {
      enabled: !!siteId && !!reviewId,
      persistKey: cacheKey,
      onError: (error) => {
        console.error('Failed to fetch review:', error.message);
      },
    }
  );
}

// Get product rating aggregation
export function useProductRating(productId: string) {
  const siteId = useSiteId();
  
  const cacheKey = `product_rating_${siteId}_${productId}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !productId) throw new Error('Site ID and Product ID are required');
      return getProductRatingAggregation(supabase, siteId, productId, signal);
    },
    {
      enabled: !!siteId && !!productId,
      persistKey: cacheKey,
      staleTime: 60 * 1000, // 1 minute
      onError: (error) => {
        console.error('Failed to fetch product rating:', error.message);
      },
    }
  );
}

// Get user's review for a product
export function useUserProductReview(productId: string, profileId?: string) {
  const siteId = useSiteId();
  
  const cacheKey = `user_product_review_${siteId}_${productId}_${profileId}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !productId || !profileId) throw new Error('Site ID, Product ID, and Profile ID are required');
      return getUserProductReview(supabase, siteId, productId, profileId, signal);
    },
    {
      enabled: !!siteId && !!productId && !!profileId,
      persistKey: cacheKey,
      staleTime: 60 * 1000, // 1 minute
      onError: (error) => {
        console.error('Failed to fetch user product review:', error.message);
      },
    }
  );
}

// Get reviews by profile
export function useReviewsByProfile(profileId: string, filters?: Omit<ReviewFilters, 'profileId'>) {
  const siteId = useSiteId();
  
  const cacheKey = `reviews_by_profile_${siteId}_${profileId}_${JSON.stringify(filters || {})}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId || !profileId) throw new Error('Site ID and Profile ID are required');
      return getReviewsByProfile(supabase, siteId, profileId, filters, signal);
    },
    {
      enabled: !!siteId && !!profileId,
      persistKey: cacheKey,
      staleTime: 30 * 1000,
      onError: (error) => {
        console.error('Failed to fetch reviews by profile:', error.message);
      },
    }
  );
}

// Get review statistics
export function useReviewStats() {
  const siteId = useSiteId();
  
  const cacheKey = `review_stats_${siteId}`;
  
  return useSupabaseQuery(
    async (signal) => {
      if (!siteId) throw new Error('Site ID is required');
      return getReviewStats(supabase, siteId, signal);
    },
    {
      enabled: !!siteId,
      persistKey: cacheKey,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch review stats:', error.message);
      },
    }
  );
}

// Create review mutation
export function useCreateReview() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (data: Omit<ReviewInsert, 'site_id'>, signal) => {
      return createReview(supabase, { ...data, site_id: siteId! }, signal);
    },
    {
      showSuccessToast: 'Review submitted successfully',
      optimisticUpdate: (newReview) => {
        // Clear related localStorage caches
        const patterns = [
          `product_reviews_${siteId}_${newReview.product_id}_`,
          `product_rating_${siteId}_${newReview.product_id}`,
          `review_stats_${siteId}`,
          `user_product_review_${siteId}_${newReview.product_id}_${newReview.profile_id}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: (data, variables) => {
        // Clear related localStorage caches on success
        const patterns = [
          `product_reviews_${siteId}_${variables.product_id}_`,
          `product_rating_${siteId}_${variables.product_id}`,
          `review_stats_${siteId}`,
          `user_product_review_${siteId}_${variables.product_id}_${variables.profile_id}`,
          `reviews_by_profile_${siteId}_${variables.profile_id}_`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        console.error('Failed to create review:', error.message);
      },
    }
  );
}

// Update review mutation
export function useUpdateReview() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: ReviewUpdate & { id: string; productId: string }, signal) => {
      const { id, productId, ...data } = variables;
      return updateReview(supabase, siteId!, id, data, signal);
    },
    {
      showSuccessToast: 'Review updated successfully',
      optimisticUpdate: (variables) => {
        // Clear related localStorage caches
        const patterns = [
          `product_reviews_${siteId}_${variables.productId}_`,
          `review_${siteId}_${variables.id}`,
          `product_rating_${siteId}_${variables.productId}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: (data, variables) => {
        // Clear related localStorage caches on success
        const patterns = [
          `product_reviews_${siteId}_${variables.productId}_`,
          `review_${siteId}_${variables.id}`,
          `product_rating_${siteId}_${variables.productId}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        console.error('Failed to update review:', error.message);
      },
    }
  );
}

// Delete review mutation
export function useDeleteReview() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: { reviewId: string; productId: string }, signal) => {
      return deleteReview(supabase, siteId!, variables.reviewId, signal);
    },
    {
      showSuccessToast: 'Review deleted successfully',
      optimisticUpdate: (variables) => {
        // Clear related localStorage caches
        const patterns = [
          `product_reviews_${siteId}_${variables.productId}_`,
          `review_${siteId}_${variables.reviewId}`,
          `product_rating_${siteId}_${variables.productId}`,
          `review_stats_${siteId}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onSuccess: (data, variables) => {
        // Clear related localStorage caches on success
        const patterns = [
          `product_reviews_${siteId}_${variables.productId}_`,
          `review_${siteId}_${variables.reviewId}`,
          `product_rating_${siteId}_${variables.productId}`,
          `review_stats_${siteId}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        console.error('Failed to delete review:', error.message);
      },
    }
  );
}

// Mark review as helpful mutation
export function useMarkReviewHelpful() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: { reviewId: string; productId: string }, signal) => {
      return markReviewHelpful(supabase, siteId!, variables.reviewId, signal);
    },
    {
      showSuccessToast: 'Thanks for your feedback!',
      optimisticUpdate: (variables) => {
        // Clear related localStorage caches
        const patterns = [
          `product_reviews_${siteId}_${variables.productId}_`,
          `review_${siteId}_${variables.reviewId}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      rollbackOnError: () => {
        // Clear caches on error to revert optimistic update
        const patterns = [
          `product_reviews_${siteId}_`,
          `review_${siteId}_`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        console.error('Failed to mark review as helpful:', error.message);
      },
    }
  );
}

// Moderate review mutation (admin only)
export function useModerateReview() {
  const siteId = useSiteId();
  
  return useSupabaseMutation(
    async (variables: { reviewId: string; productId: string; approved: boolean }, signal) => {
      return moderateReview(supabase, siteId!, variables.reviewId, variables.approved, signal);
    },
    {
      onSuccess: (data, variables) => {
        const action = variables.approved ? 'approved' : 'rejected';
        toast.success(`Review ${action} successfully`);
        
        // Clear related localStorage caches on success
        const patterns = [
          `product_reviews_${siteId}_${variables.productId}_`,
          `review_${siteId}_${variables.reviewId}`,
          `product_rating_${siteId}_${variables.productId}`,
          `review_stats_${siteId}`
        ];
        patterns.forEach(pattern => {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(pattern)) {
              localStorage.removeItem(key);
            }
          });
        });
      },
      onError: (error) => {
        console.error('Failed to moderate review:', error.message);
        toast.error('Failed to moderate review');
      },
      showSuccessToast: false, // We handle our own success messages
    }
  );
}