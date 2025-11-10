'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

/**
 * Skeleton animation variants
 */
export type SkeletonVariant = 'pulse' | 'wave' | 'shimmer' | 'none';

/**
 * Skeleton size presets
 */
export type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Base skeleton component props
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation variant */
  variant?: SkeletonVariant;
  /** Size preset */
  size?: SkeletonSize;
  /** Custom width */
  width?: string | number;
  /** Custom height */
  height?: string | number;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Whether skeleton should be visible */
  show?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom highlight color for animations */
  highlightColor?: string;
}

/**
 * Get skeleton size classes
 */
const getSkeletonSizeClasses = (size: SkeletonSize) => {
  const sizes = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  };
  return sizes[size];
};

/**
 * Get border radius classes
 */
const getRoundedClasses = (rounded: SkeletonProps['rounded']) => {
  const roundedMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  return roundedMap[rounded || 'md'];
};

/**
 * Enhanced skeleton component with multiple animation types and smooth transitions
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'shimmer',
      size = 'md',
      width,
      height,
      rounded = 'md',
      duration = 1500,
      delay = 0,
      show = true,
      backgroundColor,
      highlightColor,
      style,
      ...props
    },
    ref
  ) => {
    // Don't render if not showing
    if (!show) {
      return null;
    }

    // Build custom styles
    const customStyles: React.CSSProperties = {
      ...style,
      animationDuration: `${duration}ms`,
      animationDelay: `${delay}ms`,
    };

    if (width) {
      customStyles.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height) {
      customStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    if (backgroundColor) {
      customStyles.backgroundColor = backgroundColor;
    }

    // Animation classes
    const animationClasses = {
      pulse: 'animate-pulse',
      wave: 'animate-wave',
      shimmer: 'animate-shimmer',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted/60 transition-opacity duration-300',
          getSkeletonSizeClasses(size),
          getRoundedClasses(rounded),
          animationClasses[variant],
          className
        )}
        style={customStyles}
        role="presentation"
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Product card skeleton with realistic layout
 */
export interface ProductSkeletonProps {
  /** Whether to show the skeleton */
  show?: boolean;
  /** Layout variant */
  variant?: 'grid' | 'list';
  /** Animation type */
  animation?: SkeletonVariant;
  /** Number of skeletons to render */
  count?: number;
  /** Custom class name */
  className?: string;
}

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({
  show = true,
  variant = 'grid',
  animation = 'shimmer',
  count = 1,
  className,
}) => {
  if (!show) {
    return null;
  }

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={cn(
        'p-4 space-y-3 bg-white border rounded-lg',
        variant === 'list' ? 'flex gap-4' : '',
        className
      )}
    >
      {variant === 'grid' ? (
        <>
          {/* Product Image */}
          <Skeleton
            variant={animation}
            width="100%"
            height={200}
            rounded="md"
            delay={index * 150}
          />
          
          {/* Product Name */}
          <Skeleton
            variant={animation}
            width="75%"
            size="lg"
            delay={index * 150 + 200}
          />
          
          {/* Product Description */}
          <div className="space-y-2">
            <Skeleton
              variant={animation}
              width="100%"
              size="sm"
              delay={index * 150 + 350}
            />
            <Skeleton
              variant={animation}
              width="60%"
              size="sm"
              delay={index * 150 + 450}
            />
          </div>
          
          {/* Rating */}
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton
                key={i}
                variant={animation}
                width={12}
                height={12}
                rounded="none"
                delay={index * 150 + 550 + i * 50}
              />
            ))}
          </div>
          
          {/* Price */}
          <Skeleton
            variant={animation}
            width="40%"
            size="lg"
            delay={index * 150 + 800}
          />
          
          {/* Button */}
          <Skeleton
            variant={animation}
            width="100%"
            height={36}
            rounded="md"
            delay={index * 150 + 950}
          />
        </>
      ) : (
        <>
          {/* List view layout */}
          <Skeleton
            variant={animation}
            width={80}
            height={80}
            rounded="md"
            delay={index * 150}
          />
          
          <div className="flex-1 space-y-2">
            <Skeleton
              variant={animation}
              width="60%"
              size="lg"
              delay={index * 150 + 200}
            />
            <Skeleton
              variant={animation}
              width="100%"
              size="sm"
              delay={index * 150 + 350}
            />
            <Skeleton
              variant={animation}
              width="80%"
              size="sm"
              delay={index * 150 + 450}
            />
            
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton
                    key={i}
                    variant={animation}
                    width={10}
                    height={10}
                    rounded="none"
                    delay={index * 150 + 550 + i * 30}
                  />
                ))}
              </div>
              <Skeleton
                variant={animation}
                width={40}
                size="sm"
                delay={index * 150 + 700}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Skeleton
              variant={animation}
              width={60}
              size="lg"
              delay={index * 150 + 800}
            />
            <Skeleton
              variant={animation}
              width={80}
              height={32}
              rounded="md"
              delay={index * 150 + 950}
            />
          </div>
        </>
      )}
    </div>
  ));

  return <>{skeletons}</>;
};

/**
 * Image skeleton with aspect ratio preservation
 */
