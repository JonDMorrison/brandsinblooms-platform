'use client';

import React, { useState, forwardRef, useCallback } from 'react';
import { ProductImage, type ProductImageProps } from '@/src/components/ui/product-image';
import { cn } from '@/lib/utils';
import { Flower, Leaf, TreePine, User, MapPin, ImageIcon } from 'lucide-react';

/**
 * Plant-specific image types for appropriate fallbacks and accessibility
 */
export type PlantImageType = 
  | 'plant' 
  | 'flower' 
  | 'tree' 
  | 'succulent' 
  | 'herb' 
  | 'team-member' 
  | 'location' 
  | 'care-guide' 
  | 'category'
  | 'generic';

/**
 * Plant care difficulty levels for context-aware alt text
 */
export type PlantCareDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Plant characteristics for enhanced accessibility
 */
export interface PlantCharacteristics {
  /** Common name of the plant */
  commonName?: string;
  /** Scientific name for botanical accuracy */
  scientificName?: string;
  /** Primary care difficulty */
  careDifficulty?: PlantCareDifficulty;
  /** Light requirements */
  lightRequirement?: 'low' | 'medium' | 'bright' | 'full-sun';
  /** Water frequency */
  waterFrequency?: 'low' | 'medium' | 'high';
  /** Whether plant is pet-safe */
  petSafe?: boolean;
  /** Plant size category */
  size?: 'small' | 'medium' | 'large';
  /** Bloom season (for flowering plants) */
  bloomSeason?: string;
}

/**
 * Enhanced PlantShopImage component props
 */
export interface PlantShopImageProps extends Omit<ProductImageProps, 'placeholder' | 'productName' | 'category'> {
  /** Type of plant/image for appropriate fallbacks */
  imageType?: PlantImageType;
  /** Plant characteristics for enhanced accessibility */
  plantInfo?: PlantCharacteristics;
  /** Location name (for location images) */
  locationName?: string;
  /** Team member name (for team photos) */
  personName?: string;
  /** Care guide topic */
  careGuideType?: string;
  /** Whether to show plant care indicators */
  showCareIndicators?: boolean;
  /** Whether image is featured/hero content */
  isFeatured?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to use plant-specific optimizations */
  enablePlantOptimizations?: boolean;
}

/**
 * Generate appropriate fallback icon based on image type
 */
const getFallbackIcon = (imageType: PlantImageType, className: string = 'h-12 w-12') => {
  const iconProps = {
    className: `${className} text-gray-500/60 drop-shadow-sm`,
    'aria-hidden': true as const,
  };

  switch (imageType) {
    case 'flower':
      return <Flower {...iconProps} />;
    case 'tree':
      return <TreePine {...iconProps} />;
    case 'plant':
    case 'succulent':
    case 'herb':
      return <Leaf {...iconProps} />;
    case 'team-member':
      return <User {...iconProps} />;
    case 'location':
      return <MapPin {...iconProps} />;
    case 'care-guide':
    case 'category':
    case 'generic':
    default:
      return <ImageIcon {...iconProps} />;
  }
};

/**
 * Generate comprehensive alt text for plant images
 */
