'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ThumbsUp, Check, MoreHorizontal } from 'lucide-react';
import { StarRating } from './StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useProductReviews, useMarkReviewHelpful, useDeleteReview } from '@/hooks/useProductReviews';
import { ReviewWithProfile, ReviewFilters } from '@/lib/queries/domains/reviews';
import { toast } from 'sonner';

interface ReviewsListProps {
  productId: string;
  /** Whether to show admin actions */
  showAdminActions?: boolean;
  /** Current user's profile ID (to check if they can edit/delete) */
  currentUserProfileId?: string;
  /** Custom className */
  className?: string;
  /** Maximum number of reviews to show per page */
  pageSize?: number;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

const SORT_OPTIONS = {
  newest: { label: 'Newest first', sortBy: 'created_at', sortOrder: 'desc' },
  oldest: { label: 'Oldest first', sortBy: 'created_at', sortOrder: 'asc' },
  highest: { label: 'Highest rated', sortBy: 'rating', sortOrder: 'desc' },
  lowest: { label: 'Lowest rated', sortBy: 'rating', sortOrder: 'asc' },
  helpful: { label: 'Most helpful', sortBy: 'helpful_count', sortOrder: 'desc' },
} as const;

export function ReviewsList({
  productId,
  showAdminActions = false,
  currentUserProfileId,
  className,
  pageSize = 10,
}: ReviewsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();

  const filters: ReviewFilters = {
    page: currentPage,
    limit: pageSize,
    rating: ratingFilter,
    sortBy: SORT_OPTIONS[sortBy].sortBy,
    sortOrder: SORT_OPTIONS[sortBy].sortOrder as 'asc' | 'desc',
  };

  const { data, isLoading, error } = useProductReviews(productId, filters);
  const markHelpfulMutation = useMarkReviewHelpful();
  const deleteReviewMutation = useDeleteReview();

  const handleMarkHelpful = (reviewId: string) => {
    markHelpfulMutation.mutate({ reviewId, productId });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate({ reviewId, productId });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of reviews
    document.getElementById('reviews-list')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return <ReviewsListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load reviews. Please try again.</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div id="reviews-list" className={cn('space-y-6', className)}>
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {data.count} {data.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Rating filter */}
          <Select
            value={ratingFilter?.toString() || 'all'}
            onValueChange={(value) => {
              setRatingFilter(value === 'all' ? undefined : parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="3">3 stars</SelectItem>
              <SelectItem value="2">2 stars</SelectItem>
              <SelectItem value="1">1 star</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort options */}
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => {
              setSortBy(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                <SelectItem key={key} value={key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {data.data.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onMarkHelpful={() => handleMarkHelpful(review.id)}
            onDelete={
              currentUserProfileId === review.profile_id || showAdminActions
                ? () => handleDeleteReview(review.id)
                : undefined
            }
            showAdminActions={showAdminActions}
            isCurrentUser={currentUserProfileId === review.profile_id}
            isMarkingHelpful={markHelpfulMutation.isPending}
          />
        ))}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!data.hasPreviousPage}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            {data.totalPages > 5 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant={currentPage === data.totalPages ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(data.totalPages)}
                  className="w-8 h-8"
                >
                  {data.totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!data.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewWithProfile;
  onMarkHelpful: () => void;
  onDelete?: () => void;
  showAdminActions: boolean;
  isCurrentUser: boolean;
  isMarkingHelpful: boolean;
}

function ReviewCard({
  review,
  onMarkHelpful,
  onDelete,
  showAdminActions,
  isCurrentUser,
  isMarkingHelpful,
}: ReviewCardProps) {
  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = review.profile?.full_name || review.profile?.username || 'Anonymous';

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.profile?.avatar_url || ''} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{displayName}</p>
                {review.verified_purchase && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {format(new Date(review.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {(onDelete || showAdminActions) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Rating and Title */}
        <div className="space-y-2">
          <StarRating value={review.rating} size="sm" />
          {review.title && (
            <h4 className="font-medium text-gray-900">{review.title}</h4>
          )}
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">{review.comment}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkHelpful}
            disabled={isMarkingHelpful || isCurrentUser}
            className="text-gray-500 hover:text-gray-900"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Helpful ({review.helpful_count || 0})
          </Button>

          {!review.is_approved && showAdminActions && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Pending Approval
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReviewsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <div className="flex gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Reviews skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}