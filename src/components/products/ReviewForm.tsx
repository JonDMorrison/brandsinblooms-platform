'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { ReviewRatingInput } from './StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReview, useUpdateReview, useUserProductReview } from '@/hooks/useProductReviews';
import { toast } from 'sonner';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().min(1, 'Please enter a title').max(100, 'Title must be 100 characters or less'),
  comment: z.string().min(10, 'Please write at least 10 characters').max(1000, 'Comment must be 1000 characters or less'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  profileId: string;
  /** Called after successful submission */
  onSuccess?: () => void;
  /** Called when form is cancelled */
  onCancel?: () => void;
  /** Whether to show in edit mode */
  editMode?: boolean;
  /** Custom className */
  className?: string;
}

export function ReviewForm({
  productId,
  profileId,
  onSuccess,
  onCancel,
  editMode = false,
  className,
}: ReviewFormProps) {
  // Check if user already has a review for this product
  const { data: existingReview } = useUserProductReview(productId, profileId);
  
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();

  const isEditing = editMode && existingReview;
  const isSubmitting = createReviewMutation.isPending || updateReviewMutation.isPending;

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: isEditing ? existingReview.rating : 0,
      title: isEditing ? existingReview.title || '' : '',
      comment: isEditing ? existingReview.comment || '' : '',
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    try {
      if (isEditing && existingReview) {
        // Update existing review
        await updateReviewMutation.mutateAsync({
          id: existingReview.id,
          productId,
          ...data,
        });
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        await createReviewMutation.mutateAsync({
          product_id: productId,
          profile_id: profileId,
          ...data,
        });
        toast.success('Review submitted successfully!');
      }
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  // Don't show form if user already has a review and we're not in edit mode
  if (existingReview && !editMode) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-gray-500">You have already reviewed this product.</p>
            <Button
              variant="outline"
              onClick={() => {
                // This would typically trigger edit mode
                // For now, we'll show a message
                toast.info('Edit functionality would be implemented here');
              }}
            >
              Edit Your Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Your Review' : 'Write a Review'}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update your review for this product'
            : 'Share your experience with this product'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <ReviewRatingInput
                        value={field.value}
                        onChange={field.onChange}
                        size="lg"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your review in a few words"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <div className="flex justify-between text-sm text-gray-500">
                    <FormMessage />
                    <span>{field.value?.length || 0}/100</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell others about your experience with this product. What did you like or dislike? What should other customers know?"
                      rows={6}
                      {...field}
                      maxLength={1000}
                    />
                  </FormControl>
                  <div className="flex justify-between text-sm text-gray-500">
                    <FormMessage />
                    <span>{field.value?.length || 0}/1000</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Review' : 'Submit Review'}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface QuickReviewProps {
  productId: string;
  profileId: string;
  onSuccess?: () => void;
  className?: string;
}

/**
 * Simplified review form for quick ratings
 */
export function QuickReviewForm({
  productId,
  profileId,
  onSuccess,
  className,
}: QuickReviewProps) {
  const createReviewMutation = useCreateReview();
  const { data: existingReview } = useUserProductReview(productId, profileId);

  const handleQuickRating = async (rating: number) => {
    if (existingReview) {
      toast.info('You have already reviewed this product');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        product_id: productId,
        profile_id: profileId,
        rating,
        title: `${rating} star review`,
        comment: null,
      });
      
      toast.success('Thank you for your rating!');
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  if (existingReview) {
    return null; // Don't show if user already reviewed
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <p className="text-sm font-medium">Rate this product:</p>
        <ReviewRatingInput
          value={0}
          onChange={handleQuickRating}
          size="md"
        />
        <p className="text-xs text-gray-500">
          Click a star to rate, or write a detailed review below
        </p>
      </div>
    </div>
  );
}