const generatePlantAltText = (
  baseAlt: string,
  imageType: PlantImageType,
  plantInfo?: PlantCharacteristics,
  locationName?: string,
  personName?: string,
  careGuideType?: string
): string => {
  // Use provided alt text if comprehensive enough
  if (baseAlt && baseAlt.length > 10 && !baseAlt.toLowerCase().includes('image')) {
    return baseAlt;
  }

  let altText = '';

  switch (imageType) {
    case 'plant':
    case 'flower':
    case 'tree':
    case 'succulent':
    case 'herb':
      if (plantInfo?.commonName) {
        altText = `${plantInfo.commonName}`;
        
        if (plantInfo.scientificName) {
          altText += ` (${plantInfo.scientificName})`;
        }
        
        // Add care context
        if (plantInfo.careDifficulty) {
          altText += `, a ${plantInfo.careDifficulty}-friendly plant`;
        }
        
        if (plantInfo.lightRequirement) {
          altText += ` requiring ${plantInfo.lightRequirement} light`;
        }
        
        if (plantInfo.petSafe === true) {
          altText += ', pet-safe';
        } else if (plantInfo.petSafe === false) {
          altText += ', not pet-safe';
        }
        
        if (plantInfo.size) {
          altText += ` ${plantInfo.size} ${imageType}`;
        }
      } else {
        altText = `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} plant`;
      }
      break;
      
    case 'team-member':
      if (personName) {
        altText = `${personName}, team member`;
      } else {
        altText = 'Team member photo';
      }
      break;
      
    case 'location':
      if (locationName) {
        altText = `${locationName} location`;
      } else {
        altText = 'Store location photo';
      }
      break;
      
    case 'care-guide':
      if (careGuideType) {
        altText = `Plant care guide: ${careGuideType}`;
      } else {
        altText = 'Plant care guide illustration';
      }
      break;
      
    case 'category':
      altText = baseAlt || 'Plant category image';
      break;
      
    default:
      altText = baseAlt || 'Plant shop image';
  }

  return altText;
};

/**
 * Get category-specific gradient colors for placeholders
 */
const getPlantCategoryColors = (imageType: PlantImageType): string[] => {
  switch (imageType) {
    case 'flower':
      return ['#fce7f3', '#f472b6', '#ec4899']; // Pink gradient
    case 'tree':
      return ['#dcfce7', '#86efac', '#22c55e']; // Green gradient
    case 'plant':
      return ['#d9f99d', '#84cc16', '#65a30d']; // Lime green gradient
    case 'succulent':
      return ['#ecfdf5', '#6ee7b7', '#10b981']; // Emerald gradient
    case 'herb':
      return ['#f0fdf4', '#74f382', '#15803d']; // Forest green gradient
    case 'team-member':
      return ['#f3f4f6', '#9ca3af', '#6b7280']; // Gray gradient
    case 'location':
      return ['#dbeafe', '#60a5fa', '#3b82f6']; // Blue gradient
    case 'care-guide':
      return ['#fef3c7', '#fbbf24', '#f59e0b']; // Amber gradient
    default:
      return ['#f3f4f6', '#d1d5db', '#9ca3af']; // Default gray
  }
};

/**
 * PlantShopImage component with plant-specific optimizations and accessibility
 */
