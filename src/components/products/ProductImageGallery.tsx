'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { Tables } from '@/src/lib/database/types'

type ProductImage = Tables<'product_images'>

interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
  className?: string
}

export function ProductImageGallery({
  images,
  productName,
  className
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div className="relative aspect-square bg-muted rounded-lg flex items-center justify-center">
          <ShoppingCart className="h-24 w-24 text-gray-400" />
        </div>
      </div>
    )
  }

  const currentImage = images[selectedIndex]

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        <Image
          src={currentImage.url}
          alt={currentImage.alt_text || productName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          className="object-cover"
          priority={selectedIndex === 0}
        />

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Grid - Only show if more than 1 image */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} - Image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 25vw, 150px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Caption - Show if current image has one */}
      {currentImage.caption && (
        <p className="text-sm text-gray-600 text-center italic">
          {currentImage.caption}
        </p>
      )}
    </div>
  )
}
