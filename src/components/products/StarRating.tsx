'use client';

import React, { useState, useMemo } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Current rating value (0-5) */
  value: number;
  /** Maximum rating (default: 5) */
  max?: number;
  /** Whether the rating is interactive (clickable) */
  interactive?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show half stars for display */
  allowHalf?: boolean;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Whether to show the count (e.g., "(123 reviews)") */
  showCount?: boolean;
  /** Review count */
  count?: number;
  /** Callback when rating changes (interactive mode) */
  onChange?: (rating: number) => void;
  /** Callback when hovering over a star (interactive mode) */
  onHover?: (rating: number) => void;
  /** Custom className */
  className?: string;
  /** Whether to show labels on hover (interactive mode) */
  showLabels?: boolean;
}

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

const TEXT_SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export function StarRating({
  value = 0,
  max = 5,
  interactive = false,
  size = 'md',
  allowHalf = !interactive, // Half stars only in display mode by default
  showValue = false,
  showCount = false,
  count,
  onChange,
  onHover,
  className,
  showLabels = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [currentLabel, setCurrentLabel] = useState<string>('');

  // Clamp value between 0 and max
  const clampedValue = Math.max(0, Math.min(max, value));
  const displayValue = interactive && hoverRating !== null ? hoverRating : clampedValue;

  const stars = useMemo(() => {
    const starArray = [];
    
    for (let i = 1; i <= max; i++) {
      const filled = displayValue >= i;
      const halfFilled = allowHalf && !interactive && displayValue >= i - 0.5 && displayValue < i;
      
      starArray.push({
        index: i,
        filled,
        halfFilled,
      });
    }
    
    return starArray;
  }, [displayValue, max, allowHalf, interactive]);

  const handleClick = (rating: number) => {
    if (!interactive || !onChange) return;
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (!interactive) return;
    setHoverRating(rating);
    onHover?.(rating);
    
    if (showLabels) {
      setCurrentLabel(RATING_LABELS[rating as keyof typeof RATING_LABELS] || '');
    }
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(null);
    setCurrentLabel('');
  };

  const formatCount = (count: number) => {
    if (count === 0) return '(No reviews)';
    if (count === 1) return '(1 review)';
    return `(${count.toLocaleString()} reviews)`;
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Stars */}
      <div 
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? 'Rate this product' : `Rating: ${value} out of ${max} stars`}
      >
        {stars.map(({ index, filled, halfFilled }) => (
          <button
            key={index}
            type="button"
            className={cn(
              'relative transition-colors',
              interactive && 'hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary rounded-sm',
              !interactive && 'cursor-default'
            )}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            disabled={!interactive}
            aria-label={interactive ? `Rate ${index} star${index !== 1 ? 's' : ''}` : undefined}
            role={interactive ? 'radio' : 'presentation'}
            aria-checked={interactive ? displayValue === index : undefined}
          >
            {halfFilled ? (
              <div className="relative">
                <Star className={cn(SIZE_CLASSES[size], 'text-gray-500')} />
                <StarHalf 
                  className={cn(
                    SIZE_CLASSES[size], 
                    'absolute inset-0 text-yellow-400 fill-yellow-400'
                  )} 
                />
              </div>
            ) : (
              <Star 
                className={cn(
                  SIZE_CLASSES[size],
                  filled 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-500',
                  interactive && hoverRating !== null && index <= hoverRating && 'text-yellow-500 fill-yellow-500'
                )}
              />
            )}
          </button>
        ))}
      </div>

      {/* Numeric value */}
      {showValue && (
        <span className={cn('font-medium text-gray-900', TEXT_SIZE_CLASSES[size])}>
          {value.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {showCount && count !== undefined && (
        <span className={cn('text-gray-500', TEXT_SIZE_CLASSES[size])}>
          {formatCount(count)}
        </span>
      )}

      {/* Interactive label */}
      {interactive && showLabels && currentLabel && (
        <span className={cn('text-gray-500 ml-2', TEXT_SIZE_CLASSES[size])}>
          {currentLabel}
        </span>
      )}
    </div>
  );
}

// Preset components for common use cases
export function ProductRating({
  rating,
  reviewCount,
  size = 'md',
  className,
}: {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <StarRating
      value={rating}
      size={size}
      allowHalf
      showValue
      showCount={reviewCount !== undefined}
      count={reviewCount}
      className={className}
    />
  );
}

export function ReviewRatingInput({
  value,
  onChange,
  size = 'lg',
  className,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <StarRating
      value={value}
      interactive
      size={size}
      showLabels
      onChange={onChange}
      className={className}
    />
  );
}

export function CompactRating({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <StarRating
      value={rating}
      size="sm"
      allowHalf
      showValue
      className={className}
    />
  );
}