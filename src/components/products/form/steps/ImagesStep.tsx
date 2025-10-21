'use client';

import { ImageUploadS3, type ProductImage } from '@/src/components/products/ImageUploadS3';

interface ImagesStepProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  productId: string;
  siteId: string;
  maxImages?: number;
  disabled?: boolean;
  onUpdate?: (imageId: string, data: Partial<ProductImage>) => Promise<void>;
  onRemove?: (imageId: string) => Promise<void>;
  onSetPrimary?: (imageId: string) => Promise<void>;
}

export function ImagesStep({
  images,
  onImagesChange,
  productId,
  siteId,
  maxImages = 10,
  disabled = false,
  onUpdate,
  onRemove,
  onSetPrimary,
}: ImagesStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-4">
        Upload product images. The first image will be used as the primary image.
      </div>
      <ImageUploadS3
        images={images}
        onImagesChange={onImagesChange}
        productId={productId}
        siteId={siteId}
        maxImages={maxImages}
        disabled={disabled}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onSetPrimary={onSetPrimary}
      />
    </div>
  );
}