export const PlantShopImage = forwardRef<HTMLImageElement, PlantShopImageProps>(
  (
    {
      src,
      alt,
      imageType = 'generic',
      plantInfo,
      locationName,
      personName,
      careGuideType,
      showCareIndicators = false,
      isFeatured = false,
      errorMessage,
      enablePlantOptimizations = true,
      className,
      onError,
      ...props
    },
    ref
  ) => {
    const [hasError, setHasError] = useState(false);

    // Generate comprehensive alt text
    const enhancedAlt = generatePlantAltText(
      alt,
      imageType,
      plantInfo,
      locationName,
      personName,
      careGuideType
    );

    // Handle error with custom plant shop messaging
    const handleError = useCallback(
      (error: unknown, retryCount: number) => {
        setHasError(true);
        onError?.(error, retryCount);
      },
      [onError]
    );

    // Configure placeholder for plant-specific colors
    const plantPlaceholder = enablePlantOptimizations
      ? {
          type: 'gradient' as const,
          config: {
            colors: getPlantCategoryColors(imageType),
          },
          staticFallback: imageType === 'team-member' 
            ? ('user' as const)
            : ('image' as const),
        }
      : {
          type: 'gradient' as const,
          staticFallback: 'image' as const,
        };

    // Enhanced performance mode for plant images
    const performanceMode = isFeatured ? 'aggressive' : 'auto';

    // Plant-specific sizing suggestions
    const sizes = props.sizes || (
      isFeatured 
        ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        : '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
    );

    return (
      <div className={cn('relative group', className)}>
        <ProductImage
          ref={ref}
          src={src}
          alt={enhancedAlt}
          placeholder={plantPlaceholder}
          productName={plantInfo?.commonName || locationName || personName}
          category={imageType}
          featured={isFeatured}
          performanceMode={performanceMode}
          sizes={sizes}
          onError={handleError}
          {...props}
        />

        {/* Plant care indicators overlay */}
        {showCareIndicators && plantInfo && !hasError && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {plantInfo.careDifficulty && (
              <div 
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg',
                  plantInfo.careDifficulty === 'beginner' && 'bg-green-500',
                  plantInfo.careDifficulty === 'intermediate' && 'bg-yellow-500',
                  plantInfo.careDifficulty === 'advanced' && 'bg-red-500'
                )}
                aria-label={`Care difficulty: ${plantInfo.careDifficulty}`}
              >
                {plantInfo.careDifficulty === 'beginner' && '🟢'}
                {plantInfo.careDifficulty === 'intermediate' && '🟡'}
                {plantInfo.careDifficulty === 'advanced' && '🔴'}
              </div>
            )}
            
            {plantInfo.petSafe === true && (
              <div 
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full shadow-lg"
                aria-label="Pet safe plant"
              >
                🐾
              </div>
            )}
          </div>
        )}

        {/* Custom error overlay for plant images */}
        {hasError && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 rounded-lg"
            aria-hidden="true"
          >
            {getFallbackIcon(imageType, 'h-8 w-8')}
            <span className="text-xs text-gray-500 mt-2 text-center px-2">
              {errorMessage || `Unable to load ${imageType} image`}
            </span>
          </div>
        )}
      </div>
    );
  }
);

PlantShopImage.displayName = 'PlantShopImage';

/**
 * Specialized component variants for common plant shop use cases
 */

/**
 * Plant product image with care indicators
 */
export const PlantProductImage = forwardRef<HTMLImageElement, 
  Omit<PlantShopImageProps, 'imageType' | 'showCareIndicators'> & {
    plantType?: 'plant' | 'flower' | 'tree' | 'succulent' | 'herb';
  }
>(({ plantType = 'plant', ...props }, ref) => (
  <PlantShopImage
    ref={ref}
    imageType={plantType}
    showCareIndicators={true}
    enablePlantOptimizations={true}
    {...props}
  />
));

PlantProductImage.displayName = 'PlantProductImage';

/**
 * Team member photo with appropriate accessibility
 */
export const TeamMemberPhoto = forwardRef<HTMLImageElement,
  Omit<PlantShopImageProps, 'imageType' | 'plantInfo'>
>(({ personName, ...props }, ref) => (
  <PlantShopImage
    ref={ref}
    imageType="team-member"
    personName={personName}
    errorMessage="Team member photo unavailable"
    {...props}
  />
));

TeamMemberPhoto.displayName = 'TeamMemberPhoto';

/**
 * Location/store image with appropriate context
 */
export const LocationImage = forwardRef<HTMLImageElement,
  Omit<PlantShopImageProps, 'imageType' | 'plantInfo'>
>(({ locationName, ...props }, ref) => (
  <PlantShopImage
    ref={ref}
    imageType="location"
    locationName={locationName}
    errorMessage="Location image unavailable"
    {...props}
  />
));

LocationImage.displayName = 'LocationImage';

/**
 * Care guide illustration
 */
export const CareGuideImage = forwardRef<HTMLImageElement,
  Omit<PlantShopImageProps, 'imageType' | 'plantInfo'>
>(({ careGuideType, ...props }, ref) => (
  <PlantShopImage
    ref={ref}
    imageType="care-guide"
    careGuideType={careGuideType}
    errorMessage="Care guide image unavailable"
    {...props}
  />
));

CareGuideImage.displayName = 'CareGuideImage';

export default PlantShopImage;