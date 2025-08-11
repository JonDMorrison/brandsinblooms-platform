'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { StarRating, ProductRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductRating } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface RatingSummaryProps {
  productId: string;
  /** Whether to show detailed breakdown */
  detailed?: boolean;
  /** Custom className */
  className?: string;
}

export function RatingSummary({
  productId,
  detailed = true,
  className,
}: RatingSummaryProps) {
  const { data: ratingData, isLoading, error } = useProductRating(productId);

  if (isLoading) {
    return <RatingSummarySkeleton detailed={detailed} className={className} />;
  }

  if (error || !ratingData) {
    return null; // Fail silently
  }

  if (ratingData.totalReviews === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <StarRating value={0} size="md" />
            </div>
            <p className="text-sm text-muted-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground">
              Be the first to review this product!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {detailed && (
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Customer Reviews</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={detailed ? '' : 'pt-6'}>
        <div className="space-y-4">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {ratingData.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center">
                <StarRating value={ratingData.averageRating} size="sm" allowHalf />
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Based on {ratingData.totalReviews} {ratingData.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          {detailed && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingData.ratingDistribution[rating as keyof typeof ratingData.ratingDistribution];
                const percentage = ratingData.totalReviews > 0 
                  ? (count / ratingData.totalReviews) * 100 
                  : 0;

                return (
                  <div key={rating} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 w-12">
                      <span>{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    
                    <div className="w-8 text-right text-muted-foreground">
                      {count}
                    </div>
                    
                    <div className="w-10 text-right text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactRatingSummaryProps {
  productId: string;
  className?: string;
}

/**
 * Compact version for product cards and lists
 */
export function CompactRatingSummary({
  productId,
  className,
}: CompactRatingSummaryProps) {
  const { data: ratingData, isLoading } = useProductRating(productId);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  if (!ratingData || ratingData.totalReviews === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <StarRating value={0} size="sm" />
        <span>No reviews</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ProductRating
        rating={ratingData.averageRating}
        reviewCount={ratingData.totalReviews}
        size="sm"
      />
    </div>
  );
}

interface RatingSummarySkeletonProps {
  detailed?: boolean;
  className?: string;
}

function RatingSummarySkeleton({ detailed = true, className }: RatingSummarySkeletonProps) {
  return (
    <Card className={className}>
      {detailed && (
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
      )}
      
      <CardContent className={detailed ? '' : 'pt-6'}>
        <div className="space-y-4">
          {/* Overall Rating Skeleton */}
          <div className="flex items-center gap-4">
            <div className="text-center space-y-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Breakdown Skeleton */}
          {detailed && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RatingStatsProps {
  /** Average rating */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
  /** Rating distribution */
  distribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Static rating summary component for when you already have the data
 */
export function RatingStats({
  rating,
  reviewCount,
  distribution,
  showBreakdown = false,
  className,
}: RatingStatsProps) {
  if (reviewCount === 0) {
    return (
      <div className={cn('text-center space-y-2', className)}>
        <StarRating value={0} size="md" />
        <p className="text-sm text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{rating.toFixed(1)}</div>
          <StarRating value={rating} size="sm" allowHalf />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && distribution && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((starCount) => {
            const count = distribution[starCount as keyof typeof distribution];
            const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

            return (
              <div key={starCount} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-12">
                  <span>{starCount}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="w-8 text-right text-muted-foreground">{count}</span>
                <span className="w-10 text-right text-muted-foreground">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}