export interface ImageSkeletonProps {
  /** Width of the image */
  width?: string | number;
  /** Height of the image */
  height?: string | number;
  /** Aspect ratio (e.g., '16/9', '1/1') */
  aspectRatio?: string;
  /** Animation variant */
  animation?: SkeletonVariant;
  /** Border radius */
  rounded?: SkeletonProps['rounded'];
  /** Whether to show the skeleton */
  show?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether to show a loading icon */
  showIcon?: boolean;
}

export const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  width,
  height,
  aspectRatio,
  animation = 'shimmer',
  rounded = 'md',
  show = true,
  className,
  showIcon = true,
}) => {
  if (!show) {
    return null;
  }

  const containerStyle: React.CSSProperties = {};
  
  if (width) {
    containerStyle.width = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (height) {
    containerStyle.height = typeof height === 'number' ? `${height}px` : height;
  }
  
  if (aspectRatio && !height) {
    containerStyle.aspectRatio = aspectRatio;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/60',
        getRoundedClasses(rounded),
        className
      )}
      style={containerStyle}
    >
      <Skeleton
        variant={animation}
        width="100%"
        height="100%"
        rounded="none"
        className="absolute inset-0"
      />
      
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-3 rounded-full bg-muted/40">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Text skeleton with multiple lines
 */
export interface TextSkeletonProps {
  /** Number of lines */
  lines?: number;
  /** Width of each line (can be array for different widths) */
  lineWidths?: string[] | string;
  /** Spacing between lines */
  spacing?: 'sm' | 'md' | 'lg';
  /** Animation variant */
  animation?: SkeletonVariant;
  /** Whether to show the skeleton */
  show?: boolean;
  /** Custom class name */
  className?: string;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 3,
  lineWidths = ['100%', '75%', '50%'],
  spacing = 'md',
  animation = 'shimmer',
  show = true,
  className,
}) => {
  if (!show) {
    return null;
  }

  const spacingClasses = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-3',
  };

  const getLineWidth = (index: number): string => {
    if (Array.isArray(lineWidths)) {
      return lineWidths[index % lineWidths.length];
    }
    return lineWidths;
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          variant={animation}
          width={getLineWidth(index)}
          size="md"
          delay={index * 100}
        />
      ))}
    </div>
  );
};

/**
 * Card skeleton with header, content, and footer
 */
export interface CardSkeletonProps {
  /** Whether to show header */
  showHeader?: boolean;
  /** Whether to show image */
  showImage?: boolean;
  /** Whether to show footer */
  showFooter?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Animation variant */
  animation?: SkeletonVariant;
  /** Whether to show the skeleton */
  show?: boolean;
  /** Custom class name */
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showHeader = true,
  showImage = true,
  showFooter = true,
  contentLines = 3,
  animation = 'shimmer',
  show = true,
  className,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className={cn('p-4 space-y-4 bg-white border rounded-lg', className)}>
      {showHeader && (
        <div className="flex items-center gap-3">
          <Skeleton
            variant={animation}
            width={40}
            height={40}
            rounded="full"
            delay={0}
          />
          <div className="space-y-2 flex-1">
            <Skeleton
              variant={animation}
              width="60%"
              size="md"
              delay={150}
            />
            <Skeleton
              variant={animation}
              width="40%"
              size="sm"
              delay={250}
            />
          </div>
        </div>
      )}
      
      {showImage && (
        <ImageSkeleton
          animation={animation}
          aspectRatio="16/9"
          delay={showHeader ? 350 : 0}
        />
      )}
      
      <TextSkeleton
        lines={contentLines}
        animation={animation}
        show={true}
        className={`${showHeader || showImage ? 'pt-2' : ''}`}
      />
      
      {showFooter && (
        <div className="flex gap-2 pt-2">
          <Skeleton
            variant={animation}
            width={80}
            height={32}
            rounded="md"
            delay={600}
          />
          <Skeleton
            variant={animation}
            width={60}
            height={32}
            rounded="md"
            delay={750}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Grid skeleton for loading states
 */
export interface GridSkeletonProps {
  /** Number of items */
  count?: number;
  /** Number of columns */
  columns?: number;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Item skeleton type */
  itemType?: 'card' | 'product' | 'image';
  /** Animation variant */
  animation?: SkeletonVariant;
  /** Whether to show the skeleton */
  show?: boolean;
  /** Custom class name */
  className?: string;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  count = 6,
  columns = 3,
  gap = 'md',
  itemType = 'card',
  animation = 'shimmer',
  show = true,
  className,
}) => {
  if (!show) {
    return null;
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  const renderItem = (index: number) => {
    const key = `skeleton-${index}`;
    
    switch (itemType) {
      case 'product':
        return (
          <ProductSkeleton
            key={key}
            show={true}
            animation={animation}
            count={1}
          />
        );
      case 'image':
        return (
          <ImageSkeleton
            key={key}
            animation={animation}
            aspectRatio="1/1"
            show={true}
          />
        );
      case 'card':
      default:
        return (
          <CardSkeleton
            key={key}
            animation={animation}
            show={true}
          />
        );
    }
  };

  return (
    <div
      className={cn(
        'grid',
        gridCols[Math.min(columns, 6) as keyof typeof gridCols],
        gapClasses[gap],
        className
      )}
    >
      {Array.from({ length: count }, (_, index) => renderItem(index))}
    </div>
  );
};