'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queries/keys';
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
  
  return useQuery({
    queryKey: queryKeys.products.reviewsList(siteId!, productId, filters),
    queryFn: () => getProductReviews(supabase, siteId!, productId, filters),
    enabled: !!siteId && !!productId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single review by ID
export function useReview(reviewId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.reviews.detail(siteId!, reviewId),
    queryFn: () => getReviewById(supabase, siteId!, reviewId),
    enabled: !!siteId && !!reviewId,
  });
}

// Get product rating aggregation
export function useProductRating(productId: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.rating(siteId!, productId),
    queryFn: () => getProductRatingAggregation(supabase, siteId!, productId),
    enabled: !!siteId && !!productId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get user's review for a product
export function useUserProductReview(productId: string, profileId?: string) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.products.userReview(siteId!, productId, profileId!),
    queryFn: () => getUserProductReview(supabase, siteId!, productId, profileId!),
    enabled: !!siteId && !!productId && !!profileId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get reviews by profile
export function useReviewsByProfile(profileId: string, filters?: Omit<ReviewFilters, 'profileId'>) {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.reviews.byProfile(siteId!, profileId),
    queryFn: () => getReviewsByProfile(supabase, siteId!, profileId, filters),
    enabled: !!siteId && !!profileId,
    staleTime: 30 * 1000,
  });
}

// Get review statistics
export function useReviewStats() {
  const siteId = useSiteId();
  
  return useQuery({
    queryKey: queryKeys.reviews.stats(siteId!),
    queryFn: () => getReviewStats(supabase, siteId!),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create review mutation
export function useCreateReview() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<ReviewInsert, 'site_id'>) => 
      createReview(supabase, { ...data, site_id: siteId! }),
    onMutate: async (newReview) => {
      const productId = newReview.product_id;
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, productId) 
      });
      
      // Optimistically update the reviews list
      const previousReviews = queryClient.getQueryData(
        queryKeys.products.reviewsList(siteId!, productId)
      );
      
      // Create optimistic review object
      const optimisticReview: ReviewWithProfile = {
        ...newReview,
        id: crypto.randomUUID(),
        site_id: siteId!,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        helpful_count: 0,
        is_approved: true, // Assume approved for optimistic update
        profile: undefined,
      } as ReviewWithProfile;
      
      // Update reviews list
      queryClient.setQueryData(
        queryKeys.products.reviewsList(siteId!, productId),
        (old: any) => {
          if (!old) return { data: [optimisticReview], count: 1, page: 1, pageSize: 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
          return {
            ...old,
            data: [optimisticReview, ...old.data],
            count: old.count + 1,
          };
        }
      );
      
      return { previousReviews, productId };
    },
    onError: (err, newReview, context) => {
      if (context?.previousReviews && context.productId) {
        queryClient.setQueryData(
          queryKeys.products.reviewsList(siteId!, context.productId),
          context.previousReviews
        );
      }
      toast.error('Failed to submit review');
    },
    onSuccess: (data, variables) => {
      toast.success('Review submitted successfully');
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, variables.product_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.rating(siteId!, variables.product_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reviews.stats(siteId!) 
      });
      
      // Invalidate user's review for this product
      if (variables.profile_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.products.userReview(siteId!, variables.product_id, variables.profile_id) 
        });
      }
    },
  });
}

// Update review mutation
export function useUpdateReview() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, productId, ...data }: ReviewUpdate & { id: string; productId: string }) => 
      updateReview(supabase, siteId!, id, data),
    onMutate: async ({ id, productId, ...updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.reviews.detail(siteId!, id) 
      });
      
      const previousReview = queryClient.getQueryData(
        queryKeys.reviews.detail(siteId!, id)
      );
      
      // Optimistically update the review
      queryClient.setQueryData(
        queryKeys.reviews.detail(siteId!, id),
        (old: ProductReview) => ({
          ...old,
          ...updates,
          updated_at: new Date().toISOString(),
        })
      );
      
      // Also update in reviews list
      queryClient.setQueryData(
        queryKeys.products.reviewsList(siteId!, productId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((review: ReviewWithProfile) => 
              review.id === id 
                ? { ...review, ...updates, updated_at: new Date().toISOString() }
                : review
            )
          };
        }
      );
      
      return { previousReview, reviewId: id, productId };
    },
    onError: (err, variables, context) => {
      if (context?.previousReview) {
        queryClient.setQueryData(
          queryKeys.reviews.detail(siteId!, context.reviewId), 
          context.previousReview
        );
      }
      toast.error('Failed to update review');
    },
    onSuccess: (data, variables) => {
      toast.success('Review updated successfully');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, variables.productId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.rating(siteId!, variables.productId) 
      });
    },
  });
}

// Delete review mutation
export function useDeleteReview() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reviewId, productId }: { reviewId: string; productId: string }) => 
      deleteReview(supabase, siteId!, reviewId),
    onMutate: async ({ reviewId, productId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, productId) 
      });
      
      const previousReviews = queryClient.getQueryData(
        queryKeys.products.reviewsList(siteId!, productId)
      );
      
      // Remove review from list
      queryClient.setQueryData(
        queryKeys.products.reviewsList(siteId!, productId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((review: ReviewWithProfile) => review.id !== reviewId),
            count: Math.max(0, old.count - 1),
          };
        }
      );
      
      return { previousReviews, reviewId, productId };
    },
    onError: (err, variables, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(
          queryKeys.products.reviewsList(siteId!, context.productId),
          context.previousReviews
        );
      }
      toast.error('Failed to delete review');
    },
    onSuccess: (data, variables) => {
      toast.success('Review deleted successfully');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, variables.productId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.rating(siteId!, variables.productId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reviews.stats(siteId!) 
      });
    },
  });
}

// Mark review as helpful mutation
export function useMarkReviewHelpful() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reviewId, productId }: { reviewId: string; productId: string }) => 
      markReviewHelpful(supabase, siteId!, reviewId),
    onMutate: async ({ reviewId, productId }) => {
      // Optimistically update helpful count
      queryClient.setQueryData(
        queryKeys.products.reviewsList(siteId!, productId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((review: ReviewWithProfile) => 
              review.id === reviewId 
                ? { ...review, helpful_count: (review.helpful_count || 0) + 1 }
                : review
            )
          };
        }
      );
      
      return { reviewId, productId };
    },
    onError: (err, variables) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, variables.productId) 
      });
      toast.error('Failed to mark review as helpful');
    },
    onSuccess: () => {
      toast.success('Thanks for your feedback!');
    },
  });
}

// Moderate review mutation (admin only)
export function useModerateReview() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reviewId, productId, approved }: { reviewId: string; productId: string; approved: boolean }) => 
      moderateReview(supabase, siteId!, reviewId, approved),
    onSuccess: (data, variables) => {
      const action = variables.approved ? 'approved' : 'rejected';
      toast.success(`Review ${action} successfully`);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.reviews(siteId!, variables.productId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.rating(siteId!, variables.productId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reviews.stats(siteId!) 
      });
    },
    onError: () => {
      toast.error('Failed to moderate review');
    },
  });
}